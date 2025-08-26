import { Router } from 'oak';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { logger } from '../utils/logger.ts';
import { Database } from '../database/database.ts';
import { ValidationError, AuthenticationError, AuthorizationError, NotFoundError } from '../middleware/error.ts';
import { authenticate, requireRole, AuthenticatedContext } from '../middleware/auth.ts';

const router = new Router();

// Validation schemas
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  isActive: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Get all users (admin only)
router.get('/users', authenticate, requireRole(['admin']), async (ctx: AuthenticatedContext) => {
  try {
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.queryObject(
        `SELECT id, phone, email, role, tenant_id, is_active, created_at, updated_at
         FROM users
         ORDER BY created_at DESC`
      );
      
      ctx.response.body = {
        users: result.rows,
        total: result.rows.length,
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    logger.error('Get users error', error);
    throw new Error('Failed to get users');
  }
});

// Get user by ID
router.get('/users/:id', authenticate, requireRole(['admin', 'manager']), async (ctx: AuthenticatedContext) => {
  try {
    const userId = ctx.params?.id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.queryObject(
        `SELECT id, phone, email, role, tenant_id, is_active, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      ctx.response.body = {
        user: result.rows[0],
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error('Get user error', error);
    throw new Error('Failed to get user');
  }
});

// Update user
router.put('/users/:id', authenticate, requireRole(['admin']), async (ctx: AuthenticatedContext) => {
  try {
    const userId = ctx.params?.id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const body = await ctx.request.body().value;
    const validatedData = updateUserSchema.parse(body);
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      // Check if user exists
      const existingUser = await client.queryObject(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );
      
      if (existingUser.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      // Build update query
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;
      
      if (validatedData.email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(validatedData.email);
      }
      
      if (validatedData.role !== undefined) {
        updates.push(`role = $${paramCount++}`);
        values.push(validatedData.role);
      }
      
      if (validatedData.isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(validatedData.isActive);
      }
      
      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(userId);
      
      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, phone, email, role, tenant_id, is_active, created_at, updated_at
      `;
      
      const result = await client.queryObject(updateQuery, values);
      
      logger.auth('user_updated', userId, true);
      
      ctx.response.body = {
        message: 'User updated successfully',
        user: result.rows[0],
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error('Update user error', error);
    throw new Error('Failed to update user');
  }
});

// Change password
router.post('/users/:id/change-password', authenticate, async (ctx: AuthenticatedContext) => {
  try {
    const userId = ctx.params?.id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    // Check if user is changing their own password or is admin
    if (ctx.user?.id !== userId && ctx.user?.role !== 'admin') {
      throw new AuthorizationError('Can only change your own password');
    }
    
    const body = await ctx.request.body().value;
    const validatedData = changePasswordSchema.parse(body);
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      // Get current user
      const userResult = await client.queryObject(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      // Hash new password
      const newPasswordHash = await hash(validatedData.newPassword, 12);
      
      // Update password
      await client.queryObject(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );
      
      logger.auth('password_changed', userId, true);
      
      ctx.response.body = {
        message: 'Password changed successfully',
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || 
        error instanceof NotFoundError || 
        error instanceof AuthorizationError) {
      throw error;
    }
    
    logger.error('Change password error', error);
    throw new Error('Failed to change password');
  }
});

// Deactivate user
router.post('/users/:id/deactivate', authenticate, requireRole(['admin']), async (ctx: AuthenticatedContext) => {
  try {
    const userId = ctx.params?.id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      // Check if user exists
      const existingUser = await client.queryObject(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );
      
      if (existingUser.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      // Deactivate user
      await client.queryObject(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      
      // Invalidate all sessions
      await client.queryObject(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );
      
      logger.auth('user_deactivated', userId, true);
      
      ctx.response.body = {
        message: 'User deactivated successfully',
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    logger.error('Deactivate user error', error);
    throw new Error('Failed to deactivate user');
  }
});

// Get user sessions
router.get('/users/:id/sessions', authenticate, requireRole(['admin']), async (ctx: AuthenticatedContext) => {
  try {
    const userId = ctx.params?.id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.queryObject(
        `SELECT id, token_hash, expires_at, is_active, created_at, updated_at
         FROM user_sessions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      
      ctx.response.body = {
        sessions: result.rows,
        total: result.rows.length,
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Get user sessions error', error);
    throw new Error('Failed to get user sessions');
  }
});

export { router as userRouter };
