"""
API Routes for Aadhaar Pulse Analytics Backend

Provides RESTful endpoints for:
- File upload and ingestion
- Analysis triggering and status
- Results retrieval
- Health checks
"""

import uuid
import math
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from loguru import logger

from app.models import (
    AnalysisRequest,
    AnalysisStatusResponse,
    AnalysisPackage,
    AnalysisStatus,
    HealthCheckResponse,
    FileUploadResponse
)
from app.services.orchestrator import AnalysisOrchestrator
from app.config import settings

router = APIRouter()


def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitize an object for JSON serialization.
    Replaces NaN, Inf, -Inf with None.
    Handles datetime objects.
    """
    from datetime import datetime, date
    
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj

# In-memory storage for analysis jobs (in production, use Redis/database)
analysis_jobs: Dict[str, Dict[str, Any]] = {}
orchestrators: Dict[str, AnalysisOrchestrator] = {}


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns system status and component availability.
    """
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        components={
            "api": "operational",
            "analytics": "operational",
            "llm": "configured" if settings.openai_api_key or settings.anthropic_api_key else "not_configured"
        }
    )


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a data file for analysis.
    
    Supports CSV, JSON, and Excel files up to configured size limit.
    Returns data quality report and job ID for subsequent analysis.
    """
    # Validate file type
    filename = file.filename or "unknown"
    ext = filename.lower().split('.')[-1]
    
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {settings.allowed_extensions}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB"
        )
    
    try:
        # Create orchestrator and ingest file
        orchestrator = AnalysisOrchestrator()
        response = await orchestrator.ingest_file(content, filename)
        
        # Store orchestrator for later analysis
        orchestrators[response.job_id] = orchestrator
        
        # Initialize job status
        analysis_jobs[response.job_id] = {
            "status": AnalysisStatus.PENDING,
            "created_at": datetime.utcnow(),
            "filename": filename,
            "progress": 0,
            "result": None,
            "error": None
        }
        
        logger.info(f"File uploaded successfully: {filename}, job_id: {response.job_id}")
        return response
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{job_id}")
async def trigger_analysis(
    job_id: str,
    background_tasks: BackgroundTasks,
    target_column: Optional[str] = Query(None, description="Primary metric column"),
    region_column: Optional[str] = Query(None, description="Geographic region column"),
    time_column: Optional[str] = Query(None, description="Time/date column"),
    dimension_columns: Optional[str] = Query(None, description="Comma-separated dimension columns"),
    run_llm: bool = Query(True, description="Whether to run LLM reasoning")
):
    """
    Trigger full analysis on uploaded data.
    
    Analysis runs in background. Use /status/{job_id} to check progress.
    """
    if job_id not in orchestrators:
        raise HTTPException(status_code=404, detail="Job not found. Upload a file first.")
    
    if analysis_jobs[job_id]["status"] == AnalysisStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Analysis already in progress")
    
    # Parse dimension columns
    dim_cols = dimension_columns.split(",") if dimension_columns else None
    
    # Update job status
    analysis_jobs[job_id]["status"] = AnalysisStatus.PROCESSING
    analysis_jobs[job_id]["progress"] = 0
    
    # Run analysis in background
    background_tasks.add_task(
        run_analysis_task,
        job_id,
        target_column,
        region_column,
        time_column,
        dim_cols,
        run_llm
    )
    
    return {
        "success": True,
        "job_id": job_id,
        "message": "Analysis started. Check /status/{job_id} for progress."
    }


async def run_analysis_task(
    job_id: str,
    target_column: Optional[str],
    region_column: Optional[str],
    time_column: Optional[str],
    dimension_columns: Optional[List[str]],
    run_llm: bool
):
    """Background task to run the full analysis."""
    try:
        orchestrator = orchestrators[job_id]
        
        # Update progress
        analysis_jobs[job_id]["progress"] = 10
        
        # Run analysis
        result = await orchestrator.run_full_analysis(
            target_column=target_column,
            region_column=region_column,
            time_column=time_column,
            dimension_columns=dimension_columns,
            run_llm=run_llm
        )
        
        # Store result
        analysis_jobs[job_id]["status"] = AnalysisStatus.COMPLETED
        analysis_jobs[job_id]["progress"] = 100
        analysis_jobs[job_id]["result"] = result
        analysis_jobs[job_id]["completed_at"] = datetime.utcnow()
        
        logger.info(f"Analysis completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"Analysis failed for job {job_id}: {e}")
        analysis_jobs[job_id]["status"] = AnalysisStatus.FAILED
        analysis_jobs[job_id]["error"] = str(e)


@router.get("/status/{job_id}", response_model=AnalysisStatusResponse)
async def get_analysis_status(job_id: str):
    """
    Get the status of an analysis job.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    return AnalysisStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        current_stage="Analysis" if job["status"] == AnalysisStatus.PROCESSING else job["status"].value,
        errors=[job["error"]] if job.get("error") else []
    )


@router.get("/results/{job_id}")
async def get_analysis_results(job_id: str):
    """
    Get the complete analysis results.
    
    Returns the full AnalysisPackage including statistical findings,
    LLM insights, and visualization specifications.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] == AnalysisStatus.PROCESSING:
        raise HTTPException(status_code=202, detail="Analysis still in progress")
    
    if job["status"] == AnalysisStatus.FAILED:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {job.get('error')}")
    
    if job["result"] is None:
        raise HTTPException(status_code=404, detail="No results available")
    
    # Convert to dict for JSON serialization and sanitize NaN/Inf values
    result: AnalysisPackage = job["result"]
    result_dict = result.model_dump()
    sanitized_result = sanitize_for_json(result_dict)
    return sanitized_result


@router.get("/insights/{job_id}")
async def get_insights_only(job_id: str):
    """
    Get only the LLM-generated insights and recommendations.
    
    Lighter endpoint for quick insight retrieval.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] != AnalysisStatus.COMPLETED or job["result"] is None:
        raise HTTPException(status_code=400, detail="Analysis not completed")
    
    result: AnalysisPackage = job["result"]
    
    return {
        "job_id": job_id,
        "executive_summary": result.intelligence_report.executive_summary,
        "root_causes": result.intelligence_report.root_cause_analysis,
        "recommendations": [
            {
                "priority": r.priority,
                "recommendation": r.recommendation,
                "expected_impact": r.expected_impact
            }
            for r in result.intelligence_report.strategic_recommendations
        ],
        "risk_assessment": result.intelligence_report.risk_assessment,
        "confidence": result.intelligence_report.confidence_score
    }


@router.get("/anomalies/{job_id}")
async def get_anomalies(
    job_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low"),
    region: Optional[str] = Query(None, description="Filter by region"),
    limit: int = Query(50, description="Maximum number of anomalies to return")
):
    """
    Get detected anomalies with optional filtering.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] != AnalysisStatus.COMPLETED or job["result"] is None:
        raise HTTPException(status_code=400, detail="Analysis not completed")
    
    result: AnalysisPackage = job["result"]
    anomalies = result.statistical_abstract.anomaly_findings.anomalies
    
    # Apply filters
    if severity:
        anomalies = [a for a in anomalies if a.severity.value == severity.lower()]
    
    if region:
        anomalies = [
            a for a in anomalies 
            if a.location and a.location.get("region", "").lower() == region.lower()
        ]
    
    # Limit results
    anomalies = anomalies[:limit]
    
    return {
        "job_id": job_id,
        "total_anomalies": len(anomalies),
        "anomalies": [a.model_dump() for a in anomalies]
    }


@router.get("/correlations/{job_id}")
async def get_correlations(
    job_id: str,
    min_correlation: float = Query(0.5, description="Minimum absolute correlation"),
    limit: int = Query(20, description="Maximum number of correlations to return")
):
    """
    Get correlation analysis results.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] != AnalysisStatus.COMPLETED or job["result"] is None:
        raise HTTPException(status_code=400, detail="Analysis not completed")
    
    result: AnalysisPackage = job["result"]
    correlations = result.statistical_abstract.correlation_findings
    
    # Filter by minimum correlation
    strong_corrs = [
        c for c in correlations.strong_correlations
        if abs(c.correlation_coefficient) >= min_correlation
    ][:limit]
    
    return {
        "job_id": job_id,
        "correlations": [c.model_dump() for c in strong_corrs],
        "driver_variables": correlations.driver_variables[:10]
    }


@router.get("/volatility/{job_id}")
async def get_volatility(job_id: str):
    """
    Get volatility analysis results.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] != AnalysisStatus.COMPLETED or job["result"] is None:
        raise HTTPException(status_code=400, detail="Analysis not completed")
    
    result: AnalysisPackage = job["result"]
    volatility = result.statistical_abstract.volatility_findings
    
    return {
        "job_id": job_id,
        "high_volatility_regions": volatility.high_volatility_regions,
        "stable_regions": volatility.stable_regions,
        "seasonality_detected": volatility.seasonality_detected,
        "regional_scores": [r.model_dump() for r in volatility.regional_scores[:20]]
    }


@router.get("/visualizations/{job_id}")
async def get_visualizations(job_id: str):
    """
    Get visualization specifications for the frontend.
    
    Returns chart configurations that the React frontend
    can use to render dynamic visualizations.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] != AnalysisStatus.COMPLETED or job["result"] is None:
        raise HTTPException(status_code=400, detail="Analysis not completed")
    
    result: AnalysisPackage = job["result"]
    
    return {
        "job_id": job_id,
        "visualizations": [v.model_dump() for v in result.visualizations]
    }


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Delete an analysis job and clean up resources.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Cleanup orchestrator
    if job_id in orchestrators:
        await orchestrators[job_id].cleanup()
        del orchestrators[job_id]
    
    # Remove job
    del analysis_jobs[job_id]
    
    return {"success": True, "message": f"Job {job_id} deleted"}


@router.get("/jobs")
async def list_jobs():
    """
    List all analysis jobs.
    """
    jobs = []
    for job_id, job in analysis_jobs.items():
        jobs.append({
            "job_id": job_id,
            "status": job["status"].value,
            "filename": job.get("filename"),
            "created_at": job.get("created_at"),
            "completed_at": job.get("completed_at")
        })
    
    return {"jobs": jobs}


@router.get("/export/{job_id}")
async def export_report(
    job_id: str,
    format: str = Query("json", regex="^(json|csv|pdf)$")
):
    """
    Export analysis report in various formats.
    """
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot export - job status is {job['status'].value}"
        )
    
    # Get results - note: the key is "result" not "results"
    result = job.get("result")
    if not result:
        raise HTTPException(status_code=404, detail="Results not found")
    
    # Convert to dict if it's a Pydantic model
    try:
        if hasattr(result, 'model_dump'):
            result_dict = result.model_dump()
        elif hasattr(result, 'dict'):
            result_dict = result.dict()
        elif isinstance(result, dict):
            result_dict = result
        else:
            # If it's some other type, try to convert to dict
            import json
            result_dict = json.loads(json.dumps(result, default=str))
        
        # Sanitize results for JSON
        sanitized_results = sanitize_for_json(result_dict)
    except Exception as e:
        logger.error(f"Error converting result to dict: {e}")
        raise HTTPException(status_code=500, detail=f"Error preparing export: {str(e)}")
    
    if format == "json":
        from fastapi.responses import Response
        import json
        return Response(
            content=json.dumps(sanitized_results, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=aadhaar_pulse_report_{job_id}.json"
            }
        )
    elif format == "csv":
        # CSV export of key findings
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write summary data
        writer.writerow(["Aadhaar Pulse Analysis Report"])
        writer.writerow(["Job ID", job_id])
        writer.writerow(["Timestamp", sanitized_results.get("timestamp", "")])
        writer.writerow([])
        
        # Anomalies summary
        anomalies = sanitized_results.get("statistical_abstract", {}).get("anomaly_findings", {}).get("anomalies", [])
        writer.writerow(["Anomalies"])
        writer.writerow(["ID", "Metric", "Observed", "Expected", "Z-Score", "Severity", "Description"])
        for anomaly in anomalies[:50]:  # Limit to first 50
            writer.writerow([
                anomaly.get("id", ""),
                anomaly.get("metric_name", ""),
                anomaly.get("observed_value", ""),
                anomaly.get("expected_value", ""),
                anomaly.get("z_score", ""),
                anomaly.get("severity", ""),
                anomaly.get("description", "")
            ])
        
        from fastapi.responses import Response
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=aadhaar_pulse_report_{job_id}.csv"
            }
        )
    else:  # pdf
        # For PDF, we'd need a library like reportlab or weasyprint
        # For now, return JSON with PDF mime type as placeholder
        raise HTTPException(
            status_code=501,
            detail="PDF export not yet implemented. Please use 'json' or 'csv' format."
        )

