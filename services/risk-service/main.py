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
class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MeasureType(str, Enum):
    ELIMINATION = "elimination"
    SUBSTITUTION = "substitution"
    ENGINEERING = "engineering"
    ADMINISTRATIVE = "administrative"
    PPE = "ppe"

class MeasureStatus(str, Enum):
    PLANNED = "planned"
    IMPLEMENTED = "implemented"
    VERIFIED = "verified"

# Risk Assessment Models
class RiskAssessmentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Risk assessment title")
    department_id: str = Field(..., description="Department ID")
    location: str = Field(..., description="Assessment location")
    assessed_by: str = Field(..., description="Assessor user ID")
    assessment_date: date = Field(..., description="Assessment date")
    review_date: date = Field(..., description="Review date")
    hazards: List[Dict[str, Any]] = Field(..., description="Identified hazards")
    control_measures: str = Field(..., description="Control measures")
    responsible_person: str = Field(..., description="Responsible person user ID")
    company_id: str = Field(..., description="Company ID")

class RiskAssessmentResponse(BaseModel):
    id: str = Field(..., description="Risk assessment ID")
    assessment_number: str = Field(..., description="Assessment number")
    title: str = Field(..., description="Risk assessment title")
    department_id: str = Field(..., description="Department ID")
    location: str = Field(..., description="Assessment location")
    assessed_by: str = Field(..., description="Assessor user ID")
    assessment_date: date = Field(..., description="Assessment date")
    review_date: date = Field(..., description="Review date")
    risk_level: RiskLevel = Field(..., description="Overall risk level")
    hazards: List[Dict[str, Any]] = Field(..., description="Identified hazards")
    control_measures: str = Field(..., description="Control measures")
    residual_risk: RiskLevel = Field(..., description="Residual risk level")
    responsible_person: str = Field(..., description="Responsible person user ID")
    company_id: str = Field(..., description="Company ID")
    status: str = Field(..., description="Assessment status")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Control Measure Models
class ControlMeasureCreate(BaseModel):
    risk_assessment_id: str = Field(..., description="Risk assessment ID")
    measure_type: MeasureType = Field(..., description="Type of control measure")
    description: str = Field(..., description="Measure description")
    implementation_date: Optional[date] = Field(None, description="Implementation date")
    responsible_person: str = Field(..., description="Responsible person user ID")
    effectiveness_rating: Optional[int] = Field(None, ge=1, le=5, description="Effectiveness rating (1-5)")
    review_date: Optional[date] = Field(None, description="Review date")

class ControlMeasureResponse(BaseModel):
    id: str = Field(..., description="Control measure ID")
    risk_assessment_id: str = Field(..., description="Risk assessment ID")
    measure_type: MeasureType = Field(..., description="Type of control measure")
    description: str = Field(..., description="Measure description")
    implementation_date: Optional[date] = Field(None, description="Implementation date")
    responsible_person: str = Field(..., description="Responsible person user ID")
    status: MeasureStatus = Field(..., description="Measure status")
    effectiveness_rating: Optional[int] = Field(None, description="Effectiveness rating (1-5)")
    review_date: Optional[date] = Field(None, description="Review date")
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
    logger.info("Starting Risk Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Risk Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude Risk Service",
    description="""
    ## Risk Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, risk değerlendirmeleri ve kontrol önlemlerinin yönetimi için tasarlanmıştır.
    
    ### Özellikler:
    - 🔍 Risk değerlendirmeleri
    - 🛡️ Kontrol önlemleri yönetimi
    - 📊 Risk seviyesi takibi
    - 📋 Risk raporları
    - 🔍 Gelişmiş arama ve filtreleme
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /assessments` - Yeni risk değerlendirmesi oluştur
    - `GET /assessments` - Risk değerlendirmelerini listele
    - `POST /measures` - Yeni kontrol önlemi oluştur
    - `GET /measures` - Kontrol önlemlerini listele
    - `GET /statistics` - Risk istatistikleri
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
        "service": "Claude Risk Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Risk Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "risk-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude Risk Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude Risk Service",
        version="1.0.0",
        description="Risk Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Risk Assessment endpoints
@app.post("/assessments", response_model=RiskAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_risk_assessment(assessment: RiskAssessmentCreate):
    """Create a new risk assessment."""
    try:
        assessment_id = str(uuid.uuid4())
        assessment_number = f"RA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        response = RiskAssessmentResponse(
            id=assessment_id,
            assessment_number=assessment_number,
            title=assessment.title,
            department_id=assessment.department_id,
            location=assessment.location,
            assessed_by=assessment.assessed_by,
            assessment_date=assessment.assessment_date,
            review_date=assessment.review_date,
            risk_level=RiskLevel.MEDIUM,
            hazards=assessment.hazards,
            control_measures=assessment.control_measures,
            residual_risk=RiskLevel.LOW,
            responsible_person=assessment.responsible_person,
            company_id=assessment.company_id,
            status="active",
            created_at=datetime.now()
        )
        
        logger.info("Risk assessment created", assessment_id=assessment_id, assessment_number=assessment_number)
        return response
        
    except Exception as e:
        logger.error("Failed to create risk assessment", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create risk assessment"
        )

@app.get("/assessments", response_model=List[RiskAssessmentResponse])
async def get_risk_assessments(
    department_id: Optional[str] = Query(None, description="Filter by department"),
    risk_level: Optional[RiskLevel] = Query(None, description="Filter by risk level"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get risk assessments with optional filtering."""
    try:
        # Mock response
        mock_assessments = [
            RiskAssessmentResponse(
                id="550e8400-e29b-41d4-a716-446655440120",
                assessment_number="RA-20240115-ABC12345",
                title="Üretim Hattı Risk Değerlendirmesi",
                department_id="550e8400-e29b-41d4-a716-446655440013",
                location="Üretim Hattı A",
                assessed_by="550e8400-e29b-41d4-a716-446655440100",
                assessment_date=date(2024, 1, 15),
                review_date=date(2024, 7, 15),
                risk_level=RiskLevel.MEDIUM,
                hazards=[
                    {"hazard": "Makine çarpması", "probability": "medium", "severity": "high"},
                    {"hazard": "Gürültü", "probability": "high", "severity": "medium"},
                    {"hazard": "Toz", "probability": "medium", "severity": "medium"}
                ],
                control_measures="KKD kullanımı, güvenlik eğitimi, düzenli bakım",
                residual_risk=RiskLevel.LOW,
                responsible_person="550e8400-e29b-41d4-a716-446655440020",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                status="active",
                created_at=datetime.now()
            )
        ]
        
        logger.info("Risk assessments retrieved", count=len(mock_assessments))
        return mock_assessments
        
    except Exception as e:
        logger.error("Failed to get risk assessments", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get risk assessments"
        )

# Control Measure endpoints
@app.post("/measures", response_model=ControlMeasureResponse, status_code=status.HTTP_201_CREATED)
async def create_control_measure(measure: ControlMeasureCreate):
    """Create a new control measure."""
    try:
        measure_id = str(uuid.uuid4())
        
        response = ControlMeasureResponse(
            id=measure_id,
            risk_assessment_id=measure.risk_assessment_id,
            measure_type=measure.measure_type,
            description=measure.description,
            implementation_date=measure.implementation_date,
            responsible_person=measure.responsible_person,
            status=MeasureStatus.PLANNED,
            effectiveness_rating=measure.effectiveness_rating,
            review_date=measure.review_date,
            created_at=datetime.now()
        )
        
        logger.info("Control measure created", measure_id=measure_id)
        return response
        
    except Exception as e:
        logger.error("Failed to create control measure", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create control measure"
        )

@app.get("/measures", response_model=List[ControlMeasureResponse])
async def get_control_measures(
    risk_assessment_id: Optional[str] = Query(None, description="Filter by risk assessment ID"),
    measure_type: Optional[MeasureType] = Query(None, description="Filter by measure type"),
    status: Optional[MeasureStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get control measures with optional filtering."""
    try:
        # Mock response
        mock_measures = [
            ControlMeasureResponse(
                id="550e8400-e29b-41d4-a716-446655440130",
                risk_assessment_id="550e8400-e29b-41d4-a716-446655440120",
                measure_type=MeasureType.ENGINEERING,
                description="Makine koruyucu bariyerlerinin kurulması",
                implementation_date=date(2024, 2, 1),
                responsible_person="550e8400-e29b-41d4-a716-446655440023",
                status=MeasureStatus.IMPLEMENTED,
                effectiveness_rating=4,
                review_date=date(2024, 8, 1),
                created_at=datetime.now()
            )
        ]
        
        logger.info("Control measures retrieved", count=len(mock_measures))
        return mock_measures
        
    except Exception as e:
        logger.error("Failed to get control measures", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get control measures"
        )

# Statistics endpoint
@app.get("/statistics", response_model=Dict[str, Any])
async def get_risk_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get risk statistics."""
    try:
        stats = {
            "total_assessments": 18,
            "by_risk_level": {
                "low": 8,
                "medium": 7,
                "high": 2,
                "critical": 1
            },
            "total_measures": 45,
            "implemented_measures": 35,
            "planned_measures": 8,
            "verified_measures": 30,
            "average_effectiveness": 3.8,
            "upcoming_reviews": 5
        }
        
        logger.info("Risk statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get risk statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get risk statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)

