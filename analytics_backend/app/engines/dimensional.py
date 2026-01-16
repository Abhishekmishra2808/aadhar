"""
Dimensional Slicing Engine - Trivariate Aggregation for Outlier Detection

This module implements the "Trivariate Magic" analysis:
- Multi-axis aggregation (State × Age Group × Time Period)
- Outlier cluster detection
- Hidden pattern discovery in high-dimensional data
- Z-score based anomaly identification

This engine finds anomalies that simple 2D visualizations miss
by analyzing combinations of three or more dimensions.
"""

from typing import Any, Dict, List, Optional, Tuple
from itertools import combinations
import pandas as pd
import numpy as np
from scipy import stats
from loguru import logger

from app.models import (
    OutlierCluster,
    DimensionalSlicingOutput,
    RiskLevel,
    VisualizationType
)
from app.config import settings


class DimensionalSlicingEngine:
    """
    Trivariate Aggregation Engine for Outlier Cluster Detection.
    
    Identifies anomalous patterns hidden in high-dimensional data
    by analyzing combinations of categorical dimensions against
    numerical metrics.
    """
    
    def __init__(
        self,
        zscore_threshold: float = None,
        min_sample_size: int = 5
    ):
        self.zscore_threshold = zscore_threshold or settings.zscore_anomaly_threshold
        self.min_sample_size = min_sample_size
        self.results: Optional[DimensionalSlicingOutput] = None
    
    def analyze(
        self,
        df: pd.DataFrame,
        metric_column: str,
        dimension_columns: List[str],
        max_dimensions: int = 3
    ) -> DimensionalSlicingOutput:
        """
        Run dimensional slicing analysis on the dataset.
        
        Args:
            df: Input DataFrame
            metric_column: Column containing the metric to analyze
            dimension_columns: List of categorical columns to slice by
            max_dimensions: Maximum number of dimensions to combine
            
        Returns:
            DimensionalSlicingOutput with all findings
        """
        logger.info(
            f"Running dimensional slicing on '{metric_column}' "
            f"across dimensions: {dimension_columns}"
        )
        
        # Validate columns
        if metric_column not in df.columns:
            raise ValueError(f"Metric column '{metric_column}' not found")
        
        valid_dims = [col for col in dimension_columns if col in df.columns]
        if len(valid_dims) < 2:
            raise ValueError("Need at least 2 valid dimension columns")
        
        # Calculate national baseline
        national_mean = df[metric_column].mean()
        national_std = df[metric_column].std()
        
        if national_std == 0:
            logger.warning("Zero standard deviation in metric - all values identical")
            return self._empty_output(national_mean)
        
        # Perform aggregations across dimension combinations
        all_aggregations = []
        all_outliers = []
        
        # Analyze 2D, 3D, etc. combinations
        for n_dims in range(2, min(max_dimensions + 1, len(valid_dims) + 1)):
            for dim_combo in combinations(valid_dims, n_dims):
                agg_result, outliers = self._analyze_dimension_combination(
                    df=df,
                    metric_column=metric_column,
                    dimensions=list(dim_combo),
                    national_mean=national_mean,
                    national_std=national_std
                )
                
                all_aggregations.extend(agg_result)
                all_outliers.extend(outliers)
        
        # Remove duplicate outliers (keep highest z-score)
        unique_outliers = self._deduplicate_outliers(all_outliers)
        
        # Sort by absolute z-score
        unique_outliers.sort(key=lambda x: abs(x.z_score), reverse=True)
        
        # Calculate dimension importance
        dimension_importance = self._calculate_dimension_importance(
            unique_outliers, valid_dims
        )
        
        # Generate summary
        summary = self._generate_summary(
            unique_outliers,
            dimension_importance,
            national_mean
        )
        
        # Create visualization spec
        visualization = self._create_visualization_spec(
            unique_outliers,
            all_aggregations
        )
        
        self.results = DimensionalSlicingOutput(
            aggregations=all_aggregations,
            outlier_clusters=unique_outliers,
            top_anomalies=unique_outliers[:10],
            dimension_importance=dimension_importance,
            summary=summary,
            visualization=visualization
        )
        
        return self.results
    
    def _analyze_dimension_combination(
        self,
        df: pd.DataFrame,
        metric_column: str,
        dimensions: List[str],
        national_mean: float,
        national_std: float
    ) -> Tuple[List[Dict[str, Any]], List[OutlierCluster]]:
        """
        Analyze a specific combination of dimensions.
        """
        aggregations = []
        outliers = []
        
        # Group by dimension combination
        grouped = df.groupby(dimensions, dropna=False)[metric_column].agg(['mean', 'count', 'std'])
        grouped = grouped.reset_index()
        
        for _, row in grouped.iterrows():
            # Skip small samples
            if row['count'] < self.min_sample_size:
                continue
            
            # Calculate z-score
            metric_value = row['mean']
            
            # Skip NaN values
            if pd.isna(metric_value):
                continue
                
            z_score = (metric_value - national_mean) / national_std
            
            # Handle NaN or Inf z-scores
            if pd.isna(z_score) or np.isinf(z_score):
                z_score = 0.0
            
            # Build dimension dict
            dim_dict = {dim: str(row[dim]) for dim in dimensions}
            
            # Calculate deviation from national
            deviation_from_national = (
                ((metric_value - national_mean) / national_mean) * 100 
                if national_mean != 0 else 0.0
            )
            if pd.isna(deviation_from_national) or np.isinf(deviation_from_national):
                deviation_from_national = 0.0
            
            # Create aggregation record
            agg_record = {
                'dimensions': dim_dict,
                'metric_value': round(float(metric_value), 4),
                'sample_size': int(row['count']),
                'std_within_group': round(float(row['std']), 4) if pd.notna(row['std']) else 0.0,
                'z_score': round(float(z_score), 4),
                'deviation_from_national': round(float(deviation_from_national), 2)
            }
            aggregations.append(agg_record)
            
            # Check if outlier
            if abs(z_score) > self.zscore_threshold:
                deviation_pct = ((metric_value - national_mean) / national_mean * 100) if national_mean != 0 else 0.0
                if pd.isna(deviation_pct) or np.isinf(deviation_pct):
                    deviation_pct = 0.0
                
                outliers.append(OutlierCluster(
                    dimensions=dim_dict,
                    metric_value=round(metric_value, 4),
                    national_mean=round(national_mean, 4),
                    z_score=round(z_score, 4),
                    deviation_percentage=round(deviation_pct, 2),
                    sample_size=int(row['count']),
                    risk_level=self._classify_risk(z_score)
                ))
        
        return aggregations, outliers
    
    def _classify_risk(self, z_score: float) -> RiskLevel:
        """
        Classify risk level based on z-score magnitude.
        """
        abs_z = abs(z_score)
        
        if abs_z > 4:
            return RiskLevel.CRITICAL
        elif abs_z > 3:
            return RiskLevel.HIGH
        elif abs_z > 2:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _deduplicate_outliers(
        self,
        outliers: List[OutlierCluster]
    ) -> List[OutlierCluster]:
        """
        Remove duplicate outliers, keeping the one with highest z-score.
        """
        seen = {}
        
        for outlier in outliers:
            # Create unique key from dimensions
            key = tuple(sorted(outlier.dimensions.items()))
            
            if key not in seen or abs(outlier.z_score) > abs(seen[key].z_score):
                seen[key] = outlier
        
        return list(seen.values())
    
    def _calculate_dimension_importance(
        self,
        outliers: List[OutlierCluster],
        dimensions: List[str]
    ) -> Dict[str, float]:
        """
        Calculate importance score for each dimension based on
        how frequently it appears in outlier clusters.
        """
        dimension_counts = {dim: 0 for dim in dimensions}
        dimension_zscore_sum = {dim: 0.0 for dim in dimensions}
        
        for outlier in outliers:
            for dim in outlier.dimensions.keys():
                if dim in dimension_counts:
                    dimension_counts[dim] += 1
                    dimension_zscore_sum[dim] += abs(outlier.z_score)
        
        # Calculate importance as weighted sum
        total_outliers = len(outliers) if outliers else 1
        importance = {}
        
        for dim in dimensions:
            frequency_score = dimension_counts[dim] / total_outliers
            avg_zscore = dimension_zscore_sum[dim] / max(dimension_counts[dim], 1)
            
            # Importance = 60% frequency + 40% average z-score impact
            importance[dim] = round(
                (frequency_score * 0.6 + min(avg_zscore / 5, 1) * 0.4),
                4
            )
        
        # Sort by importance
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
    
    def _generate_summary(
        self,
        outliers: List[OutlierCluster],
        dimension_importance: Dict[str, float],
        national_mean: float
    ) -> str:
        """
        Generate executive summary of dimensional slicing findings.
        """
        summary_parts = [
            "**Dimensional Slicing Analysis Summary**\n\n",
            f"National baseline: **{national_mean:.2f}**\n\n"
        ]
        
        # Outlier summary
        if outliers:
            critical = [o for o in outliers if o.risk_level == RiskLevel.CRITICAL]
            high = [o for o in outliers if o.risk_level == RiskLevel.HIGH]
            
            summary_parts.append(f"Found **{len(outliers)}** outlier clusters:\n")
            summary_parts.append(f"- 🔴 Critical: {len(critical)}\n")
            summary_parts.append(f"- 🟠 High Risk: {len(high)}\n")
            summary_parts.append(f"- 🟡 Medium/Low: {len(outliers) - len(critical) - len(high)}\n\n")
            
            # Top anomalies
            summary_parts.append("**🎯 Top Anomalous Clusters:**\n")
            for outlier in outliers[:5]:
                dims_str = " × ".join([f"{k}: {v}" for k, v in outlier.dimensions.items()])
                direction = "above" if outlier.z_score > 0 else "below"
                
                summary_parts.append(
                    f"- **{dims_str}**\n"
                    f"  - Value: {outlier.metric_value:.2f} "
                    f"({abs(outlier.deviation_percentage):.1f}% {direction} national average)\n"
                    f"  - Z-Score: {outlier.z_score:.2f} ({outlier.risk_level.value} risk)\n"
                )
        else:
            summary_parts.append(
                "**✅ No significant outlier clusters detected.** "
                "Data appears consistent across all dimension combinations.\n"
            )
        
        # Dimension importance
        if dimension_importance:
            summary_parts.append("\n**📊 Dimension Importance Ranking:**\n")
            for dim, score in list(dimension_importance.items())[:5]:
                bar_length = int(score * 20)
                bar = "█" * bar_length + "░" * (20 - bar_length)
                summary_parts.append(f"- {dim}: {bar} ({score:.2f})\n")
        
        return "".join(summary_parts)
    
    def _create_visualization_spec(
        self,
        outliers: List[OutlierCluster],
        aggregations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create visualization specification for frontend.
        """
        # Prepare heatmap data
        heatmap_data = []
        for outlier in outliers[:50]:  # Limit for visualization
            heatmap_data.append({
                'dimensions': outlier.dimensions,
                'value': outlier.metric_value,
                'z_score': outlier.z_score,
                'risk': outlier.risk_level.value
            })
        
        return {
            'type': VisualizationType.HEATMAP.value,
            'title': 'Dimensional Outlier Analysis',
            'description': 'Identifies anomalous clusters across dimension combinations',
            'data': {
                'outliers': heatmap_data,
                'aggregations': aggregations[:100]  # Limit for performance
            },
            'config': {
                'colorScale': 'RdYlGn_r',
                'zScoreThreshold': self.zscore_threshold,
                'showLabels': True
            }
        }
    
    def _empty_output(self, national_mean: float) -> DimensionalSlicingOutput:
        """Return empty output when analysis cannot be performed."""
        return DimensionalSlicingOutput(
            aggregations=[],
            outlier_clusters=[],
            top_anomalies=[],
            dimension_importance={},
            summary=f"National mean: {national_mean:.2f}. No dimensional analysis possible.",
            visualization={}
        )
    
    def get_outliers_for_dimension(
        self,
        dimension: str,
        value: str
    ) -> List[OutlierCluster]:
        """
        Get all outliers that include a specific dimension value.
        """
        if self.results is None:
            return []
        
        return [
            o for o in self.results.outlier_clusters
            if dimension in o.dimensions and o.dimensions[dimension] == value
        ]
    
    def drill_down(
        self,
        df: pd.DataFrame,
        metric_column: str,
        fixed_dimensions: Dict[str, str],
        drill_dimension: str
    ) -> List[Dict[str, Any]]:
        """
        Drill down into a specific dimension while holding others fixed.
        """
        # Filter data by fixed dimensions
        mask = pd.Series([True] * len(df))
        for dim, val in fixed_dimensions.items():
            mask &= (df[dim].astype(str) == val)
        
        filtered_df = df[mask]
        
        if len(filtered_df) < self.min_sample_size:
            return []
        
        # Aggregate by drill dimension
        result = filtered_df.groupby(drill_dimension)[metric_column].agg([
            'mean', 'count', 'std'
        ]).reset_index()
        
        national_mean = df[metric_column].mean()
        national_std = df[metric_column].std()
        
        drill_down_results = []
        for _, row in result.iterrows():
            z_score = (row['mean'] - national_mean) / national_std if national_std > 0 else 0
            
            drill_down_results.append({
                drill_dimension: row[drill_dimension],
                'metric_value': round(row['mean'], 4),
                'sample_size': int(row['count']),
                'z_score': round(z_score, 4),
                'deviation_pct': round(((row['mean'] - national_mean) / national_mean) * 100, 2) if national_mean != 0 else 0
            })
        
        return sorted(drill_down_results, key=lambda x: abs(x['z_score']), reverse=True)
