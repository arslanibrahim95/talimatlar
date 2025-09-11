import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  if (!baseURL) {
    throw new Error('Base URL is not configured');
  }

  console.log('🚀 Starting global setup...');
  console.log(`📍 Base URL: ${baseURL}`);

  // Start browser and create test context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(baseURL);
    
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
    
    // Check if the app is running in test mode
    const isTestMode = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';
    });

    if (isTestMode) {
      console.log('✅ Application is running in test mode');
    } else {
      console.log('⚠️ Application is not running in test mode');
    }

    // Verify critical components are loaded
    const criticalElements = [
      'body',
      '#root',
      'main',
      'nav',
      'footer'
    ];

    for (const selector of criticalElements) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Found critical element: ${selector}`);
      } catch (error) {
        console.warn(`⚠️ Critical element not found: ${selector}`);
      }
    }

    // Check authentication state
    const authState = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      return {
        hasToken: !!token,
        hasUserData: !!userData,
        isAuthenticated: !!(token && userData)
      };
    });

    console.log('🔐 Authentication state:', authState);

    // Create test data if needed
    if (!authState.isAuthenticated) {
      console.log('📝 Creating test user data...');
      
      // Navigate to login page
      await page.goto(`${baseURL}/auth/login`);
      await page.waitForLoadState('networkidle');
      
      // Fill login form with test credentials
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      console.log('✅ Test user logged in successfully');
    }

    // Verify dashboard is accessible
    try {
      await page.goto(`${baseURL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const dashboardTitle = await page.textContent('h1, h2, h3');
      console.log(`📊 Dashboard loaded: ${dashboardTitle}`);
      
    } catch (error) {
      console.warn('⚠️ Dashboard not accessible:', error.message);
    }

    // Set up test environment variables
    process.env.TEST_APP_READY = 'true';
    process.env.TEST_BASE_URL = baseURL;
    process.env.TEST_AUTH_STATE = authState.isAuthenticated ? 'authenticated' : 'unauthenticated';

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
