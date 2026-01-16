"""
Correlation Engine - Bivariate Analysis for Driver Variable Identification

This module implements the "Who & What" analysis:
- Pearson correlation coefficient calculation
- Statistical significance testing (p-values)
- Driver variable ranking
- Correlation matrix generation

Mathematical Formula:
r = Σ(xi - x̄)(yi - ȳ) / √[Σ(xi - x̄)² Σ(yi - ȳ)²]
"""

from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from scipy import stats
from scipy.stats import pearsonr, spearmanr
from loguru import logger

from app.models import (
    CorrelationResult,
    CorrelationEngineOutput,
    VisualizationType
)
from app.config import settings


class CorrelationEngine:
    """
    Bivariate Correlation Analysis Engine.
    
    Identifies driver variables and hidden relationships between
    numerical variables in the dataset.
    """
    
    def __init__(
        self,
        correlation_threshold: float = None,
        pvalue_threshold: float = None
    ):
        self.correlation_threshold = correlation_threshold or settings.correlation_threshold
        self.pvalue_threshold = pvalue_threshold or settings.pvalue_significance
        self.correlation_matrix: Optional[pd.DataFrame] = None
        self.pvalue_matrix: Optional[pd.DataFrame] = None
        self.results: Optional[CorrelationEngineOutput] = None
    
    def analyze(
        self,
        df: pd.DataFrame,
        target_column: Optional[str] = None,
        method: str = 'pearson'
    ) -> CorrelationEngineOutput:
        """
        Run full correlation analysis on the dataset.
        
        Args:
            df: Input DataFrame
            target_column: Optional specific column to analyze correlations against
            method: 'pearson' or 'spearman'
            
        Returns:
            CorrelationEngineOutput with all findings
        """
        logger.info(f"Running correlation analysis with method: {method}")
        
        # Get numeric columns only
        numeric_df = df.select_dtypes(include=['int64', 'float64', 'int32', 'float32'])
        
        if len(numeric_df.columns) < 2:
            logger.warning("Insufficient numeric columns for correlation analysis")
            return self._empty_output()
        
        # Calculate correlation matrix
        self.correlation_matrix = self._compute_correlation_matrix(numeric_df, method)
        
        # Calculate p-value matrix
        self.pvalue_matrix = self._compute_pvalue_matrix(numeric_df, method)
        
        # Find strong correlations
        strong_correlations = self._find_strong_correlations(
            target_column=target_column
        )
        
        # Identify driver variables
        driver_variables = self._identify_driver_variables(
            df, target_column, strong_correlations
        )
        
        # Generate summary
        summary = self._generate_summary(strong_correlations, driver_variables)
        
        # Create visualization spec
        visualization = self._create_visualization_spec()
        
        self.results = CorrelationEngineOutput(
            correlation_matrix=self.correlation_matrix.to_dict(),
            strong_correlations=strong_correlations,
            driver_variables=driver_variables,
            summary=summary,
            visualization=visualization
        )
        
        return self.results
    
    def _compute_correlation_matrix(
        self, 
        df: pd.DataFrame,
        method: str
    ) -> pd.DataFrame:
        """
        Compute correlation matrix for all numeric columns.
        
        Uses Pearson correlation coefficient:
        r = Σ(xi - x̄)(yi - ȳ) / √[Σ(xi - x̄)² Σ(yi - ȳ)²]
        """
        if method == 'spearman':
            corr_matrix = df.corr(method='spearman')
        else:
            corr_matrix = df.corr(method='pearson')
        
        # Replace NaN values with 0 (no correlation)
        corr_matrix = corr_matrix.fillna(0.0)
        
        # Replace infinite values with 0
        corr_matrix = corr_matrix.replace([np.inf, -np.inf], 0.0)
        
        return corr_matrix
    
    def _compute_pvalue_matrix(
        self,
        df: pd.DataFrame,
        method: str
    ) -> pd.DataFrame:
        """
        Compute p-value matrix for statistical significance testing.
        """
        columns = df.columns
        n = len(columns)
        pvalue_matrix = pd.DataFrame(
            np.zeros((n, n)),
            columns=columns,
            index=columns
        )
        
        corr_func = spearmanr if method == 'spearman' else pearsonr
        
        for i, col1 in enumerate(columns):
            for j, col2 in enumerate(columns):
                if i == j:
                    pvalue_matrix.loc[col1, col2] = 0.0
                elif i < j:
                    # Remove NaN values for correlation calculation
                    mask = df[[col1, col2]].notna().all(axis=1)
                    if mask.sum() > 2:
                        try:
                            _, p_value = corr_func(
                                df.loc[mask, col1],
                                df.loc[mask, col2]
                            )
                            pvalue_matrix.loc[col1, col2] = p_value
                            pvalue_matrix.loc[col2, col1] = p_value
                        except Exception:
                            pvalue_matrix.loc[col1, col2] = 1.0
                            pvalue_matrix.loc[col2, col1] = 1.0
                    else:
                        pvalue_matrix.loc[col1, col2] = 1.0
                        pvalue_matrix.loc[col2, col1] = 1.0
        
        return pvalue_matrix
    
    def _find_strong_correlations(
        self,
        target_column: Optional[str] = None
    ) -> List[CorrelationResult]:
        """
        Identify correlations that exceed the threshold.
        """
        if self.correlation_matrix is None or self.pvalue_matrix is None:
            return []
        
        strong_correlations = []
        columns = self.correlation_matrix.columns.tolist()
        
        for i, col1 in enumerate(columns):
            for j, col2 in enumerate(columns):
                if i >= j:  # Skip diagonal and duplicates
                    continue
                
                # If target column specified, only find correlations with it
                if target_column and target_column not in [col1, col2]:
                    continue
                
                r = self.correlation_matrix.loc[col1, col2]
                p_value = self.pvalue_matrix.loc[col1, col2]
                
                # Skip if r or p_value is NaN or Inf
                if pd.isna(r) or pd.isna(p_value) or np.isinf(r) or np.isinf(p_value):
                    continue
                
                # Convert to float to ensure JSON serialization
                r = float(r)
                p_value = float(p_value)
                
                if abs(r) >= self.correlation_threshold:
                    is_significant = p_value < self.pvalue_threshold
                    
                    # Determine relationship type
                    if r > 0.8:
                        relationship = "strong_positive"
                    elif r > 0.5:
                        relationship = "moderate_positive"
                    elif r > 0:
                        relationship = "weak_positive"
                    elif r > -0.5:
                        relationship = "weak_negative"
                    elif r > -0.8:
                        relationship = "moderate_negative"
                    else:
                        relationship = "strong_negative"
                    
                    # Generate interpretation
                    interpretation = self._interpret_correlation(
                        col1, col2, r, is_significant
                    )
                    
                    strong_correlations.append(CorrelationResult(
                        variable_1=col1,
                        variable_2=col2,
                        correlation_coefficient=round(r, 4),
                        p_value=round(p_value, 6),
                        is_significant=is_significant,
                        relationship_type=relationship,
                        interpretation=interpretation
                    ))
        
        # Sort by absolute correlation value
        strong_correlations.sort(
            key=lambda x: abs(x.correlation_coefficient),
            reverse=True
        )
        
        return strong_correlations
    
    def _interpret_correlation(
        self,
        var1: str,
        var2: str,
        r: float,
        is_significant: bool
    ) -> str:
        """
        Generate human-readable interpretation of a correlation.
        """
        strength = "strong" if abs(r) > 0.8 else "moderate" if abs(r) > 0.5 else "weak"
        direction = "positive" if r > 0 else "negative"
        significance = "statistically significant" if is_significant else "not statistically significant"
        
        interpretation = (
            f"There is a {strength} {direction} relationship between "
            f"'{var1}' and '{var2}' (r = {r:.3f}). "
            f"This correlation is {significance}. "
        )
        
        if r > 0.7 and is_significant:
            interpretation += f"As '{var1}' increases, '{var2}' tends to increase as well."
        elif r < -0.7 and is_significant:
            interpretation += f"As '{var1}' increases, '{var2}' tends to decrease."
        
        return interpretation
    
    def _identify_driver_variables(
        self,
        df: pd.DataFrame,
        target_column: Optional[str],
        strong_correlations: List[CorrelationResult]
    ) -> List[Dict[str, Any]]:
        """
        Rank variables by their importance as drivers.
        """
        driver_scores = {}
        
        # Calculate driver score based on correlation strength and frequency
        for corr in strong_correlations:
            for var in [corr.variable_1, corr.variable_2]:
                if target_column and var == target_column:
                    continue
                
                if var not in driver_scores:
                    driver_scores[var] = {
                        'total_correlation': 0,
                        'count': 0,
                        'max_correlation': 0,
                        'significant_count': 0
                    }
                
                driver_scores[var]['total_correlation'] += abs(corr.correlation_coefficient)
                driver_scores[var]['count'] += 1
                driver_scores[var]['max_correlation'] = max(
                    driver_scores[var]['max_correlation'],
                    abs(corr.correlation_coefficient)
                )
                if corr.is_significant:
                    driver_scores[var]['significant_count'] += 1
        
        # Convert to list and rank
        drivers = []
        for var, scores in driver_scores.items():
            avg_correlation = scores['total_correlation'] / scores['count'] if scores['count'] > 0 else 0
            driver_score = (
                avg_correlation * 0.4 +
                scores['max_correlation'] * 0.3 +
                (scores['significant_count'] / max(scores['count'], 1)) * 0.3
            )
            
            drivers.append({
                'variable': var,
                'driver_score': round(driver_score, 4),
                'average_correlation': round(avg_correlation, 4),
                'max_correlation': round(scores['max_correlation'], 4),
                'correlation_count': scores['count'],
                'significant_correlations': scores['significant_count'],
                'interpretation': f"'{var}' is a key driver variable with {scores['count']} strong correlations"
            })
        
        # Sort by driver score
        drivers.sort(key=lambda x: x['driver_score'], reverse=True)
        
        return drivers[:10]  # Return top 10 drivers
    
    def _generate_summary(
        self,
        strong_correlations: List[CorrelationResult],
        driver_variables: List[Dict[str, Any]]
    ) -> str:
        """
        Generate executive summary of correlation findings.
        """
        if not strong_correlations:
            return "No strong correlations found in the dataset. Variables appear to be independent."
        
        summary_parts = [
            f"**Correlation Analysis Summary**\n\n",
            f"Found **{len(strong_correlations)}** strong correlations (|r| ≥ {self.correlation_threshold}).\n\n"
        ]
        
        # Top correlations
        significant_corrs = [c for c in strong_correlations if c.is_significant]
        if significant_corrs:
            summary_parts.append(f"**Top Statistically Significant Findings:**\n")
            for corr in significant_corrs[:3]:
                summary_parts.append(
                    f"- {corr.variable_1} ↔ {corr.variable_2}: "
                    f"r = {corr.correlation_coefficient:.3f} (p < {self.pvalue_threshold})\n"
                )
        
        # Driver variables
        if driver_variables:
            summary_parts.append(f"\n**Key Driver Variables:**\n")
            for driver in driver_variables[:3]:
                summary_parts.append(
                    f"- **{driver['variable']}**: Driver score = {driver['driver_score']:.2f}\n"
                )
        
        return "".join(summary_parts)
    
    def _create_visualization_spec(self) -> Dict[str, Any]:
        """
        Create visualization specification for frontend.
        """
        if self.correlation_matrix is None:
            return {}
        
        return {
            'type': VisualizationType.HEATMAP.value,
            'title': 'Correlation Matrix Heatmap',
            'description': 'Visualizes pairwise correlations between variables',
            'data': {
                'matrix': self.correlation_matrix.round(3).to_dict(),
                'labels': self.correlation_matrix.columns.tolist()
            },
            'config': {
                'colorScale': 'RdBu',
                'minValue': -1,
                'maxValue': 1,
                'annotate': True
            }
        }
    
    def _empty_output(self) -> CorrelationEngineOutput:
        """Return empty output when analysis cannot be performed."""
        return CorrelationEngineOutput(
            correlation_matrix={},
            strong_correlations=[],
            driver_variables=[],
            summary="Insufficient data for correlation analysis.",
            visualization={}
        )
    
    def get_correlation(self, var1: str, var2: str) -> Optional[float]:
        """Get correlation between two specific variables."""
        if self.correlation_matrix is None:
            return None
        
        if var1 in self.correlation_matrix.columns and var2 in self.correlation_matrix.columns:
            return self.correlation_matrix.loc[var1, var2]
        return None
    
    def get_top_correlations_for_variable(
        self,
        variable: str,
        n: int = 5
    ) -> List[Tuple[str, float]]:
        """Get top N correlations for a specific variable."""
        if self.correlation_matrix is None or variable not in self.correlation_matrix.columns:
            return []
        
        correlations = self.correlation_matrix[variable].drop(variable)
        top_n = correlations.abs().nlargest(n)
        
        return [(idx, correlations[idx]) for idx in top_n.index]
