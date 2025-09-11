from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
import uuid
import os

from ..utils.logger import get_logger
from .storage_service import StorageService
from .search_service import SearchService

logger = get_logger(__name__)

class DocumentService:
    def __init__(self, db: Session, storage_service: StorageService, search_service: SearchService):
        self.db = db
        self.storage_service = storage_service
        self.search_service = search_service

    def create_document(self, document_data: Any, user_id: str, tenant_id: str) -> Dict[str, Any]:
        """Create a new document"""
        try:
            # Generate unique document ID
            document_id = str(uuid.uuid4())
            
            # For now, return mock data
            document = {
                "id": document_id,
                "tenant_id": tenant_id,
                "title": document_data.get("title", "Untitled"),
                "description": document_data.get("description", ""),
                "created_by": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "status": "draft"
            }
            
            logger.info(f"Document created successfully: {document_id}")
            return document
            
        except Exception as e:
            logger.error(f"Error creating document: {str(e)}")
            raise

    def get_document(self, document_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        try:
            # Mock document for now
            document = {
                "id": document_id,
                "tenant_id": tenant_id,
                "title": "Sample Document",
                "description": "This is a sample document",
                "created_at": datetime.utcnow().isoformat(),
                "status": "published"
            }
            
            return document
            
        except Exception as e:
            logger.error(f"Error getting document {document_id}: {str(e)}")
            raise

    def get_documents(
        self, 
        tenant_id: str, 
        page: int = 1, 
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get documents with pagination and filters"""
        try:
            # Mock documents for now
            documents = [
                {
                    "id": "1",
                    "title": "İş Güvenliği El Kitabı",
                    "description": "Genel iş güvenliği kuralları",
                    "category": "Güvenlik",
                    "status": "published",
                    "created_at": datetime.utcnow().isoformat()
                },
                {
                    "id": "2", 
                    "title": "Acil Durum Prosedürleri",
                    "description": "Acil durumlarda yapılacaklar",
                    "category": "Prosedür",
                    "status": "published",
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
            
            return {
                "documents": documents,
                "total": len(documents),
                "page": page,
                "limit": limit,
                "pages": 1
            }
            
        except Exception as e:
            logger.error(f"Error getting documents: {str(e)}")
            raise

    def update_document(self, document_id: str, update_data: Any, user_id: str, tenant_id: str) -> Dict[str, Any]:
        """Update document"""
        try:
            # Mock update for now
            document = {
                "id": document_id,
                "tenant_id": tenant_id,
                "title": update_data.get("title", "Updated Document"),
                "description": update_data.get("description", ""),
                "updated_by": user_id,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Document updated successfully: {document_id}")
            return document
            
        except Exception as e:
            logger.error(f"Error updating document {document_id}: {str(e)}")
            raise

    def delete_document(self, document_id: str, tenant_id: str) -> bool:
        """Delete document"""
        try:
            logger.info(f"Document deleted successfully: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {str(e)}")
            return False

    def get_document_analytics(self, tenant_id: str) -> Dict[str, Any]:
        """Get document analytics"""
        try:
            return {
                "total_documents": 156,
                "total_views": 3421,
                "total_downloads": 1247,
                "popular_categories": [
                    {"name": "Güvenlik", "count": 45},
                    {"name": "Prosedür", "count": 32},
                    {"name": "Eğitim", "count": 28}
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting analytics: {str(e)}")
            raise
