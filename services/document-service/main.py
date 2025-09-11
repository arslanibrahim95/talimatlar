from fastapi import FastAPI, HTTPException, status, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
import structlog

# Setup logging
logger = structlog.get_logger()

# Pydantic models for API documentation and validation
# Defines data structures for document management operations

# Base document model with common fields
# Contains essential document information and metadata
class DocumentBase(BaseModel):
    title: str = Field(..., description="Document title", min_length=1, max_length=200)
    description: Optional[str] = Field(None, description="Document description", max_length=1000)
    category: str = Field(..., description="Document category", min_length=1, max_length=100)
    tags: Optional[List[str]] = Field(None, description="Document tags")

# Document creation model for new documents
# Extends base model with file-specific fields
class DocumentCreate(DocumentBase):
    file_url: Optional[str] = Field(None, description="Document file URL")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    file_type: Optional[str] = Field(None, description="File MIME type")

# Document response model for API responses
# Includes all document fields with system-generated data
class DocumentResponse(DocumentBase):
    id: str = Field(..., description="Document unique identifier")
    status: str = Field(..., description="Document status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    class Config:
        from_attributes = True

# Health check model for service monitoring
# Provides service status and health information
class HealthCheck(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    checks: dict

# Error response model for API error handling
# Standardizes error responses across the API
class ErrorResponse(BaseModel):
    error: str
    message: str
    status_code: int
    timestamp: str

# Application lifespan manager
# Handles startup and shutdown operations
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Document Service", version="1.0.0")
    logger.info("Services initialization skipped")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Document Service")

# Create FastAPI app with enhanced metadata
# Configures application with comprehensive documentation and security
app = FastAPI(
    title="Claude Document Service",
    description="""
    ## Document Management Service for Claude Talimat İş Güvenliği Sistemi
    
    Bu servis, iş güvenliği dokümanlarının yönetimi, arama ve depolanması için tasarlanmıştır.
    
    ### Özellikler:
    - 📄 Doküman yükleme ve yönetimi
    - 🔍 Gelişmiş arama ve filtreleme
    - 📊 Doküman analizi ve raporlama
    - 🔐 Güvenli dosya depolama
    - 📱 PWA desteği
    
    ### API Endpoints:
    - `GET /` - Servis bilgisi
    - `GET /health` - Sağlık kontrolü
    - `GET /docs` - Swagger UI
    - `GET /openapi.json` - OpenAPI schema
    - `POST /documents` - Yeni doküman oluştur
    - `GET /documents` - Dokümanları listele
    - `GET /documents/{id}` - Doküman detayı
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

# Add CORS middleware with better configuration
# Enables cross-origin requests with security restrictions
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom OpenAPI schema
def custom_openapi() -> dict:
    """Generate custom OpenAPI schema with enhanced metadata."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Claude Document Service API",
        version="1.0.0",
        description="Document management service for Claude Talimat system",
        routes=app.routes,
    )
    
    # Add custom info
    openapi_schema["info"]["x-logo"] = {
        "url": "https://claude-talimat.com/logo.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Custom Swagger UI
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html() -> HTMLResponse:
    """Serve custom Swagger UI with enhanced styling."""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Swagger UI",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
        swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png"
    )

@app.get("/", response_model=dict, tags=["Root"])
async def root() -> dict:
    """
    ## Servis Bilgisi
    
    Claude Document Service'in temel bilgilerini döndürür.
    """
    return {
        "service": "Claude Document Service",
        "version": "1.0.0",
        "status": "running",
        "description": "Document management service for Claude Talimat system",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "openapi": "/openapi.json"
        }
    }

@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """
    ## Sağlık Kontrolü
    
    Servisin sağlık durumunu ve bağımlılıklarını kontrol eder.
    """
    try:
        health_status = HealthCheck(
            status="healthy",
            service="document-service",
            version="1.0.0",
            timestamp=datetime.utcnow().isoformat(),
            checks={
                "database": "not_configured",
                "search": "not_implemented",
                "storage": "not_implemented"
            }
        )
        
        return health_status
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )

# Document routes with enhanced documentation
@app.post("/documents", response_model=DocumentResponse, tags=["Documents"])
async def create_document(document: DocumentCreate):
    """
    ## Yeni Doküman Oluştur
    
    Sisteme yeni bir doküman ekler.
    
    ### Parametreler:
    - **title**: Doküman başlığı (zorunlu)
    - **description**: Doküman açıklaması (opsiyonel)
    - **category**: Doküman kategorisi (zorunlu)
    - **tags**: Doküman etiketleri (opsiyonel)
    - **file_url**: Dosya URL'i (opsiyonel)
    - **file_size**: Dosya boyutu (opsiyonel)
    - **file_type**: Dosya türü (opsiyonel)
    
    ### Dönüş:
    - Oluşturulan doküman bilgileri
    """
    try:
        # Simulate document creation
        created_document = DocumentResponse(
            id="doc_" + str(int(datetime.utcnow().timestamp())),
            title=document.title,
            description=document.description,
            category=document.category,
            tags=document.tags or [],
            status="draft",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        logger.info("Document created", document_id=created_document.id, title=document.title)
        return created_document
        
    except Exception as e:
        logger.error("Document creation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document creation failed: {str(e)}"
        )

@app.get("/documents", response_model=dict, tags=["Documents"])
async def list_documents(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """
    ## Dokümanları Listele
    
    Sistemdeki dokümanları sayfalı olarak listeler.
    
    ### Query Parametreleri:
    - **page**: Sayfa numarası (varsayılan: 1)
    - **size**: Sayfa boyutu (varsayılan: 10, maksimum: 100)
    - **category**: Kategoriye göre filtreleme (opsiyonel)
    - **status**: Duruma göre filtreleme (opsiyonel)
    
    ### Dönüş:
    - Doküman listesi ve toplam sayı
    """
    try:
        # Simulate document listing with filtering
        sample_documents = [
            {
                "id": "1",
                "title": "İş Güvenliği El Kitabı",
                "description": "Genel iş güvenliği kuralları ve prosedürleri",
                "category": "Güvenlik",
                "status": "published",
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "2",
                "title": "Yangın Güvenliği Prosedürleri",
                "description": "Yangın durumunda yapılacaklar",
                "category": "Güvenlik",
                "status": "published",
                "created_at": "2024-01-02T00:00:00Z"
            }
        ]
        
        # Apply filters
        if category:
            sample_documents = [doc for doc in sample_documents if doc["category"] == category]
        if status:
            sample_documents = [doc for doc in sample_documents if doc["status"] == status]
        
        # Pagination
        start = (page - 1) * size
        end = start + size
        paginated_documents = sample_documents[start:end]
        
        return {
            "documents": paginated_documents,
            "total": len(sample_documents),
            "page": page,
            "size": size,
            "total_pages": (len(sample_documents) + size - 1) // size
        }
        
    except Exception as e:
        logger.error("Document listing failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document listing failed: {str(e)}"
        )

@app.get("/documents/{document_id}", response_model=DocumentResponse, tags=["Documents"])
async def get_document(document_id: str = Path(..., description="Document unique identifier")):
    """
    ## Doküman Detayı
    
    Belirtilen ID'ye sahip dokümanın detaylarını döndürür.
    
    ### Parametreler:
    - **document_id**: Doküman ID'si (zorunlu)
    
    ### Dönüş:
    - Doküman detayları
    
    ### Hata Durumları:
    - **404**: Doküman bulunamadı
    """
    try:
        # Simulate document retrieval
        if document_id == "1":
            return DocumentResponse(
                id=document_id,
                title="İş Güvenliği El Kitabı",
                description="Genel iş güvenliği kuralları ve prosedürleri",
                category="Güvenlik",
                tags=["güvenlik", "el kitabı", "prosedür"],
                status="published",
                created_at=datetime(2024, 1, 1),
                updated_at=datetime(2024, 1, 1)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document retrieval failed", document_id=document_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document retrieval failed: {str(e)}"
        )

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    error_response = ErrorResponse(
        error=exc.detail,
        message=str(exc.detail),
        status_code=exc.status_code,
        timestamp=datetime.utcnow().isoformat()
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc))
    error_response = ErrorResponse(
        error="Internal server error",
        message="An unexpected error occurred",
        status_code=500,
        timestamp=datetime.utcnow().isoformat()
    )
    return JSONResponse(
        status_code=500,
        content=error_response.dict()
    )

# Server startup
if __name__ == "__main__":
    import uvicorn
    print("🚀 Document Service starting on port 8002")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )
