# Aadhaar Pulse Analytics Backend

## End-to-End Analytical & Reasoning Intelligence Engine

Python-based analytical backend that transforms raw UIDAI datasets into actionable insights through advanced statistical analysis and LLM-powered reasoning.

## Features

### Analytical Engines

1. **Data Preprocessor**
   - Automatic schema detection
   - Multi-format support (CSV, JSON, Excel)
   - Intelligent missing value handling
   - Duplicate removal and standardization

2. **Correlation Engine**
   - Pearson/Spearman correlation analysis
   - Statistical significance testing (p-values)
   - Driver variable identification
   - Correlation matrix visualization

3. **Volatility Scoring Engine**
   - Coefficient of Variation (CV) analysis
   - Regional stability scoring
   - Seasonal pattern detection
   - Temporal trend analysis

4. **Dimensional Slicing Engine**
   - Multi-axis aggregation (trivariate analysis)
   - Outlier cluster detection
   - Hidden pattern discovery
   - Z-score based anomaly identification

5. **Anomaly Detection Engine**
   - Z-Score normalization
   - Isolation Forest (optional multivariate)
   - Severity classification
   - Regional/temporal distribution

6. **LLM Reasoning Layer**
   - Math-to-Narrative translation
   - Root cause analysis
   - Strategic recommendations
   - Differential privacy protection

## Quick Start

### Prerequisites

- Python 3.10+
- pip or conda

### Installation

```bash
# Navigate to analytics backend
cd analytics_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your API keys (optional for LLM features)
```

### Running the Server

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### File Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file=<your_file.csv>
```

### Trigger Analysis
```
POST /api/analyze/{job_id}?target_column=rejection_rate&region_column=state
```

### Get Results
```
GET /api/results/{job_id}
GET /api/insights/{job_id}
GET /api/anomalies/{job_id}
GET /api/correlations/{job_id}
GET /api/volatility/{job_id}
GET /api/visualizations/{job_id}
```

## Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM | - |
| `ANTHROPIC_API_KEY` | Anthropic API key for LLM | - |
| `LLM_PROVIDER` | LLM provider: "openai" or "anthropic" | openai |
| `CORRELATION_THRESHOLD` | Threshold for strong correlations | 0.7 |
| `ZSCORE_ANOMALY_THRESHOLD` | Z-score threshold for anomalies | 2.0 |
| `VOLATILITY_HIGH_THRESHOLD` | CV threshold for high volatility | 0.5 |

## Docker Deployment

```bash
# Build and run
docker build -t aadhaar-pulse-analytics .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key aadhaar-pulse-analytics
```

## Project Structure

```
analytics_backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── models.py            # Pydantic models
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py        # API endpoints
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── preprocessor.py  # Data cleaning
│   │   ├── correlation.py   # Correlation engine
│   │   ├── volatility.py    # Volatility scoring
│   │   ├── dimensional.py   # Dimensional slicing
│   │   └── anomaly.py       # Anomaly detection
│   └── services/
│       ├── __init__.py
│       ├── llm_reasoning.py # LLM integration
│       └── orchestrator.py  # Pipeline orchestration
├── tests/
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

## Security Features

- Stateless API design
- Differential privacy for LLM outputs
- CORS configuration
- Rate limiting (production)
- HSM integration ready (FIPS 140-2)

## License

Proprietary - UIDAI
