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
class InstructionStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class InstructionPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class AssignmentStatus(str, Enum):
    ASSIGNED = "assigned"
    READ = "read"
    COMPLETED = "completed"
    OVERDUE = "overdue"

# Quiz Question Model
class QuizQuestion(BaseModel):
    question: str = Field(..., description="Question text")
    options: List[str] = Field(..., min_items=2, max_items=6, description="Answer options")
    correct_answer: int = Field(..., ge=0, description="Index of correct answer (0-based)")

# Instruction Models
class InstructionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Instruction title")
    content: str = Field(..., min_length=1, description="Instruction content")
    category_id: Optional[str] = Field(None, description="Category ID")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")
    status: InstructionStatus = Field(InstructionStatus.DRAFT, description="Instruction status")
    priority: InstructionPriority = Field(InstructionPriority.NORMAL, description="Instruction priority")
    effective_date: Optional[date] = Field(None, description="Effective date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    version: str = Field("1.0", description="Instruction version")
    tags: List[str] = Field(default_factory=list, max_items=10, description="Instruction tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    is_mandatory: bool = Field(False, description="Whether instruction is mandatory")
    quiz_questions: Optional[List[QuizQuestion]] = Field(None, description="Quiz questions")

class InstructionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1)
    category_id: Optional[str] = None
    status: Optional[InstructionStatus] = None
    priority: Optional[InstructionPriority] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    version: Optional[str] = None
    tags: Optional[List[str]] = Field(None, max_items=10)
    metadata: Optional[Dict[str, Any]] = None
    is_mandatory: Optional[bool] = None
    quiz_questions: Optional[List[QuizQuestion]] = None

class InstructionResponse(BaseModel):
    id: str = Field(..., description="Instruction ID")
    title: str = Field(..., description="Instruction title")
    content: str = Field(..., description="Instruction content")
    category_id: Optional[str] = Field(None, description="Category ID")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")
    status: InstructionStatus = Field(..., description="Instruction status")
    priority: InstructionPriority = Field(..., description="Instruction priority")
    effective_date: Optional[date] = Field(None, description="Effective date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    version: str = Field(..., description="Instruction version")
    tags: List[str] = Field(default_factory=list, description="Instruction tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    is_mandatory: bool = Field(..., description="Whether instruction is mandatory")
    quiz_questions: Optional[List[QuizQuestion]] = Field(None, description="Quiz questions")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Instruction Assignment Models
class InstructionAssignmentCreate(BaseModel):
    instruction_id: str = Field(..., description="Instruction ID")
    user_id: str = Field(..., description="User ID to assign to")
    assigned_by: str = Field(..., description="User ID who assigned")
    due_date: Optional[datetime] = Field(None, description="Due date")
    notes: Optional[str] = Field(None, description="Assignment notes")

class InstructionAssignmentUpdate(BaseModel):
    status: Optional[AssignmentStatus] = None
    read_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    quiz_score: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None

class InstructionAssignmentResponse(BaseModel):
    id: str = Field(..., description="Assignment ID")
    instruction_id: str = Field(..., description="Instruction ID")
    user_id: str = Field(..., description="User ID")
    assigned_by: str = Field(..., description="User ID who assigned")
    assigned_at: datetime = Field(..., description="Assignment timestamp")
    due_date: Optional[datetime] = Field(None, description="Due date")
    status: AssignmentStatus = Field(..., description="Assignment status")
    read_at: Optional[datetime] = Field(None, description="Read timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    quiz_score: Optional[int] = Field(None, description="Quiz score")
    notes: Optional[str] = Field(None, description="Assignment notes")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Instruction Template Models
class InstructionTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    content_template: str = Field(..., min_length=1, description="Template content")
    category_id: Optional[str] = Field(None, description="Category ID")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")
    is_active: bool = Field(True, description="Whether template is active")
    variables: Dict[str, Any] = Field(default_factory=dict, description="Template variables")

class InstructionTemplateResponse(BaseModel):
    id: str = Field(..., description="Template ID")
    name: str = Field(..., description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    content_template: str = Field(..., description="Template content")
    category_id: Optional[str] = Field(None, description="Category ID")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")
    is_active: bool = Field(..., description="Whether template is active")
    variables: Dict[str, Any] = Field(default_factory=dict, description="Template variables")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Search and Filter Models
class InstructionSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    status: Optional[InstructionStatus] = Field(None, description="Filter by status")
    priority: Optional[InstructionPriority] = Field(None, description="Filter by priority")
    category_id: Optional[str] = Field(None, description="Filter by category")
    company_id: Optional[str] = Field(None, description="Filter by company")
    is_mandatory: Optional[bool] = Field(None, description="Filter by mandatory status")
    effective_date_from: Optional[date] = Field(None, description="Filter from effective date")
    effective_date_to: Optional[date] = Field(None, description="Filter to effective date")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(20, ge=1, le=100, description="Number of records to return")

class InstructionSearchResponse(BaseModel):
    instructions: List[InstructionResponse] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Number of records returned")

# Statistics Models
class InstructionStatsResponse(BaseModel):
    total_instructions: int = Field(..., description="Total number of instructions")
    by_status: Dict[str, int] = Field(..., description="Instructions by status")
    by_priority: Dict[str, int] = Field(..., description="Instructions by priority")
    mandatory_count: int = Field(..., description="Number of mandatory instructions")
    expired_count: int = Field(..., description="Number of expired instructions")
    recent_created: int = Field(..., description="Instructions created in last 30 days")

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
    logger.info("Starting Instruction Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Instruction Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude Instruction Service",
    description="""
    ## Instruction Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, iş güvenliği talimatlarının yönetimi, atanması ve takibi için tasarlanmıştır.
    
    ### Özellikler:
    - 📋 Talimat oluşturma ve yönetimi
    - 👥 Talimat atama sistemi
    - 📝 Talimat şablonları
    - 🎯 Quiz sistemi ile anlama kontrolü
    - 📊 Talimat istatistikleri ve raporlama
    - 🔍 Gelişmiş arama ve filtreleme
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /instructions` - Yeni talimat oluştur
    - `GET /instructions` - Talimatları listele
    - `GET /instructions/{id}` - Talimat detayı
    - `PUT /instructions/{id}` - Talimat güncelle
    - `POST /instructions/{id}/assign` - Talimat ata
    - `GET /assignments` - Atamaları listele
    - `POST /templates` - Şablon oluştur
    - `GET /templates` - Şablonları listele
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
        "service": "Claude Instruction Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Instruction Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "instruction-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude Instruction Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude Instruction Service",
        version="1.0.0",
        description="Instruction Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Instruction endpoints
@app.post("/instructions", response_model=InstructionResponse, status_code=status.HTTP_201_CREATED)
async def create_instruction(instruction: InstructionCreate):
    """Create a new instruction."""
    try:
        # Generate ID
        instruction_id = str(uuid.uuid4())
        
        # Mock response
        response = InstructionResponse(
            id=instruction_id,
            title=instruction.title,
            content=instruction.content,
            category_id=instruction.category_id,
            company_id=instruction.company_id,
            created_by=instruction.created_by,
            status=instruction.status,
            priority=instruction.priority,
            effective_date=instruction.effective_date,
            expiry_date=instruction.expiry_date,
            version=instruction.version,
            tags=instruction.tags,
            metadata=instruction.metadata,
            is_mandatory=instruction.is_mandatory,
            quiz_questions=instruction.quiz_questions,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info("Instruction created", instruction_id=instruction_id, title=instruction.title)
        return response
        
    except Exception as e:
        logger.error("Failed to create instruction", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create instruction"
        )

@app.get("/instructions", response_model=InstructionSearchResponse)
async def get_instructions(
    query: Optional[str] = Query(None, description="Search query"),
    status: Optional[InstructionStatus] = Query(None, description="Filter by status"),
    priority: Optional[InstructionPriority] = Query(None, description="Filter by priority"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    is_mandatory: Optional[bool] = Query(None, description="Filter by mandatory status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get instructions with optional filtering."""
    try:
        # Mock response
        mock_instructions = [
            InstructionResponse(
                id=str(uuid.uuid4()),
                title="İş Güvenliği Genel Kuralları",
                content="Tüm çalışanların uyması gereken temel iş güvenliği kuralları...",
                category_id="550e8400-e29b-41d4-a716-446655440400",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                created_by="550e8400-e29b-41d4-a716-446655440100",
                status=InstructionStatus.PUBLISHED,
                priority=InstructionPriority.HIGH,
                effective_date=date(2024, 1, 1),
                expiry_date=date(2025, 1, 1),
                version="2.0",
                tags=["güvenlik", "genel", "kurallar"],
                metadata={"author": "Güvenlik Müdürlüğü"},
                is_mandatory=True,
                quiz_questions=[
                    QuizQuestion(
                        question="İş güvenliği kurallarına uymak kimin sorumluluğundadır?",
                        options=["Sadece güvenlik müdürü", "Tüm çalışanlar", "Sadece yöneticiler", "Sadece operatörler"],
                        correct_answer=1
                    )
                ],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]
        
        response = InstructionSearchResponse(
            instructions=mock_instructions,
            total=len(mock_instructions),
            skip=skip,
            limit=limit
        )
        
        logger.info("Instructions retrieved", count=len(mock_instructions))
        return response
        
    except Exception as e:
        logger.error("Failed to get instructions", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get instructions"
        )

@app.get("/instructions/{instruction_id}", response_model=InstructionResponse)
async def get_instruction(instruction_id: str = Path(..., description="Instruction ID")):
    """Get a specific instruction by ID."""
    try:
        # Mock response
        instruction = InstructionResponse(
            id=instruction_id,
            title="İş Güvenliği Genel Kuralları",
            content="Tüm çalışanların uyması gereken temel iş güvenliği kuralları ve prosedürleri...",
            category_id="550e8400-e29b-41d4-a716-446655440400",
            company_id="550e8400-e29b-41d4-a716-446655440000",
            created_by="550e8400-e29b-41d4-a716-446655440100",
            status=InstructionStatus.PUBLISHED,
            priority=InstructionPriority.HIGH,
            effective_date=date(2024, 1, 1),
            expiry_date=date(2025, 1, 1),
            version="2.0",
            tags=["güvenlik", "genel", "kurallar"],
            metadata={"author": "Güvenlik Müdürlüğü"},
            is_mandatory=True,
            quiz_questions=[
                QuizQuestion(
                    question="İş güvenliği kurallarına uymak kimin sorumluluğundadır?",
                    options=["Sadece güvenlik müdürü", "Tüm çalışanlar", "Sadece yöneticiler", "Sadece operatörler"],
                    correct_answer=1
                )
            ],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info("Instruction retrieved", instruction_id=instruction_id)
        return instruction
        
    except Exception as e:
        logger.error("Failed to get instruction", instruction_id=instruction_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instruction not found"
        )

@app.put("/instructions/{instruction_id}", response_model=InstructionResponse)
async def update_instruction(
    instruction_id: str = Path(..., description="Instruction ID"),
    instruction_update: InstructionUpdate = None
):
    """Update an instruction."""
    try:
        # Mock response
        instruction = InstructionResponse(
            id=instruction_id,
            title=instruction_update.title or "İş Güvenliği Genel Kuralları",
            content=instruction_update.content or "Tüm çalışanların uyması gereken temel iş güvenliği kuralları...",
            category_id=instruction_update.category_id or "550e8400-e29b-41d4-a716-446655440400",
            company_id="550e8400-e29b-41d4-a716-446655440000",
            created_by="550e8400-e29b-41d4-a716-446655440100",
            status=instruction_update.status or InstructionStatus.PUBLISHED,
            priority=instruction_update.priority or InstructionPriority.HIGH,
            effective_date=instruction_update.effective_date or date(2024, 1, 1),
            expiry_date=instruction_update.expiry_date or date(2025, 1, 1),
            version=instruction_update.version or "2.0",
            tags=instruction_update.tags or ["güvenlik", "genel", "kurallar"],
            metadata=instruction_update.metadata or {"author": "Güvenlik Müdürlüğü"},
            is_mandatory=instruction_update.is_mandatory if instruction_update.is_mandatory is not None else True,
            quiz_questions=instruction_update.quiz_questions,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        logger.info("Instruction updated", instruction_id=instruction_id)
        return instruction
        
    except Exception as e:
        logger.error("Failed to update instruction", instruction_id=instruction_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update instruction"
        )

# Assignment endpoints
@app.post("/instructions/{instruction_id}/assign", response_model=InstructionAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def assign_instruction(
    instruction_id: str = Path(..., description="Instruction ID"),
    assignment: InstructionAssignmentCreate = None
):
    """Assign an instruction to a user."""
    try:
        assignment_id = str(uuid.uuid4())
        
        response = InstructionAssignmentResponse(
            id=assignment_id,
            instruction_id=instruction_id,
            user_id=assignment.user_id,
            assigned_by=assignment.assigned_by,
            assigned_at=datetime.now(),
            due_date=assignment.due_date,
            status=AssignmentStatus.ASSIGNED,
            notes=assignment.notes,
            created_at=datetime.now()
        )
        
        logger.info("Instruction assigned", instruction_id=instruction_id, user_id=assignment.user_id)
        return response
        
    except Exception as e:
        logger.error("Failed to assign instruction", instruction_id=instruction_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign instruction"
        )

@app.get("/assignments", response_model=List[InstructionAssignmentResponse])
async def get_assignments(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    instruction_id: Optional[str] = Query(None, description="Filter by instruction ID"),
    status: Optional[AssignmentStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get instruction assignments."""
    try:
        # Mock response
        mock_assignments = [
            InstructionAssignmentResponse(
                id=str(uuid.uuid4()),
                instruction_id="550e8400-e29b-41d4-a716-446655440030",
                user_id=user_id or "550e8400-e29b-41d4-a716-446655440101",
                assigned_by="550e8400-e29b-41d4-a716-446655440100",
                assigned_at=datetime.now(),
                due_date=datetime.now(),
                status=AssignmentStatus.ASSIGNED,
                notes="Yeni çalışan eğitimi",
                created_at=datetime.now()
            )
        ]
        
        logger.info("Assignments retrieved", count=len(mock_assignments))
        return mock_assignments
        
    except Exception as e:
        logger.error("Failed to get assignments", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get assignments"
        )

# Template endpoints
@app.post("/templates", response_model=InstructionTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(template: InstructionTemplateCreate):
    """Create a new instruction template."""
    try:
        template_id = str(uuid.uuid4())
        
        response = InstructionTemplateResponse(
            id=template_id,
            name=template.name,
            description=template.description,
            content_template=template.content_template,
            category_id=template.category_id,
            company_id=template.company_id,
            created_by=template.created_by,
            is_active=template.is_active,
            variables=template.variables,
            created_at=datetime.now()
        )
        
        logger.info("Template created", template_id=template_id, name=template.name)
        return response
        
    except Exception as e:
        logger.error("Failed to create template", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template"
        )

@app.get("/templates", response_model=List[InstructionTemplateResponse])
async def get_templates(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get instruction templates."""
    try:
        # Mock response
        mock_templates = [
            InstructionTemplateResponse(
                id=str(uuid.uuid4()),
                name="Güvenlik Talimatı Şablonu",
                description="Genel güvenlik talimatları için şablon",
                content_template="Bu talimat {department} departmanı için hazırlanmıştır...",
                category_id="550e8400-e29b-41d4-a716-446655440400",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                created_by="550e8400-e29b-41d4-a716-446655440100",
                is_active=True,
                variables={"department": "string", "location": "string"},
                created_at=datetime.now()
            )
        ]
        
        logger.info("Templates retrieved", count=len(mock_templates))
        return mock_templates
        
    except Exception as e:
        logger.error("Failed to get templates", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get templates"
        )

# Statistics endpoint
@app.get("/statistics", response_model=InstructionStatsResponse)
async def get_instruction_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get instruction statistics."""
    try:
        stats = InstructionStatsResponse(
            total_instructions=25,
            by_status={
                "published": 20,
                "draft": 3,
                "archived": 2
            },
            by_priority={
                "high": 8,
                "normal": 15,
                "low": 2
            },
            mandatory_count=12,
            expired_count=1,
            recent_created=5
        )
        
        logger.info("Statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

