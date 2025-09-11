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
class IncidentType(str, Enum):
    NEAR_MISS = "near_miss"
    INJURY = "injury"
    PROPERTY_DAMAGE = "property_damage"
    ENVIRONMENTAL = "environmental"

class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, Enum):
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"

# Incident Models
class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Incident title")
    description: str = Field(..., min_length=1, description="Incident description")
    incident_type: IncidentType = Field(..., description="Type of incident")
    severity: IncidentSeverity = Field(..., description="Incident severity")
    incident_date: datetime = Field(..., description="Date and time of incident")
    location: str = Field(..., description="Incident location")
    department_id: str = Field(..., description="Department ID")
    company_id: str = Field(..., description="Company ID")
    reported_by: str = Field(..., description="Reporter user ID")
    affected_employees: List[Dict[str, Any]] = Field(default_factory=list, description="Affected employees")
    witnesses: List[Dict[str, Any]] = Field(default_factory=list, description="Witnesses")
    immediate_actions: Optional[str] = Field(None, description="Immediate actions taken")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Related documents")

class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    incident_type: Optional[IncidentType] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    incident_date: Optional[datetime] = None
    location: Optional[str] = None
    department_id: Optional[str] = None
    affected_employees: Optional[List[Dict[str, Any]]] = None
    witnesses: Optional[List[Dict[str, Any]]] = None
    immediate_actions: Optional[str] = None
    root_causes: Optional[str] = None
    corrective_actions: Optional[str] = None
    prevention_measures: Optional[str] = None
    investigation_team: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None

class IncidentResponse(BaseModel):
    id: str = Field(..., description="Incident ID")
    incident_number: str = Field(..., description="Incident number")
    title: str = Field(..., description="Incident title")
    description: str = Field(..., description="Incident description")
    incident_type: IncidentType = Field(..., description="Type of incident")
    severity: IncidentSeverity = Field(..., description="Incident severity")
    status: IncidentStatus = Field(..., description="Incident status")
    reported_by: str = Field(..., description="Reporter user ID")
    reported_date: datetime = Field(..., description="Report date")
    incident_date: datetime = Field(..., description="Date and time of incident")
    location: str = Field(..., description="Incident location")
    department_id: str = Field(..., description="Department ID")
    company_id: str = Field(..., description="Company ID")
    affected_employees: List[Dict[str, Any]] = Field(default_factory=list, description="Affected employees")
    witnesses: List[Dict[str, Any]] = Field(default_factory=list, description="Witnesses")
    immediate_actions: Optional[str] = Field(None, description="Immediate actions taken")
    root_causes: Optional[str] = Field(None, description="Root causes")
    corrective_actions: Optional[str] = Field(None, description="Corrective actions")
    prevention_measures: Optional[str] = Field(None, description="Prevention measures")
    investigation_team: List[Dict[str, Any]] = Field(default_factory=list, description="Investigation team")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Related documents")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Incidents Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Incidents Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude Incidents Service",
    description="""
    ## Incident Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, iş kazaları ve olayların yönetimi için tasarlanmıştır.
    
    ### Özellikler:
    - ⚠️ Olay/Kaza raporlama sistemi
    - 🔍 Araştırma süreçleri
    - 📋 Düzeltici önlemler takibi
    - 📊 Olay istatistikleri ve raporlama
    - 🔍 Gelişmiş arama ve filtreleme
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /incidents` - Yeni olay raporla
    - `GET /incidents` - Olayları listele
    - `GET /incidents/{id}` - Olay detayı
    - `PUT /incidents/{id}` - Olay güncelle
    - `GET /statistics` - Olay istatistikleri
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
        "service": "Claude Incidents Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Incident Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "incidents-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude Incidents Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude Incidents Service",
        version="1.0.0",
        description="Incident Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Incident endpoints
@app.post("/incidents", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(incident: IncidentCreate):
    """Create a new incident report."""
    try:
        incident_id = str(uuid.uuid4())
        incident_number = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        response = IncidentResponse(
            id=incident_id,
            incident_number=incident_number,
            title=incident.title,
            description=incident.description,
            incident_type=incident.incident_type,
            severity=incident.severity,
            status=IncidentStatus.REPORTED,
            reported_by=incident.reported_by,
            reported_date=datetime.now(),
            incident_date=incident.incident_date,
            location=incident.location,
            department_id=incident.department_id,
            company_id=incident.company_id,
            affected_employees=incident.affected_employees,
            witnesses=incident.witnesses,
            immediate_actions=incident.immediate_actions,
            documents=incident.documents,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info("Incident created", incident_id=incident_id, incident_number=incident_number)
        return response
        
    except Exception as e:
        logger.error("Failed to create incident", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create incident"
        )

@app.get("/incidents", response_model=List[IncidentResponse])
async def get_incidents(
    incident_type: Optional[IncidentType] = Query(None, description="Filter by incident type"),
    severity: Optional[IncidentSeverity] = Query(None, description="Filter by severity"),
    status: Optional[IncidentStatus] = Query(None, description="Filter by status"),
    department_id: Optional[str] = Query(None, description="Filter by department"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get incidents with optional filtering."""
    try:
        # Mock response
        mock_incidents = [
            IncidentResponse(
                id="550e8400-e29b-41d4-a716-446655440080",
                incident_number="INC-20240115-ABC12345",
                title="Üretim Hattında Küçük Yaralanma",
                description="Operatör elini makineye sıkıştırdı, hafif yaralanma",
                incident_type=IncidentType.INJURY,
                severity=IncidentSeverity.MEDIUM,
                status=IncidentStatus.INVESTIGATING,
                reported_by="550e8400-e29b-41d4-a716-446655440100",
                reported_date=datetime.now(),
                incident_date=datetime(2024, 1, 15, 14, 30),
                location="Üretim Hattı A",
                department_id="550e8400-e29b-41d4-a716-446655440013",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                affected_employees=[{"name": "Mehmet Demir", "id": "EMP003", "injury_type": "Hafif kesik"}],
                witnesses=[{"name": "Ayşe Kaya", "id": "EMP004"}],
                immediate_actions="Yaralıya ilk yardım yapıldı, hastaneye götürüldü",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]
        
        logger.info("Incidents retrieved", count=len(mock_incidents))
        return mock_incidents
        
    except Exception as e:
        logger.error("Failed to get incidents", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get incidents"
        )

@app.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str = Path(..., description="Incident ID")):
    """Get a specific incident by ID."""
    try:
        # Mock response
        incident = IncidentResponse(
            id=incident_id,
            incident_number="INC-20240115-ABC12345",
            title="Üretim Hattında Küçük Yaralanma",
            description="Operatör elini makineye sıkıştırdı, hafif yaralanma. Olay detaylı olarak araştırılmaktadır.",
            incident_type=IncidentType.INJURY,
            severity=IncidentSeverity.MEDIUM,
            status=IncidentStatus.INVESTIGATING,
            reported_by="550e8400-e29b-41d4-a716-446655440100",
            reported_date=datetime.now(),
            incident_date=datetime(2024, 1, 15, 14, 30),
            location="Üretim Hattı A",
            department_id="550e8400-e29b-41d4-a716-446655440013",
            company_id="550e8400-e29b-41d4-a716-446655440000",
            affected_employees=[{"name": "Mehmet Demir", "id": "EMP003", "injury_type": "Hafif kesik"}],
            witnesses=[{"name": "Ayşe Kaya", "id": "EMP004"}],
            immediate_actions="Yaralıya ilk yardım yapıldı, hastaneye götürüldü",
            root_causes="Güvenlik prosedürlerine uyulmaması, KKD kullanılmaması",
            corrective_actions="Ek güvenlik eğitimi, KKD kullanım zorunluluğu",
            prevention_measures="Güvenlik kontrollerinin artırılması",
            investigation_team=[{"name": "Ahmet Yılmaz", "role": "Güvenlik Müdürü"}],
            documents=[{"name": "Olay Raporu", "url": "/documents/incident_report.pdf"}],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info("Incident retrieved", incident_id=incident_id)
        return incident
        
    except Exception as e:
        logger.error("Failed to get incident", incident_id=incident_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

@app.put("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str = Path(..., description="Incident ID"),
    incident_update: IncidentUpdate = None
):
    """Update an incident."""
    try:
        # Mock response
        incident = IncidentResponse(
            id=incident_id,
            incident_number="INC-20240115-ABC12345",
            title=incident_update.title or "Üretim Hattında Küçük Yaralanma",
            description=incident_update.description or "Operatör elini makineye sıkıştırdı, hafif yaralanma",
            incident_type=incident_update.incident_type or IncidentType.INJURY,
            severity=incident_update.severity or IncidentSeverity.MEDIUM,
            status=incident_update.status or IncidentStatus.INVESTIGATING,
            reported_by="550e8400-e29b-41d4-a716-446655440100",
            reported_date=datetime.now(),
            incident_date=incident_update.incident_date or datetime(2024, 1, 15, 14, 30),
            location=incident_update.location or "Üretim Hattı A",
            department_id=incident_update.department_id or "550e8400-e29b-41d4-a716-446655440013",
            company_id="550e8400-e29b-41d4-a716-446655440000",
            affected_employees=incident_update.affected_employees or [{"name": "Mehmet Demir", "id": "EMP003"}],
            witnesses=incident_update.witnesses or [{"name": "Ayşe Kaya", "id": "EMP004"}],
            immediate_actions=incident_update.immediate_actions or "Yaralıya ilk yardım yapıldı",
            root_causes=incident_update.root_causes,
            corrective_actions=incident_update.corrective_actions,
            prevention_measures=incident_update.prevention_measures,
            investigation_team=incident_update.investigation_team or [],
            documents=incident_update.documents or [],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info("Incident updated", incident_id=incident_id)
        return incident
        
    except Exception as e:
        logger.error("Failed to update incident", incident_id=incident_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update incident"
        )

# Statistics endpoint
@app.get("/statistics", response_model=Dict[str, Any])
async def get_incident_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get incident statistics."""
    try:
        stats = {
            "total_incidents": 15,
            "by_type": {
                "injury": 8,
                "near_miss": 4,
                "property_damage": 2,
                "environmental": 1
            },
            "by_severity": {
                "low": 5,
                "medium": 7,
                "high": 2,
                "critical": 1
            },
            "by_status": {
                "reported": 3,
                "investigating": 5,
                "resolved": 6,
                "closed": 1
            },
            "recent_incidents": 3,
            "trend": "decreasing"
        }
        
        logger.info("Incident statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get incident statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get incident statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)

