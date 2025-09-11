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
class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    UNDER_REVIEW = "under_review"

class AuditType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    REGULATORY = "regulatory"

class AuditStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Regulation Models
class RegulationCreate(BaseModel):
    regulation_code: str = Field(..., min_length=1, max_length=100, description="Regulation code")
    title: str = Field(..., min_length=1, max_length=500, description="Regulation title")
    description: Optional[str] = Field(None, description="Regulation description")
    regulation_type: str = Field(..., description="Type of regulation")
    effective_date: date = Field(..., description="Effective date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    applicable_departments: List[str] = Field(default_factory=list, description="Applicable departments")
    requirements: str = Field(..., description="Regulation requirements")
    responsible_person: str = Field(..., description="Responsible person user ID")
    company_id: str = Field(..., description="Company ID")

class RegulationResponse(BaseModel):
    id: str = Field(..., description="Regulation ID")
    regulation_code: str = Field(..., description="Regulation code")
    title: str = Field(..., description="Regulation title")
    description: Optional[str] = Field(None, description="Regulation description")
    regulation_type: str = Field(..., description="Type of regulation")
    effective_date: date = Field(..., description="Effective date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    applicable_departments: List[str] = Field(default_factory=list, description="Applicable departments")
    requirements: str = Field(..., description="Regulation requirements")
    compliance_status: ComplianceStatus = Field(..., description="Compliance status")
    responsible_person: str = Field(..., description="Responsible person user ID")
    company_id: str = Field(..., description="Company ID")
    last_review_date: Optional[date] = Field(None, description="Last review date")
    next_review_date: Optional[date] = Field(None, description="Next review date")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Audit Models
class AuditCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Audit title")
    audit_type: AuditType = Field(..., description="Type of audit")
    planned_date: date = Field(..., description="Planned audit date")
    auditor_id: str = Field(..., description="Auditor user ID")
    auditee_department_id: str = Field(..., description="Auditee department ID")
    company_id: str = Field(..., description="Company ID")
    scope: str = Field(..., description="Audit scope")

class AuditResponse(BaseModel):
    id: str = Field(..., description="Audit ID")
    audit_number: str = Field(..., description="Audit number")
    title: str = Field(..., description="Audit title")
    audit_type: AuditType = Field(..., description="Type of audit")
    status: AuditStatus = Field(..., description="Audit status")
    planned_date: date = Field(..., description="Planned audit date")
    actual_date: Optional[date] = Field(None, description="Actual audit date")
    auditor_id: str = Field(..., description="Auditor user ID")
    auditee_department_id: str = Field(..., description="Auditee department ID")
    company_id: str = Field(..., description="Company ID")
    scope: str = Field(..., description="Audit scope")
    findings: List[Dict[str, Any]] = Field(default_factory=list, description="Audit findings")
    recommendations: Optional[str] = Field(None, description="Recommendations")
    corrective_actions: Optional[str] = Field(None, description="Corrective actions")
    follow_up_date: Optional[date] = Field(None, description="Follow-up date")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Audit documents")
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
    logger.info("Starting Compliance Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Compliance Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude Compliance Service",
    description="""
    ## Compliance Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, uyumluluk ve denetim yönetimi için tasarlanmıştır.
    
    ### Özellikler:
    - 📋 Yönetmelik takibi
    - 🔍 İç/dış denetimler
    - ✅ Uyumluluk kontrolleri
    - 📊 Uyumluluk raporları
    - 🔍 Gelişmiş arama ve filtreleme
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /regulations` - Yeni yönetmelik oluştur
    - `GET /regulations` - Yönetmelikleri listele
    - `POST /audits` - Yeni denetim oluştur
    - `GET /audits` - Denetimleri listele
    - `GET /statistics` - Uyumluluk istatistikleri
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
        "service": "Claude Compliance Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Compliance Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "compliance-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude Compliance Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude Compliance Service",
        version="1.0.0",
        description="Compliance Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Regulation endpoints
@app.post("/regulations", response_model=RegulationResponse, status_code=status.HTTP_201_CREATED)
async def create_regulation(regulation: RegulationCreate):
    """Create a new regulation."""
    try:
        regulation_id = str(uuid.uuid4())
        
        response = RegulationResponse(
            id=regulation_id,
            regulation_code=regulation.regulation_code,
            title=regulation.title,
            description=regulation.description,
            regulation_type=regulation.regulation_type,
            effective_date=regulation.effective_date,
            expiry_date=regulation.expiry_date,
            applicable_departments=regulation.applicable_departments,
            requirements=regulation.requirements,
            compliance_status=ComplianceStatus.UNDER_REVIEW,
            responsible_person=regulation.responsible_person,
            company_id=regulation.company_id,
            created_at=datetime.now()
        )
        
        logger.info("Regulation created", regulation_id=regulation_id, code=regulation.regulation_code)
        return response
        
    except Exception as e:
        logger.error("Failed to create regulation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create regulation"
        )

@app.get("/regulations", response_model=List[RegulationResponse])
async def get_regulations(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    compliance_status: Optional[ComplianceStatus] = Query(None, description="Filter by compliance status"),
    regulation_type: Optional[str] = Query(None, description="Filter by regulation type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get regulations with optional filtering."""
    try:
        # Mock response
        mock_regulations = [
            RegulationResponse(
                id="550e8400-e29b-41d4-a716-446655440100",
                regulation_code="ISG-2024-001",
                title="İş Sağlığı ve Güvenliği Yönetmeliği",
                description="İşyerlerinde iş sağlığı ve güvenliği ile ilgili temel kurallar",
                regulation_type="Güvenlik",
                effective_date=date(2024, 1, 1),
                expiry_date=date(2025, 12, 31),
                applicable_departments=["Üretim", "Bakım", "Güvenlik"],
                requirements="Tüm çalışanlar için güvenlik eğitimi, KKD kullanımı, risk değerlendirmesi",
                compliance_status=ComplianceStatus.COMPLIANT,
                responsible_person="550e8400-e29b-41d4-a716-446655440100",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                last_review_date=date(2024, 1, 15),
                next_review_date=date(2024, 7, 15),
                created_at=datetime.now()
            )
        ]
        
        logger.info("Regulations retrieved", count=len(mock_regulations))
        return mock_regulations
        
    except Exception as e:
        logger.error("Failed to get regulations", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get regulations"
        )

# Audit endpoints
@app.post("/audits", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
async def create_audit(audit: AuditCreate):
    """Create a new audit."""
    try:
        audit_id = str(uuid.uuid4())
        audit_number = f"AUD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        response = AuditResponse(
            id=audit_id,
            audit_number=audit_number,
            title=audit.title,
            audit_type=audit.audit_type,
            status=AuditStatus.PLANNED,
            planned_date=audit.planned_date,
            auditor_id=audit.auditor_id,
            auditee_department_id=audit.auditee_department_id,
            company_id=audit.company_id,
            scope=audit.scope,
            created_at=datetime.now()
        )
        
        logger.info("Audit created", audit_id=audit_id, audit_number=audit_number)
        return response
        
    except Exception as e:
        logger.error("Failed to create audit", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create audit"
        )

@app.get("/audits", response_model=List[AuditResponse])
async def get_audits(
    audit_type: Optional[AuditType] = Query(None, description="Filter by audit type"),
    status: Optional[AuditStatus] = Query(None, description="Filter by status"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get audits with optional filtering."""
    try:
        # Mock response
        mock_audits = [
            AuditResponse(
                id="550e8400-e29b-41d4-a716-446655440110",
                audit_number="AUD-20240115-ABC12345",
                title="Üretim Departmanı İç Denetimi",
                audit_type=AuditType.INTERNAL,
                status=AuditStatus.COMPLETED,
                planned_date=date(2024, 1, 15),
                actual_date=date(2024, 1, 15),
                auditor_id="550e8400-e29b-41d4-a716-446655440100",
                auditee_department_id="550e8400-e29b-41d4-a716-446655440013",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                scope="Güvenlik prosedürleri, KKD kullanımı, eğitim kayıtları",
                findings=[
                    {"finding": "KKD kullanımında eksiklikler", "severity": "medium"},
                    {"finding": "Eğitim kayıtları güncel", "severity": "low"}
                ],
                recommendations="KKD kullanımı konusunda ek eğitim verilmesi",
                corrective_actions="Güvenlik eğitimi planlanması",
                follow_up_date=date(2024, 3, 15),
                documents=[{"name": "Denetim Raporu", "url": "/documents/audit_report.pdf"}],
                created_at=datetime.now()
            )
        ]
        
        logger.info("Audits retrieved", count=len(mock_audits))
        return mock_audits
        
    except Exception as e:
        logger.error("Failed to get audits", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get audits"
        )

# Statistics endpoint
@app.get("/statistics", response_model=Dict[str, Any])
async def get_compliance_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get compliance statistics."""
    try:
        stats = {
            "total_regulations": 25,
            "compliant_regulations": 20,
            "non_compliant_regulations": 3,
            "under_review_regulations": 2,
            "total_audits": 12,
            "completed_audits": 8,
            "planned_audits": 3,
            "in_progress_audits": 1,
            "compliance_rate": 80.0,
            "upcoming_audits": 3
        }
        
        logger.info("Compliance statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get compliance statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get compliance statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)

