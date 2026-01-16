"""
Unit Tests for Analytical Engines

Tests the core analytical engines with sample data.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from app.engines.preprocessor import DataPreprocessor
from app.engines.correlation import CorrelationEngine
from app.engines.volatility import VolatilityScoringEngine
from app.engines.dimensional import DimensionalSlicingEngine
from app.engines.anomaly import AnomalyDetectionEngine


# Test Data Fixtures
@pytest.fixture
def sample_enrollment_data():
    """Generate sample enrollment data for testing."""
    np.random.seed(42)
    
    states = ['Uttar Pradesh', 'Maharashtra', 'Bihar', 'West Bengal', 'Madhya Pradesh',
              'Tamil Nadu', 'Rajasthan', 'Karnataka', 'Gujarat', 'Andhra Pradesh']
    
    months = pd.date_range(start='2024-01-01', periods=12, freq='M')
    age_groups = ['0-5', '5-18', '18-30', '30-50', '50+']
    
    data = []
    for state in states:
        for month in months:
            for age_group in age_groups:
                # Base enrollment with state-specific variation
                base = np.random.randint(10000, 50000)
                
                # Add seasonal variation
                if month.month in [6, 7, 8, 9]:  # Monsoon
                    base *= np.random.uniform(0.7, 0.9)
                
                # Add state-specific anomalies
                if state == 'Bihar' and month.month in [3, 4]:
                    base *= np.random.uniform(1.3, 1.5)  # Pre-monsoon spike
                
                # Age group affects rejection rate
                rejection_multiplier = {
                    '0-5': 0.08, '5-18': 0.03, '18-30': 0.02,
                    '30-50': 0.025, '50+': 0.04
                }
                rejection_rate = rejection_multiplier[age_group] * np.random.uniform(0.8, 1.2)
                
                data.append({
                    'state': state,
                    'date': month,
                    'age_group': age_group,
                    'enrollment_count': int(base),
                    'rejection_count': int(base * rejection_rate),
                    'rejection_rate': round(rejection_rate * 100, 2),
                    'biometric_failures': int(base * rejection_rate * 0.6),
                    'document_issues': int(base * rejection_rate * 0.3),
                    'other_issues': int(base * rejection_rate * 0.1)
                })
    
    return pd.DataFrame(data)


@pytest.fixture
def sample_csv_content(sample_enrollment_data):
    """Generate CSV content from sample data."""
    return sample_enrollment_data.to_csv(index=False).encode('utf-8')


class TestDataPreprocessor:
    """Tests for Data Preprocessor."""
    
    def test_load_csv(self, sample_csv_content):
        """Test CSV loading."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_file(sample_csv_content, 'test.csv')
        
        assert df is not None
        assert len(df) > 0
        assert 'state' in df.columns
    
    def test_clean_data(self, sample_csv_content):
        """Test data cleaning pipeline."""
        preprocessor = DataPreprocessor()
        preprocessor.load_file(sample_csv_content, 'test.csv')
        cleaned = preprocessor.clean_data()
        
        assert cleaned is not None
        assert len(cleaned) > 0
    
    def test_quality_report(self, sample_csv_content):
        """Test data quality report generation."""
        preprocessor = DataPreprocessor()
        preprocessor.load_file(sample_csv_content, 'test.csv')
        report = preprocessor.generate_quality_report()
        
        assert report is not None
        assert report.total_rows > 0
        assert report.quality_score >= 0
        assert report.quality_score <= 100


class TestCorrelationEngine:
    """Tests for Correlation Engine."""
    
    def test_correlation_analysis(self, sample_enrollment_data):
        """Test correlation analysis."""
        engine = CorrelationEngine(correlation_threshold=0.5)
        result = engine.analyze(sample_enrollment_data)
        
        assert result is not None
        assert result.correlation_matrix is not None
        assert isinstance(result.summary, str)
    
    def test_strong_correlations(self, sample_enrollment_data):
        """Test identification of strong correlations."""
        engine = CorrelationEngine(correlation_threshold=0.3)
        result = engine.analyze(sample_enrollment_data)
        
        # Should find correlation between rejection_count and enrollment_count
        assert len(result.strong_correlations) > 0
    
    def test_driver_variables(self, sample_enrollment_data):
        """Test driver variable identification."""
        engine = CorrelationEngine()
        result = engine.analyze(sample_enrollment_data)
        
        assert 'driver_variables' in result.model_dump()


class TestVolatilityScoringEngine:
    """Tests for Volatility Scoring Engine."""
    
    def test_volatility_analysis(self, sample_enrollment_data):
        """Test volatility analysis."""
        engine = VolatilityScoringEngine()
        result = engine.analyze(
            sample_enrollment_data,
            metric_column='rejection_rate',
            region_column='state',
            time_column='date'
        )
        
        assert result is not None
        assert len(result.regional_scores) > 0
    
    def test_high_volatility_detection(self, sample_enrollment_data):
        """Test detection of high volatility regions."""
        engine = VolatilityScoringEngine(high_threshold=0.3)
        result = engine.analyze(
            sample_enrollment_data,
            metric_column='enrollment_count',
            region_column='state'
        )
        
        # Should classify some regions based on CV
        assert isinstance(result.high_volatility_regions, list)
        assert isinstance(result.stable_regions, list)


class TestDimensionalSlicingEngine:
    """Tests for Dimensional Slicing Engine."""
    
    def test_dimensional_analysis(self, sample_enrollment_data):
        """Test dimensional slicing analysis."""
        engine = DimensionalSlicingEngine()
        result = engine.analyze(
            sample_enrollment_data,
            metric_column='rejection_rate',
            dimension_columns=['state', 'age_group']
        )
        
        assert result is not None
        assert len(result.aggregations) > 0
    
    def test_outlier_detection(self, sample_enrollment_data):
        """Test outlier cluster detection."""
        # Add some extreme values
        sample_enrollment_data.loc[0, 'rejection_rate'] = 50.0  # Extreme outlier
        
        engine = DimensionalSlicingEngine(zscore_threshold=2.0)
        result = engine.analyze(
            sample_enrollment_data,
            metric_column='rejection_rate',
            dimension_columns=['state', 'age_group']
        )
        
        assert result is not None


class TestAnomalyDetectionEngine:
    """Tests for Anomaly Detection Engine."""
    
    def test_anomaly_detection(self, sample_enrollment_data):
        """Test anomaly detection."""
        engine = AnomalyDetectionEngine()
        result = engine.analyze(
            sample_enrollment_data,
            metric_columns=['rejection_rate', 'enrollment_count'],
            region_column='state'
        )
        
        assert result is not None
        assert isinstance(result.total_anomalies, int)
    
    def test_severity_classification(self, sample_enrollment_data):
        """Test severity classification of anomalies."""
        # Add extreme outliers
        sample_enrollment_data.loc[0, 'rejection_rate'] = 100.0
        sample_enrollment_data.loc[1, 'rejection_rate'] = 80.0
        
        engine = AnomalyDetectionEngine(zscore_threshold=2.0)
        result = engine.analyze(
            sample_enrollment_data,
            metric_columns=['rejection_rate'],
            region_column='state'
        )
        
        # Should have some anomalies
        if result.total_anomalies > 0:
            severities = [a.severity.value for a in result.anomalies]
            assert any(s in severities for s in ['critical', 'high', 'medium', 'low'])


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
