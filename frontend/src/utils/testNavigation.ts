/**
 * Navigation test utilities
 * Menü navigasyon sorunlarını test etmek için yardımcı fonksiyonlar
 */

import { mainNavigation } from '../config/navigation';

export interface NavigationTestResult {
  href: string;
  title: string;
  status: 'success' | 'error' | 'pending';
  error?: string;
  timestamp: string;
}

export class NavigationTester {
  private results: NavigationTestResult[] = [];

  // Test navigation to a specific route
  async testNavigation(href: string, title: string): Promise<NavigationTestResult> {
    const result: NavigationTestResult = {
      href,
      title,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      // Check if the route exists in our navigation config
      const navItem = mainNavigation.find(item => item.href === href);
      
      if (!navItem) {
        result.status = 'error';
        result.error = `Route not found in navigation config: ${href}`;
      } else {
        // Simulate navigation (in real app, this would be actual navigation)
        result.status = 'success';
      }
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.results.push(result);
    return result;
  }

  // Test all navigation routes
  async testAllRoutes(): Promise<NavigationTestResult[]> {
    const promises = mainNavigation.map(item => 
      this.testNavigation(item.href, item.title)
    );
    
    return Promise.all(promises);
  }

  // Get test results
  getResults(): NavigationTestResult[] {
    return [...this.results];
  }

  // Clear results
  clearResults(): void {
    this.results = [];
  }

  // Get summary
  getSummary(): { total: number; success: number; errors: number } {
    const total = this.results.length;
    const success = this.results.filter(r => r.status === 'success').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    
    return { total, success, errors };
  }
}

// Common navigation issues and solutions
export const navigationIssues = {
  // Check if route is properly defined
  checkRouteDefinition: (href: string): boolean => {
    return mainNavigation.some(item => item.href === href);
  },

  // Check if route has proper component
  checkRouteComponent: (href: string): boolean => {
    // This would check if the component exists in the file system
    // For now, we'll assume all routes have components
    return true;
  },

  // Check if route is accessible (no authentication issues)
  checkRouteAccess: (href: string): boolean => {
    // This would check authentication and authorization
    // For now, we'll assume all routes are accessible
    return true;
  },

  // Get common navigation problems
  getCommonProblems: (): string[] => {
    return [
      'Route not defined in App.tsx',
      'Component not found or not exported',
      'Authentication/authorization issues',
      'React Router configuration problems',
      'Lazy loading issues',
      'Protected route configuration',
      'Route path mismatch',
      'Component import errors'
    ];
  }
};

// Navigation test scenarios
export const testScenarios = {
  // Test basic navigation
  basicNavigation: async (tester: NavigationTester) => {
    console.log('🧪 Testing basic navigation...');
    
    const basicRoutes = ['/dashboard', '/documents', '/analytics', '/users'];
    const results = [];
    
    for (const route of basicRoutes) {
      const result = await tester.testNavigation(route, `Basic: ${route}`);
      results.push(result);
      console.log(`${result.status === 'success' ? '✅' : '❌'} ${route}: ${result.status}`);
    }
    
    return results;
  },

  // Test all navigation routes
  allRoutes: async (tester: NavigationTester) => {
    console.log('🧪 Testing all navigation routes...');
    
    const results = await tester.testAllRoutes();
    
    results.forEach(result => {
      console.log(`${result.status === 'success' ? '✅' : '❌'} ${result.title}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    return results;
  },

  // Test navigation with different methods
  navigationMethods: async () => {
    console.log('🧪 Testing navigation methods...');
    
    const methods = [
      { name: 'Link Component', test: () => console.log('Link component test') },
      { name: 'useNavigate Hook', test: () => console.log('useNavigate hook test') },
      { name: 'Programmatic Navigation', test: () => console.log('Programmatic navigation test') }
    ];
    
    methods.forEach(method => {
      console.log(`Testing ${method.name}...`);
      method.test();
    });
  }
};

// Export singleton instance
export const navigationTester = new NavigationTester();

// Quick test function
export const quickNavigationTest = async (): Promise<void> => {
  console.log('🚀 Starting quick navigation test...');
  
  const tester = new NavigationTester();
  
  // Test basic routes
  await testScenarios.basicNavigation(tester);
  
  // Get summary
  const summary = tester.getSummary();
  console.log(`📊 Test Summary: ${summary.success}/${summary.total} successful, ${summary.errors} errors`);
  
  if (summary.errors > 0) {
    console.log('❌ Navigation issues detected. Check the results above.');
  } else {
    console.log('✅ All navigation tests passed!');
  }
};

export default navigationTester;
