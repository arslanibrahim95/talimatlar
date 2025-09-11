from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import uuid
import hashlib
import mimetypes
import os
from pathlib import Path

app = FastAPI(title="Instruction Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Instruction(BaseModel):
    id: str
    title: str
    description: str
    content: str
    category: str
    tags: List[str]
    priority: str
    status: str
    author: str
    approver: Optional[str] = None
    version: int
    createdAt: str
    updatedAt: str
    publishedAt: Optional[str] = None
    attachments: List[str]
    targetAudience: List[str]
    distributionChannels: List[str]
    readCount: int
    lastReadAt: Optional[str] = None

class CompanyInstruction(BaseModel):
    id: str
    companyId: str
    companyName: str
    title: str
    description: str
    content: str
    category: str
    subcategory: Optional[str] = None
    priority: str
    status: str
    author: str
    approver: Optional[str] = None
    version: str
    effectiveDate: str
    reviewDate: str
    tags: List[str]
    targetAudience: List[str]
    departments: List[str]
    attachments: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    createdAt: str
    updatedAt: str
    publishedAt: Optional[str] = None
    readCount: int
    lastReadAt: Optional[str] = None
    mobileOptimized: bool = True
    qrCode: Optional[str] = None

class FileAttachment(BaseModel):
    id: str
    name: str
    type: str
    size: int
    url: str
    thumbnailUrl: Optional[str] = None
    checksum: str

class InstructionMetadata(BaseModel):
    fileType: str
    fileSize: int
    pageCount: Optional[int] = None
    wordCount: Optional[int] = None
    language: str = "tr"
    securityLevel: str = "internal"
    compliance: List[str] = []
    riskLevel: str = "medium"
    keywords: List[str] = []
    extractedText: Optional[str] = None
    summary: Optional[str] = None

class ImportRequest(BaseModel):
    companyId: str
    companyName: str
    companyIndustry: Optional[str] = None
    companySize: Optional[str] = None
    companyLocation: Optional[str] = None
    importType: str = "single"  # single, bulk, template
    files: List[str] = []  # File IDs or URLs
    metadata: Optional[Dict[str, Any]] = None

# In-memory storage
instructions = []
company_instructions = []
instruction_id_counter = 1
company_instruction_id_counter = 1

# File storage
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Supported file types
SUPPORTED_TYPES = {
    'document': ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    'spreadsheet': ['.xlsx', '.xls', '.csv'],
    'presentation': ['.pptx', '.ppt'],
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'video': ['.mp4', '.avi', '.mov', '.wmv'],
    'audio': ['.mp3', '.wav', '.aac'],
    'archive': ['.zip', '.rar', '.7z']
}

# Security keywords for risk assessment
SECURITY_KEYWORDS = {
    'critical': ['yangın', 'patlama', 'elektrik', 'kimyasal', 'gaz', 'basınç', 'yükseklik', 'derinlik', 'makine'],
    'high': ['güvenlik', 'prosedür', 'talimat', 'acil', 'kaza', 'yaralanma', 'koruyucu', 'donanım'],
    'medium': ['eğitim', 'bilgilendirme', 'rehber', 'kontrol', 'denetim', 'bakım'],
    'low': ['genel', 'temel', 'standart', 'politika', 'yönetmelik']
}

# Compliance standards
COMPLIANCE_STANDARDS = ['ISO 45001', 'OHSAS 18001', 'ISO 14001', 'ISO 9001', 'SGK', 'ÇSGB', 'İSG', 'OSHA', 'CE', 'TSE']

# Categories
categories = [
    'genel', 'güvenlik', 'operasyon', 'teknik', 'yönetim', 'acil', 'eğitim', 'prosedür'
]

# Distribution channels
distribution_channels = [
    'email', 'sms', 'push_notification', 'dashboard', 'mobile_app', 'web_portal', 'intranet'
]

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "instruction-service",
        "timestamp": datetime.now().isoformat(),
        "total_instructions": len(instructions)
    }

@app.post("/instructions", status_code=201)
async def create_instruction(instruction_data: dict):
    global instruction_id_counter
    
    new_instruction = Instruction(
        id=f"inst_{instruction_id_counter}",
        title=instruction_data.get("title", ""),
        description=instruction_data.get("description", ""),
        content=instruction_data.get("content", ""),
        category=instruction_data.get("category", "genel"),
        tags=instruction_data.get("tags", []),
        priority=instruction_data.get("priority", "medium"),
        status="draft",
        author=instruction_data.get("author", "system"),
        version=1,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat(),
        attachments=instruction_data.get("attachments", []),
        targetAudience=instruction_data.get("targetAudience", []),
        distributionChannels=instruction_data.get("distributionChannels", ["dashboard"]),
        readCount=0
    )
    
    instructions.append(new_instruction)
    instruction_id_counter += 1
    
    return {"success": True, "data": new_instruction}

@app.get("/instructions")
async def get_instructions(
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    author: Optional[str] = None,
    search: Optional[str] = None
):
    filtered_instructions = instructions.copy()
    
    if category:
        filtered_instructions = [inst for inst in filtered_instructions if inst.category == category]
    
    if status:
        filtered_instructions = [inst for inst in filtered_instructions if inst.status == status]
    
    if priority:
        filtered_instructions = [inst for inst in filtered_instructions if inst.priority == priority]
    
    if author:
        filtered_instructions = [inst for inst in filtered_instructions if inst.author == author]
    
    if search:
        search_lower = search.lower()
        filtered_instructions = [
            inst for inst in filtered_instructions 
            if (search_lower in inst.title.lower() or 
                search_lower in inst.description.lower() or
                search_lower in inst.content.lower() or
                any(search_lower in tag.lower() for tag in inst.tags))
        ]
    
    # Sort by priority and date
    priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    filtered_instructions.sort(
        key=lambda x: (priority_order.get(x.priority, 0), x.createdAt),
        reverse=True
    )
    
    return {
        "success": True,
        "data": filtered_instructions,
        "meta": {
            "total": len(filtered_instructions),
            "categories": categories,
            "distributionChannels": distribution_channels
        }
    }

@app.get("/instructions/{instruction_id}")
async def get_instruction(instruction_id: str):
    instruction = next((inst for inst in instructions if inst.id == instruction_id), None)
    
    if not instruction:
        raise HTTPException(status_code=404, detail="Instruction not found")
    
    # Increment read count
    instruction.readCount += 1
    instruction.lastReadAt = datetime.now().isoformat()
    
    return {"success": True, "data": instruction}

@app.put("/instructions/{instruction_id}")
async def update_instruction(instruction_id: str, instruction_data: dict):
    instruction_index = next((i for i, inst in enumerate(instructions) if inst.id == instruction_id), None)
    
    if instruction_index is None:
        raise HTTPException(status_code=404, detail="Instruction not found")
    
    existing_instruction = instructions[instruction_index]
    
    # Update fields
    for field, value in instruction_data.items():
        if hasattr(existing_instruction, field) and field not in ["id"]:
            setattr(existing_instruction, field, value)
    
    existing_instruction.version += 1
    existing_instruction.updatedAt = datetime.now().isoformat()
    
    return {"success": True, "data": existing_instruction}

@app.post("/instructions/{instruction_id}/approve")
async def approve_instruction(instruction_id: str, approval_data: dict):
    instruction = next((inst for inst in instructions if inst.id == instruction_id), None)
    
    if not instruction:
        raise HTTPException(status_code=404, detail="Instruction not found")
    
    instruction.status = "approved"
    instruction.approver = approval_data.get("approver", "system")
    instruction.updatedAt = datetime.now().isoformat()
    
    return {"success": True, "data": instruction}

@app.post("/instructions/{instruction_id}/publish")
async def publish_instruction(instruction_id: str):
    instruction = next((inst for inst in instructions if inst.id == instruction_id), None)
    
    if not instruction:
        raise HTTPException(status_code=404, detail="Instruction not found")
    
    if instruction.status != "approved":
        raise HTTPException(status_code=400, detail="Only approved instructions can be published")
    
    instruction.status = "published"
    instruction.publishedAt = datetime.now().isoformat()
    instruction.updatedAt = datetime.now().isoformat()
    
    return {"success": True, "data": instruction}

@app.get("/instructions/stats")
async def get_instruction_stats():
    stats = {
        "total": len(instructions),
        "byStatus": {
            "draft": len([inst for inst in instructions if inst.status == "draft"]),
            "pending": len([inst for inst in instructions if inst.status == "pending"]),
            "approved": len([inst for inst in instructions if inst.status == "approved"]),
            "published": len([inst for inst in instructions if inst.status == "published"]),
            "archived": len([inst for inst in instructions if inst.status == "archived"])
        },
        "byPriority": {
            "critical": len([inst for inst in instructions if inst.priority == "critical"]),
            "high": len([inst for inst in instructions if inst.priority == "high"]),
            "medium": len([inst for inst in instructions if inst.priority == "medium"]),
            "low": len([inst for inst in instructions if inst.priority == "low"])
        },
        "byCategory": {category: len([inst for inst in instructions if inst.category == category]) for category in categories},
        "totalReads": sum(inst.readCount for inst in instructions),
        "recentActivity": [
            {
                "id": inst.id,
                "title": inst.title,
                "status": inst.status,
                "updatedAt": inst.updatedAt
            }
            for inst in sorted(instructions, key=lambda x: x.updatedAt, reverse=True)[:10]
        ]
    }
    
    return {"success": True, "data": stats}

# Utility functions
def calculate_file_checksum(file_path: str) -> str:
    """Calculate SHA-256 checksum of a file"""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def get_file_type_category(filename: str) -> str:
    """Determine file type category based on extension"""
    ext = Path(filename).suffix.lower()
    for category, extensions in SUPPORTED_TYPES.items():
        if ext in extensions:
            return category
    return 'unknown'

def assess_risk_level(content: str) -> str:
    """Assess risk level based on content keywords"""
    content_lower = content.lower()
    for level, keywords in SECURITY_KEYWORDS.items():
        if any(keyword in content_lower for keyword in keywords):
            return level
    return 'low'

def extract_compliance_standards(content: str) -> List[str]:
    """Extract compliance standards from content"""
    content_upper = content.upper()
    found_standards = []
    for standard in COMPLIANCE_STANDARDS:
        if standard.upper() in content_upper:
            found_standards.append(standard)
    return found_standards

def generate_qr_code(instruction_id: str) -> str:
    """Generate QR code for instruction"""
    return f"QR_{instruction_id}_{uuid.uuid4().hex[:8]}"

# File upload endpoint
@app.post("/instructions/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a single file for instruction import"""
    try:
        # Validate file type
        file_ext = Path(file.filename).suffix.lower()
        is_supported = any(file_ext in extensions for extensions in SUPPORTED_TYPES.values())
        
        if not is_supported:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        # Validate file size (50MB limit)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
        
        # Save file
        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Calculate checksum
        checksum = calculate_file_checksum(str(file_path))
        
        # Create file attachment record
        attachment = FileAttachment(
            id=file_id,
            name=file.filename,
            type=file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream",
            size=file_size,
            url=f"/uploads/{file_id}_{file.filename}",
            checksum=checksum
        )
        
        return {
            "success": True,
            "data": {
                "fileId": file_id,
                "filename": file.filename,
                "size": file_size,
                "type": attachment.type,
                "checksum": checksum,
                "url": attachment.url
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# Bulk file upload endpoint
@app.post("/instructions/bulk-upload")
async def bulk_upload_files(files: List[UploadFile] = File(...)):
    """Upload multiple files for bulk instruction import"""
    try:
        if len(files) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 files allowed for bulk upload")
        
        uploaded_files = []
        
        for file in files:
            # Validate file type
            file_ext = Path(file.filename).suffix.lower()
            is_supported = any(file_ext in extensions for extensions in SUPPORTED_TYPES.values())
            
            if not is_supported:
                continue  # Skip unsupported files
            
            # Validate file size
            file_size = 0
            content = await file.read()
            file_size = len(content)
            
            if file_size > 50 * 1024 * 1024:  # 50MB
                continue  # Skip oversized files
            
            # Save file
            file_id = str(uuid.uuid4())
            file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Calculate checksum
            checksum = calculate_file_checksum(str(file_path))
            
            uploaded_files.append({
                "fileId": file_id,
                "filename": file.filename,
                "size": file_size,
                "type": file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream",
                "checksum": checksum,
                "url": f"/uploads/{file_id}_{file.filename}"
            })
        
        return {
            "success": True,
            "data": {
                "uploadedFiles": uploaded_files,
                "totalFiles": len(uploaded_files),
                "skippedFiles": len(files) - len(uploaded_files)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk upload failed: {str(e)}")

# Company instruction import endpoint
@app.post("/instructions/company/import")
async def import_company_instructions(import_request: ImportRequest):
    """Import company-specific instructions"""
    global company_instruction_id_counter
    
    try:
        imported_instructions = []
        
        for file_id in import_request.files:
            # Find the uploaded file
            file_path = None
            for file in UPLOAD_DIR.glob(f"{file_id}_*"):
                file_path = file
                break
            
            if not file_path or not file_path.exists():
                continue
            
            # Extract metadata
            filename = file_path.name.split('_', 1)[1] if '_' in file_path.name else file_path.name
            file_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            file_size = file_path.stat().st_size
            checksum = calculate_file_checksum(str(file_path))
            
            # Simulate content extraction (in real implementation, use appropriate libraries)
            extracted_text = f"Extracted content from {filename}"
            summary = f"Summary of {filename}"
            
            # Assess risk level and compliance
            risk_level = assess_risk_level(extracted_text)
            compliance = extract_compliance_standards(extracted_text)
            
            # Generate keywords
            keywords = ['talimat', 'güvenlik', 'prosedür', 'kurallar']
            
            # Create metadata
            metadata = InstructionMetadata(
                fileType=file_type,
                fileSize=file_size,
                language="tr",
                securityLevel="internal",
                compliance=compliance,
                riskLevel=risk_level,
                keywords=keywords,
                extractedText=extracted_text,
                summary=summary
            )
            
            # Create attachment
            attachment = FileAttachment(
                id=str(uuid.uuid4()),
                name=filename,
                type=file_type,
                size=file_size,
                url=f"/uploads/{file_path.name}",
                checksum=checksum
            )
            
            # Create company instruction
            instruction = CompanyInstruction(
                id=f"comp_inst_{company_instruction_id_counter}",
                companyId=import_request.companyId,
                companyName=import_request.companyName,
                title=filename.replace(Path(filename).suffix, ''),
                description=f"Import edilen talimat: {filename}",
                content=extracted_text,
                category="güvenlik",  # Default category
                priority=risk_level,
                status="draft",
                author="Import Sistemi",
                version="1.0",
                effectiveDate=datetime.now().isoformat().split('T')[0],
                reviewDate=(datetime.now().replace(year=datetime.now().year + 1)).isoformat().split('T')[0],
                tags=keywords,
                targetAudience=["Tüm Çalışanlar"],
                departments=["Genel"],
                attachments=[attachment.dict()],
                metadata=metadata.dict(),
                createdAt=datetime.now().isoformat(),
                updatedAt=datetime.now().isoformat(),
                readCount=0,
                mobileOptimized=True,
                qrCode=generate_qr_code(f"comp_inst_{company_instruction_id_counter}")
            )
            
            company_instructions.append(instruction)
            imported_instructions.append(instruction)
            company_instruction_id_counter += 1
        
        return {
            "success": True,
            "data": {
                "importedInstructions": imported_instructions,
                "totalImported": len(imported_instructions),
                "companyId": import_request.companyId,
                "companyName": import_request.companyName
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

# Get company instructions
@app.get("/instructions/company/{company_id}")
async def get_company_instructions(
    company_id: str,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None
):
    """Get instructions for a specific company"""
    filtered_instructions = [
        inst for inst in company_instructions 
        if inst.companyId == company_id
    ]
    
    if category:
        filtered_instructions = [inst for inst in filtered_instructions if inst.category == category]
    
    if status:
        filtered_instructions = [inst for inst in filtered_instructions if inst.status == status]
    
    if priority:
        filtered_instructions = [inst for inst in filtered_instructions if inst.priority == priority]
    
    if search:
        search_lower = search.lower()
        filtered_instructions = [
            inst for inst in filtered_instructions 
            if (search_lower in inst.title.lower() or 
                search_lower in inst.description.lower() or
                search_lower in inst.content.lower() or
                any(search_lower in tag.lower() for tag in inst.tags))
        ]
    
    # Sort by priority and date
    priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    filtered_instructions.sort(
        key=lambda x: (priority_order.get(x.priority, 0), x.createdAt),
        reverse=True
    )
    
    return {
        "success": True,
        "data": filtered_instructions,
        "meta": {
            "total": len(filtered_instructions),
            "companyId": company_id
        }
    }

# Get company instruction by ID
@app.get("/instructions/company/{company_id}/{instruction_id}")
async def get_company_instruction(company_id: str, instruction_id: str):
    """Get a specific company instruction"""
    instruction = next(
        (inst for inst in company_instructions 
         if inst.id == instruction_id and inst.companyId == company_id), 
        None
    )
    
    if not instruction:
        raise HTTPException(status_code=404, detail="Company instruction not found")
    
    # Increment read count
    instruction.readCount += 1
    instruction.lastReadAt = datetime.now().isoformat()
    
    return {"success": True, "data": instruction}

# Update company instruction
@app.put("/instructions/company/{company_id}/{instruction_id}")
async def update_company_instruction(
    company_id: str, 
    instruction_id: str, 
    instruction_data: dict
):
    """Update a company instruction"""
    instruction_index = next(
        (i for i, inst in enumerate(company_instructions) 
         if inst.id == instruction_id and inst.companyId == company_id), 
        None
    )
    
    if instruction_index is None:
        raise HTTPException(status_code=404, detail="Company instruction not found")
    
    existing_instruction = company_instructions[instruction_index]
    
    # Update fields
    for field, value in instruction_data.items():
        if hasattr(existing_instruction, field) and field not in ["id", "companyId"]:
            setattr(existing_instruction, field, value)
    
    existing_instruction.updatedAt = datetime.now().isoformat()
    
    return {"success": True, "data": existing_instruction}

# Get company instruction statistics
@app.get("/instructions/company/{company_id}/stats")
async def get_company_instruction_stats(company_id: str):
    """Get statistics for company instructions"""
    company_insts = [inst for inst in company_instructions if inst.companyId == company_id]
    
    stats = {
        "total": len(company_insts),
        "byStatus": {
            "draft": len([inst for inst in company_insts if inst.status == "draft"]),
            "pending": len([inst for inst in company_insts if inst.status == "pending"]),
            "approved": len([inst for inst in company_insts if inst.status == "approved"]),
            "published": len([inst for inst in company_insts if inst.status == "published"]),
            "archived": len([inst for inst in company_insts if inst.status == "archived"])
        },
        "byPriority": {
            "critical": len([inst for inst in company_insts if inst.priority == "critical"]),
            "high": len([inst for inst in company_insts if inst.priority == "high"]),
            "medium": len([inst for inst in company_insts if inst.priority == "medium"]),
            "low": len([inst for inst in company_insts if inst.priority == "low"])
        },
        "totalReads": sum(inst.readCount for inst in company_insts),
        "mobileOptimized": len([inst for inst in company_insts if inst.mobileOptimized]),
        "recentActivity": [
            {
                "id": inst.id,
                "title": inst.title,
                "status": inst.status,
                "updatedAt": inst.updatedAt
            }
            for inst in sorted(company_insts, key=lambda x: x.updatedAt, reverse=True)[:10]
        ]
    }
    
    return {"success": True, "data": stats}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
