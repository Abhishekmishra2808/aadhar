"""
Anomaly Detection Engine - Z-Score Analysis for Outlier Flagging

This module implements statistical anomaly detection:
- Z-Score normalization and threshold-based detection
- Multi-metric anomaly tracking
- Regional and temporal anomaly distribution
- Severity classification

Mathematical Formula:
Z = (x - μ) / σ

Where:
- x = observed value
- μ = population mean
- σ = population standard deviation

Threshold: |Z| > 2 is flagged as anomalous
"""

import uuid
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
import pandas as pd
import numpy as np
from scipy import stats
from scipy.stats import zscore as scipy_zscore
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from loguru import logger

from app.models import (
    Anomaly,
    AnomalyDetectionOutput,
    RiskLevel,
    VisualizationType
)
from app.config import settings


class AnomalyDetectionEngine:
    """
    Statistical Anomaly Detection Engine.
    
    Identifies outliers and broken relationships between local
    and national performance using Z-score analysis and
    advanced machine learning techniques.
    """
    
    def __init__(
        self,
        zscore_threshold: float = None,
        use_isolation_forest: bool = False
    ):
        self.zscore_threshold = zscore_threshold or settings.zscore_anomaly_threshold
        self.use_isolation_forest = use_isolation_forest
        self.results: Optional[AnomalyDetectionOutput] = None
    
    def analyze(
        self,
        df: pd.DataFrame,
        metric_columns: List[str],
        region_column: Optional[str] = None,
        time_column: Optional[str] = None,
        id_column: Optional[str] = None
    ) -> AnomalyDetectionOutput:
        """
        Run full anomaly detection on the dataset.
        
        Args:
            df: Input DataFrame
            metric_columns: List of numeric columns to analyze for anomalies
            region_column: Optional column containing region identifiers
            time_column: Optional column containing time information
            id_column: Optional column for record identification
            
        Returns:
            AnomalyDetectionOutput with all findings
        """
        logger.info(f"Running anomaly detection on columns: {metric_columns}")
        
        # Validate columns
        valid_metrics = [col for col in metric_columns if col in df.columns]
        if not valid_metrics:
            raise ValueError("No valid metric columns found")
        
        all_anomalies = []
        
        # Z-Score based detection for each metric
        for metric in valid_metrics:
            metric_anomalies = self._detect_zscore_anomalies(
                df=df,
                metric_column=metric,
                region_column=region_column,
                time_column=time_column,
                id_column=id_column
            )
            all_anomalies.extend(metric_anomalies)
        
        # Optional: Multivariate anomaly detection using Isolation Forest
        if self.use_isolation_forest and len(valid_metrics) > 1:
            mv_anomalies = self._detect_multivariate_anomalies(
                df=df,
                metric_columns=valid_metrics,
                region_column=region_column,
                time_column=time_column
            )
            all_anomalies.extend(mv_anomalies)
        
        # Remove duplicates (keep highest severity)
        unique_anomalies = self._deduplicate_anomalies(all_anomalies)
        
        # Calculate distributions
        anomaly_by_region = self._calculate_regional_distribution(
            unique_anomalies, region_column
        )
        anomaly_by_metric = self._calculate_metric_distribution(unique_anomalies)
        severity_distribution = self._calculate_severity_distribution(unique_anomalies)
        
        # Generate summary
        summary = self._generate_summary(
            unique_anomalies,
            anomaly_by_region,
            anomaly_by_metric,
            severity_distribution
        )
        
        # Create visualization spec
        visualization = self._create_visualization_spec(
            unique_anomalies,
            anomaly_by_region
        )
        
        self.results = AnomalyDetectionOutput(
            total_anomalies=len(unique_anomalies),
            anomalies=unique_anomalies,
            anomaly_by_region=anomaly_by_region,
            anomaly_by_metric=anomaly_by_metric,
            severity_distribution=severity_distribution,
            summary=summary,
            visualization=visualization
        )
        
        return self.results
    
    def _detect_zscore_anomalies(
        self,
        df: pd.DataFrame,
        metric_column: str,
        region_column: Optional[str],
        time_column: Optional[str],
        id_column: Optional[str]
    ) -> List[Anomaly]:
        """
        Detect anomalies using Z-Score analysis.
        
        Z = (x - μ) / σ
        """
        anomalies = []
        
        # Calculate national statistics
        metric_data = df[metric_column].dropna()
        if len(metric_data) < 3:
            return anomalies
        
        national_mean = metric_data.mean()
        national_std = metric_data.std()
        
        if national_std == 0:
            return anomalies
        
        # Calculate Z-scores
        df_temp = df.copy()
        df_temp['_zscore'] = (df[metric_column] - national_mean) / national_std
        
        # Find anomalies
        anomaly_mask = abs(df_temp['_zscore']) > self.zscore_threshold
        anomaly_rows = df_temp[anomaly_mask]
        
        for idx, row in anomaly_rows.iterrows():
            observed = row[metric_column]
            z = row['_zscore']
            
            # Skip NaN or Inf values
            if pd.isna(observed) or pd.isna(z) or np.isinf(observed) or np.isinf(z):
                continue
                
            deviation_pct = ((observed - national_mean) / national_mean * 100) if national_mean != 0 else 0.0
            
            # Skip if deviation_pct is NaN or Inf
            if pd.isna(deviation_pct) or np.isinf(deviation_pct):
                deviation_pct = 0.0
            
            # Build location dict
            location = {}
            if region_column and region_column in df.columns:
                location['region'] = str(row[region_column])
            
            # Get time period
            time_period = None
            if time_column and time_column in df.columns:
                time_period = str(row[time_column])
            
            # Generate description
            direction = "above" if z > 0 else "below"
            description = (
                f"{metric_column} value of {observed:.2f} is {abs(deviation_pct):.1f}% "
                f"{direction} the national average ({national_mean:.2f})"
            )
            
            if location.get('region'):
                description = f"In {location['region']}: " + description
            
            anomalies.append(Anomaly(
                id=str(uuid.uuid4())[:8],
                metric_name=metric_column,
                observed_value=round(observed, 4),
                expected_value=round(national_mean, 4),
                z_score=round(z, 4),
                deviation_percentage=round(deviation_pct, 2),
                location=location if location else None,
                time_period=time_period,
                severity=self._classify_severity(z),
                description=description
            ))
        
        return anomalies
    
    def _detect_multivariate_anomalies(
        self,
        df: pd.DataFrame,
        metric_columns: List[str],
        region_column: Optional[str],
        time_column: Optional[str]
    ) -> List[Anomaly]:
        """
        Detect multivariate anomalies using Isolation Forest.
        
        Isolation Forest isolates observations by randomly selecting
        a feature and then randomly selecting a split value.
        """
        anomalies = []
        
        try:
            # Prepare data
            feature_df = df[metric_columns].dropna()
            if len(feature_df) < 10:
                return anomalies
            
            # Scale features
            scaler = StandardScaler()
            scaled_features = scaler.fit_transform(feature_df)
            
            # Fit Isolation Forest
            iso_forest = IsolationForest(
                contamination=0.05,  # Expect 5% anomalies
                random_state=42,
                n_estimators=100
            )
            
            predictions = iso_forest.fit_predict(scaled_features)
            anomaly_scores = iso_forest.score_samples(scaled_features)
            
            # Find anomalies (predictions == -1)
            anomaly_indices = feature_df.index[predictions == -1]
            
            for idx in anomaly_indices:
                row = df.loc[idx]
                score = anomaly_scores[list(feature_df.index).index(idx)]
                
                # Build location dict
                location = {}
                if region_column and region_column in df.columns:
                    location['region'] = str(row[region_column])
                
                # Get time period
                time_period = None
                if time_column and time_column in df.columns:
                    time_period = str(row[time_column])
                
                # Find which metric is most anomalous
                z_scores = {}
                for col in metric_columns:
                    mean = df[col].mean()
                    std = df[col].std()
                    if std > 0:
                        z_scores[col] = abs((row[col] - mean) / std)
                
                most_anomalous = max(z_scores.items(), key=lambda x: x[1])
                
                description = (
                    f"Multivariate anomaly detected. Most anomalous metric: "
                    f"{most_anomalous[0]} (Z-score: {most_anomalous[1]:.2f})"
                )
                
                if location.get('region'):
                    description = f"In {location['region']}: " + description
                
                anomalies.append(Anomaly(
                    id=str(uuid.uuid4())[:8],
                    metric_name="multivariate",
                    observed_value=round(score, 4),
                    expected_value=0,  # Expected score for normal points
                    z_score=round(most_anomalous[1], 4),
                    deviation_percentage=round((1 - score) * 100, 2),
                    location=location if location else None,
                    time_period=time_period,
                    severity=self._classify_severity_from_score(score),
                    description=description
                ))
            
        except Exception as e:
            logger.warning(f"Multivariate anomaly detection failed: {e}")
        
        return anomalies
    
    def _classify_severity(self, z_score: float) -> RiskLevel:
        """
        Classify severity based on Z-score magnitude.
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
    
    def _classify_severity_from_score(self, anomaly_score: float) -> RiskLevel:
        """
        Classify severity based on Isolation Forest anomaly score.
        Score is negative; more negative = more anomalous.
        """
        if anomaly_score < -0.5:
            return RiskLevel.CRITICAL
        elif anomaly_score < -0.3:
            return RiskLevel.HIGH
        elif anomaly_score < -0.1:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _deduplicate_anomalies(
        self,
        anomalies: List[Anomaly]
    ) -> List[Anomaly]:
        """
        Remove duplicate anomalies, keeping highest severity.
        """
        seen = {}
        severity_order = {
            RiskLevel.CRITICAL: 4,
            RiskLevel.HIGH: 3,
            RiskLevel.MEDIUM: 2,
            RiskLevel.LOW: 1
        }
        
        for anomaly in anomalies:
            # Create unique key
            location_key = tuple(sorted(anomaly.location.items())) if anomaly.location else ()
            key = (anomaly.metric_name, location_key, anomaly.time_period)
            
            if key not in seen:
                seen[key] = anomaly
            else:
                existing = seen[key]
                if severity_order[anomaly.severity] > severity_order[existing.severity]:
                    seen[key] = anomaly
        
        return list(seen.values())
    
    def _calculate_regional_distribution(
        self,
        anomalies: List[Anomaly],
        region_column: Optional[str]
    ) -> Dict[str, int]:
        """
        Calculate anomaly count by region.
        """
        distribution = defaultdict(int)
        
        for anomaly in anomalies:
            if anomaly.location and 'region' in anomaly.location:
                distribution[anomaly.location['region']] += 1
            else:
                distribution['Unknown'] += 1
        
        # Sort by count descending
        return dict(sorted(distribution.items(), key=lambda x: x[1], reverse=True))
    
    def _calculate_metric_distribution(
        self,
        anomalies: List[Anomaly]
    ) -> Dict[str, int]:
        """
        Calculate anomaly count by metric.
        """
        distribution = defaultdict(int)
        
        for anomaly in anomalies:
            distribution[anomaly.metric_name] += 1
        
        return dict(sorted(distribution.items(), key=lambda x: x[1], reverse=True))
    
    def _calculate_severity_distribution(
        self,
        anomalies: List[Anomaly]
    ) -> Dict[str, int]:
        """
        Calculate anomaly count by severity level.
        """
        distribution = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        }
        
        for anomaly in anomalies:
            distribution[anomaly.severity.value] += 1
        
        return distribution
    
    def _generate_summary(
        self,
        anomalies: List[Anomaly],
        anomaly_by_region: Dict[str, int],
        anomaly_by_metric: Dict[str, int],
        severity_distribution: Dict[str, int]
    ) -> str:
        """
        Generate executive summary of anomaly detection findings.
        """
        summary_parts = [
            "**Anomaly Detection Summary**\n\n",
            f"Detected **{len(anomalies)}** anomalies in the dataset.\n\n"
        ]
        
        # Severity breakdown
        summary_parts.append("**Severity Distribution:**\n")
        summary_parts.append(f"- 🔴 Critical: {severity_distribution['critical']}\n")
        summary_parts.append(f"- 🟠 High: {severity_distribution['high']}\n")
        summary_parts.append(f"- 🟡 Medium: {severity_distribution['medium']}\n")
        summary_parts.append(f"- 🟢 Low: {severity_distribution['low']}\n\n")
        
        # Regional hotspots
        if anomaly_by_region:
            summary_parts.append("**🎯 Regional Hotspots (Most Anomalies):**\n")
            for region, count in list(anomaly_by_region.items())[:5]:
                summary_parts.append(f"- {region}: {count} anomalies\n")
            summary_parts.append("\n")
        
        # Metric breakdown
        if anomaly_by_metric:
            summary_parts.append("**📊 Metrics with Most Anomalies:**\n")
            for metric, count in list(anomaly_by_metric.items())[:5]:
                summary_parts.append(f"- {metric}: {count} anomalies\n")
            summary_parts.append("\n")
        
        # Critical anomalies
        critical_anomalies = [a for a in anomalies if a.severity == RiskLevel.CRITICAL]
        if critical_anomalies:
            summary_parts.append("**⚠️ Critical Anomalies Requiring Immediate Attention:**\n")
            for anomaly in critical_anomalies[:3]:
                summary_parts.append(f"- {anomaly.description}\n")
        
        return "".join(summary_parts)
    
    def _create_visualization_spec(
        self,
        anomalies: List[Anomaly],
        anomaly_by_region: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Create visualization specification for frontend.
        """
        # Prepare scatter plot data
        scatter_data = []
        for anomaly in anomalies[:100]:  # Limit for visualization
            scatter_data.append({
                'id': anomaly.id,
                'metric': anomaly.metric_name,
                'observed': anomaly.observed_value,
                'expected': anomaly.expected_value,
                'z_score': anomaly.z_score,
                'severity': anomaly.severity.value,
                'region': anomaly.location.get('region', 'Unknown') if anomaly.location else 'Unknown'
            })
        
        return {
            'type': VisualizationType.SCATTER_PLOT.value,
            'title': 'Anomaly Detection Results',
            'description': 'Scatter plot showing detected anomalies by Z-score',
            'data': {
                'anomalies': scatter_data,
                'regional_distribution': anomaly_by_region
            },
            'config': {
                'xAxis': 'expected',
                'yAxis': 'observed',
                'colorBy': 'severity',
                'sizeBy': 'z_score',
                'threshold': self.zscore_threshold
            }
        }
    
    def get_anomalies_by_severity(
        self,
        severity: RiskLevel
    ) -> List[Anomaly]:
        """
        Get anomalies filtered by severity level.
        """
        if self.results is None:
            return []
        
        return [a for a in self.results.anomalies if a.severity == severity]
    
    def get_anomalies_by_region(
        self,
        region: str
    ) -> List[Anomaly]:
        """
        Get anomalies for a specific region.
        """
        if self.results is None:
            return []
        
        return [
            a for a in self.results.anomalies
            if a.location and a.location.get('region') == region
        ]
    
    def get_top_anomalies(
        self,
        n: int = 10
    ) -> List[Anomaly]:
        """
        Get top N anomalies by Z-score magnitude.
        """
        if self.results is None:
            return []
        
        return sorted(
            self.results.anomalies,
            key=lambda x: abs(x.z_score),
            reverse=True
        )[:n]
