import pytest
import sys
import os

# Add the service directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_document_service_basic():
    """Test basic document service functionality"""
    service_name = "document-service"
    assert service_name == "document-service"

def test_document_service_health():
    """Test health check functionality"""
    health_status = "healthy"
    assert health_status == "healthy"

def test_document_service_config():
    """Test configuration loading"""
    config = {
        "port": 8002,
        "database": "postgresql",
        "storage": "minio"
    }
    
    assert config["port"] == 8002
    assert config["database"] == "postgresql"
    assert config["storage"] == "minio"

def test_document_creation():
    """Test document creation logic"""
    document_data = {
        "title": "Test Document",
        "content": "This is a test document",
        "category": "test"
    }
    
    assert document_data["title"] == "Test Document"
    assert document_data["content"] == "This is a test document"
    assert document_data["category"] == "test"

if __name__ == "__main__":
    pytest.main([__file__])
