"""
Pydantic Models for Aadhaar Pulse Analytics Backend

Defines request/response schemas for API endpoints.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class VolatilityLevel(str, Enum):
    STABLE = "stable"
    MODERATE = "moderate"
    HIGH = "high"
    ERRATIC = "erratic"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class VisualizationType(str, Enum):
    LINE_CHART = "line_chart"
    BAR_CHART = "bar_chart"
    HEATMAP = "heatmap"
    SCATTER_PLOT = "scatter_plot"
    MAP = "map"
    BUBBLE_CHART = "bubble_chart"
    PIE_CHART = "pie_chart"


# ============================================================================
# Base Models
# ============================================================================

class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# ============================================================================
# Data Ingestion Models
# ============================================================================

class FileUploadResponse(BaseModel):
    """Response after file upload."""
    success: bool
    filename: str
    file_size: int
    records_count: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    data_quality: "DataQualityReport"
    job_id: str


class DataQualityReport(BaseModel):
    """Report on data quality after ingestion."""
    total_rows: int
    total_columns: int
    missing_values: Dict[str, int]
    duplicate_rows: int
    data_types: Dict[str, str]
    numeric_columns: List[str]
    categorical_columns: List[str]
    date_columns: List[str]
    quality_score: float = Field(ge=0, le=100)
    issues: List[str]


# ============================================================================
# Correlation Engine Models
# ============================================================================

class CorrelationResult(BaseModel):
    """Single correlation finding."""
    variable_1: str
    variable_2: str
    correlation_coefficient: float = Field(ge=-1, le=1)
    p_value: float
    is_significant: bool
    relationship_type: str  # "positive", "negative", "weak"
    interpretation: str


class CorrelationEngineOutput(BaseModel):
    """Complete output from Correlation Engine."""
    correlation_matrix: Dict[str, Dict[str, float]]
    strong_correlations: List[CorrelationResult]
    driver_variables: List[Dict[str, Any]]
    summary: str
    visualization: Dict[str, Any]


# ============================================================================
# Volatility Scoring Models
# ============================================================================

class RegionalVolatility(BaseModel):
    """Volatility score for a specific region."""
    region: str
    coefficient_of_variation: float
    mean: float
    std_deviation: float
    volatility_level: VolatilityLevel
    temporal_pattern: Optional[str] = None
    seasonal_factors: List[str] = []


class VolatilityScoringOutput(BaseModel):
    """Complete output from Volatility Scoring Engine."""
    regional_scores: List[RegionalVolatility]
    high_volatility_regions: List[str]
    stable_regions: List[str]
    temporal_patterns: Dict[str, Any]
    seasonality_detected: bool
    summary: str
    visualization: Dict[str, Any]


# ============================================================================
# Dimensional Slicing Models
# ============================================================================

class OutlierCluster(BaseModel):
    """Identified outlier cluster from dimensional slicing."""
    dimensions: Dict[str, str]  # e.g., {"state": "Kerala", "age_group": "0-5", "month": "December"}
    metric_value: float
    national_mean: float
    z_score: float
    deviation_percentage: float
    sample_size: int
    risk_level: RiskLevel


class DimensionalSlicingOutput(BaseModel):
    """Complete output from Dimensional Slicing Engine."""
    aggregations: List[Dict[str, Any]]
    outlier_clusters: List[OutlierCluster]
    top_anomalies: List[OutlierCluster]
    dimension_importance: Dict[str, float]
    summary: str
    visualization: Dict[str, Any]


# ============================================================================
# Anomaly Detection Models
# ============================================================================

class Anomaly(BaseModel):
    """Detected anomaly."""
    id: str
    metric_name: str
    observed_value: float
    expected_value: float
    z_score: float
    deviation_percentage: float
    location: Optional[Dict[str, str]] = None
    time_period: Optional[str] = None
    severity: RiskLevel
    description: str


class AnomalyDetectionOutput(BaseModel):
    """Complete output from Anomaly Detection Engine."""
    total_anomalies: int
    anomalies: List[Anomaly]
    anomaly_by_region: Dict[str, int]
    anomaly_by_metric: Dict[str, int]
    severity_distribution: Dict[str, int]
    summary: str
    visualization: Dict[str, Any]


# ============================================================================
# LLM Reasoning Models
# ============================================================================

class ContextualFactor(BaseModel):
    """External contextual factor identified by LLM."""
    factor_type: str  # "policy", "weather", "infrastructure", "demographic"
    description: str
    relevance_score: float = Field(ge=0, le=1)
    source: Optional[str] = None
    date: Optional[str] = None


class StrategicRecommendation(BaseModel):
    """Strategic recommendation from LLM."""
    priority: int = Field(ge=1, le=5)
    recommendation: str
    rationale: str
    expected_impact: str
    implementation_complexity: str  # "low", "medium", "high"
    affected_regions: List[str]
    timeline: str


class LLMReasoningOutput(BaseModel):
    """Complete output from LLM Reasoning Layer."""
    executive_summary: str
    root_cause_analysis: List[str]
    contextual_factors: List[ContextualFactor]
    strategic_recommendations: List[StrategicRecommendation]
    risk_assessment: str
    confidence_score: float = Field(ge=0, le=1)
    sources_consulted: List[str]


# ============================================================================
# Complete Analysis Output Models
# ============================================================================

class VisualizationSpec(BaseModel):
    """Specification for a visualization."""
    type: VisualizationType
    title: str
    description: str
    data: Dict[str, Any]
    config: Dict[str, Any] = {}


class StatisticalAbstract(BaseModel):
    """Statistical abstract - intermediate output before LLM processing."""
    correlation_findings: CorrelationEngineOutput
    volatility_findings: VolatilityScoringOutput
    dimensional_findings: DimensionalSlicingOutput
    anomaly_findings: AnomalyDetectionOutput


class AnalysisPackage(BaseModel):
    """Complete analysis package sent to frontend."""
    job_id: str
    status: AnalysisStatus
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Data Summary
    data_summary: Dict[str, Any]
    
    # Statistical Abstract
    statistical_abstract: StatisticalAbstract
    
    # LLM Reasoning Output
    intelligence_report: LLMReasoningOutput
    
    # Visualizations
    visualizations: List[VisualizationSpec]
    
    # Metadata
    processing_time_seconds: float
    data_quality_score: float


# ============================================================================
# API Request/Response Models
# ============================================================================

class AnalysisRequest(BaseModel):
    """Request to trigger analysis on uploaded data."""
    job_id: str
    analysis_types: List[str] = Field(
        default=["correlation", "volatility", "dimensional", "anomaly", "llm"]
    )
    target_column: Optional[str] = None
    groupby_columns: Optional[List[str]] = None
    time_column: Optional[str] = None
    region_column: Optional[str] = None


class AnalysisStatusResponse(BaseModel):
    """Response with analysis status."""
    job_id: str
    status: AnalysisStatus
    progress: int = Field(ge=0, le=100)
    current_stage: str
    estimated_time_remaining: Optional[int] = None
    errors: List[str] = []


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: datetime
    version: str
    components: Dict[str, str]


# Forward reference resolution
FileUploadResponse.model_rebuild()
