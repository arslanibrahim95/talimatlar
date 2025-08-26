import { Pool } from 'postgres';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';

export class Database {
  private pool: Pool | null = null;

  async initialize(): Promise<void> {
    if (!config.databaseUrl) {
      logger.warn('Database URL not configured, using in-memory storage');
      return;
    }

    try {
      this.pool = new Pool(config.databaseUrl, 10, true);
      
      // Test connection
      const client = await this.pool.connect();
      await client.queryObject('SELECT 1');
      client.release();
      
      logger.info('Database connection established');
      
      // Initialize tables
      await this.createTables();
      
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.pool) return;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'employee',
        tenant_id UUID,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const createUserSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        refresh_token_hash VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const createOtpCodesTable = `
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const createTenantsTable = `
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const createAuditLogsTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        tenant_id UUID REFERENCES tenants(id),
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    try {
      await this.pool.queryObject(createTenantsTable);
      await this.pool.queryObject(createUsersTable);
      await this.pool.queryObject(createUserSessionsTable);
      await this.pool.queryObject(createOtpCodesTable);
      await this.pool.queryObject(createAuditLogsTable);

      // Create indexes
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);');
      await this.pool.queryObject('CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);');

      logger.info('Database tables created successfully');
    } catch (error) {
      logger.error('Failed to create database tables', error);
      throw error;
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection closed');
    }
  }
}
