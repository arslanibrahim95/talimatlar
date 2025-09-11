import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Application } from 'https://deno.land/x/oak@v12.6.1/mod.ts';

// Mock database for testing
const mockUsers = new Map();
const mockSessions = new Map();

// Test data
const testUser = {
  id: '1',
  email: 'test@example.com',
  password: 'hashed_password_123',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date()
};

const testAdmin = {
  id: '2',
  email: 'admin@example.com',
  password: 'hashed_password_admin',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('Auth Service Integration Tests', () => {
  let app: Application;
  let baseUrl: string;

  beforeAll(async () => {
    // Initialize test database
    mockUsers.set('test@example.com', testUser);
    mockUsers.set('admin@example.com', testAdmin);
    
    baseUrl = 'http://localhost:8004';
  });

  afterAll(async () => {
    // Cleanup
    mockUsers.clear();
    mockSessions.clear();
  });

  beforeEach(() => {
    // Reset sessions before each test
    mockSessions.clear();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should return error for password mismatch', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test2@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      };

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('password');
    });

    it('should return error for existing email', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com', // Already exists
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(409);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.user.password).toBeUndefined();
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First login to get a token
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const loginResult = await loginResponse.json();
      const token = loginResult.token;

      // Now logout
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should return error for invalid token', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid_token',
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user data with valid token', async () => {
      // First login to get a token
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const loginResult = await loginResponse.json();
      const token = loginResult.token;

      // Get user data
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeUndefined();
    });

    it('should return error without token', async () => {
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get a token
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });

      const loginResult = await loginResponse.json();
      const token = loginResult.token;

      // Refresh token
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token).not.toBe(token); // Should be a new token
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(10).fill(null).map(() =>
        fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email-format',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(400);
    });

    it('should validate password strength', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test3@example.com',
        password: '123', // Too short
        confirmPassword: '123'
      };

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(400);
    });
  });
});
