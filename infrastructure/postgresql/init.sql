-- =============================================================================
-- CLAUDE TALİMAT İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - DATABASE INITIALIZATION
-- =============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS notifications;

-- =============================================================================
-- AUTH SCHEMA - Kullanıcı yönetimi ve kimlik doğrulama
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company_id UUID,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS auth.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS auth.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP table
CREATE TABLE IF NOT EXISTS auth.otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'login'
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- DOCUMENTS SCHEMA - Doküman yönetimi
-- =============================================================================

-- Document categories
CREATE TABLE IF NOT EXISTS documents.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES documents.categories(id),
    company_id UUID REFERENCES auth.companies(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES documents.categories(id),
    company_id UUID REFERENCES auth.companies(id),
    uploaded_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'active',
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document versions
CREATE TABLE IF NOT EXISTS documents.document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document access logs
CREATE TABLE IF NOT EXISTS documents.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'edit', 'delete'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ANALYTICS SCHEMA - Veri analizi ve raporlama
-- =============================================================================

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES auth.companies(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity metrics
CREATE TABLE IF NOT EXISTS analytics.user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    login_count INTEGER DEFAULT 0,
    document_views INTEGER DEFAULT 0,
    document_downloads INTEGER DEFAULT 0,
    search_queries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Company metrics
CREATE TABLE IF NOT EXISTS analytics.company_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES auth.companies(id),
    date DATE NOT NULL,
    active_users INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date)
);

-- =============================================================================
-- NOTIFICATIONS SCHEMA - Bildirim sistemi
-- =============================================================================

-- Notification templates
CREATE TABLE IF NOT EXISTS notifications.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push'
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSONB,
    company_id UUID REFERENCES auth.companies(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    template_id UUID REFERENCES notifications.templates(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification delivery logs
CREATE TABLE IF NOT EXISTS notifications.delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications.notifications(id) ON DELETE CASCADE,
    delivery_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'success', 'failed'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Auth indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON auth.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON auth.users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON auth.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON auth.otp_codes(user_id);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents.documents(created_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_events_event_type ON analytics.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_company_id ON analytics.events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics.events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id_date ON analytics.user_activity(user_id, date);
CREATE INDEX IF NOT EXISTS idx_company_metrics_company_id_date ON analytics.company_metrics(company_id, date);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications.notifications(created_at);

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Insert sample company
INSERT INTO auth.companies (id, name, tax_number, address, phone, email, contact_person, subscription_plan)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Örnek Şirket A.Ş.',
    '1234567890',
    'İstanbul, Türkiye',
    '+90 212 123 45 67',
    'info@orneksirket.com',
    'Ahmet Yılmaz',
    'premium'
) ON CONFLICT DO NOTHING;

-- Insert sample user
INSERT INTO auth.users (id, email, username, password_hash, first_name, last_name, phone, company_id, role, is_verified)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@orneksirket.com',
    'admin',
    crypt('admin123', gen_salt('bf')),
    'Admin',
    'User',
    '+90 555 123 45 67',
    '550e8400-e29b-41d4-a716-446655440000',
    'admin',
    true
) ON CONFLICT DO NOTHING;

-- Insert sample document category
INSERT INTO documents.categories (id, name, description, company_id)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'İş Güvenliği Talimatları',
    'Genel iş güvenliği talimatları ve prosedürleri',
    '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON auth.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant permissions to application user
GRANT USAGE ON SCHEMA auth TO safety_admin;
GRANT USAGE ON SCHEMA documents TO safety_admin;
GRANT USAGE ON SCHEMA analytics TO safety_admin;
GRANT USAGE ON SCHEMA notifications TO safety_admin;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA documents TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO safety_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA notifications TO safety_admin;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA documents TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO safety_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA notifications TO safety_admin;

-- =============================================================================
-- END OF INITIALIZATION SCRIPT
-- =============================================================================
