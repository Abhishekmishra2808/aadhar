"""
Analysis Orchestrator - Coordinates the Full Data-to-Insight Pipeline

This module orchestrates:
1. Data ingestion and cleaning
2. Parallel execution of analytical engines
3. Statistical abstract generation
4. LLM reasoning analysis
5. Final package assembly for frontend
"""

import asyncio
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
import pandas as pd
from loguru import logger

from app.engines import (
    DataPreprocessor,
    CorrelationEngine,
    VolatilityScoringEngine,
    DimensionalSlicingEngine,
    AnomalyDetectionEngine
)
from app.services.llm_reasoning import LLMReasoningLayer
from app.models import (
    AnalysisPackage,
    AnalysisStatus,
    StatisticalAbstract,
    VisualizationSpec,
    VisualizationType,
    DataQualityReport,
    FileUploadResponse
)


class AnalysisOrchestrator:
    """
    Master orchestrator for the Aadhaar Pulse analytical pipeline.
    
    Coordinates all engines and services to produce the final
    intelligence package for the frontend.
    """
    
    def __init__(self):
        self.preprocessor = DataPreprocessor()
        self.correlation_engine = CorrelationEngine()
        self.volatility_engine = VolatilityScoringEngine()
        self.dimensional_engine = DimensionalSlicingEngine()
        self.anomaly_engine = AnomalyDetectionEngine()
        self.llm_layer = LLMReasoningLayer()
        
        # State
        self.current_df: Optional[pd.DataFrame] = None
        self.quality_report: Optional[DataQualityReport] = None
        self.job_id: Optional[str] = None
    
    async def ingest_file(
        self,
        file_content: bytes,
        filename: str
    ) -> FileUploadResponse:
        """
        Ingest and clean uploaded file.
        
        Returns upload response with data quality report.
        """
        self.job_id = str(uuid.uuid4())
        logger.info(f"Starting file ingestion for job {self.job_id}: {filename}")
        
        try:
            # Load and clean data
            self.preprocessor.load_file(file_content, filename)
            self.current_df = self.preprocessor.clean_data()
            self.quality_report = self.preprocessor.generate_quality_report()
            
            # Get preview
            preview = self.preprocessor.get_preview(10)
            
            return FileUploadResponse(
                success=True,
                filename=filename,
                file_size=len(file_content),
                records_count=len(self.current_df),
                columns=list(self.current_df.columns),
                preview=preview,
                data_quality=self.quality_report,
                job_id=self.job_id
            )
            
        except Exception as e:
            logger.error(f"File ingestion failed: {e}")
            raise
    
    async def run_full_analysis(
        self,
        target_column: Optional[str] = None,
        region_column: Optional[str] = None,
        time_column: Optional[str] = None,
        dimension_columns: Optional[List[str]] = None,
        run_llm: bool = True
    ) -> AnalysisPackage:
        """
        Run the complete analytical pipeline.
        
        Args:
            target_column: Primary metric column to analyze
            region_column: Column containing geographic regions
            time_column: Column containing time/date information
            dimension_columns: Columns for dimensional slicing
            run_llm: Whether to run LLM reasoning layer
            
        Returns:
            Complete AnalysisPackage for frontend
        """
        if self.current_df is None:
            raise ValueError("No data loaded. Call ingest_file first.")
        
        start_time = datetime.utcnow()
        logger.info(f"Starting full analysis for job {self.job_id}")
        
        # Auto-detect columns if not provided
        target_column = target_column or self._auto_detect_target_column()
        region_column = region_column or self._auto_detect_region_column()
        time_column = time_column or self._auto_detect_time_column()
        dimension_columns = dimension_columns or self._auto_detect_dimension_columns()
        
        # Get numeric columns for correlation and anomaly detection
        numeric_columns = self.quality_report.numeric_columns if self.quality_report else []
        
        # Run analytical engines (can be parallelized)
        try:
            # Correlation Analysis
            correlation_output = self.correlation_engine.analyze(
                self.current_df,
                target_column=target_column
            )
            logger.info("Correlation analysis complete")
            
            # Volatility Analysis (if region column exists)
            if region_column and target_column:
                volatility_output = self.volatility_engine.analyze(
                    self.current_df,
                    metric_column=target_column,
                    region_column=region_column,
                    time_column=time_column
                )
            else:
                volatility_output = self.volatility_engine._empty_output() if hasattr(self.volatility_engine, '_empty_output') else None
                if volatility_output is None:
                    from app.models import VolatilityScoringOutput
                    volatility_output = VolatilityScoringOutput(
                        regional_scores=[],
                        high_volatility_regions=[],
                        stable_regions=[],
                        temporal_patterns={},
                        seasonality_detected=False,
                        summary="Insufficient data for volatility analysis",
                        visualization={}
                    )
            logger.info("Volatility analysis complete")
            
            # Dimensional Slicing (if dimension columns exist)
            logger.info(f"Dimension columns detected: {dimension_columns}")
            logger.info(f"Target column: {target_column}")
            if dimension_columns and target_column and len(dimension_columns) >= 2:
                try:
                    dimensional_output = self.dimensional_engine.analyze(
                        self.current_df,
                        metric_column=target_column,
                        dimension_columns=dimension_columns
                    )
                    logger.info(f"Dimensional analysis found {len(dimensional_output.outlier_clusters)} outlier clusters")
                except Exception as e:
                    logger.error(f"Dimensional analysis failed: {e}")
                    from app.models import DimensionalSlicingOutput
                    dimensional_output = DimensionalSlicingOutput(
                        aggregations=[],
                        outlier_clusters=[],
                        top_anomalies=[],
                        dimension_importance={},
                        summary=f"Dimensional analysis failed: {str(e)}",
                        visualization={}
                    )
            else:
                logger.warning(f"Skipping dimensional analysis - need >= 2 dimensions, got {len(dimension_columns) if dimension_columns else 0}")
                from app.models import DimensionalSlicingOutput
                dimensional_output = DimensionalSlicingOutput(
                    aggregations=[],
                    outlier_clusters=[],
                    top_anomalies=[],
                    dimension_importance={},
                    summary="Insufficient dimension columns for analysis",
                    visualization={}
                )
            logger.info("Dimensional slicing complete")
            
            # Anomaly Detection
            anomaly_output = self.anomaly_engine.analyze(
                self.current_df,
                metric_columns=numeric_columns[:10],  # Limit to avoid overload
                region_column=region_column,
                time_column=time_column
            )
            logger.info("Anomaly detection complete")
            
            # Create statistical abstract
            statistical_abstract = StatisticalAbstract(
                correlation_findings=correlation_output,
                volatility_findings=volatility_output,
                dimensional_findings=dimensional_output,
                anomaly_findings=anomaly_output
            )
            
            # LLM Reasoning Layer
            if run_llm:
                intelligence_report = await self.llm_layer.analyze(
                    statistical_abstract,
                    additional_context={
                        "data_summary": {
                            "total_records": len(self.current_df),
                            "columns": list(self.current_df.columns),
                            "time_range": self._get_time_range(time_column)
                        }
                    }
                )
            else:
                intelligence_report = self.llm_layer._fallback_output(
                    statistical_abstract, "LLM analysis skipped"
                )
            logger.info("LLM reasoning complete")
            
            # Generate visualizations
            visualizations = self._generate_visualizations(
                correlation_output,
                volatility_output,
                dimensional_output,
                anomaly_output
            )
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Assemble final package
            return AnalysisPackage(
                job_id=self.job_id,
                status=AnalysisStatus.COMPLETED,
                data_summary={
                    "total_records": len(self.current_df),
                    "total_columns": len(self.current_df.columns),
                    "numeric_columns": numeric_columns,
                    "target_column": target_column,
                    "region_column": region_column,
                    "time_column": time_column
                },
                statistical_abstract=statistical_abstract,
                intelligence_report=intelligence_report,
                visualizations=visualizations,
                processing_time_seconds=processing_time,
                data_quality_score=self.quality_report.quality_score if self.quality_report else 0
            )
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            raise
    
    def _auto_detect_target_column(self) -> Optional[str]:
        """Auto-detect the primary metric column."""
        if self.current_df is None or self.quality_report is None:
            return None
        
        numeric_cols = self.quality_report.numeric_columns
        
        # Look for common metric patterns
        metric_patterns = [
            'rate', 'count', 'total', 'enrollment', 'rejection',
            'success', 'failure', 'value', 'amount'
        ]
        
        for col in numeric_cols:
            col_lower = col.lower()
            for pattern in metric_patterns:
                if pattern in col_lower:
                    return col
        
        # Default to first numeric column
        return numeric_cols[0] if numeric_cols else None
    
    def _auto_detect_region_column(self) -> Optional[str]:
        """Auto-detect the region/geographic column."""
        if self.current_df is None or self.quality_report is None:
            return None
        
        categorical_cols = self.quality_report.categorical_columns
        
        # Look for common region patterns
        region_patterns = [
            'state', 'district', 'region', 'city', 'location',
            'area', 'zone', 'territory'
        ]
        
        for col in categorical_cols:
            col_lower = col.lower()
            for pattern in region_patterns:
                if pattern in col_lower:
                    return col
        
        return None
    
    def _auto_detect_time_column(self) -> Optional[str]:
        """Auto-detect the time/date column."""
        if self.current_df is None or self.quality_report is None:
            return None
        
        # Check date columns first
        if self.quality_report.date_columns:
            return self.quality_report.date_columns[0]
        
        # Look for time patterns in other columns
        time_patterns = ['date', 'time', 'month', 'year', 'period', 'quarter']
        
        for col in self.current_df.columns:
            col_lower = col.lower()
            for pattern in time_patterns:
                if pattern in col_lower:
                    return col
        
        return None
    
    def _auto_detect_dimension_columns(self) -> List[str]:
        """Auto-detect columns suitable for dimensional analysis."""
        if self.current_df is None or self.quality_report is None:
            return []
        
        dimension_cols = []
        
        # Common dimension column name patterns for Aadhaar data
        dimension_patterns = [
            'state', 'district', 'region', 'area', 'zone',
            'gender', 'sex', 'age', 'group', 'category', 'type',
            'status', 'mode', 'agency', 'operator', 'source',
            'month', 'year', 'quarter', 'period', 'date'
        ]
        
        logger.info(f"DataFrame columns: {list(self.current_df.columns)}")
        logger.info(f"Categorical columns from quality report: {self.quality_report.categorical_columns}")
        
        # First check all columns by name pattern (regardless of dtype)
        for col in self.current_df.columns:
            col_lower = col.lower()
            unique_count = self.current_df[col].nunique()
            
            # Check if column name matches dimension patterns
            for pattern in dimension_patterns:
                if pattern in col_lower and col not in dimension_cols:
                    if 2 <= unique_count <= 500:
                        dimension_cols.append(col)
                        logger.info(f"Added '{col}' as dimension (pattern match: {pattern}, {unique_count} unique)")
                        break
        
        # Then try categorical columns from quality report
        for col in self.quality_report.categorical_columns:
            if col not in dimension_cols:
                unique_count = self.current_df[col].nunique()
                logger.info(f"Categorical column '{col}': {unique_count} unique values")
                if 2 <= unique_count <= 500:
                    dimension_cols.append(col)
                    logger.info(f"Added '{col}' as dimension column")
        
        # If still not enough, check all object and string columns
        if len(dimension_cols) < 2:
            logger.info(f"Only {len(dimension_cols)} dimensions found, checking all object columns")
            for col in self.current_df.select_dtypes(include=['object', 'string', 'category']).columns:
                if col not in dimension_cols:
                    unique_count = self.current_df[col].nunique()
                    logger.info(f"Object column '{col}': {unique_count} unique values")
                    if 2 <= unique_count <= 500:
                        dimension_cols.append(col)
                        logger.info(f"Added object column '{col}' as dimension")
        
        # If STILL not enough, check numeric columns with low cardinality (could be encoded categories)
        if len(dimension_cols) < 2:
            logger.info("Checking numeric columns with low cardinality")
            for col in self.current_df.select_dtypes(include=['int64', 'int32', 'float64']).columns:
                if col not in dimension_cols:
                    unique_count = self.current_df[col].nunique()
                    if 2 <= unique_count <= 50:  # Stricter for numeric
                        dimension_cols.append(col)
                        logger.info(f"Added numeric column '{col}' as dimension ({unique_count} unique)")
        
        logger.info(f"Final dimension columns detected: {dimension_cols[:5]}")
        return dimension_cols[:5]  # Limit to 5 dimensions
    
    def _get_time_range(self, time_column: Optional[str]) -> Optional[Dict[str, str]]:
        """Get time range from data."""
        if time_column is None or self.current_df is None:
            return None
        
        if time_column not in self.current_df.columns:
            return None
        
        try:
            time_series = pd.to_datetime(self.current_df[time_column], errors='coerce')
            return {
                "start": str(time_series.min()),
                "end": str(time_series.max())
            }
        except Exception:
            return None
    
    def _generate_visualizations(
        self,
        correlation_output,
        volatility_output,
        dimensional_output,
        anomaly_output
    ) -> List[VisualizationSpec]:
        """
        Generate visualization specifications for the frontend.
        """
        visualizations = []
        
        # Correlation heatmap
        if correlation_output.visualization:
            visualizations.append(VisualizationSpec(
                type=VisualizationType.HEATMAP,
                title="Correlation Matrix",
                description="Pairwise correlations between variables",
                data=correlation_output.visualization.get('data', {}),
                config=correlation_output.visualization.get('config', {})
            ))
        
        # Volatility map
        if volatility_output.visualization:
            visualizations.append(VisualizationSpec(
                type=VisualizationType.MAP,
                title="Regional Volatility",
                description="Geographic distribution of data volatility",
                data=volatility_output.visualization.get('data', {}),
                config=volatility_output.visualization.get('config', {})
            ))
        
        # Dimensional heatmap
        if dimensional_output.visualization:
            visualizations.append(VisualizationSpec(
                type=VisualizationType.HEATMAP,
                title="Dimensional Analysis",
                description="Outlier clusters across dimensions",
                data=dimensional_output.visualization.get('data', {}),
                config=dimensional_output.visualization.get('config', {})
            ))
        
        # Anomaly scatter plot
        if anomaly_output.visualization:
            visualizations.append(VisualizationSpec(
                type=VisualizationType.SCATTER_PLOT,
                title="Anomaly Detection",
                description="Detected anomalies by severity",
                data=anomaly_output.visualization.get('data', {}),
                config=anomaly_output.visualization.get('config', {})
            ))
        
        # Add summary charts
        if self.current_df is not None and self.quality_report:
            # Add data distribution chart
            visualizations.append(VisualizationSpec(
                type=VisualizationType.BAR_CHART,
                title="Data Quality Overview",
                description="Summary of data quality metrics",
                data={
                    "quality_score": self.quality_report.quality_score,
                    "total_records": self.quality_report.total_rows,
                    "missing_values": sum(self.quality_report.missing_values.values()),
                    "duplicates": self.quality_report.duplicate_rows
                },
                config={"showLabels": True}
            ))
        
        return visualizations
    
    async def cleanup(self):
        """Cleanup resources."""
        await self.llm_layer.close()
        self.current_df = None
        self.quality_report = None
