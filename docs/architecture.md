# AADHAAR PULSE - Technical Architecture

## End-to-End Analytical & Reasoning Intelligence Engine

This document provides comprehensive technical documentation for the Aadhaar Pulse analytics platform.

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AADHAAR PULSE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │   React     │   │   FastAPI   │   │   LLM       │               │
│  │  Frontend   │──▶│   Backend   │──▶│  Reasoning  │               │
│  │   (Vite)    │   │  (Python)   │   │   Layer     │               │
│  └─────────────┘   └─────────────┘   └─────────────┘               │
│         │                 │                  │                      │
│         ▼                 ▼                  ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ANALYTICAL ENGINES                        │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │   │
│  │  │Correlation│ │ Volatility│ │Dimensional│ │  Anomaly  │   │   │
│  │  │  Engine   │ │  Scoring  │ │  Slicing  │ │ Detection │   │   │
│  │  │  (r)      │ │   (CV)    │ │ (Trivar)  │ │ (Z-Score) │   │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Analytical Engines Specification

### 2.1 Correlation Engine (The "Who & What")

**Purpose:** Identify bivariate relationships between all numeric variables in the dataset.

**Mathematical Foundation:**
- Pearson's Correlation Coefficient (r):
  
  r = Σ(xi - x̄)(yi - ȳ) / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
  
  Where:
  - xi, yi are individual data points
  - x̄, ȳ are the means of X and Y variables
  - r ranges from -1 (perfect negative) to +1 (perfect positive)

**Implementation Details:**
- Performs pairwise correlation for all numeric columns
- Calculates p-values for statistical significance testing (α = 0.05)
- Identifies "driver variables" with highest average correlations
- Classifies relationships as:
  - Strong positive: r ≥ 0.7
  - Strong negative: r ≤ -0.7
  - Moderate: 0.4 ≤ |r| < 0.7
  - Weak: |r| < 0.4

**Output:**
```json
{
  "correlation_matrix": {"var1": {"var2": 0.85, "var3": -0.42}},
  "strong_correlations": [
    {
      "variable_1": "enrollment_count",
      "variable_2": "population_density",
      "correlation_coefficient": 0.847,
      "p_value": 0.0001,
      "is_significant": true,
      "relationship_type": "strong_positive"
    }
  ],
  "driver_variables": [
    {"variable": "population_density", "driver_score": 0.72}
  ]
}
```

### 2.2 Volatility Scoring Engine (The "Where & When")

**Purpose:** Measure temporal variability across regions using Coefficient of Variation.

**Mathematical Foundation:**
- Coefficient of Variation (CV):
  
  CV = σ / μ = Standard Deviation / Mean
  
  Where:
  - σ is the standard deviation
  - μ is the mean (must be non-zero)

**Classification Thresholds:**
- CV ≥ 0.5: Critical volatility
- CV ≥ 0.3: High volatility
- CV ≥ 0.2: Moderate volatility
- CV ≥ 0.1: Low volatility
- CV < 0.1: Stable

**Implementation Details:**
- Groups data by region (state/district)
- Calculates CV for each region's time series
- Detects seasonal patterns (monthly, quarterly)
- Identifies trend direction (upward, downward, stable)

**Output:**
```json
{
  "regional_volatility": [
    {
      "region": "Bihar",
      "coefficient_of_variation": 0.42,
      "mean": 150000,
      "std_dev": 63000,
      "data_points": 24,
      "interpretation": "High variability suggests operational inconsistencies"
    }
  ],
  "seasonal_patterns": [
    {
      "pattern_type": "quarterly",
      "strength": 0.78,
      "peak_periods": ["Q1", "Q4"],
      "trough_periods": ["Q2"]
    }
  ]
}
```

### 2.3 Dimensional Slicing Engine (The "Trivariate Magic")

**Purpose:** Perform multi-axis aggregation to identify outlier clusters across Region × Time × Metric dimensions.

**Mathematical Foundation:**
- For each dimensional slice (Region, Time, Metric):
  1. Calculate aggregate value
  2. Compute Z-score: Z = (x - μ) / σ
  3. Flag outliers where |Z| > 2

**Implementation Details:**
- Groups data by all dimension combinations
- Supports arbitrary metric aggregation
- Identifies outlier clusters (multiple related outliers)
- Provides expected value ranges

**Output:**
```json
{
  "dimensional_slices": [
    {
      "region": "Uttar Pradesh",
      "time_period": "2024-Q3",
      "dimension": "rejection_rate",
      "value": 0.15,
      "z_score": 3.2,
      "expected_range": [0.02, 0.08],
      "is_outlier": true
    }
  ],
  "outlier_clusters": [
    {
      "cluster_id": "cluster_001",
      "regions": ["UP", "Bihar"],
      "time_periods": ["2024-Q3"],
      "common_characteristics": ["High rejection rate"],
      "severity_score": 0.85
    }
  ]
}
```

### 2.4 Anomaly Detection Engine

**Purpose:** Statistical identification and classification of data anomalies.

**Mathematical Foundation:**
- Z-Score Normalization:
  
  Z = (x - μ) / σ
  
  Where:
  - x is the data point
  - μ is the mean of the distribution
  - σ is the standard deviation

**Classification Thresholds:**
- |Z| ≥ 3: Critical anomaly
- |Z| ≥ 2.5: High severity
- |Z| ≥ 2: Moderate anomaly

**Optional: Isolation Forest**
- Unsupervised machine learning for complex multi-dimensional anomalies
- Contamination parameter: 0.05 (5% expected anomalies)

**Output:**
```json
{
  "anomalies": [
    {
      "id": "anom_001",
      "type": "statistical_outlier",
      "severity": "high",
      "z_score": 3.2,
      "affected_metric": "rejection_count",
      "region": "Uttar Pradesh",
      "time_period": "2024-09",
      "actual_value": 45000,
      "expected_value": 12000,
      "expected_range": [8000, 16000],
      "description": "Unusually high rejection count",
      "related_anomalies": ["anom_002"]
    }
  ]
}
```

## 3. LLM Reasoning Layer

### 3.1 Purpose

The LLM Reasoning Layer transforms mathematical outputs from the analytical engines into human-readable intelligence reports, providing:
- Executive summaries
- Root cause analysis
- Strategic recommendations

### 3.2 Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    LLM REASONING LAYER                     │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │
│  │  Analysis   │   │   Prompt    │   │   Output    │      │
│  │   Package   │──▶│  Generator  │──▶│  Generator  │      │
│  │   (JSON)    │   │             │   │             │      │
│  └─────────────┘   └─────────────┘   └─────────────┘      │
│                           │                               │
│                           ▼                               │
│                    ┌─────────────┐                        │
│                    │   LLM API   │                        │
│                    │ (GPT-4 /    │                        │
│                    │  Claude-3)  │                        │
│                    └─────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Prompt Engineering

**System Prompt Template:**
```
You are an expert data analyst for UIDAI, interpreting Aadhaar enrollment 
analytics. Your role is to transform statistical findings into actionable 
intelligence for policy makers.

Guidelines:
- Be precise and evidence-based
- Link findings to potential real-world causes
- Prioritize recommendations by impact
- Never expose individual-level data
- Maintain differential privacy
```

### 3.4 Output Structure

```json
{
  "executive_summary": "Analysis of 2.5M records reveals strong correlation...",
  "key_findings": [
    "Enrollment rates highly correlated with urban population density (r=0.85)",
    "Bihar shows critical volatility (CV=0.42) in monthly enrollments",
    "Q3 2024 rejection spike in UP exceeds 3σ from historical mean"
  ],
  "root_cause_analysis": [
    {
      "finding": "High volatility in Bihar",
      "likely_causes": [
        "Inconsistent operator availability",
        "Infrastructure gaps in rural areas",
        "Seasonal agricultural migration"
      ],
      "confidence": 0.75
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Deploy additional mobile enrollment units in Bihar",
      "rationale": "High CV suggests capacity constraints during peak periods",
      "expected_impact": "Reduce CV by 40%, improve enrollment consistency"
    }
  ],
  "confidence_score": 0.82
}
```

## 4. API Reference

### 4.1 Upload & Analysis

**POST /api/upload**
- Upload dataset for analysis
- Accepts: CSV, Excel, JSON
- Returns: analysis_id

**GET /api/analysis/{id}/status**
- Check analysis progress
- Returns: status, progress percentage, current stage

**GET /api/analysis/{id}/results**
- Get complete analysis package
- Returns: Full AnalysisPackage JSON

### 4.2 Specific Endpoints

**GET /api/analysis/{id}/correlations**
**GET /api/analysis/{id}/volatility**
**GET /api/analysis/{id}/anomalies**
**GET /api/analysis/{id}/insights**

### 4.3 Export

**GET /api/analysis/{id}/export?format=pdf|csv**
- Export analysis report
- Returns: Binary file

## 5. Data Flow

```
1. Upload (CSV/Excel/JSON)
          │
          ▼
2. Preprocessor
   - Auto-detect encoding
   - Clean & validate data
   - Generate quality report
          │
          ▼
3. Column Detection
   - Target columns (numeric metrics)
   - Region columns (categorical geo)
   - Time columns (datetime)
   - Dimension columns (categorical)
          │
          ▼
4. Parallel Engine Execution
   ┌──────┬──────┬──────┬──────┐
   │Corr. │Volat.│Dimen.│Anom. │
   │Engine│Engine│Engine│Engine│
   └──────┴──────┴──────┴──────┘
          │
          ▼
5. Analysis Package Assembly
          │
          ▼
6. LLM Reasoning
   - Generate insights
   - Create recommendations
          │
          ▼
7. Return Results
```

## 6. Configuration

### 6.1 Environment Variables

```env
# LLM Configuration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo-preview

# Analysis Thresholds
CORRELATION_THRESHOLD=0.7
VOLATILITY_CV_THRESHOLD=0.3
ANOMALY_Z_THRESHOLD=2.0

# Server
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,https://aadhaar-pulse.uidai.gov.in
```

### 6.2 Column Auto-Detection Rules

| Column Type | Detection Heuristics |
|-------------|---------------------|
| Target | Numeric dtype, contains 'count', 'rate', 'enrollment' |
| Region | Categorical, contains 'state', 'district', 'region', 'area' |
| Time | Datetime dtype, contains 'date', 'month', 'year', 'period' |
| Dimension | Categorical, not region, low cardinality (<100 unique) |

## 7. Security & Privacy

### 7.1 Data Handling
- Raw data processed in memory, never persisted
- Analysis results contain aggregates only
- No PII in analysis outputs

### 7.2 LLM Privacy
- Prompts sanitized before sending to LLM
- No individual records included
- Only statistical summaries shared

### 7.3 Access Control
- API key authentication
- Role-based access (future)
- Audit logging for all operations

## 8. Deployment

### 8.1 Docker Compose

```yaml
services:
  analytics-backend:
    build: ./analytics_backend
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### 8.2 Kubernetes (Production)

See `kubernetes/` directory for Helm charts and manifests.

## 9. Monitoring & Observability

- Health check: GET /health
- Metrics: Prometheus endpoint at /metrics
- Logging: Structured JSON logs
- Tracing: OpenTelemetry integration

---

*Document Version: 1.0*
*Last Updated: 2024*
