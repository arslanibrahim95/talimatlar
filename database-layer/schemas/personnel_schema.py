"""
Personnel Management Schema
Contains all models related to employee management, roles, and organizational structure
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Index, Enum, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()

class EmployeeStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"

class EmploymentType(enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    CONSULTANT = "consultant"

class Personnel(Base):
    """Employee personnel records"""
    __tablename__ = "personnel"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(50), unique=True, nullable=False)  # Company employee ID
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    date_of_birth = Column(Date)
    gender = Column(String(20))
    nationality = Column(String(50))
    marital_status = Column(String(20))
    
    # Contact Information
    personal_email = Column(String(255))
    personal_phone = Column(String(20))
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relationship = Column(String(50))
    address = Column(Text)
    
    # Employment Information
    employment_type = Column(Enum(EmploymentType), default=EmploymentType.FULL_TIME)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    hire_date = Column(Date, nullable=False)
    termination_date = Column(Date)
    department_id = Column(String, ForeignKey('departments.id'))
    position_id = Column(String, ForeignKey('positions.id'))
    manager_id = Column(String, ForeignKey('personnel.id'))
    work_location = Column(String(255))
    work_schedule = Column(JSON, default=dict)  # Work schedule configuration
    
    # Compensation
    salary = Column(Integer)  # Monthly salary in cents
    currency = Column(String(3), default='TRY')
    benefits = Column(JSON, default=list)
    
    # Additional Information
    skills = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="personnel")
    tenant = relationship("Tenant", back_populates="personnel")
    department = relationship("Department", back_populates="personnel")
    position = relationship("Position", back_populates="personnel")
    manager = relationship("Personnel", remote_side=[id])
    subordinates = relationship("Personnel", back_populates="manager")
    training_records = relationship("TrainingRecord", back_populates="personnel", cascade="all, delete-orphan")
    performance_reviews = relationship("PerformanceReview", back_populates="personnel", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="personnel", cascade="all, delete-orphan")

class Department(Base):
    """Organizational departments"""
    __tablename__ = "departments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    tenant_id = Column(String, ForeignKey('tenants.id'), nullable=False)
    parent_department_id = Column(String, ForeignKey('departments.id'))
    manager_id = Column(String, ForeignKey('personnel.id'))
    budget = Column(Integer)  # Department budget in cents
    cost_center = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    parent_department = relationship("Department", remote_side=[id])
    sub_departments = relationship("Department", back_populates="parent_department")
    manager = relationship("Personnel")
    personnel = relationship("Personnel", back_populates="department")
    positions = relationship("Position", back_populates="department", cascade="all, delete-orphan")

class Position(Base):
    """Job positions and roles"""
    __tablename__ = "positions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    department_id = Column(String, ForeignKey('departments.id'), nullable=False)
    level = Column(Integer, default=1)  # Position level in hierarchy
    requirements = Column(JSON, default=dict)  # Job requirements
    responsibilities = Column(JSON, default=list)  # Job responsibilities
    skills_required = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="positions")
    personnel = relationship("Personnel", back_populates="position")

class TrainingRecord(Base):
    """Employee training records"""
    __tablename__ = "training_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    training_id = Column(String, ForeignKey('trainings.id'), nullable=False)
    status = Column(String(50), default='assigned')  # assigned, in_progress, completed, failed
    assigned_date = Column(DateTime, default=datetime.utcnow)
    started_date = Column(DateTime)
    completed_date = Column(DateTime)
    score = Column(Integer)  # Training completion score
    certificate_url = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel = relationship("Personnel", back_populates="training_records")
    training = relationship("Training", back_populates="training_records")

class PerformanceReview(Base):
    """Employee performance reviews"""
    __tablename__ = "performance_reviews"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    reviewer_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    review_period_start = Column(Date, nullable=False)
    review_period_end = Column(Date, nullable=False)
    overall_rating = Column(Integer)  # 1-5 rating
    goals_achieved = Column(JSON, default=list)
    areas_for_improvement = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    development_plan = Column(Text)
    comments = Column(Text)
    status = Column(String(50), default='draft')  # draft, submitted, approved, completed
    submitted_date = Column(DateTime)
    approved_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel = relationship("Personnel", back_populates="performance_reviews", foreign_keys=[personnel_id])
    reviewer = relationship("Personnel", foreign_keys=[reviewer_id])

class LeaveRequest(Base):
    """Employee leave requests"""
    __tablename__ = "leave_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    leave_type = Column(String(50), nullable=False)  # annual, sick, personal, maternity, etc.
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_requested = Column(Integer, nullable=False)
    reason = Column(Text)
    status = Column(String(50), default='pending')  # pending, approved, rejected, cancelled
    approved_by = Column(String, ForeignKey('personnel.id'))
    approved_date = Column(DateTime)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel = relationship("Personnel", back_populates="leave_requests", foreign_keys=[personnel_id])
    approved_by_personnel = relationship("Personnel", foreign_keys=[approved_by])

class Skill(Base):
    """Skills and competencies"""
    __tablename__ = "skills"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    category = Column(String(100))  # Technical, Soft Skills, Safety, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel_skills = relationship("PersonnelSkill", back_populates="skill", cascade="all, delete-orphan")

class PersonnelSkill(Base):
    """Personnel skills and proficiency levels"""
    __tablename__ = "personnel_skills"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    personnel_id = Column(String, ForeignKey('personnel.id'), nullable=False)
    skill_id = Column(String, ForeignKey('skills.id'), nullable=False)
    proficiency_level = Column(Integer, default=1)  # 1-5 proficiency level
    years_experience = Column(Integer, default=0)
    last_used = Column(Date)
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String, ForeignKey('personnel.id'))
    verified_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    personnel = relationship("Personnel")
    skill = relationship("Skill", back_populates="personnel_skills")
    verified_by_personnel = relationship("Personnel", foreign_keys=[verified_by])

# Indexes for performance
Index('idx_personnel_employee_id', Personnel.employee_id)
Index('idx_personnel_user_id', Personnel.user_id)
Index('idx_personnel_tenant_id', Personnel.tenant_id)
Index('idx_personnel_department_id', Personnel.department_id)
Index('idx_personnel_position_id', Personnel.position_id)
Index('idx_personnel_manager_id', Personnel.manager_id)
Index('idx_personnel_status', Personnel.status)
Index('idx_personnel_hire_date', Personnel.hire_date)
Index('idx_departments_tenant_id', Department.tenant_id)
Index('idx_departments_code', Department.code)
Index('idx_departments_parent_department_id', Department.parent_department_id)
Index('idx_departments_manager_id', Department.manager_id)
Index('idx_positions_department_id', Position.department_id)
Index('idx_positions_code', Position.code)
Index('idx_positions_level', Position.level)
Index('idx_training_records_personnel_id', TrainingRecord.personnel_id)
Index('idx_training_records_training_id', TrainingRecord.training_id)
Index('idx_training_records_status', TrainingRecord.status)
Index('idx_performance_reviews_personnel_id', PerformanceReview.personnel_id)
Index('idx_performance_reviews_reviewer_id', PerformanceReview.reviewer_id)
Index('idx_performance_reviews_status', PerformanceReview.status)
Index('idx_leave_requests_personnel_id', LeaveRequest.personnel_id)
Index('idx_leave_requests_status', LeaveRequest.status)
Index('idx_leave_requests_start_date', LeaveRequest.start_date)
Index('idx_leave_requests_end_date', LeaveRequest.end_date)
Index('idx_skills_name', Skill.name)
Index('idx_skills_category', Skill.category)
Index('idx_personnel_skills_personnel_id', PersonnelSkill.personnel_id)
Index('idx_personnel_skills_skill_id', PersonnelSkill.skill_id)
Index('idx_personnel_skills_proficiency_level', PersonnelSkill.proficiency_level)
