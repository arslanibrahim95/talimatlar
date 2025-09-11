import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5433,
  database: 'safety_production',
  user: 'safety_admin',
  password: process.env.POSTGRES_PASSWORD || 'test_password'
};

describe('Database Integration Tests', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool(DB_CONFIG);
    
    // Test database connection
    const client = await pool.connect();
    await client.release();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Database Connection', () => {
    it('should connect to PostgreSQL database', async () => {
      const client = await pool.connect();
      expect(client).toBeDefined();
      await client.release();
    });

    it('should execute basic query', async () => {
      const result = await pool.query('SELECT NOW() as current_time');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].current_time).toBeDefined();
    });
  });

  describe('User Table Operations', () => {
    beforeEach(async () => {
      // Clean up test data
      await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%']);
    });

    it('should create user record', async () => {
      const userData = {
        email: 'test_user@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [userData.email, userData.password_hash, userData.first_name, 
         userData.last_name, userData.role, userData.created_at, userData.updated_at]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
    });

    it('should retrieve user by email', async () => {
      // First create a user
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['test_retrieve@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
      );

      const result = await pool.query('SELECT * FROM users WHERE email = $1', ['test_retrieve@example.com']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe('test_retrieve@example.com');
    });

    it('should update user record', async () => {
      // Create user
      const createResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ['test_update@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
      );

      const userId = createResult.rows[0].id;

      // Update user
      const updateResult = await pool.query(
        'UPDATE users SET first_name = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        ['Updated Name', new Date(), userId]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].first_name).toBe('Updated Name');
    });

    it('should delete user record', async () => {
      // Create user
      const createResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ['test_delete@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
      );

      const userId = createResult.rows[0].id;

      // Delete user
      const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
      expect(deleteResult.rows).toHaveLength(1);

      // Verify deletion
      const verifyResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(verifyResult.rows).toHaveLength(0);
    });
  });

  describe('Instructions Table Operations', () => {
    let userId: string;

    beforeEach(async () => {
      // Clean up test data
      await pool.query('DELETE FROM instructions WHERE title LIKE $1', ['Test%']);
      await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%']);

      // Create test user
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ['test_instruction_user@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
      );
      userId = userResult.rows[0].id;
    });

    it('should create instruction record', async () => {
      const instructionData = {
        title: 'Test Safety Instruction',
        content: 'This is a test safety instruction',
        category: 'safety',
        priority: 'high',
        author_id: userId,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await pool.query(
        `INSERT INTO instructions (title, content, category, priority, author_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [instructionData.title, instructionData.content, instructionData.category,
         instructionData.priority, instructionData.author_id, instructionData.status,
         instructionData.created_at, instructionData.updated_at]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
    });

    it('should retrieve instructions with author information', async () => {
      // Create instruction
      await pool.query(
        `INSERT INTO instructions (title, content, category, priority, author_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['Test Instruction', 'Content', 'safety', 'high', userId, 'draft', new Date(), new Date()]
      );

      const result = await pool.query(
        `SELECT i.*, u.first_name, u.last_name, u.email
         FROM instructions i
         JOIN users u ON i.author_id = u.id
         WHERE i.title = $1`,
        ['Test Instruction']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].title).toBe('Test Instruction');
      expect(result.rows[0].first_name).toBe('Test');
    });

    it('should search instructions by content', async () => {
      // Create instruction
      await pool.query(
        `INSERT INTO instructions (title, content, category, priority, author_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['Test Search', 'This instruction contains safety keywords', 'safety', 'high', userId, 'draft', new Date(), new Date()]
      );

      const result = await pool.query(
        `SELECT * FROM instructions WHERE content ILIKE $1`,
        ['%safety%']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].content).toContain('safety');
    });
  });

  describe('Analytics Table Operations', () => {
    let userId: string;

    beforeEach(async () => {
      // Clean up test data
      await pool.query('DELETE FROM analytics_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test_%']);
      await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%']);

      // Create test user
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ['test_analytics_user@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
      );
      userId = userResult.rows[0].id;
    });

    it('should track user activity', async () => {
      const eventData = {
        user_id: userId,
        event_type: 'page_view',
        page: '/dashboard',
        metadata: { user_agent: 'test-agent' },
        timestamp: new Date()
      };

      const result = await pool.query(
        `INSERT INTO analytics_events (user_id, event_type, page, metadata, timestamp)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [eventData.user_id, eventData.event_type, eventData.page, 
         JSON.stringify(eventData.metadata), eventData.timestamp]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
    });

    it('should aggregate analytics data', async () => {
      // Create multiple events
      const events = [
        { user_id: userId, event_type: 'page_view', page: '/dashboard', timestamp: new Date() },
        { user_id: userId, event_type: 'page_view', page: '/instructions', timestamp: new Date() },
        { user_id: userId, event_type: 'click', page: '/dashboard', timestamp: new Date() }
      ];

      for (const event of events) {
        await pool.query(
          `INSERT INTO analytics_events (user_id, event_type, page, timestamp)
           VALUES ($1, $2, $3, $4)`,
          [event.user_id, event.event_type, event.page, event.timestamp]
        );
      }

      const result = await pool.query(
        `SELECT event_type, COUNT(*) as count
         FROM analytics_events
         WHERE user_id = $1
         GROUP BY event_type`,
        [userId]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows.find(r => r.event_type === 'page_view').count).toBe('2');
      expect(result.rows.find(r => r.event_type === 'click').count).toBe('1');
    });
  });

  describe('Database Transactions', () => {
    it('should handle successful transaction', async () => {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create user
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          ['test_transaction@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
        );
        
        const userId = userResult.rows[0].id;
        
        // Create instruction
        await client.query(
          `INSERT INTO instructions (title, content, category, priority, author_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          ['Transaction Test', 'Content', 'safety', 'high', userId, 'draft', new Date(), new Date()]
        );
        
        await client.query('COMMIT');
        
        // Verify both records exist
        const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const instructionCheck = await pool.query('SELECT * FROM instructions WHERE author_id = $1', [userId]);
        
        expect(userCheck.rows).toHaveLength(1);
        expect(instructionCheck.rows).toHaveLength(1);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    it('should handle failed transaction with rollback', async () => {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create user
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          ['test_rollback@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
        );
        
        const userId = userResult.rows[0].id;
        
        // Try to create instruction with invalid data (should fail)
        await client.query(
          `INSERT INTO instructions (title, content, category, priority, author_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [null, 'Content', 'safety', 'high', userId, 'draft', new Date(), new Date()] // null title should fail
        );
        
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        
        // Verify user was not created due to rollback
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['test_rollback@example.com']);
        expect(userCheck.rows).toHaveLength(0);
        
      } finally {
        client.release();
      }
    });
  });

  describe('Database Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      const result = await pool.query(
        `SELECT u.*, COUNT(i.id) as instruction_count
         FROM users u
         LEFT JOIN instructions i ON u.id = i.author_id
         GROUP BY u.id
         LIMIT 1000`
      );
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(queryTime).toBeLessThan(5000); // 5 seconds max
      expect(result.rows.length).toBeLessThanOrEqual(1000);
    });

    it('should use indexes efficiently', async () => {
      const result = await pool.query(
        'EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      
      expect(result.rows).toHaveLength(1);
      const plan = result.rows[0]['QUERY PLAN'];
      expect(plan).toContain('Index Scan'); // Should use index
    });
  });

  describe('Database Constraints', () => {
    it('should enforce unique email constraint', async () => {
      // Create first user
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['unique_test@example.com', 'hash', 'Test', 'User', 'user', new Date(), new Date()]
      );

      // Try to create second user with same email
      try {
        await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          ['unique_test@example.com', 'hash2', 'Test2', 'User2', 'user', new Date(), new Date()]
        );
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error.message).toContain('unique');
      }
    });

    it('should enforce foreign key constraints', async () => {
      try {
        await pool.query(
          `INSERT INTO instructions (title, content, category, priority, author_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          ['Test', 'Content', 'safety', 'high', 'non-existent-id', 'draft', new Date(), new Date()]
        );
        expect.fail('Should have thrown foreign key constraint error');
      } catch (error) {
        expect(error.message).toContain('foreign key');
      }
    });
  });

  describe('Database Cleanup', () => {
    it('should clean up test data', async () => {
      // Clean up all test data
      await pool.query('DELETE FROM instructions WHERE title LIKE $1', ['Test%']);
      await pool.query('DELETE FROM analytics_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test_%']);
      await pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%']);

      // Verify cleanup
      const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE email LIKE $1', ['test_%']);
      const instructionCount = await pool.query('SELECT COUNT(*) FROM instructions WHERE title LIKE $1', ['Test%']);

      expect(parseInt(userCount.rows[0].count)).toBe(0);
      expect(parseInt(instructionCount.rows[0].count)).toBe(0);
    });
  });
});
