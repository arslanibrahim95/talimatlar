from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import structlog
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.config import settings
from app.database import init_db
from app.models.analytics import (
    DashboardResponse, 
    UserActivityResponse, 
    DocumentStatsResponse,
    ComplianceReportResponse,
    RiskAssessmentResponse
)
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService
from app.services.reporting_service import ReportingService
from app.middleware.auth import get_current_user
from app.middleware.error_handler import error_handler
from app.utils.logger import setup_logging

# Setup logging
setup_logging()
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Analytics Service", version="1.0.0")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Initialize services
    app.state.analytics_service = AnalyticsService()
    app.state.dashboard_service = DashboardService()
    app.state.reporting_service = ReportingService()
    logger.info("Services initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Analytics Service")

# Create FastAPI app
app = FastAPI(
    title="Claude Analytics Service",
    description="Analytics and reporting service for Claude Talimat system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handler
app.add_exception_handler(Exception, error_handler)

@app.get("/")
async def root():
    return {
        "service": "Claude Analytics Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    try:
        # Check database connection
        analytics_service: AnalyticsService = app.state.analytics_service
        
        health_status = {
            "status": "healthy",
            "service": "analytics-service",
            "version": "1.0.0",
            "checks": {
                "database": "healthy",
                "analytics": "healthy"
            }
        }
        
        return JSONResponse(content=health_status, status_code=200)
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return JSONResponse(
            content={
                "status": "unhealthy",
                "service": "analytics-service",
                "error": str(e)
            },
            status_code=503
        )

# Dashboard routes
@app.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(lambda: app.state.dashboard_service)
):
    """Get main dashboard data"""
    try:
        dashboard_data = await dashboard_service.get_dashboard_data(
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        return dashboard_data
        
    except Exception as e:
        logger.error("Failed to get dashboard data", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")

@app.get("/dashboard/user-activity", response_model=UserActivityResponse)
async def get_user_activity(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get user activity analytics"""
    try:
        activity_data = await analytics_service.get_user_activity(
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            days=days
        )
        
        return activity_data
        
    except Exception as e:
        logger.error("Failed to get user activity", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get user activity")

@app.get("/dashboard/document-stats", response_model=DocumentStatsResponse)
async def get_document_stats(
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get document statistics"""
    try:
        stats = await analytics_service.get_document_stats(
            tenant_id=current_user.tenant_id
        )
        
        return stats
        
    except Exception as e:
        logger.error("Failed to get document stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get document stats")

# Analytics routes
@app.get("/analytics/compliance")
async def get_compliance_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for analysis"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get compliance analytics"""
    try:
        compliance_data = await analytics_service.get_compliance_analytics(
            tenant_id=current_user.tenant_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return compliance_data
        
    except Exception as e:
        logger.error("Failed to get compliance analytics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get compliance analytics")

@app.get("/analytics/risk-assessment", response_model=RiskAssessmentResponse)
async def get_risk_assessment(
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get risk assessment data"""
    try:
        risk_data = await analytics_service.get_risk_assessment(
            tenant_id=current_user.tenant_id
        )
        
        return risk_data
        
    except Exception as e:
        logger.error("Failed to get risk assessment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get risk assessment")

@app.get("/analytics/trends")
async def get_trends(
    metric: str = Query(..., description="Metric to analyze (views, downloads, uploads)"),
    period: str = Query("month", description="Time period (day, week, month, year)"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get trend analysis for specific metrics"""
    try:
        trends = await analytics_service.get_trends(
            tenant_id=current_user.tenant_id,
            metric=metric,
            period=period
        )
        
        return trends
        
    except Exception as e:
        logger.error("Failed to get trends", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get trends")

# Reporting routes
@app.get("/reports/compliance", response_model=ComplianceReportResponse)
async def generate_compliance_report(
    report_type: str = Query(..., description="Type of compliance report"),
    format: str = Query("json", description="Report format (json, pdf, csv)"),
    current_user = Depends(get_current_user),
    reporting_service: ReportingService = Depends(lambda: app.state.reporting_service)
):
    """Generate compliance report"""
    try:
        report = await reporting_service.generate_compliance_report(
            tenant_id=current_user.tenant_id,
            report_type=report_type,
            format=format,
            generated_by=current_user.id
        )
        
        return report
        
    except Exception as e:
        logger.error("Failed to generate compliance report", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate compliance report")

@app.get("/reports/activity")
async def generate_activity_report(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    user_id: Optional[str] = Query(None, description="Specific user ID (optional)"),
    format: str = Query("json", description="Report format (json, pdf, csv)"),
    current_user = Depends(get_current_user),
    reporting_service: ReportingService = Depends(lambda: app.state.reporting_service)
):
    """Generate activity report"""
    try:
        report = await reporting_service.generate_activity_report(
            tenant_id=current_user.tenant_id,
            start_date=start_date,
            end_date=end_date,
            user_id=user_id,
            format=format,
            generated_by=current_user.id
        )
        
        return report
        
    except Exception as e:
        logger.error("Failed to generate activity report", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate activity report")

@app.get("/reports/documents")
async def generate_document_report(
    category: Optional[str] = Query(None, description="Document category filter"),
    status: Optional[str] = Query(None, description="Document status filter"),
    format: str = Query("json", description="Report format (json, pdf, csv)"),
    current_user = Depends(get_current_user),
    reporting_service: ReportingService = Depends(lambda: app.state.reporting_service)
):
    """Generate document inventory report"""
    try:
        report = await reporting_service.generate_document_report(
            tenant_id=current_user.tenant_id,
            category=category,
            status=status,
            format=format,
            generated_by=current_user.id
        )
        
        return report
        
    except Exception as e:
        logger.error("Failed to generate document report", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate document report")

# Metrics routes
@app.get("/metrics/real-time")
async def get_real_time_metrics(
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get real-time metrics"""
    try:
        metrics = await analytics_service.get_real_time_metrics(
            tenant_id=current_user.tenant_id
        )
        
        return metrics
        
    except Exception as e:
        logger.error("Failed to get real-time metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get real-time metrics")

@app.get("/metrics/summary")
async def get_metrics_summary(
    period: str = Query("day", description="Time period (hour, day, week, month)"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(lambda: app.state.analytics_service)
):
    """Get metrics summary for specified period"""
    try:
        summary = await analytics_service.get_metrics_summary(
            tenant_id=current_user.tenant_id,
            period=period
        )
        
        return summary
        
    except Exception as e:
        logger.error("Failed to get metrics summary", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get metrics summary")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
