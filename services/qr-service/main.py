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
class QRCodeType(str, Enum):
    INSTRUCTION = "instruction"
    EQUIPMENT = "equipment"
    LOCATION = "location"
    EMERGENCY = "emergency"

# QR Code Models
class QRCodeCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=255, description="QR code value")
    type: QRCodeType = Field(..., description="Type of QR code")
    related_id: str = Field(..., description="Related record ID")
    related_type: str = Field(..., description="Related table name")
    location: str = Field(..., description="Physical location")
    company_id: str = Field(..., description="Company ID")
    created_by: str = Field(..., description="Creator user ID")

class QRCodeResponse(BaseModel):
    id: str = Field(..., description="QR code ID")
    code: str = Field(..., description="QR code value")
    type: QRCodeType = Field(..., description="Type of QR code")
    related_id: str = Field(..., description="Related record ID")
    related_type: str = Field(..., description="Related table name")
    location: str = Field(..., description="Physical location")
    company_id: str = Field(..., description="Company ID")
    is_active: bool = Field(..., description="Whether QR code is active")
    created_by: str = Field(..., description="Creator user ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    # Additional fields
    related_title: Optional[str] = Field(None, description="Related record title")
    scan_count: Optional[int] = Field(None, description="Number of scans")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# QR Usage Log Models
class QRUsageLogResponse(BaseModel):
    id: str = Field(..., description="Usage log ID")
    qr_code_id: str = Field(..., description="QR code ID")
    user_id: str = Field(..., description="User ID who scanned")
    scanned_at: datetime = Field(..., description="Scan timestamp")
    location: Optional[str] = Field(None, description="Scan location")
    device_info: Dict[str, Any] = Field(default_factory=dict, description="Device information")
    ip_address: Optional[str] = Field(None, description="IP address")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    # Additional fields
    user_name: Optional[str] = Field(None, description="User name")
    qr_code_type: Optional[str] = Field(None, description="QR code type")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting QR Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down QR Service")

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Claude QR Service",
    description="""
    ## QR Code Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, QR kodların yönetimi ve kullanım takibi için tasarlanmıştır.
    
    ### Özellikler:
    - 📱 QR kod oluşturma ve yönetimi
    - 📊 QR kod kullanım logları
    - 🔍 QR kod arama ve filtreleme
    - 📈 Kullanım istatistikleri
    - 🎯 Hızlı erişim sistemi
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `POST /qr-codes` - Yeni QR kod oluştur
    - `GET /qr-codes` - QR kodları listele
    - `GET /qr-codes/{id}` - QR kod detayı
    - `POST /qr-codes/{id}/scan` - QR kod tara
    - `GET /usage-logs` - Kullanım loglarını listele
    - `GET /statistics` - QR kod istatistikleri
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
        "service": "Claude QR Service",
        "version": "1.0.0",
        "status": "running",
        "description": "QR Code Management Service for Claude Talimat İş Güvenliği Sistemi"
    }

# Health check endpoint
@app.get("/health", response_model=Dict[str, str])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "qr-service",
        "timestamp": datetime.now().isoformat()
    }

# Custom docs endpoint
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Claude QR Service - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

# OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Claude QR Service",
        version="1.0.0",
        description="QR Code Management Service for Claude Talimat İş Güvenliği Sistemi",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# QR Code endpoints
@app.post("/qr-codes", response_model=QRCodeResponse, status_code=status.HTTP_201_CREATED)
async def create_qr_code(qr_code: QRCodeCreate):
    """Create a new QR code."""
    try:
        qr_code_id = str(uuid.uuid4())
        
        response = QRCodeResponse(
            id=qr_code_id,
            code=qr_code.code,
            type=qr_code.type,
            related_id=qr_code.related_id,
            related_type=qr_code.related_type,
            location=qr_code.location,
            company_id=qr_code.company_id,
            is_active=True,
            created_by=qr_code.created_by,
            created_at=datetime.now(),
            related_title="İş Güvenliği Genel Kuralları",
            scan_count=0
        )
        
        logger.info("QR code created", qr_code_id=qr_code_id, code=qr_code.code)
        return response
        
    except Exception as e:
        logger.error("Failed to create QR code", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create QR code"
        )

@app.get("/qr-codes", response_model=List[QRCodeResponse])
async def get_qr_codes(
    type: Optional[QRCodeType] = Query(None, description="Filter by QR code type"),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get QR codes with optional filtering."""
    try:
        # Mock response
        mock_qr_codes = [
            QRCodeResponse(
                id="550e8400-e29b-41d4-a716-446655440140",
                code="QR-INS-001",
                type=QRCodeType.INSTRUCTION,
                related_id="550e8400-e29b-41d4-a716-446655440030",
                related_type="instructions.instructions",
                location="Üretim Hattı A - Giriş",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                is_active=True,
                created_by="550e8400-e29b-41d4-a716-446655440100",
                created_at=datetime.now(),
                related_title="İş Güvenliği Genel Kuralları",
                scan_count=25
            ),
            QRCodeResponse(
                id="550e8400-e29b-41d4-a716-446655440141",
                code="QR-EQP-001",
                type=QRCodeType.EQUIPMENT,
                related_id="550e8400-e29b-41d4-a716-446655440090",
                related_type="equipment",
                location="Üretim Makinesi #1",
                company_id=company_id or "550e8400-e29b-41d4-a716-446655440000",
                is_active=True,
                created_by="550e8400-e29b-41d4-a716-446655440100",
                created_at=datetime.now(),
                related_title="Üretim Makinesi #1",
                scan_count=15
            )
        ]
        
        logger.info("QR codes retrieved", count=len(mock_qr_codes))
        return mock_qr_codes
        
    except Exception as e:
        logger.error("Failed to get QR codes", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get QR codes"
        )

@app.get("/qr-codes/{qr_code_id}", response_model=QRCodeResponse)
async def get_qr_code(qr_code_id: str = Path(..., description="QR code ID")):
    """Get a specific QR code by ID."""
    try:
        # Mock response
        qr_code = QRCodeResponse(
            id=qr_code_id,
            code="QR-INS-001",
            type=QRCodeType.INSTRUCTION,
            related_id="550e8400-e29b-41d4-a716-446655440030",
            related_type="instructions.instructions",
            location="Üretim Hattı A - Giriş",
            company_id="550e8400-e29b-41d4-a716-446655440000",
            is_active=True,
            created_by="550e8400-e29b-41d4-a716-446655440100",
            created_at=datetime.now(),
            related_title="İş Güvenliği Genel Kuralları",
            scan_count=25
        )
        
        logger.info("QR code retrieved", qr_code_id=qr_code_id)
        return qr_code
        
    except Exception as e:
        logger.error("Failed to get QR code", qr_code_id=qr_code_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR code not found"
        )

@app.post("/qr-codes/{qr_code_id}/scan", response_model=QRUsageLogResponse, status_code=status.HTTP_201_CREATED)
async def scan_qr_code(
    qr_code_id: str = Path(..., description="QR code ID"),
    user_id: str = Query(..., description="User ID who scanned"),
    location: Optional[str] = Query(None, description="Scan location"),
    device_info: Optional[Dict[str, Any]] = Query(None, description="Device information")
):
    """Record a QR code scan."""
    try:
        log_id = str(uuid.uuid4())
        
        response = QRUsageLogResponse(
            id=log_id,
            qr_code_id=qr_code_id,
            user_id=user_id,
            scanned_at=datetime.now(),
            location=location,
            device_info=device_info or {},
            ip_address="192.168.1.100",
            created_at=datetime.now(),
            user_name="Ahmet Yılmaz",
            qr_code_type="instruction"
        )
        
        logger.info("QR code scanned", qr_code_id=qr_code_id, user_id=user_id)
        return response
        
    except Exception as e:
        logger.error("Failed to record QR code scan", qr_code_id=qr_code_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record QR code scan"
        )

@app.get("/usage-logs", response_model=List[QRUsageLogResponse])
async def get_usage_logs(
    qr_code_id: Optional[str] = Query(None, description="Filter by QR code ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return")
):
    """Get QR code usage logs."""
    try:
        # Mock response
        mock_logs = [
            QRUsageLogResponse(
                id="550e8400-e29b-41d4-a716-446655440150",
                qr_code_id="550e8400-e29b-41d4-a716-446655440140",
                user_id="550e8400-e29b-41d4-a716-446655440101",
                scanned_at=datetime.now(),
                location="Üretim Hattı A",
                device_info={"device": "mobile", "os": "Android", "browser": "Chrome"},
                ip_address="192.168.1.100",
                created_at=datetime.now(),
                user_name="Ahmet Yılmaz",
                qr_code_type="instruction"
            )
        ]
        
        logger.info("Usage logs retrieved", count=len(mock_logs))
        return mock_logs
        
    except Exception as e:
        logger.error("Failed to get usage logs", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage logs"
        )

# Statistics endpoint
@app.get("/statistics", response_model=Dict[str, Any])
async def get_qr_statistics(
    company_id: Optional[str] = Query(None, description="Filter by company ID")
):
    """Get QR code statistics."""
    try:
        stats = {
            "total_qr_codes": 25,
            "active_qr_codes": 23,
            "by_type": {
                "instruction": 15,
                "equipment": 6,
                "location": 3,
                "emergency": 1
            },
            "total_scans": 150,
            "unique_scanners": 45,
            "most_scanned": "QR-INS-001",
            "recent_scans": 12
        }
        
        logger.info("QR statistics retrieved")
        return stats
        
    except Exception as e:
        logger.error("Failed to get QR statistics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get QR statistics"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)

