"""
Volatility Scoring Engine - Temporal Analysis for Pattern Detection

This module implements the "Where & When" analysis:
- Coefficient of Variation (CV) calculation
- Regional stability scoring
- Seasonal pattern detection
- Temporal trend analysis

Mathematical Formula:
CV = σ / μ = Standard Deviation / Mean

Interpretation:
- Low CV (< 0.15): Steady state
- Moderate CV (0.15-0.5): Some variability
- High CV (> 0.5): Massive, unexplained spikes
"""

from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
import pandas as pd
import numpy as np
from scipy import stats
from scipy.fft import fft
from loguru import logger

from app.models import (
    RegionalVolatility,
    VolatilityScoringOutput,
    VolatilityLevel,
    VisualizationType
)
from app.config import settings


class VolatilityScoringEngine:
    """
    Temporal Volatility Analysis Engine.
    
    Measures data stability across regions and time periods
    to identify erratic patterns and unexplained spikes.
    """
    
    def __init__(
        self,
        high_threshold: float = None,
        low_threshold: float = None
    ):
        self.high_threshold = high_threshold or settings.volatility_high_threshold
        self.low_threshold = low_threshold or settings.volatility_low_threshold
        self.results: Optional[VolatilityScoringOutput] = None
    
    def analyze(
        self,
        df: pd.DataFrame,
        metric_column: str,
        region_column: str,
        time_column: Optional[str] = None
    ) -> VolatilityScoringOutput:
        """
        Run full volatility analysis on the dataset.
        
        Args:
            df: Input DataFrame
            metric_column: Column containing the metric to analyze
            region_column: Column containing region identifiers
            time_column: Optional column containing time/date information
            
        Returns:
            VolatilityScoringOutput with all findings
        """
        logger.info(f"Running volatility analysis on '{metric_column}' by '{region_column}'")
        
        # Validate columns
        if metric_column not in df.columns:
            raise ValueError(f"Metric column '{metric_column}' not found")
        if region_column not in df.columns:
            raise ValueError(f"Region column '{region_column}' not found")
        
        # Calculate regional CV scores
        regional_scores = self._calculate_regional_cv(
            df, metric_column, region_column
        )
        
        # Add temporal patterns if time column provided
        temporal_patterns = {}
        if time_column and time_column in df.columns:
            temporal_patterns = self._analyze_temporal_patterns(
                df, metric_column, region_column, time_column
            )
            regional_scores = self._enrich_with_temporal(
                regional_scores, temporal_patterns
            )
        
        # Classify regions
        high_volatility_regions = [
            r.region for r in regional_scores 
            if r.volatility_level in [VolatilityLevel.HIGH, VolatilityLevel.ERRATIC]
        ]
        
        stable_regions = [
            r.region for r in regional_scores
            if r.volatility_level == VolatilityLevel.STABLE
        ]
        
        # Detect seasonality
        seasonality_detected = self._detect_seasonality(
            df, metric_column, time_column
        ) if time_column else False
        
        # Generate summary
        summary = self._generate_summary(
            regional_scores, 
            high_volatility_regions,
            stable_regions,
            seasonality_detected
        )
        
        # Create visualization spec
        visualization = self._create_visualization_spec(
            regional_scores, temporal_patterns
        )
        
        self.results = VolatilityScoringOutput(
            regional_scores=regional_scores,
            high_volatility_regions=high_volatility_regions,
            stable_regions=stable_regions,
            temporal_patterns=temporal_patterns,
            seasonality_detected=seasonality_detected,
            summary=summary,
            visualization=visualization
        )
        
        return self.results
    
    def _calculate_regional_cv(
        self,
        df: pd.DataFrame,
        metric_column: str,
        region_column: str
    ) -> List[RegionalVolatility]:
        """
        Calculate Coefficient of Variation for each region.
        
        CV = σ / μ
        
        Where:
        - σ = Standard Deviation
        - μ = Mean
        """
        regional_scores = []
        
        for region in df[region_column].unique():
            region_data = df[df[region_column] == region][metric_column]
            
            # Skip if insufficient data
            if len(region_data) < 3:
                continue
            
            mean = region_data.mean()
            std = region_data.std()
            
            # Handle NaN values
            if pd.isna(mean) or pd.isna(std):
                continue
            
            # Avoid division by zero - use large number instead of inf for JSON compatibility
            if mean == 0:
                cv = 999.99 if std > 0 else 0.0
            else:
                cv = std / abs(mean)
            
            # Handle NaN or Inf CV values
            if pd.isna(cv) or np.isinf(cv):
                cv = 999.99
            
            # Classify volatility level
            volatility_level = self._classify_volatility(cv)
            
            regional_scores.append(RegionalVolatility(
                region=str(region),
                coefficient_of_variation=round(cv, 4),
                mean=round(mean, 4),
                std_deviation=round(std, 4),
                volatility_level=volatility_level,
                temporal_pattern=None,
                seasonal_factors=[]
            ))
        
        # Sort by CV descending
        regional_scores.sort(
            key=lambda x: x.coefficient_of_variation,
            reverse=True
        )
        
        return regional_scores
    
    def _classify_volatility(self, cv: float) -> VolatilityLevel:
        """
        Classify volatility level based on CV thresholds.
        """
        if cv > 1.0:
            return VolatilityLevel.ERRATIC
        elif cv > self.high_threshold:
            return VolatilityLevel.HIGH
        elif cv > self.low_threshold:
            return VolatilityLevel.MODERATE
        else:
            return VolatilityLevel.STABLE
    
    def _analyze_temporal_patterns(
        self,
        df: pd.DataFrame,
        metric_column: str,
        region_column: str,
        time_column: str
    ) -> Dict[str, Any]:
        """
        Analyze temporal patterns in the data.
        """
        temporal_patterns = {
            'monthly_trends': {},
            'quarterly_trends': {},
            'regional_temporal': {}
        }
        
        # Ensure time column is datetime
        df_temp = df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df_temp[time_column]):
            df_temp[time_column] = pd.to_datetime(df_temp[time_column], errors='coerce')
        
        # Overall monthly trends
        if df_temp[time_column].notna().any():
            df_temp['month'] = df_temp[time_column].dt.month
            df_temp['quarter'] = df_temp[time_column].dt.quarter
            
            monthly_agg = df_temp.groupby('month')[metric_column].agg(['mean', 'std']).to_dict()
            temporal_patterns['monthly_trends'] = monthly_agg
            
            quarterly_agg = df_temp.groupby('quarter')[metric_column].agg(['mean', 'std']).to_dict()
            temporal_patterns['quarterly_trends'] = quarterly_agg
            
            # Regional temporal patterns
            for region in df[region_column].unique():
                region_data = df_temp[df_temp[region_column] == region]
                if len(region_data) > 0:
                    regional_monthly = region_data.groupby('month')[metric_column].mean().to_dict()
                    temporal_patterns['regional_temporal'][str(region)] = regional_monthly
        
        return temporal_patterns
    
    def _enrich_with_temporal(
        self,
        regional_scores: List[RegionalVolatility],
        temporal_patterns: Dict[str, Any]
    ) -> List[RegionalVolatility]:
        """
        Enrich regional scores with temporal pattern information.
        """
        regional_temporal = temporal_patterns.get('regional_temporal', {})
        
        for score in regional_scores:
            region_monthly = regional_temporal.get(score.region, {})
            
            if region_monthly:
                # Identify peak and trough months
                if region_monthly:
                    peak_month = max(region_monthly.items(), key=lambda x: x[1])
                    trough_month = min(region_monthly.items(), key=lambda x: x[1])
                    
                    month_names = {
                        1: 'January', 2: 'February', 3: 'March', 4: 'April',
                        5: 'May', 6: 'June', 7: 'July', 8: 'August',
                        9: 'September', 10: 'October', 11: 'November', 12: 'December'
                    }
                    
                    peak_name = month_names.get(peak_month[0], str(peak_month[0]))
                    trough_name = month_names.get(trough_month[0], str(trough_month[0]))
                    
                    score.temporal_pattern = f"Peak: {peak_name}, Trough: {trough_name}"
                    
                    # Identify seasonal factors
                    seasonal_factors = []
                    
                    # Check for monsoon correlation (June-September in India)
                    monsoon_months = [6, 7, 8, 9]
                    monsoon_values = [v for k, v in region_monthly.items() if k in monsoon_months]
                    other_values = [v for k, v in region_monthly.items() if k not in monsoon_months]
                    
                    if monsoon_values and other_values:
                        monsoon_avg = np.mean(monsoon_values)
                        other_avg = np.mean(other_values)
                        
                        if monsoon_avg > other_avg * 1.2:
                            seasonal_factors.append("monsoon_spike")
                        elif monsoon_avg < other_avg * 0.8:
                            seasonal_factors.append("monsoon_dip")
                    
                    # Check for year-end patterns (Oct-Dec)
                    yearend_months = [10, 11, 12]
                    yearend_values = [v for k, v in region_monthly.items() if k in yearend_months]
                    
                    if yearend_values and other_values:
                        yearend_avg = np.mean(yearend_values)
                        if yearend_avg > np.mean(other_values) * 1.2:
                            seasonal_factors.append("year_end_surge")
                    
                    score.seasonal_factors = seasonal_factors
        
        return regional_scores
    
    def _detect_seasonality(
        self,
        df: pd.DataFrame,
        metric_column: str,
        time_column: Optional[str]
    ) -> bool:
        """
        Detect if there's significant seasonality in the data.
        Uses autocorrelation analysis.
        """
        if time_column is None or time_column not in df.columns:
            return False
        
        try:
            df_temp = df.copy()
            df_temp[time_column] = pd.to_datetime(df_temp[time_column], errors='coerce')
            df_temp = df_temp.dropna(subset=[time_column, metric_column])
            
            if len(df_temp) < 24:  # Need at least 2 years of monthly data
                return False
            
            # Aggregate by month
            df_temp['year_month'] = df_temp[time_column].dt.to_period('M')
            monthly_series = df_temp.groupby('year_month')[metric_column].mean()
            
            if len(monthly_series) < 24:
                return False
            
            # Calculate autocorrelation at lag 12 (yearly)
            values = monthly_series.values
            mean = np.mean(values)
            var = np.var(values)
            
            if var == 0:
                return False
            
            # Lag-12 autocorrelation
            n = len(values)
            lag = 12
            if n <= lag:
                return False
            
            autocorr = np.sum((values[:n-lag] - mean) * (values[lag:] - mean)) / (n * var)
            
            # Significant seasonality if autocorrelation > 0.3
            return autocorr > 0.3
            
        except Exception as e:
            logger.warning(f"Error detecting seasonality: {e}")
            return False
    
    def _generate_summary(
        self,
        regional_scores: List[RegionalVolatility],
        high_volatility_regions: List[str],
        stable_regions: List[str],
        seasonality_detected: bool
    ) -> str:
        """
        Generate executive summary of volatility findings.
        """
        summary_parts = [
            "**Volatility Analysis Summary**\n\n",
            f"Analyzed **{len(regional_scores)}** regions.\n\n"
        ]
        
        # Volatility distribution
        erratic = [r for r in regional_scores if r.volatility_level == VolatilityLevel.ERRATIC]
        high = [r for r in regional_scores if r.volatility_level == VolatilityLevel.HIGH]
        moderate = [r for r in regional_scores if r.volatility_level == VolatilityLevel.MODERATE]
        stable = [r for r in regional_scores if r.volatility_level == VolatilityLevel.STABLE]
        
        summary_parts.append("**Volatility Distribution:**\n")
        summary_parts.append(f"- 🔴 Erratic (CV>1.0): {len(erratic)} regions - CRITICAL\n")
        summary_parts.append(f"- 🟠 High (CV>0.5): {len(high)} regions - Needs Attention\n")
        summary_parts.append(f"- 🟡 Moderate (CV 0.15-0.5): {len(moderate)} regions - Acceptable\n")
        summary_parts.append(f"- 🟢 Stable (CV<0.15): {len(stable)} regions - Normal Performance\n\n")
        
        # High volatility regions
        if high_volatility_regions:
            summary_parts.append("**⚠️ High Volatility Regions Requiring Attention:**\n")
            for region in high_volatility_regions[:5]:
                score = next((r for r in regional_scores if r.region == region), None)
                if score:
                    summary_parts.append(
                        f"- **{region}**: CV = {score.coefficient_of_variation:.3f} "
                        f"({score.volatility_level.value}) - {'URGENT' if score.coefficient_of_variation > 1.0 else 'Monitor'}\n"
                    )
                    if score.temporal_pattern:
                        summary_parts.append(f"  - {score.temporal_pattern}\n")
        else:
            summary_parts.append("**✅ All regions showing acceptable stability levels.**\n")
        
        # Stable regions
        if stable_regions:
            summary_parts.append(f"\n**✅ Most Stable Regions (CV<0.15):** {', '.join(stable_regions[:5])}\n")
            summary_parts.append("These regions show consistent performance with minimal fluctuation.\n")
        
        # Seasonality
        if seasonality_detected:
            summary_parts.append(
                "\n**📅 Seasonality Detected:** The data shows significant seasonal patterns. "
                "Consider seasonal adjustments when setting targets.\n"
            )
        
        return "".join(summary_parts)
    
    def _create_visualization_spec(
        self,
        regional_scores: List[RegionalVolatility],
        temporal_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create visualization specification for frontend.
        """
        return {
            'type': VisualizationType.MAP.value,
            'title': 'Regional Volatility Heatmap',
            'description': 'Geographic distribution of metric volatility',
            'data': {
                'regions': [
                    {
                        'region': r.region,
                        'cv': r.coefficient_of_variation,
                        'level': r.volatility_level.value,
                        'mean': r.mean,
                        'std': r.std_deviation
                    }
                    for r in regional_scores
                ],
                'temporal': temporal_patterns
            },
            'config': {
                'colorScale': 'YlOrRd',
                'thresholds': {
                    'low': self.low_threshold,
                    'high': self.high_threshold
                }
            }
        }
    
    def get_region_details(self, region: str) -> Optional[RegionalVolatility]:
        """Get detailed volatility information for a specific region."""
        if self.results is None:
            return None
        
        return next(
            (r for r in self.results.regional_scores if r.region == region),
            None
        )
    
    def compare_regions(
        self,
        regions: List[str]
    ) -> Dict[str, Any]:
        """
        Compare volatility metrics across specified regions.
        """
        if self.results is None:
            return {}
        
        comparison = {}
        for region in regions:
            score = self.get_region_details(region)
            if score:
                comparison[region] = {
                    'cv': score.coefficient_of_variation,
                    'level': score.volatility_level.value,
                    'mean': score.mean,
                    'std': score.std_deviation
                }
        
        return comparison
