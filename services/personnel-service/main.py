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
class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"

class ShiftType(str, Enum):
    DAY = "day"
    NIGHT = "night"
    ROTATING = "rotating"

# Emergency Contact Model
class EmergencyContact(BaseModel):
    name: str = Field(..., description="Contact person name")
    phone: str = Field(..., description="Contact phone number")
    relation: str = Field(..., description="Relationship to employee")
    email: Optional[str] = Field(None, description="Contact email")

# Certification Model
class Certification(BaseModel):
    name: str = Field(..., description="Certification name")
    issuer: str = Field(..., description="Issuing organization")
    issue_date: date = Field(..., description="Issue date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    certificate_number: Optional[str] = Field(None, description="Certificate number")

# Department Models
class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Department name")
    code: str = Field(..., min_length=1, max_length=50, description="Department code")
    description: Optional[str] = Field(None, description="Department description")
    manager_id: Optional[str] = Field(None, description="Manager employee ID")
    company_id: str = Field(..., description="Company ID")
    parent_department_id: Optional[str] = Field(None, description="Parent department ID")
    is_active: bool = Field(True, description="Whether department is active")

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    manager_id: Optional[str] = None
    parent_department_id: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(BaseModel):
    id: str = Field(..., description="Department ID")
    name: str = Field(..., description="Department name")
    code: str = Field(..., description="Department code")
    description: Optional[str] = Field(None, description="Department description")
    manager_id: Optional[str] = Field(None, description="Manager employee ID")
    company_id: str = Field(..., description="Company ID")
    parent_department_id: Optional[str] = Field(None, description="Parent department ID")
    is_active: bool = Field(..., description="Whether department is active")
    created_at: datetime = Field(..., description="Creation timestamp")
    employee_count: Optional[int] = Field(None, description="Number of employees in department")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Employee Models
class EmployeeCreate(BaseModel):
    user_id: str = Field(..., description="User ID")
    employee_number: str = Field(..., min_length=1, max_length=50, description="Employee number")
    department_id: str = Field(..., description="Department ID")
    position: str = Field(..., min_length=1, max_length=100, description="Position")
    hire_date: date = Field(..., description="Hire date")
    employment_type: EmploymentType = Field(..., description="Employment type")
    work_location: Optional[str] = Field(None, description="Work location")
    shift: Optional[ShiftType] = Field(None, description="Shift type")
    supervisor_id: Optional[str] = Field(None, description="Supervisor employee ID")
    skills: List[str] = Field(default_factory=list, description="Employee skills")
    certifications: List[Certification] = Field(default_factory=list, description="Employee certifications")
    emergency_contact: EmergencyContact = Field(..., description="Emergency contact information")
    is_active: bool = Field(True, description="Whether employee is active")

class EmployeeUpdate(BaseModel):
    employee_number: Optional[str] = Field(None, min_length=1, max_length=50)
    department_id: Optional[str] = None
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    employment_type: Optional[EmploymentType] = None
    work_location: Optional[str] = None
    shift: Optional[ShiftType] = None
    supervisor_id: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[Certification]] = None
    emergency_contact: Optional[EmergencyContact] = None
    is_active: Optional[bool] = None

class EmployeeResponse(BaseModel):
    id: str = Field(..., description="Employee ID")
    user_id: str = Field(..., description="User ID")
    employee_number: str = Field(..., description="Employee number")
    department_id: str = Field(..., description="Department ID")
    position: str = Field(..., description="Position")
    hire_date: date = Field(..., description="Hire date")
    employment_type: EmploymentType = Field(..., description="Employment type")
    work_location: Optional[str] = Field(None, description="Work location")
    shift: Optional[ShiftType] = Field(None, description="Shift type")
    supervisor_id: Optional[str] = Field(None, description="Supervisor employee ID")
    skills: List[str] = Field(default_factory=list, description="Employee skills")
    certifications: List[Certification] = Field(default_factory=list, description="Employee certifications")
    emergency_contact: EmergencyContact = Field(..., description="Emergency contact information")
    is_active: bool = Field(..., description="Whether employee is active")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Additional fields from user table
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Phone")
    
    # Department info
    department_name: Optional[str] = Field(None, description="Department name")
    department_code: Optional[str] = Field(None, description="Department code")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Search and Filter Models
class EmployeeSearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    department_id: Optional[str] = Field(None, description="Filter by department")
    position: Optional[str] = Field(None, description="Filter by position")
    employment_type: Optional[EmploymentType] = Field(None, description="Filter by employment type")
    shift: Optional[ShiftType] = Field(None, description="Filter by shift")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    company_id: Optional[str] = Field(None, description="Filter by company")
    skills: Optional[List[str]] = Field(None, description="Filter by skills")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(20, ge=1, le=100, description="Number of records to return")

class EmployeeSearchResponse(BaseModel):
    employees: List[EmployeeResponse] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Number of records returned")

# Statistics Models
class PersonnelStatsResponse(BaseModel):
    total_employees: int = Field(..., description="Total number of employees")
    active_employees: int = Field(..., description="Number of active employees")
    by_department: Dict[str, int] = Field(..., description="Employees by department")
    by_employment_type: Dict[str, int] = Field(..., description="Employees by employment type")
    by_shift: Dict[str, int] = Field(..., description="Employees by shift")
    recent_hires: int = Field(..., description="Employees hired in last 30 days")
    certifications_expiring: int = Field(..., description="Certifications expiring in next 30 days")

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
    logger.info("Starting Personnel Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Personnel Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude Personnel Service",
    description="""
    ## Personnel Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, personel ve departman yönetimi için tasarlanmıştır.
    
    ### Özellikler:
    - 👥 Personel yönetimi ve bilgileri
    - 🏢 Departman organizasyonu
    - 📋 Pozisyon ve vardiya yönetimi
    - 🎓 Sertifika takibi
    - 📞 Acil durum iletişim bilgileri
    - 📊 Personel istatistikleri ve raporlama
    - 🔍 Gelişmiş arama ve filtreleme
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /departments` - Yeni departman oluştur
    - `GET /departments` - Departmanları listele
    - `POST /employees` - Yeni personel oluştur
    - `GET /employees` - Personelleri listele
    - `GET /employees/{id}` - Personel detayı
    - `PUT /employees/{id}` - Personel güncelle
    - `GET /statistics` - Personel istatistikleri
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
        "service": "Claude Personnel Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Personnel Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "personnel-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude Personnel Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude Personnel Service",
        version="1.0.0",
        description="Personnel Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Department endpoints
@app.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(department: DepartmentCreate):
    """Create a new department."""
    try:
        department_id = str(uuid.uuid4())
        
        response = DepartmentResponse(
            id=department_id,
            name=department.name,
            code=department.code,
            description=department.description,
            manager_id=department.manager_id,
            company_id=department.company_id,
            parent_department_id=department.parent_department_id,
            is_active=department.is_active,
            created_at=datetime.now(),
            employee_count=0
        )
        
        logger.info("Department created", department_id=department_id, name=department.name)
        return response
        
    except Exception as e:
        logger.error("Failed to create department", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create department"
        )

@app.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get departments."""
    try:
        # Mock response
        mock_departments = [
            DepartmentResponse(
                id="550e8400-e29b-41d4-a716-446655440010",
                name="İnsan Kaynakları",
                code="IK",
                description="İnsan kaynakları ve personel yönetimi",
                manager_id="550e8400-e29b-41d4-a716-446655440020",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                parent_department_id=None,
                is_active=True,
                created_at=datetime.now(),
                employee_count=5
            ),
            DepartmentResponse(
                id="550e8400-e29b-41d4-a716-446655440011",
                name="Güvenlik Müdürlüğü",
                code="GM",
                description="İş güvenliği ve çevre yönetimi",
                manager_id="550e8400-e29b-41d4-a716-446655440020",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                parent_department_id=None,
                is_active=True,
                created_at=datetime.now(),
                employee_count=8
            )
        ]
        
        logger.info("Departments retrieved", count=len(mock_departments))
        return mock_departments
        
    except Exception as e:
        logger.error("Failed to get departments", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get departments"
        )

# Employee endpoints
@app.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(employee: EmployeeCreate):
    """Create a new employee."""
    try:
        employee_id = str(uuid.uuid4())
        
        response = EmployeeResponse(
            id=employee_id,
            user_id=employee.user_id,
            employee_number=employee.employee_number,
            department_id=employee.department_id,
            position=employee.position,
            hire_date=employee.hire_date,
            employment_type=employee.employment_type,
            work_location=employee.work_location,
            shift=employee.shift,
            supervisor_id=employee.supervisor_id,
            skills=employee.skills,
            certifications=employee.certifications,
            emergency_contact=employee.emergency_contact,
            is_active=employee.is_active,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            first_name="Ahmet",
            last_name="Yılmaz",
            email="ahmet.yilmaz@example.com",
            phone="+90 555 123 45 67",
            department_name="Güvenlik Müdürlüğü",
            department_code="GM"
        )
        
        logger.info("Employee created", employee_id=employee_id, employee_number=employee.employee_number)
        return response
        
    except Exception as e:
        logger.error("Failed to create employee", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create employee"
        )

@app.get("/employees", response_model=EmployeeSearchResponse)
async def get_employees(
    query: Optional[str] = Query(None, description="Search query"),
    department_id: Optional[str] = Query(None, description="Filter by department"),
    position: Optional[str] = Query(None, description="Filter by position"),
    employment_type: Optional[EmploymentType] = Query(None, description="Filter by employment type"),
    shift: Optional[ShiftType] = Query(None, description="Filter by shift"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get employees with optional filtering."""
    try:
        # Mock response
        mock_employees = [
            EmployeeResponse(
                id="550e8400-e29b-41d4-a716-446655440020",
                user_id="550e8400-e29b-41d4-a716-446655440100",
                employee_number="EMP001",
                department_id="550e8400-e29b-41d4-a716-446655440011",
                position="Güvenlik Müdürü",
                hire_date=date(2023, 1, 15),
                employment_type=EmploymentType.FULL_TIME,
                work_location="Ana Tesis",
                shift=ShiftType.DAY,
                supervisor_id=None,
                skills=["İş Güvenliği", "Risk Değerlendirmesi", "Eğitim"],
                certifications=[
                    Certification(
                        name="İş Güvenliği Uzmanı",
                        issuer="Çalışma ve Sosyal Güvenlik Bakanlığı",
                        issue_date=date(2023, 1, 1),
                        expiry_date=date(2024, 12, 31),
                        certificate_number="ISG-2023-001"
                    )
                ],
                emergency_contact=EmergencyContact(
                    name="Ayşe Yılmaz",
                    phone="+90 555 111 22 33",
                    relation="Eş",
                    email="ayse.yilmaz@example.com"
                ),
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                first_name="Ahmet",
                last_name="Yılmaz",
                email="ahmet.yilmaz@example.com",
                phone="+90 555 123 45 67",
                department_name="Güvenlik Müdürlüğü",
                department_code="GM"
            )
        ]
        
        response = EmployeeSearchResponse(
            employees=mock_employees,
            total=len(mock_employees),
            skip=skip,
            limit=limit
        )
        
        logger.info("Employees retrieved", count=len(mock_employees))
        return response
        
    except Exception as e:
        logger.error("Failed to get employees", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get employees"
        )

@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str = Path(..., description="Employee ID")):
    """Get a specific employee by ID."""
    try:
        # Mock response
        employee = EmployeeResponse(
            id=employee_id,
            user_id="550e8400-e29b-41d4-a716-446655440100",
            employee_number="EMP001",
            department_id="550e8400-e29b-41d4-a716-446655440011",
            position="Güvenlik Müdürü",
            hire_date=date(2023, 1, 15),
            employment_type=EmploymentType.FULL_TIME,
            work_location="Ana Tesis",
            shift=ShiftType.DAY,
            supervisor_id=None,
            skills=["İş Güvenliği", "Risk Değerlendirmesi", "Eğitim"],
            certifications=[
                Certification(
                    name="İş Güvenliği Uzmanı",
                    issuer="Çalışma ve Sosyal Güvenlik Bakanlığı",
                    issue_date=date(2023, 1, 1),
                    expiry_date=date(2024, 12, 31),
                    certificate_number="ISG-2023-001"
                )
            ],
            emergency_contact=EmergencyContact(
                name="Ayşe Yılmaz",
                phone="+90 555 111 22 33",
                relation="Eş",
                email="ayse.yilmaz@example.com"
            ),
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            first_name="Ahmet",
            last_name="Yılmaz",
            email="ahmet.yilmaz@example.com",
            phone="+90 555 123 45 67",
            department_name="Güvenlik Müdürlüğü",
            department_code="GM"
        )
        
        logger.info("Employee retrieved", employee_id=employee_id)
        return employee
        
    except Exception as e:
        logger.error("Failed to get employee", employee_id=employee_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

@app.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str = Path(..., description="Employee ID"),
    employee_update: EmployeeUpdate = None
):
    """Update an employee."""
    try:
        # Mock response
        employee = EmployeeResponse(
            id=employee_id,
            user_id="550e8400-e29b-41d4-a716-446655440100",
            employee_number=employee_update.employee_number or "EMP001",
            department_id=employee_update.department_id or "550e8400-e29b-41d4-a716-446655440011",
            position=employee_update.position or "Güvenlik Müdürü",
            hire_date=date(2023, 1, 15),
            employment_type=employee_update.employment_type or EmploymentType.FULL_TIME,
            work_location=employee_update.work_location or "Ana Tesis",
            shift=employee_update.shift or ShiftType.DAY,
            supervisor_id=employee_update.supervisor_id,
            skills=employee_update.skills or ["İş Güvenliği", "Risk Değerlendirmesi", "Eğitim"],
            certifications=employee_update.certifications or [
                Certification(
                    name="İş Güvenliği Uzmanı",
                    issuer="Çalışma ve Sosyal Güvenlik Bakanlığı",
                    issue_date=date(2023, 1, 1),
                    expiry_date=date(2024, 12, 31),
                    certificate_number="ISG-2023-001"
                )
            ],
            emergency_contact=employee_update.emergency_contact or EmergencyContact(
                name="Ayşe Yılmaz",
                phone="+90 555 111 22 33",
                relation="Eş",
                email="ayse.yilmaz@example.com"
            ),
            is_active=employee_update.is_active if employee_update.is_active is not None else True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            first_name="Ahmet",
            last_name="Yılmaz",
            email="ahmet.yilmaz@example.com",
            phone="+90 555 123 45 67",
            department_name="Güvenlik Müdürlüğü",
            department_code="GM"
        )
        
        logger.info("Employee updated", employee_id=employee_id)
        return employee
        
    except Exception as e:
        logger.error("Failed to update employee", employee_id=employee_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update employee"
        )

# Statistics endpoint
@app.get("/statistics", response_model=PersonnelStatsResponse)
async def get_personnel_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get personnel statistics."""
    try:
        stats = PersonnelStatsResponse(
            total_employees=45,
            active_employees=42,
            by_department={
                "Güvenlik Müdürlüğü": 8,
                "İnsan Kaynakları": 5,
                "Kalite Kontrol": 12,
                "Üretim": 15,
                "Bakım": 5
            },
            by_employment_type={
                "full_time": 38,
                "part_time": 5,
                "contract": 2
            },
            by_shift={
                "day": 35,
                "night": 7,
                "rotating": 3
            },
            recent_hires=3,
            certifications_expiring=2
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
    uvicorn.run(app, host="0.0.0.0", port=8002)

