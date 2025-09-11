-- =============================================================================
-- İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - YENİ SCHEMA'LAR VE TABLOLAR
-- =============================================================================
-- Bu dosya, iş güvenliği yönetim sistemi için gerekli yeni schema'ları ve tabloları içerir
-- Mevcut init.sql dosyasına ek olarak çalıştırılmalıdır

-- =============================================================================
-- YENİ SCHEMA'LAR
-- =============================================================================

-- Talimat yönetimi schema'sı
CREATE SCHEMA IF NOT EXISTS instructions;

-- Personel yönetimi schema'sı
CREATE SCHEMA IF NOT EXISTS personnel;

-- Eğitim yönetimi schema'sı
CREATE SCHEMA IF NOT EXISTS training;

-- Olay/Kaza yönetimi schema'sı
CREATE SCHEMA IF NOT EXISTS incidents;

-- Uyumluluk ve denetim schema'sı
CREATE SCHEMA IF NOT EXISTS compliance;

-- Risk yönetimi schema'sı
CREATE SCHEMA IF NOT EXISTS risk;

-- QR kod yönetimi schema'sı
CREATE SCHEMA IF NOT EXISTS qr;

-- KPI ve metrikler schema'sı
CREATE SCHEMA IF NOT EXISTS kpi;

-- =============================================================================
-- INSTRUCTIONS SCHEMA - Talimat Yönetimi
-- =============================================================================

-- Talimatlar tablosu
CREATE TABLE IF NOT EXISTS instructions.instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES documents.categories(id),
    company_id UUID REFERENCES auth.companies(id),
    created_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    effective_date DATE,
    expiry_date DATE,
    version VARCHAR(20) DEFAULT '1.0',
    tags TEXT[],
    metadata JSONB,
    is_mandatory BOOLEAN DEFAULT false,
    quiz_questions JSONB, -- Quiz soruları
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Talimat atamaları tablosu
CREATE TABLE IF NOT EXISTS instructions.instruction_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instruction_id UUID REFERENCES instructions.instructions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'read', 'completed', 'overdue'
    read_at TIMESTAMP,
    completed_at TIMESTAMP,
    quiz_score INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Talimat şablonları tablosu
CREATE TABLE IF NOT EXISTS instructions.instruction_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_template TEXT NOT NULL,
    category_id UUID REFERENCES documents.categories(id),
    company_id UUID REFERENCES auth.companies(id),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    variables JSONB, -- Template değişkenleri
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Talimat versiyonları tablosu
CREATE TABLE IF NOT EXISTS instructions.instruction_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instruction_id UUID REFERENCES instructions.instructions(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    change_description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERSONNEL SCHEMA - Personel Yönetimi
-- =============================================================================

-- Departmanlar tablosu
CREATE TABLE IF NOT EXISTS personnel.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    manager_id UUID, -- Will reference personnel.employees after it's created
    company_id UUID REFERENCES auth.companies(id),
    parent_department_id UUID REFERENCES personnel.departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personel tablosu
CREATE TABLE IF NOT EXISTS personnel.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_number VARCHAR(50) UNIQUE,
    department_id UUID REFERENCES personnel.departments(id),
    position VARCHAR(100),
    hire_date DATE,
    employment_type VARCHAR(50), -- 'full_time', 'part_time', 'contract'
    work_location VARCHAR(255),
    shift VARCHAR(50), -- 'day', 'night', 'rotating'
    supervisor_id UUID REFERENCES personnel.employees(id),
    skills TEXT[],
    certifications JSONB,
    emergency_contact JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departman yöneticisi referansını güncelle
ALTER TABLE personnel.departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES personnel.employees(id);

-- =============================================================================
-- TRAINING SCHEMA - Eğitim Yönetimi
-- =============================================================================

-- Eğitim programları tablosu
CREATE TABLE IF NOT EXISTS training.training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_hours INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    validity_period_months INTEGER,
    company_id UUID REFERENCES auth.companies(id),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personel eğitimleri tablosu
CREATE TABLE IF NOT EXISTS training.employee_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES personnel.employees(id) ON DELETE CASCADE,
    training_program_id UUID REFERENCES training.training_programs(id) ON DELETE CASCADE,
    assigned_date DATE,
    completed_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'expired'
    score INTEGER,
    certificate_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eğitim oturumları tablosu
CREATE TABLE IF NOT EXISTS training.training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_program_id UUID REFERENCES training.training_programs(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    location VARCHAR(255),
    instructor_id UUID REFERENCES auth.users(id),
    max_participants INTEGER,
    company_id UUID REFERENCES auth.companies(id),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eğitim katılımcıları tablosu
CREATE TABLE IF NOT EXISTS training.session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES training.training_sessions(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES personnel.employees(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'absent'
    attendance_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, employee_id)
);

-- =============================================================================
-- INCIDENTS SCHEMA - Olay/Kaza Yönetimi
-- =============================================================================

-- Olaylar/Kazalar tablosu
CREATE TABLE IF NOT EXISTS incidents.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    incident_type VARCHAR(100), -- 'near_miss', 'injury', 'property_damage', 'environmental'
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'reported', -- 'reported', 'investigating', 'resolved', 'closed'
    reported_by UUID REFERENCES auth.users(id),
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    incident_date TIMESTAMP,
    location VARCHAR(255),
    department_id UUID REFERENCES personnel.departments(id),
    company_id UUID REFERENCES auth.companies(id),
    affected_employees JSONB,
    witnesses JSONB,
    immediate_actions TEXT,
    root_causes TEXT,
    corrective_actions TEXT,
    prevention_measures TEXT,
    investigation_team JSONB,
    documents JSONB, -- Ek dosyalar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Olay takip durumları tablosu
CREATE TABLE IF NOT EXISTS incidents.incident_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents.incidents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COMPLIANCE SCHEMA - Uyumluluk ve Denetim
-- =============================================================================

-- Yönetmelikler tablosu
CREATE TABLE IF NOT EXISTS compliance.regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regulation_code VARCHAR(100) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    regulation_type VARCHAR(100),
    effective_date DATE,
    expiry_date DATE,
    applicable_departments TEXT[],
    requirements TEXT,
    compliance_status VARCHAR(50), -- 'compliant', 'non_compliant', 'under_review'
    responsible_person UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES auth.companies(id),
    last_review_date DATE,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Denetimler tablosu
CREATE TABLE IF NOT EXISTS compliance.audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_number VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    audit_type VARCHAR(100), -- 'internal', 'external', 'regulatory'
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
    planned_date DATE,
    actual_date DATE,
    auditor_id UUID REFERENCES auth.users(id),
    auditee_department_id UUID REFERENCES personnel.departments(id),
    company_id UUID REFERENCES auth.companies(id),
    scope TEXT,
    findings JSONB,
    recommendations TEXT,
    corrective_actions TEXT,
    follow_up_date DATE,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uyumluluk kontrolleri tablosu
CREATE TABLE IF NOT EXISTS compliance.compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regulation_id UUID REFERENCES compliance.regulations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES personnel.departments(id),
    check_date DATE,
    checked_by UUID REFERENCES auth.users(id),
    compliance_status VARCHAR(50), -- 'compliant', 'non_compliant', 'partial'
    findings TEXT,
    corrective_actions TEXT,
    next_check_date DATE,
    company_id UUID REFERENCES auth.companies(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RISK SCHEMA - Risk Yönetimi
-- =============================================================================

-- Risk değerlendirmeleri tablosu
CREATE TABLE IF NOT EXISTS risk.risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_number VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    department_id UUID REFERENCES personnel.departments(id),
    location VARCHAR(255),
    assessed_by UUID REFERENCES auth.users(id),
    assessment_date DATE,
    review_date DATE,
    risk_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    hazards JSONB,
    control_measures TEXT,
    residual_risk VARCHAR(50),
    responsible_person UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES auth.companies(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk kontrol önlemleri tablosu
CREATE TABLE IF NOT EXISTS risk.control_measures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_assessment_id UUID REFERENCES risk.risk_assessments(id) ON DELETE CASCADE,
    measure_type VARCHAR(100), -- 'elimination', 'substitution', 'engineering', 'administrative', 'ppe'
    description TEXT NOT NULL,
    implementation_date DATE,
    responsible_person UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'implemented', 'verified'
    effectiveness_rating INTEGER, -- 1-5 scale
    review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- QR SCHEMA - QR Kod Yönetimi
-- =============================================================================

-- QR kodlar tablosu
CREATE TABLE IF NOT EXISTS qr.qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50), -- 'instruction', 'equipment', 'location', 'emergency'
    related_id UUID, -- İlgili kaydın ID'si
    related_type VARCHAR(50), -- İlgili tablo adı
    location VARCHAR(255),
    company_id UUID REFERENCES auth.companies(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR kod kullanım logları tablosu
CREATE TABLE IF NOT EXISTS qr.qr_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID REFERENCES qr.qr_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- KPI SCHEMA - KPI ve Metrikler
-- =============================================================================

-- Güvenlik metrikleri tablosu
CREATE TABLE IF NOT EXISTS kpi.safety_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(100), -- 'lagging', 'leading'
    value DECIMAL(10,2),
    unit VARCHAR(50),
    period_start DATE,
    period_end DATE,
    department_id UUID REFERENCES personnel.departments(id),
    company_id UUID REFERENCES auth.companies(id),
    target_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    status VARCHAR(50), -- 'on_target', 'below_target', 'above_target'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI hedefleri tablosu
CREATE TABLE IF NOT EXISTS kpi.kpi_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    period_start DATE,
    period_end DATE,
    department_id UUID REFERENCES personnel.departments(id),
    company_id UUID REFERENCES auth.companies(id),
    responsible_person UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Instructions indexes
CREATE INDEX IF NOT EXISTS idx_instructions_company_id ON instructions.instructions(company_id);
CREATE INDEX IF NOT EXISTS idx_instructions_status ON instructions.instructions(status);
CREATE INDEX IF NOT EXISTS idx_instructions_priority ON instructions.instructions(priority);
CREATE INDEX IF NOT EXISTS idx_instructions_effective_date ON instructions.instructions(effective_date);
CREATE INDEX IF NOT EXISTS idx_instruction_assignments_user_id ON instructions.instruction_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_instruction_assignments_status ON instructions.instruction_assignments(status);
CREATE INDEX IF NOT EXISTS idx_instruction_assignments_due_date ON instructions.instruction_assignments(due_date);

-- Personnel indexes
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON personnel.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON personnel.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON personnel.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON personnel.employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON personnel.departments(company_id);

-- Training indexes
CREATE INDEX IF NOT EXISTS idx_training_programs_company_id ON training.training_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_employee_id ON training.employee_training(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_status ON training.employee_training(status);
CREATE INDEX IF NOT EXISTS idx_employee_training_expiry_date ON training.employee_training(expiry_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_company_id ON training.training_sessions(company_id);

-- Incidents indexes
CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON incidents.incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_date ON incidents.incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_incidents_department_id ON incidents.incidents(department_id);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_regulations_company_id ON compliance.regulations(company_id);
CREATE INDEX IF NOT EXISTS idx_regulations_compliance_status ON compliance.regulations(compliance_status);
CREATE INDEX IF NOT EXISTS idx_audits_company_id ON compliance.audits(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON compliance.audits(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_company_id ON compliance.compliance_checks(company_id);

-- Risk indexes
CREATE INDEX IF NOT EXISTS idx_risk_assessments_company_id ON risk.risk_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk.risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_department_id ON risk.risk_assessments(department_id);
CREATE INDEX IF NOT EXISTS idx_control_measures_risk_assessment_id ON risk.control_measures(risk_assessment_id);

-- QR indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_company_id ON qr.qr_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr.qr_codes(type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_related_type ON qr.qr_codes(related_type);
CREATE INDEX IF NOT EXISTS idx_qr_usage_logs_qr_code_id ON qr.qr_usage_logs(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_logs_user_id ON qr.qr_usage_logs(user_id);

-- KPI indexes
CREATE INDEX IF NOT EXISTS idx_safety_metrics_company_id ON kpi.safety_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_safety_metrics_department_id ON kpi.safety_metrics(department_id);
CREATE INDEX IF NOT EXISTS idx_safety_metrics_period_start ON kpi.safety_metrics(period_start);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_company_id ON kpi.kpi_targets(company_id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Instructions triggers
CREATE TRIGGER update_instructions_updated_at BEFORE UPDATE ON instructions.instructions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Personnel triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON personnel.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Incidents triggers
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents.incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant permissions to application user for new schemas
GRANT USAGE ON SCHEMA instructions TO safety_admin;
GRANT USAGE ON SCHEMA personnel TO safety_admin;
GRANT USAGE ON SCHEMA training TO safety_admin;
GRANT USAGE ON SCHEMA incidents TO safety_admin;
GRANT USAGE ON SCHEMA compliance TO safety_admin;
GRANT USAGE ON SCHEMA risk TO safety_admin;
GRANT USAGE ON SCHEMA qr TO safety_admin;
GRANT USAGE ON SCHEMA kpi TO safety_admin;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA instructions TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA personnel TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA training TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA incidents TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA risk TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA qr TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kpi TO safety_admin;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA instructions TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA personnel TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA training TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA incidents TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA compliance TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA risk TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA qr TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA kpi TO safety_admin;

-- =============================================================================
-- END OF SAFETY SCHEMAS SCRIPT
-- =============================================================================
