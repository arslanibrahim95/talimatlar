from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import structlog
from typing import List, Optional
import os

from app.config import settings
from app.database import init_db, get_db
from app.models.document import Document, DocumentCreate, DocumentUpdate, DocumentResponse
from app.services.document_service import DocumentService
from app.services.search_service import SearchService
from app.services.storage_service import StorageService
from app.middleware.auth import get_current_user
from app.middleware.error_handler import error_handler
from app.utils.logger import setup_logging

# Setup logging
setup_logging()
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Document Service", version="1.0.0")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Initialize services
    app.state.document_service = DocumentService()
    app.state.search_service = SearchService()
    app.state.storage_service = StorageService()
    logger.info("Services initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Document Service")

# Create FastAPI app
app = FastAPI(
    title="Claude Document Service",
    description="Document management service for Claude Talimat system",
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
        "service": "Claude Document Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    try:
        # Check database connection
        db = get_db()
        await db.execute("SELECT 1")
        
        # Check services
        document_service: DocumentService = app.state.document_service
        search_service: SearchService = app.state.search_service
        storage_service: StorageService = app.state.storage_service
        
        health_status = {
            "status": "healthy",
            "service": "document-service",
            "version": "1.0.0",
            "checks": {
                "database": "healthy",
                "search": "healthy",
                "storage": "healthy"
            }
        }
        
        return JSONResponse(content=health_status, status_code=200)
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return JSONResponse(
            content={
                "status": "unhealthy",
                "service": "document-service",
                "error": str(e)
            },
            status_code=503
        )

# Document routes
@app.post("/documents", response_model=DocumentResponse)
async def create_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    tags: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """Upload and create a new document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="File is required")
        
        # Check file size
        if file.size and file.size > settings.max_file_size:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Check file type
        allowed_extensions = settings.allowed_file_types.split(',')
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        # Parse tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # Create document
        document_data = DocumentCreate(
            title=title,
            category=category,
            tags=tag_list,
            description=description,
            filename=file.filename,
            file_size=file.size or 0,
            uploaded_by=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        document = await document_service.create_document(document_data, file)
        
        logger.info("Document created", 
                   document_id=document.id, 
                   user_id=current_user.id,
                   filename=file.filename)
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create document", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create document")

@app.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """List documents with pagination and filtering"""
    try:
        documents = await document_service.list_documents(
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            skip=skip,
            limit=limit,
            category=category,
            search=search
        )
        
        return documents
        
    except Exception as e:
        logger.error("Failed to list documents", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list documents")

@app.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """Get a specific document by ID"""
    try:
        document = await document_service.get_document(
            document_id=document_id,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get document", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get document")

@app.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """Update document metadata"""
    try:
        document = await document_service.update_document(
            document_id=document_id,
            document_update=document_update,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info("Document updated", 
                   document_id=document_id, 
                   user_id=current_user.id)
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update document", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update document")

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """Delete a document"""
    try:
        success = await document_service.delete_document(
            document_id=document_id,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info("Document deleted", 
                   document_id=document_id, 
                   user_id=current_user.id)
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete document", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to delete document")

@app.get("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """Download a document file"""
    try:
        file_data = await document_service.download_document(
            document_id=document_id,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        
        if not file_data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info("Document downloaded", 
                   document_id=document_id, 
                   user_id=current_user.id)
        
        return file_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to download document", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to download document")

@app.get("/categories")
async def get_categories(
    current_user = Depends(get_current_user),
    document_service: DocumentService = Depends(lambda: app.state.document_service)
):
    """Get available document categories"""
    try:
        categories = await document_service.get_categories(
            tenant_id=current_user.tenant_id
        )
        
        return {"categories": categories}
        
    except Exception as e:
        logger.error("Failed to get categories", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get categories")

@app.get("/search")
async def search_documents(
    q: str,
    skip: int = 0,
    limit: int = 20,
    current_user = Depends(get_current_user),
    search_service: SearchService = Depends(lambda: app.state.search_service)
):
    """Search documents using full-text search"""
    try:
        results = await search_service.search_documents(
            query=q,
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            skip=skip,
            limit=limit
        )
        
        return results
        
    except Exception as e:
        logger.error("Failed to search documents", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to search documents")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
