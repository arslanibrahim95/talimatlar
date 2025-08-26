from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DocumentCategory(str, Enum):
    SAFETY = "safety"
    PROCEDURE = "procedure"
    POLICY = "policy"
    TRAINING = "training"
    INCIDENT = "incident"
    COMPLIANCE = "compliance"
    GENERAL = "general"

class DocumentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    EXPIRED = "expired"

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Document title")
    description: Optional[str] = Field(None, max_length=1000, description="Document description")
    category: DocumentCategory = Field(..., description="Document category")
    tags: List[str] = Field(default_factory=list, max_items=10, description="Document tags")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    uploaded_by: str = Field(..., description="User ID who uploaded the document")
    tenant_id: Optional[str] = Field(None, description="Tenant ID")
    is_public: bool = Field(False, description="Whether document is public")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('tags')
    def validate_tags(cls, v):
        for tag in v:
            if not tag.strip():
                raise ValueError("Tags cannot be empty")
            if len(tag) > 50:
                raise ValueError("Tag length cannot exceed 50 characters")
        return [tag.strip().lower() for tag in v if tag.strip()]

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[DocumentCategory] = None
    tags: Optional[List[str]] = Field(None, max_items=10)
    is_public: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is None:
            return v
        for tag in v:
            if not tag.strip():
                raise ValueError("Tags cannot be empty")
            if len(tag) > 50:
                raise ValueError("Tag length cannot exceed 50 characters")
        return [tag.strip().lower() for tag in v if tag.strip()]

class DocumentResponse(BaseModel):
    id: str = Field(..., description="Document ID")
    title: str = Field(..., description="Document title")
    description: Optional[str] = Field(None, description="Document description")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type")
    category: DocumentCategory = Field(..., description="Document category")
    tags: List[str] = Field(default_factory=list, description="Document tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    # User and tenant info
    uploaded_by: str = Field(..., description="User ID who uploaded the document")
    tenant_id: Optional[str] = Field(None, description="Tenant ID")
    
    # Status and timestamps
    is_active: bool = Field(..., description="Whether document is active")
    is_public: bool = Field(..., description="Whether document is public")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Analytics
    view_count: int = Field(0, description="Number of views")
    download_count: int = Field(0, description="Number of downloads")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DocumentVersionResponse(BaseModel):
    id: str = Field(..., description="Version ID")
    document_id: str = Field(..., description="Document ID")
    version_number: int = Field(..., description="Version number")
    filename: str = Field(..., description="Filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type")
    change_description: Optional[str] = Field(None, description="Change description")
    created_by: str = Field(..., description="User ID who created the version")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DocumentAccessResponse(BaseModel):
    id: str = Field(..., description="Access ID")
    document_id: str = Field(..., description="Document ID")
    user_id: str = Field(..., description="User ID")
    access_type: str = Field(..., description="Access type")
    granted_at: datetime = Field(..., description="Grant timestamp")
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp")
    granted_by: Optional[str] = Field(None, description="User ID who granted access")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DocumentAnalyticsResponse(BaseModel):
    id: str = Field(..., description="Analytics ID")
    document_id: str = Field(..., description="Document ID")
    user_id: str = Field(..., description="User ID")
    action: str = Field(..., description="Action performed")
    timestamp: datetime = Field(..., description="Action timestamp")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    session_id: Optional[str] = Field(None, description="Session ID")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DocumentSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    category: Optional[DocumentCategory] = Field(None, description="Filter by category")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(20, ge=1, le=100, description="Number of records to return")

class DocumentSearchResponse(BaseModel):
    documents: List[DocumentResponse] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Number of records returned")
    query: str = Field(..., description="Search query used")

class DocumentUploadResponse(BaseModel):
    document: DocumentResponse = Field(..., description="Created document")
    message: str = Field(..., description="Success message")
    file_url: Optional[str] = Field(None, description="File download URL")

class DocumentDownloadResponse(BaseModel):
    filename: str = Field(..., description="Filename")
    content_type: str = Field(..., description="Content type")
    file_size: int = Field(..., description="File size")
    download_url: str = Field(..., description="Download URL")
    expires_at: Optional[datetime] = Field(None, description="URL expiration time")

class CategoryResponse(BaseModel):
    name: str = Field(..., description="Category name")
    display_name: str = Field(..., description="Category display name")
    description: Optional[str] = Field(None, description="Category description")
    document_count: int = Field(0, description="Number of documents in category")
    
    class Config:
        from_attributes = True

class DocumentStatsResponse(BaseModel):
    total_documents: int = Field(..., description="Total number of documents")
    total_size: int = Field(..., description="Total size in bytes")
    categories: Dict[str, int] = Field(..., description="Documents per category")
    recent_uploads: int = Field(..., description="Documents uploaded in last 30 days")
    popular_tags: List[Dict[str, Any]] = Field(..., description="Most used tags")
    
    class Config:
        from_attributes = True
