import React, { createContext, useContext, useState, useEffect } from 'react';

// Test user interface
interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  companyId: string;
  isVerified: boolean;
  isActive: boolean;
}

// Auth context interface
interface AuthContextType {
  user: TestUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createTestUser: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Test users
const testUsers: TestUser[] = [
  {
    id: 'test-user-1',
    email: 'test1@example.com',
    firstName: 'Test',
    lastName: 'User 1',
    role: 'admin',
    companyId: 'test-company-1',
    isVerified: true,
    isActive: true
  },
  {
    id: 'test-user-2',
    email: 'admin@orneksirket.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    companyId: 'test-company-1',
    isVerified: true,
    isActive: true
  }
];

// Auth provider component
export const TestUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('test_user');
        const isTestMode = localStorage.getItem('use_test_user') === 'true';
        
        if (isTestMode && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('✅ Test user loaded from localStorage:', userData.email);
        } else {
          // Auto-create test user for development
          if (process.env.NODE_ENV === 'development') {
            createTestUser();
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Create test user
  const createTestUser = () => {
    const testUser = testUsers[0]; // Use first test user
    
    try {
      localStorage.setItem('test_user', JSON.stringify(testUser));
      localStorage.setItem('use_test_user', 'true');
      localStorage.setItem('auth_token', 'test-token-' + Date.now());
      
      setUser(testUser);
      console.log('✅ Test user created:', testUser.email);
    } catch (error) {
      console.error('❌ Failed to create test user:', error);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Find test user
      const testUser = testUsers.find(u => u.email === email && password === 'password123');
      
      if (testUser) {
        localStorage.setItem('test_user', JSON.stringify(testUser));
        localStorage.setItem('use_test_user', 'true');
        localStorage.setItem('auth_token', 'test-token-' + Date.now());
        
        setUser(testUser);
        console.log('✅ Test user logged in:', testUser.email);
        return true;
      } else {
        console.log('❌ Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('test_user');
    localStorage.removeItem('use_test_user');
    localStorage.removeItem('auth_token');
    setUser(null);
    console.log('✅ Test user logged out');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    createTestUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a TestUserProvider');
  }
  return context;
};

// Test user button component
export const TestUserButton: React.FC = () => {
  const { user, isAuthenticated, createTestUser, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Test User: {user.email}
        </span>
        <button
          onClick={logout}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={createTestUser}
      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
    >
      Create Test User
    </button>
  );
};

export default TestUserProvider;
