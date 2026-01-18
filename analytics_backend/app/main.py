"""
Aadhaar Pulse Analytics Backend - Main Application

FastAPI application entry point with middleware configuration,
CORS setup, and route registration.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger

from app.config import settings
from app.api.routes import router


# Configure logging
logger.add(
    settings.log_file,
    rotation="10 MB",
    retention="7 days",
    level=settings.log_level
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Aadhaar Pulse Analytics Backend")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"LLM Provider: {settings.llm_provider}")
    
    # Create logs directory if needed
    os.makedirs(os.path.dirname(settings.log_file), exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("Shutting down Aadhaar Pulse Analytics Backend")


# Create FastAPI application
app = FastAPI(
    title="Aadhaar Pulse Analytics API",
    description="""
    ## Aadhaar Pulse - End-to-End Analytical & Reasoning Intelligence Engine
    
    This API provides intelligent analytics for UIDAI datasets, transforming raw data 
    into actionable insights through:
    
    * **Automated Data Cleaning**: Ingests and standardizes raw CSV/Excel files
    * **Correlation Engine**: Identifies driver variables and hidden relationships
    * **Volatility Scoring**: Detects erratic patterns across regions and time
    * **Dimensional Slicing**: Finds anomalous clusters in high-dimensional data
    * **Anomaly Detection**: Flags statistical outliers using Z-score analysis
    * **LLM Reasoning**: Translates statistics into plain-English recommendations
    
    ### Authentication
    Currently in development mode. Production will require mTLS authentication.
    
    ### Rate Limits
    - File upload: 100MB max
    - Analysis requests: 10 concurrent jobs
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware - Allow all origins for production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Vercel, local dev, etc.)
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all response headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API routes
app.include_router(router, prefix="/api", tags=["Analysis"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Aadhaar Pulse Analytics API",
        "version": "1.0.0",
        "description": "End-to-End Analytical & Reasoning Intelligence Engine for UIDAI",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment for cloud deployments (Render, Heroku, etc.)
    port = int(os.environ.get("PORT", settings.api_port))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # Bind to all interfaces for cloud deployment
        port=port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
