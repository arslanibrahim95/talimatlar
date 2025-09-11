"""
Instruction and Procedure Management Schema
Contains all models related to work instructions, procedures, and standard operating procedures
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class InstructionStatus(enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class InstructionType(enum.Enum):
    SOP = "sop"  # Standard Operating Procedure
    WORK_INSTRUCTION = "work_instruction"
    SAFETY_PROCEDURE = "safety_procedure"
    EMERGENCY_PROCEDURE = "emergency_procedure"
    MAINTENANCE_PROCEDURE = "maintenance_procedure"
    QUALITY_PROCEDURE = "quality_procedure"

class Instruction(Base):
    """Work instructions and procedures"""
    __tablename__ = "instructions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    instruction_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    instruction_type = Column(Enum(InstructionType), nullable=False)
    category = Column(String(100))
    version = Column(String(20), default='1.0')
    status = Column(Enum(InstructionStatus), default=InstructionStatus.DRAFT)
    content = Column(JSON, default=dict)  # Rich content structure
    steps = Column(JSON, default=list)  # Step-by-step instructions
    prerequisites = Column(JSON, default=list)
    required_tools = Column(JSON, default=list)
    required_materials = Column(JSON, default=list)
    safety_requirements = Column(JSON, default=list)
    quality_checkpoints = Column(JSON, default=list)
    estimated_duration = Column(Integer)  # Duration in minutes
    difficulty_level = Column(Integer, default=1)  # 1-5 difficulty scale
    is_mandatory = Column(Boolean, default=False)
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    approved_by = Column(String, ForeignKey('users.id'))
    approved_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    versions = relationship("InstructionVersion", back_populates="instruction", cascade="all, delete-orphan")
    assignments = relationship("InstructionAssignment", back_populates="instruction", cascade="all, delete-orphan")
    completions = relationship("InstructionCompletion", back_populates="instruction", cascade="all, delete-orphan")

class InstructionVersion(Base):
    """Version control for instructions"""
    __tablename__ = "instruction_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    instruction_id = Column(String, ForeignKey('instructions.id'), nullable=False)
    version_number = Column(String(20), nullable=False)
    change_description = Column(Text)
    content = Column(JSON, default=dict)
    created_by = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    instruction = relationship("Instruction", back_populates="versions")
    created_by_user = relationship("User")

class InstructionAssignment(Base):
    """Assignment of instructions to personnel"""
    __tablename__ = "instruction_assignments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    instruction_id = Column(String, ForeignKey('instructions.id'), nullable=False)
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    assigned_by = Column(String, ForeignKey('users.id'), nullable=False)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    status = Column(String(50), default='assigned')  # assigned, in_progress, completed, overdue
    priority = Column(String(20), default='normal')  # low, normal, high, urgent
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    instruction = relationship("Instruction", back_populates="assignments")
    personnel = relationship("Personnel")
    assigned_by_user = relationship("User")

class InstructionCompletion(Base):
    """Instruction completion tracking"""
    __tablename__ = "instruction_completions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    instruction_id = Column(String, ForeignKey('instructions.id'), nullable=False)
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    assignment_id = Column(String, ForeignKey('instruction_assignments.id'))
    started_date = Column(DateTime)
    completed_date = Column(DateTime)
    completion_score = Column(Float)  # 0-100 score
    time_taken = Column(Integer)  # Time taken in minutes
    feedback = Column(Text)
    questions_answered = Column(JSON, default=list)  # Quiz/assessment answers
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String, ForeignKey('users.id'))
    verified_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    instruction = relationship("Instruction", back_populates="completions")
    personnel = relationship("Personnel")
    assignment = relationship("InstructionAssignment")
    verified_by_user = relationship("User")

class InstructionCategory(Base):
    """Instruction categories and classifications"""
    __tablename__ = "instruction_categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    parent_id = Column(String, ForeignKey('instruction_categories.id'))
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    color = Column(String(7))  # Hex color code
    icon = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("InstructionCategory", remote_side=[id])
    children = relationship("InstructionCategory", back_populates="parent")
    tenant = relationship("Tenant")

# Indexes for performance
Index('idx_instructions_tenant_id', Instruction.tenant_id)
Index('idx_instructions_instruction_number', Instruction.instruction_number)
Index('idx_instructions_instruction_type', Instruction.instruction_type)
Index('idx_instructions_category', Instruction.category)
Index('idx_instructions_status', Instruction.status)
Index('idx_instructions_created_by', Instruction.created_by)
Index('idx_instructions_effective_date', Instruction.effective_date)
Index('idx_instruction_versions_instruction_id', InstructionVersion.instruction_id)
Index('idx_instruction_versions_version_number', InstructionVersion.version_number)
Index('idx_instruction_assignments_instruction_id', InstructionAssignment.instruction_id)
Index('idx_instruction_assignments_personnel_id', InstructionAssignment.personnel_id)
Index('idx_instruction_assignments_status', InstructionAssignment.status)
Index('idx_instruction_assignments_due_date', InstructionAssignment.due_date)
Index('idx_instruction_completions_instruction_id', InstructionCompletion.instruction_id)
Index('idx_instruction_completions_personnel_id', InstructionCompletion.personnel_id)
Index('idx_instruction_completions_completed_date', InstructionCompletion.completed_date)
Index('idx_instruction_categories_tenant_id', InstructionCategory.tenant_id)
Index('idx_instruction_categories_parent_id', InstructionCategory.parent_id)
