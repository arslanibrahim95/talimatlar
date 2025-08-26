import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import tempfile
import os

from main import app

client = TestClient(app)

class TestDocumentService:
    """Document Service test cases"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "document-service"
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Claude Document Service"
        assert data["version"] == "1.0.0"
    
    @patch('app.services.document_service.DocumentService')
    def test_get_documents_unauthorized(self, mock_service):
        """Test getting documents without authentication"""
        response = client.get("/documents")
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_get_documents_authorized(self, mock_service):
        """Test getting documents with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_service_instance.get_documents.return_value = []
            mock_service.return_value = mock_service_instance
            
            response = client.get("/documents")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
    
    @patch('app.services.document_service.DocumentService')
    def test_create_document_unauthorized(self, mock_service):
        """Test creating document without authentication"""
        document_data = {
            "title": "Test Document",
            "description": "Test description",
            "category": "safety",
            "tags": ["test", "document"]
        }
        
        response = client.post("/documents", json=document_data)
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_create_document_authorized(self, mock_service):
        """Test creating document with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_document = Mock()
            mock_document.id = "test-doc-id"
            mock_document.title = "Test Document"
            mock_service_instance.create_document.return_value = mock_document
            mock_service.return_value = mock_service_instance
            
            document_data = {
                "title": "Test Document",
                "description": "Test description",
                "category": "safety",
                "tags": ["test", "document"]
            }
            
            response = client.post("/documents", json=document_data)
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Test Document"
    
    @patch('app.services.document_service.DocumentService')
    def test_get_document_by_id_unauthorized(self, mock_service):
        """Test getting document by ID without authentication"""
        response = client.get("/documents/test-doc-id")
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_get_document_by_id_authorized(self, mock_service):
        """Test getting document by ID with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_document = Mock()
            mock_document.id = "test-doc-id"
            mock_document.title = "Test Document"
            mock_service_instance.get_document_by_id.return_value = mock_document
            mock_service.return_value = mock_service_instance
            
            response = client.get("/documents/test-doc-id")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "test-doc-id"
            assert data["title"] == "Test Document"
    
    @patch('app.services.document_service.DocumentService')
    def test_update_document_unauthorized(self, mock_service):
        """Test updating document without authentication"""
        update_data = {
            "title": "Updated Document",
            "description": "Updated description"
        }
        
        response = client.put("/documents/test-doc-id", json=update_data)
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_update_document_authorized(self, mock_service):
        """Test updating document with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_document = Mock()
            mock_document.id = "test-doc-id"
            mock_document.title = "Updated Document"
            mock_service_instance.update_document.return_value = mock_document
            mock_service.return_value = mock_service_instance
            
            update_data = {
                "title": "Updated Document",
                "description": "Updated description"
            }
            
            response = client.put("/documents/test-doc-id", json=update_data)
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Updated Document"
    
    @patch('app.services.document_service.DocumentService')
    def test_delete_document_unauthorized(self, mock_service):
        """Test deleting document without authentication"""
        response = client.delete("/documents/test-doc-id")
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_delete_document_authorized(self, mock_service):
        """Test deleting document with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_service_instance.delete_document.return_value = True
            mock_service.return_value = mock_service_instance
            
            response = client.delete("/documents/test-doc-id")
            assert response.status_code == 204
    
    @patch('app.services.document_service.DocumentService')
    def test_search_documents_unauthorized(self, mock_service):
        """Test searching documents without authentication"""
        search_data = {
            "query": "test",
            "category": "safety"
        }
        
        response = client.post("/search", json=search_data)
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_search_documents_authorized(self, mock_service):
        """Test searching documents with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_service_instance.search_documents.return_value = {
                "documents": [],
                "total": 0,
                "query": "test"
            }
            mock_service.return_value = mock_service_instance
            
            search_data = {
                "query": "test",
                "category": "safety"
            }
            
            response = client.post("/search", json=search_data)
            assert response.status_code == 200
            data = response.json()
            assert "documents" in data
            assert "total" in data
            assert data["query"] == "test"
    
    @patch('app.services.document_service.DocumentService')
    def test_get_categories_unauthorized(self, mock_service):
        """Test getting categories without authentication"""
        response = client.get("/categories")
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_get_categories_authorized(self, mock_service):
        """Test getting categories with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_service_instance.get_categories.return_value = [
                {"name": "safety", "display_name": "Safety", "count": 5},
                {"name": "procedure", "display_name": "Procedure", "count": 3}
            ]
            mock_service.return_value = mock_service_instance
            
            response = client.get("/categories")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert data[0]["name"] == "safety"

class TestFileUpload:
    """File upload test cases"""
    
    def test_upload_file_unauthorized(self):
        """Test uploading file without authentication"""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as tmp_file:
            tmp_file.write(b"Test file content")
            tmp_file.flush()
            
            with open(tmp_file.name, "rb") as f:
                response = client.post(
                    "/documents/upload",
                    files={"file": ("test.txt", f, "text/plain")},
                    data={"title": "Test File", "category": "safety"}
                )
            
            os.unlink(tmp_file.name)
        
        assert response.status_code == 401
    
    @patch('app.services.document_service.DocumentService')
    def test_upload_file_authorized(self, mock_service):
        """Test uploading file with authentication"""
        # Mock authentication
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.tenant_id = "test-tenant-id"
        
        with patch('app.middleware.auth.get_current_user', return_value=mock_user):
            mock_service_instance = Mock()
            mock_document = Mock()
            mock_document.id = "test-doc-id"
            mock_document.title = "Test File"
            mock_service_instance.upload_file.return_value = mock_document
            mock_service.return_value = mock_service_instance
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as tmp_file:
                tmp_file.write(b"Test file content")
                tmp_file.flush()
                
                with open(tmp_file.name, "rb") as f:
                    response = client.post(
                        "/documents/upload",
                        files={"file": ("test.txt", f, "text/plain")},
                        data={"title": "Test File", "category": "safety"}
                    )
                
                os.unlink(tmp_file.name)
            
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Test File"

if __name__ == "__main__":
    pytest.main([__file__])
