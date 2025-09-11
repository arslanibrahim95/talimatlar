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
class TrainingStatus(str, Enum):
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"

class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ParticipantStatus(str, Enum):
    REGISTERED = "registered"
    ATTENDED = "attended"
    ABSENT = "absent"

# Training Program Models
class TrainingProgramCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Training program title")
    description: Optional[str] = Field(None, description="Training program description")
    category: str = Field(..., min_length=1, max_length=100, description="Training category")
    duration_hours: int = Field(..., ge=1, description="Training duration in hours")
    is_mandatory: bool = Field(False, description="Whether training is mandatory")
    validity_period_months: Optional[int] = Field(None, ge=1, description="Validity period in months")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")
    is_active: bool = Field(True, description="Whether training program is active")

class TrainingProgramUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    duration_hours: Optional[int] = Field(None, ge=1)
    is_mandatory: Optional[bool] = None
    validity_period_months: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None

class TrainingProgramResponse(BaseModel):
    id: str = Field(..., description="Training program ID")
    title: str = Field(..., description="Training program title")
    description: Optional[str] = Field(None, description="Training program description")
    category: str = Field(..., description="Training category")
    duration_hours: int = Field(..., description="Training duration in hours")
    is_mandatory: bool = Field(..., description="Whether training is mandatory")
    validity_period_months: Optional[int] = Field(None, description="Validity period in months")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")
    is_active: bool = Field(..., description="Whether training program is active")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Employee Training Models
class EmployeeTrainingCreate(BaseModel):
    employee_id: str = Field(..., description="Employee ID")
    training_program_id: str = Field(..., description="Training program ID")
    assigned_date: date = Field(..., description="Assignment date")
    due_date: Optional[date] = Field(None, description="Due date")
    notes: Optional[str] = Field(None, description="Training notes")

class EmployeeTrainingUpdate(BaseModel):
    completed_date: Optional[date] = None
    status: Optional[TrainingStatus] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    certificate_url: Optional[str] = Field(None, description="Certificate URL")
    notes: Optional[str] = None

class EmployeeTrainingResponse(BaseModel):
    id: str = Field(..., description="Employee training ID")
    employee_id: str = Field(..., description="Employee ID")
    training_program_id: str = Field(..., description="Training program ID")
    assigned_date: date = Field(..., description="Assignment date")
    completed_date: Optional[date] = Field(None, description="Completion date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    status: TrainingStatus = Field(..., description="Training status")
    score: Optional[int] = Field(None, description="Training score")
    certificate_url: Optional[str] = Field(None, description="Certificate URL")
    notes: Optional[str] = Field(None, description="Training notes")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    # Additional fields
    employee_name: Optional[str] = Field(None, description="Employee name")
    training_title: Optional[str] = Field(None, description="Training program title")
    training_category: Optional[str] = Field(None, description="Training category")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Training Session Models
class TrainingSessionCreate(BaseModel):
    training_program_id: str = Field(..., description="Training program ID")
    title: str = Field(..., min_length=1, max_length=500, description="Session title")
    description: Optional[str] = Field(None, description="Session description")
    start_date: datetime = Field(..., description="Session start date")
    end_date: datetime = Field(..., description="Session end date")
    location: Optional[str] = Field(None, description="Session location")
    instructor_id: str = Field(..., description="Instructor user ID")
    max_participants: Optional[int] = Field(None, ge=1, description="Maximum participants")
    company_id: str = Field(..., description="Company ID")

class TrainingSessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    instructor_id: Optional[str] = None
    max_participants: Optional[int] = Field(None, ge=1)
    status: Optional[SessionStatus] = None

class TrainingSessionResponse(BaseModel):
    id: str = Field(..., description="Session ID")
    training_program_id: str = Field(..., description="Training program ID")
    title: str = Field(..., description="Session title")
    description: Optional[str] = Field(None, description="Session description")
    start_date: datetime = Field(..., description="Session start date")
    end_date: datetime = Field(..., description="Session end date")
    location: Optional[str] = Field(None, description="Session location")
    instructor_id: str = Field(..., description="Instructor user ID")
    max_participants: Optional[int] = Field(None, description="Maximum participants")
    company_id: str = Field(..., description="Company ID")
    status: SessionStatus = Field(..., description="Session status")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    # Additional fields
    training_title: Optional[str] = Field(None, description="Training program title")
    instructor_name: Optional[str] = Field(None, description="Instructor name")
    participant_count: Optional[int] = Field(None, description="Number of participants")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Session Participant Models
class SessionParticipantCreate(BaseModel):
    session_id: str = Field(..., description="Session ID")
    employee_id: str = Field(..., description="Employee ID")
    notes: Optional[str] = Field(None, description="Participant notes")

class SessionParticipantUpdate(BaseModel):
    status: Optional[ParticipantStatus] = None
    attendance_time: Optional[datetime] = None
    notes: Optional[str] = None

class SessionParticipantResponse(BaseModel):
    id: str = Field(..., description="Participant ID")
    session_id: str = Field(..., description="Session ID")
    employee_id: str = Field(..., description="Employee ID")
    status: ParticipantStatus = Field(..., description="Participant status")
    attendance_time: Optional[datetime] = Field(None, description="Attendance time")
    notes: Optional[str] = Field(None, description="Participant notes")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    # Additional fields
    employee_name: Optional[str] = Field(None, description="Employee name")
    employee_number: Optional[str] = Field(None, description="Employee number")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Search and Filter Models
class TrainingSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    is_mandatory: Optional[bool] = Field(None, description="Filter by mandatory status")
    company_id: Optional[str] = Field(None, description="Filter by company")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(20, ge=1, le=100, description="Number of records to return")

class TrainingSearchResponse(BaseModel):
    training_programs: List[TrainingProgramResponse] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Number of records returned")

# Statistics Models
class TrainingStatsResponse(BaseModel):
    total_programs: int = Field(..., description="Total number of training programs")
    active_programs: int = Field(..., description="Number of active programs")
    mandatory_programs: int = Field(..., description="Number of mandatory programs")
    by_category: Dict[str, int] = Field(..., description="Programs by category")
    total_assignments: int = Field(..., description="Total number of training assignments")
    completed_assignments: int = Field(..., description="Number of completed assignments")
    expired_assignments: int = Field(..., description="Number of expired assignments")
    upcoming_sessions: int = Field(..., description="Number of upcoming sessions")

# Error response model
class ErrorResponse(BaseModel):
    error: str
    message: str
    status_code: int
    timestamp: str

# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Training Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Training Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude Training Service",
    description="""
    ## Training Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, eğitim programları ve personel eğitimlerinin yönetimi için tasarlanmıştır.
    
    ### Özellikler:
    - 🎓 Eğitim programları yönetimi
    - 👥 Personel eğitim atamaları
    - 📅 Eğitim oturumları ve katılımcılar
    - 📜 Sertifika takibi
    - 📊 Eğitim istatistikleri ve raporlama
    - 🔍 Gelişmiş arama ve filtreleme
    - ⏰ Eğitim süre takibi
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /programs` - Yeni eğitim programı oluştur
    - `GET /programs` - Eğitim programlarını listele
    - `POST /assignments` - Eğitim ata
    - `GET /assignments` - Eğitim atamalarını listele
    - `POST /sessions` - Eğitim oturumu oluştur
    - `GET /sessions` - Eğitim oturumlarını listele
    - `GET /statistics` - Eğitim istatistikleri
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
        "service": "Claude Training Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Training Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "training-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude Training Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude Training Service",
        version="1.0.0",
        description="Training Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Training Program endpoints
@app.post("/programs", response_model=TrainingProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_training_program(program: TrainingProgramCreate):
    """Create a new training program."""
    try:
        program_id = str(uuid.uuid4())
        
        response = TrainingProgramResponse(
            id=program_id,
            title=program.title,
            description=program.description,
            category=program.category,
            duration_hours=program.duration_hours,
            is_mandatory=program.is_mandatory,
            validity_period_months=program.validity_period_months,
            company_id=program.company_id,
            created_by=program.created_by,
            is_active=program.is_active,
            created_at=datetime.now()
        )
        
        logger.info("Training program created", program_id=program_id, title=program.title)
        return response
        
    except Exception as e:
        logger.error("Failed to create training program", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create training program"
        )

@app.get("/programs", response_model=TrainingSearchResponse)
async def get_training_programs(
    query: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_mandatory: Optional[bool] = Query(None, description="Filter by mandatory status"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get training programs with optional filtering."""
    try:
        # Mock response
        mock_programs = [
            TrainingProgramResponse(
                id="550e8400-e29b-41d4-a716-446655440050",
                title="Temel İş Güvenliği Eğitimi",
                description="Yeni çalışanlar için temel iş güvenliği eğitimi",
                category="Güvenlik",
                duration_hours=8,
                is_mandatory=True,
                validity_period_months=12,
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                created_by="550e8400-e29b-41d4-a716-446655440100",
                is_active=True,
                created_at=datetime.now()
            ),
            TrainingProgramResponse(
                id="550e8400-e29b-41d4-a716-446655440051",
                title="Yangın Güvenliği Eğitimi",
                description="Yangın önleme ve söndürme eğitimi",
                category="Güvenlik",
                duration_hours=4,
                is_mandatory=True,
                validity_period_months=24,
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                created_by="550e8400-e29b-41d4-a716-446655440100",
                is_active=True,
                created_at=datetime.now()
            )
        ]
        
        response = TrainingSearchResponse(
            training_programs=mock_programs,
            total=len(mock_programs),
            skip=skip,
            limit=limit
        )
        
        logger.info("Training programs retrieved", count=len(mock_programs))
        return response
        
    except Exception as e:
        logger.error("Failed to get training programs", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get training programs"
        )

# Employee Training endpoints
@app.post("/assignments", response_model=EmployeeTrainingResponse, status_code=status.HTTP_201_CREATED)
async def create_employee_training(assignment: EmployeeTrainingCreate):
    """Assign training to an employee."""
    try:
        assignment_id = str(uuid.uuid4())
        
        response = EmployeeTrainingResponse(
            id=assignment_id,
            employee_id=assignment.employee_id,
            training_program_id=assignment.training_program_id,
            assigned_date=assignment.assigned_date,
            completed_date=None,
            expiry_date=None,
            status=TrainingStatus.ASSIGNED,
            score=None,
            certificate_url=None,
            notes=assignment.notes,
            created_at=datetime.now(),
            employee_name="Ahmet Yılmaz",
            training_title="Temel İş Güvenliği Eğitimi",
            training_category="Güvenlik"
        )
        
        logger.info("Training assigned", assignment_id=assignment_id, employee_id=assignment.employee_id)
        return response
        
    except Exception as e:
        logger.error("Failed to assign training", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign training"
        )

@app.get("/assignments", response_model=List[EmployeeTrainingResponse])
async def get_employee_trainings(
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    training_program_id: Optional[str] = Query(None, description="Filter by training program ID"),
    status: Optional[TrainingStatus] = Query(None, description="Filter by status"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get employee training assignments."""
    try:
        # Mock response
        mock_assignments = [
            EmployeeTrainingResponse(
                id="550e8400-e29b-41d4-a716-446655440060",
                employee_id=employee_id or "550e8400-e29b-41d4-a716-446655440020",
                training_program_id="550e8400-e29b-41d4-a716-446655440050",
                assigned_date=date(2023, 1, 20),
                completed_date=date(2023, 1, 25),
                expiry_date=date(2024, 1, 25),
                status=TrainingStatus.COMPLETED,
                score=95,
                certificate_url="/certificates/safety_001.pdf",
                notes="Mükemmel performans",
                created_at=datetime.now(),
                employee_name="Ahmet Yılmaz",
                training_title="Temel İş Güvenliği Eğitimi",
                training_category="Güvenlik"
            )
        ]
        
        logger.info("Employee trainings retrieved", count=len(mock_assignments))
        return mock_assignments
        
    except Exception as e:
        logger.error("Failed to get employee trainings", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get employee trainings"
        )

# Training Session endpoints
@app.post("/sessions", response_model=TrainingSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_training_session(session: TrainingSessionCreate):
    """Create a new training session."""
    try:
        session_id = str(uuid.uuid4())
        
        response = TrainingSessionResponse(
            id=session_id,
            training_program_id=session.training_program_id,
            title=session.title,
            description=session.description,
            start_date=session.start_date,
            end_date=session.end_date,
            location=session.location,
            instructor_id=session.instructor_id,
            max_participants=session.max_participants,
            company_id=session.company_id,
            status=SessionStatus.SCHEDULED,
            created_at=datetime.now(),
            training_title="Temel İş Güvenliği Eğitimi",
            instructor_name="Mehmet Demir",
            participant_count=0
        )
        
        logger.info("Training session created", session_id=session_id, title=session.title)
        return response
        
    except Exception as e:
        logger.error("Failed to create training session", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create training session"
        )

@app.get("/sessions", response_model=List[TrainingSessionResponse])
async def get_training_sessions(
    training_program_id: Optional[str] = Query(None, description="Filter by training program ID"),
    instructor_id: Optional[str] = Query(None, description="Filter by instructor ID"),
    status: Optional[SessionStatus] = Query(None, description="Filter by status"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get training sessions."""
    try:
        # Mock response
        mock_sessions = [
            TrainingSessionResponse(
                id="550e8400-e29b-41d4-a716-446655440070",
                training_program_id="550e8400-e29b-41d4-a716-446655440050",
                title="Temel İş Güvenliği - Grup 1",
                description="Yeni çalışanlar için temel güvenlik eğitimi",
                start_date=datetime(2024, 2, 15, 9, 0),
                end_date=datetime(2024, 2, 15, 17, 0),
                location="Eğitim Salonu A",
                instructor_id="550e8400-e29b-41d4-a716-446655440100",
                max_participants=20,
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                status=SessionStatus.SCHEDULED,
                created_at=datetime.now(),
                training_title="Temel İş Güvenliği Eğitimi",
                instructor_name="Mehmet Demir",
                participant_count=15
            )
        ]
        
        logger.info("Training sessions retrieved", count=len(mock_sessions))
        return mock_sessions
        
    except Exception as e:
        logger.error("Failed to get training sessions", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get training sessions"
        )

# Statistics endpoint
@app.get("/statistics", response_model=TrainingStatsResponse)
async def get_training_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get training statistics."""
    try:
        stats = TrainingStatsResponse(
            total_programs=15,
            active_programs=12,
            mandatory_programs=8,
            by_category={
                "Güvenlik": 6,
                "Kalite": 4,
                "Teknik": 3,
                "Yönetim": 2
            },
            total_assignments=120,
            completed_assignments=95,
            expired_assignments=5,
            upcoming_sessions=8
        )
        
        logger.info("Training statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get training statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get training statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

