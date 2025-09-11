import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log('🧹 Starting global teardown...');
  console.log(`📍 Base URL: ${baseURL}`);

  // Start browser and create test context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    
    // Clear localStorage
    await page.evaluate(() => {
      const keysToRemove = [
        'auth_token',
        'user_data',
        'session_timeout',
        'test_data',
        'temp_data'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`Removed: ${key}`);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    });

    console.log('✅ Test data cleaned up successfully');

    // Log test results summary
    const testResults = await page.evaluate(() => {
      return {
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage),
        cookies: document.cookie,
        url: window.location.href,
        title: document.title
      };
    });

    console.log('📊 Final application state:', testResults);

    // Verify cleanup was successful
    const authState = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      return {
        hasToken: !!token,
        hasUserData: !!userData,
        isAuthenticated: !!(token && userData)
      };
    });

    if (authState.isAuthenticated) {
      console.log('⚠️ User still authenticated, attempting logout...');
      
      try {
        // Navigate to logout or clear auth manually
        await page.evaluate(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        });
        
        console.log('✅ User logged out successfully');
      } catch (error) {
        console.warn('⚠️ Could not logout user:', error.message);
      }
    }

    // Reset environment variables
    delete process.env.TEST_APP_READY;
    delete process.env.TEST_BASE_URL;
    delete process.env.TEST_AUTH_STATE;

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalTeardown;
