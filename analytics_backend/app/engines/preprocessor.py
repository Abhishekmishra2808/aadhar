"""
Data Preprocessor - Automated Data Ingestion & Cleaning

This module handles:
- Reading various file formats (CSV, JSON, XLSX)
- Automatic schema detection
- Data cleaning and standardization
- Missing value handling
- Duplicate removal
- Date format standardization
- Data quality scoring
"""

import io
import re
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
import chardet
import pandas as pd
import numpy as np
from loguru import logger

from app.models import DataQualityReport


class DataPreprocessor:
    """
    Automated data ingestion and cleaning engine.
    
    Transforms raw, inconsistent datasets into clean, standardized
    dataframes ready for downstream analysis.
    """
    
    def __init__(self):
        self.original_df: Optional[pd.DataFrame] = None
        self.cleaned_df: Optional[pd.DataFrame] = None
        self.quality_report: Optional[DataQualityReport] = None
        self._date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # DD/MM/YYYY or MM/DD/YYYY
            r'\d{2}-\d{2}-\d{4}',  # DD-MM-YYYY
            r'\d{4}/\d{2}/\d{2}',  # YYYY/MM/DD
        ]
    
    def load_file(
        self, 
        file_content: bytes, 
        filename: str,
        encoding: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Load data from file content.
        
        Args:
            file_content: Raw bytes of the file
            filename: Original filename (used to determine format)
            encoding: Optional encoding override
            
        Returns:
            Loaded DataFrame
        """
        logger.info(f"Loading file: {filename}")
        
        # Detect encoding if not provided
        if encoding is None:
            detected = chardet.detect(file_content)
            encoding = detected.get('encoding', 'utf-8')
            logger.debug(f"Detected encoding: {encoding}")
        
        # Determine file type and load
        file_ext = filename.lower().split('.')[-1]
        
        try:
            if file_ext == 'csv':
                self.original_df = self._load_csv(file_content, encoding)
            elif file_ext == 'json':
                self.original_df = self._load_json(file_content, encoding)
            elif file_ext in ['xlsx', 'xls']:
                self.original_df = self._load_excel(file_content)
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            logger.info(f"Loaded {len(self.original_df)} rows, {len(self.original_df.columns)} columns")
            return self.original_df
            
        except Exception as e:
            logger.error(f"Failed to load file: {e}")
            raise
    
    def _load_csv(self, content: bytes, encoding: str) -> pd.DataFrame:
        """Load CSV file with automatic delimiter detection."""
        text = content.decode(encoding, errors='replace')
        
        # Try to detect delimiter
        sample = text[:5000]
        delimiters = [',', ';', '\t', '|']
        delimiter_counts = {d: sample.count(d) for d in delimiters}
        delimiter = max(delimiter_counts, key=delimiter_counts.get)
        
        return pd.read_csv(
            io.StringIO(text),
            delimiter=delimiter,
            low_memory=False,
            on_bad_lines='skip'
        )
    
    def _load_json(self, content: bytes, encoding: str) -> pd.DataFrame:
        """Load JSON file (handles both records and array format)."""
        text = content.decode(encoding, errors='replace')
        
        try:
            return pd.read_json(io.StringIO(text))
        except ValueError:
            # Try loading as JSON Lines
            return pd.read_json(io.StringIO(text), lines=True)
    
    def _load_excel(self, content: bytes) -> pd.DataFrame:
        """Load Excel file."""
        return pd.read_excel(io.BytesIO(content), engine='openpyxl')
    
    def clean_data(self) -> pd.DataFrame:
        """
        Apply full cleaning pipeline to loaded data.
        
        Returns:
            Cleaned DataFrame
        """
        if self.original_df is None:
            raise ValueError("No data loaded. Call load_file() first.")
        
        logger.info("Starting data cleaning pipeline")
        df = self.original_df.copy()
        
        # Step 1: Clean column names
        df = self._clean_column_names(df)
        
        # Step 2: Remove duplicate rows
        initial_rows = len(df)
        df = df.drop_duplicates()
        duplicates_removed = initial_rows - len(df)
        logger.debug(f"Removed {duplicates_removed} duplicate rows")
        
        # Step 3: Standardize data types
        df = self._standardize_data_types(df)
        
        # Step 4: Handle missing values
        df = self._handle_missing_values(df)
        
        # Step 5: Standardize date columns
        df = self._standardize_dates(df)
        
        # Step 6: Clean string columns
        df = self._clean_strings(df)
        
        # Step 7: Remove outliers in numeric columns (optional, configurable)
        # df = self._cap_outliers(df)
        
        self.cleaned_df = df
        logger.info(f"Cleaning complete. Final shape: {df.shape}")
        
        return df
    
    def _clean_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize column names."""
        df.columns = [
            re.sub(r'[^\w\s]', '', str(col))  # Remove special chars
            .strip()
            .lower()
            .replace(' ', '_')
            for col in df.columns
        ]
        return df
    
    def _standardize_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Infer and standardize data types."""
        for col in df.columns:
            # Try to convert to numeric
            if df[col].dtype == 'object':
                # Check if it looks like a number
                numeric_df = pd.to_numeric(df[col], errors='coerce')
                non_null_numeric = numeric_df.notna().sum()
                
                if non_null_numeric / len(df) > 0.8:  # 80% convertible
                    df[col] = numeric_df
                    continue
                
                # Check if it looks like a date
                if self._looks_like_date(df[col]):
                    try:
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                    except Exception:
                        pass
        
        return df
    
    def _looks_like_date(self, series: pd.Series) -> bool:
        """Check if a series looks like it contains dates."""
        sample = series.dropna().head(100).astype(str)
        date_matches = 0
        
        for val in sample:
            for pattern in self._date_patterns:
                if re.search(pattern, val):
                    date_matches += 1
                    break
        
        return date_matches / len(sample) > 0.5 if len(sample) > 0 else False
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Handle missing values with intelligent imputation.
        
        Strategy:
        - Numeric columns: Fill with median (robust to outliers)
        - Categorical columns with few categories: Fill with mode
        - High-cardinality categorical: Leave as NaN or fill with 'Unknown'
        """
        for col in df.columns:
            missing_pct = df[col].isna().sum() / len(df)
            
            if missing_pct > 0.5:
                # Too many missing values - flag but don't impute
                logger.warning(f"Column '{col}' has {missing_pct:.1%} missing values")
                continue
            
            if df[col].dtype in ['int64', 'float64']:
                # Numeric: fill with median
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
            elif df[col].dtype == 'object':
                unique_count = df[col].nunique()
                if unique_count < 20:
                    # Low cardinality: fill with mode
                    mode_val = df[col].mode()
                    if len(mode_val) > 0:
                        df[col] = df[col].fillna(mode_val[0])
                else:
                    # High cardinality: fill with 'Unknown'
                    df[col] = df[col].fillna('Unknown')
        
        return df
    
    def _standardize_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensure all datetime columns are in standard format."""
        for col in df.select_dtypes(include=['datetime64']).columns:
            # Create additional derived columns
            df[f'{col}_year'] = df[col].dt.year
            df[f'{col}_month'] = df[col].dt.month
            df[f'{col}_quarter'] = df[col].dt.quarter
        
        return df
    
    def _clean_strings(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and standardize string columns."""
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].astype(str).str.strip()
            # Standardize common variations
            df[col] = df[col].replace({
                'nan': np.nan,
                'NaN': np.nan,
                'NULL': np.nan,
                'null': np.nan,
                'None': np.nan,
                '': np.nan
            })
        
        return df
    
    def _cap_outliers(
        self, 
        df: pd.DataFrame, 
        method: str = 'iqr',
        threshold: float = 1.5
    ) -> pd.DataFrame:
        """
        Cap extreme outliers in numeric columns.
        
        Args:
            df: Input DataFrame
            method: 'iqr' (Interquartile Range) or 'zscore'
            threshold: IQR multiplier or Z-score threshold
        """
        numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        for col in numeric_cols:
            if method == 'iqr':
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower = Q1 - threshold * IQR
                upper = Q3 + threshold * IQR
            else:  # zscore
                mean = df[col].mean()
                std = df[col].std()
                lower = mean - threshold * std
                upper = mean + threshold * std
            
            df[col] = df[col].clip(lower=lower, upper=upper)
        
        return df
    
    def generate_quality_report(self) -> DataQualityReport:
        """
        Generate comprehensive data quality report.
        
        Returns:
            DataQualityReport with quality metrics
        """
        if self.original_df is None:
            raise ValueError("No data loaded. Call load_file() first.")
        
        df = self.original_df
        
        # Calculate missing values
        missing_values = df.isna().sum().to_dict()
        missing_values = {k: int(v) for k, v in missing_values.items() if v > 0}
        
        # Count duplicates
        duplicate_rows = int(df.duplicated().sum())
        
        # Data types
        data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Classify columns
        numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        date_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        
        # Calculate quality score
        total_cells = df.size
        missing_cells = df.isna().sum().sum()
        completeness = 1 - (missing_cells / total_cells) if total_cells > 0 else 0
        uniqueness = 1 - (duplicate_rows / len(df)) if len(df) > 0 else 0
        quality_score = round((completeness * 0.7 + uniqueness * 0.3) * 100, 2)
        
        # Identify issues
        issues = []
        if duplicate_rows > 0:
            issues.append(f"Found {duplicate_rows} duplicate rows")
        
        high_missing_cols = [
            col for col, count in missing_values.items() 
            if count / len(df) > 0.2
        ]
        if high_missing_cols:
            issues.append(f"High missing values in: {', '.join(high_missing_cols)}")
        
        self.quality_report = DataQualityReport(
            total_rows=len(df),
            total_columns=len(df.columns),
            missing_values=missing_values,
            duplicate_rows=duplicate_rows,
            data_types=data_types,
            numeric_columns=numeric_cols,
            categorical_columns=categorical_cols,
            date_columns=date_cols,
            quality_score=quality_score,
            issues=issues
        )
        
        return self.quality_report
    
    def get_preview(self, n_rows: int = 10) -> List[Dict[str, Any]]:
        """Get preview of loaded data."""
        df = self.cleaned_df if self.cleaned_df is not None else self.original_df
        if df is None:
            return []
        
        return df.head(n_rows).to_dict(orient='records')
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get basic statistics for the dataset."""
        df = self.cleaned_df if self.cleaned_df is not None else self.original_df
        if df is None:
            return {}
        
        stats = {
            'shape': {'rows': len(df), 'columns': len(df.columns)},
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
            'numeric_summary': df.describe().to_dict() if len(df.select_dtypes(include=['number']).columns) > 0 else {},
            'categorical_summary': {}
        }
        
        # Add categorical summaries
        for col in df.select_dtypes(include=['object', 'category']).columns:
            value_counts = df[col].value_counts().head(10).to_dict()
            stats['categorical_summary'][col] = {
                'unique_values': df[col].nunique(),
                'top_values': value_counts
            }
        
        return stats
