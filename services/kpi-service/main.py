from fastapi import FastAPI, HTTPException, status, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
import structlog
import uuid

# Setup logging
logger = structlog.get_logger()

# Pydantic models for API documentation and validation
class MetricType(str, Enum):
    LAGGING = "lagging"
    LEADING = "leading"

class MetricStatus(str, Enum):
    ON_TARGET = "on_target"
    BELOW_TARGET = "below_target"
    ABOVE_TARGET = "above_target"

# Safety Metric Models
class SafetyMetricCreate(BaseModel):
    metric_name: str = Field(..., min_length=1, max_length=255, description="Metric name")
    metric_type: MetricType = Field(..., description="Type of metric")
    value: float = Field(..., description="Metric value")
    unit: str = Field(..., description="Unit of measurement")
    period_start: date = Field(..., description="Period start date")
    period_end: date = Field(..., description="Period end date")
    department_id: Optional[str] = Field(None, description="Department ID")
    company_id: str = Field(..., description="Company ID")
    target_value: Optional[float] = Field(None, description="Target value")
    actual_value: Optional[float] = Field(None, description="Actual value")

class SafetyMetricResponse(BaseModel):
    id: str = Field(..., description="Metric ID")
    metric_name: str = Field(..., description="Metric name")
    metric_type: MetricType = Field(..., description="Type of metric")
    value: float = Field(..., description="Metric value")
    unit: str = Field(..., description="Unit of measurement")
    period_start: date = Field(..., description="Period start date")
    period_end: date = Field(..., description="Period end date")
    department_id: Optional[str] = Field(None, description="Department ID")
    company_id: str = Field(..., description="Company ID")
    target_value: Optional[float] = Field(None, description="Target value")
    actual_value: Optional[float] = Field(None, description="Actual value")
    status: MetricStatus = Field(..., description="Metric status")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# KPI Target Models
class KPITargetCreate(BaseModel):
    metric_name: str = Field(..., min_length=1, max_length=255, description="Metric name")
    target_value: float = Field(..., description="Target value")
    period_start: date = Field(..., description="Period start date")
    period_end: date = Field(..., description="Period end date")
    department_id: Optional[str] = Field(None, description="Department ID")
    company_id: str = Field(..., description="Company ID")
    responsible_person: str = Field(..., description="Responsible person user ID")

class KPITargetResponse(BaseModel):
    id: str = Field(..., description="KPI target ID")
    metric_name: str = Field(..., description="Metric name")
    target_value: float = Field(..., description="Target value")
    period_start: date = Field(..., description="Period start date")
    period_end: date = Field(..., description="Period end date")
    department_id: Optional[str] = Field(None, description="Department ID")
    company_id: str = Field(..., description="Company ID")
    responsible_person: str = Field(..., description="Responsible person user ID")
    is_active: bool = Field(..., description="Whether target is active")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting KPI Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down KPI Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude KPI Service",
    description="""
    ## KPI and Metrics Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, KPI ve güvenlik metriklerinin yönetimi için tasarlanmıştır.
    
    ### Özellikler:
    - 📊 Güvenlik metrikleri yönetimi
    - 🎯 KPI hedefleri takibi
    - 📈 Performans raporları
    - 📋 Metrik analizi
    - 🔍 Gelişmiş arama ve filtreleme
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /metrics` - Yeni metrik oluştur
    - `GET /metrics` - Metrikleri listele
    - `POST /targets` - Yeni KPI hedefi oluştur
    - `GET /targets` - KPI hedeflerini listele
    - `GET /statistics` - KPI istatistikleri
    """,
    version="1.0.0",
    contact={
        "name": "Claude Talimat Team",
        "email": "ibrahim1995412@gmail.com",
        "url": "https://github.com/arslanibrahim95/talimatlar"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    lifespan=lifespan,
    docs_url=None,  # Disable default docs
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/", response_model=Dict[str, str])
async def root() -> dict:
    """Root endpoint returning service information."""
    return {
        "service": "Claude KPI Service",
        "version": "1.0.0",
        "status": "running",
        "description": "KPI and Metrics Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "kpi-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude KPI Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude KPI Service",
        version="1.0.0",
        description="KPI and Metrics Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Safety Metric endpoints
@app.post("/metrics", response_model=SafetyMetricResponse, status_code=status.HTTP_201_CREATED)
async def create_safety_metric(metric: SafetyMetricCreate):
    """Create a new safety metric."""
    try:
        metric_id = str(uuid.uuid4())
        
        # Determine status based on target vs actual
        status = MetricStatus.ON_TARGET
        if metric.target_value and metric.actual_value:
            if metric.actual_value < metric.target_value:
                status = MetricStatus.BELOW_TARGET
            elif metric.actual_value > metric.target_value:
                status = MetricStatus.ABOVE_TARGET
        
        response = SafetyMetricResponse(
            id=metric_id,
            metric_name=metric.metric_name,
            metric_type=metric.metric_type,
            value=metric.value,
            unit=metric.unit,
            period_start=metric.period_start,
            period_end=metric.period_end,
            department_id=metric.department_id,
            company_id=metric.company_id,
            target_value=metric.target_value,
            actual_value=metric.actual_value,
            status=status,
            created_at=datetime.now()
        )
        
        logger.info("Safety metric created", metric_id=metric_id, metric_name=metric.metric_name)
        return response
        
    except Exception as e:
        logger.error("Failed to create safety metric", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create safety metric"
        )

@app.get("/metrics", response_model=List[SafetyMetricResponse])
async def get_safety_metrics(
    metric_type: Optional[MetricType] = Query(None, description="Filter by metric type"),
    department_id: Optional[str] = Query(None, description="Filter by department"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    status: Optional[MetricStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get safety metrics with optional filtering."""
    try:
        # Mock response
        mock_metrics = [
            SafetyMetricResponse(
                id="550e8400-e29b-41d4-a716-446655440160",
                metric_name="İş Kazası Sayısı",
                metric_type=MetricType.LAGGING,
                value=2.0,
                unit="adet",
                period_start=date(2024, 1, 1),
                period_end=date(2024, 1, 31),
                department_id="550e8400-e29b-41d4-a716-446655440013",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                target_value=0.0,
                actual_value=2.0,
                status=MetricStatus.ABOVE_TARGET,
                created_at=datetime.now()
            ),
            SafetyMetricResponse(
                id="550e8400-e29b-41d4-a716-446655440161",
                metric_name="Eğitim Tamamlama Oranı",
                metric_type=MetricType.LEADING,
                value=85.0,
                unit="%",
                period_start=date(2024, 1, 1),
                period_end=date(2024, 1, 31),
                department_id=None,
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                target_value=90.0,
                actual_value=85.0,
                status=MetricStatus.BELOW_TARGET,
                created_at=datetime.now()
            )
        ]
        
        logger.info("Safety metrics retrieved", count=len(mock_metrics))
        return mock_metrics
        
    except Exception as e:
        logger.error("Failed to get safety metrics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get safety metrics"
        )

# KPI Target endpoints
@app.post("/targets", response_model=KPITargetResponse, status_code=status.HTTP_201_CREATED)
async def create_kpi_target(target: KPITargetCreate):
    """Create a new KPI target."""
    try:
        target_id = str(uuid.uuid4())
        
        response = KPITargetResponse(
            id=target_id,
            metric_name=target.metric_name,
            target_value=target.target_value,
            period_start=target.period_start,
            period_end=target.period_end,
            department_id=target.department_id,
            company_id=target.company_id,
            responsible_person=target.responsible_person,
            is_active=True,
            created_at=datetime.now()
        )
        
        logger.info("KPI target created", target_id=target_id, metric_name=target.metric_name)
        return response
        
    except Exception as e:
        logger.error("Failed to create KPI target", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create KPI target"
        )

@app.get("/targets", response_model=List[KPITargetResponse])
async def get_kpi_targets(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    department_id: Optional[str] = Query(None, description="Filter by department ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get KPI targets with optional filtering."""
    try:
        # Mock response
        mock_targets = [
            KPITargetResponse(
                id="550e8400-e29b-41d4-a716-446655440170",
                metric_name="İş Kazası Sayısı",
                target_value=0.0,
                period_start=date(2024, 1, 1),
                period_end=date(2024, 12, 31),
                department_id="550e8400-e29b-41d4-a716-446655440013",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                responsible_person="550e8400-e29b-41d4-a716-446655440020",
                is_active=True,
                created_at=datetime.now()
            ),
            KPITargetResponse(
                id="550e8400-e29b-41d4-a716-446655440171",
                metric_name="Eğitim Tamamlama Oranı",
                target_value=90.0,
                period_start=date(2024, 1, 1),
                period_end=date(2024, 12, 31),
                department_id=None,
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                responsible_person="550e8400-e29b-41d4-a716-446655440100",
                is_active=True,
                created_at=datetime.now()
            )
        ]
        
        logger.info("KPI targets retrieved", count=len(mock_targets))
        return mock_targets
        
    except Exception as e:
        logger.error("Failed to get KPI targets", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get KPI targets"
        )

# Statistics endpoint
@app.get("/statistics", response_model=Dict[str, Any])
async def get_kpi_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get KPI statistics."""
    try:
        stats = {
            "total_metrics": 25,
            "by_type": {
                "lagging": 15,
                "leading": 10
            },
            "by_status": {
                "on_target": 18,
                "below_target": 5,
                "above_target": 2
            },
            "total_targets": 20,
            "active_targets": 18,
            "average_performance": 85.5,
            "top_performing_metrics": [
                {"metric": "Eğitim Tamamlama Oranı", "performance": 95.0},
                {"metric": "Risk Değerlendirme Sayısı", "performance": 90.0}
            ],
            "improvement_areas": [
                {"metric": "İş Kazası Sayısı", "current": 2.0, "target": 0.0},
                {"metric": "Uyumluluk Oranı", "current": 80.0, "target": 95.0}
            ]
        }
        
        logger.info("KPI statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get KPI statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get KPI statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)

