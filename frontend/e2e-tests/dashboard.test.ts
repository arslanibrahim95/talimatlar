import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.getByLabel('E-posta').fill('test@example.com');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with all components', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check main dashboard elements
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Genel Bakış')).toBeVisible();
    
    // Check statistics cards
    await expect(page.getByText('Toplam Kullanıcı')).toBeVisible();
    await expect(page.getByText('Aktif Kullanıcılar')).toBeVisible();
    await expect(page.getByText('Toplam Doküman')).toBeVisible();
    await expect(page.getByText('Talimatlar')).toBeVisible();
    
    // Check charts
    await expect(page.locator('[data-testid="compliance-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-chart"]')).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check recent activities section
    await expect(page.getByText('Son Aktiviteler')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check quick action buttons
    await expect(page.getByRole('button', { name: 'Yeni Talimat' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rapor Oluştur' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kullanıcı Ekle' })).toBeVisible();
  });

  test('should navigate to instructions from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on "Yeni Talimat" button
    await page.getByRole('button', { name: 'Yeni Talimat' }).click();
    
    // Should navigate to instructions page
    await expect(page).toHaveURL('/instructions');
    await expect(page.getByText('Talimatlar')).toBeVisible();
  });

  test('should navigate to reports from quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on "Rapor Oluştur" button
    await page.getByRole('button', { name: 'Rapor Oluştur' }).click();
    
    // Should navigate to reports page
    await expect(page).toHaveURL('/reports');
    await expect(page.getByText('Raporlar')).toBeVisible();
  });

  test('should refresh dashboard data', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click refresh button
    await page.getByRole('button', { name: 'Yenile' }).click();
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Should hide loading state after refresh
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('should display notifications', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check notifications icon
    await expect(page.locator('[data-testid="notifications-icon"]')).toBeVisible();
    
    // Click on notifications
    await page.locator('[data-testid="notifications-icon"]').click();
    
    // Should show notifications dropdown
    await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible();
  });

  test('should handle dashboard errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/analytics/dashboard', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/dashboard');
    
    // Should show error message
    await expect(page.getByText('Veri yüklenirken hata oluştu')).toBeVisible();
    
    // Should show retry button
    await expect(page.getByRole('button', { name: 'Tekrar Dene' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Check that dashboard is responsive
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });

  test('should display user profile information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check user profile section
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    
    // Click on user profile
    await page.locator('[data-testid="user-profile"]').click();
    
    // Should show profile dropdown
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible();
    await expect(page.getByText('Profil')).toBeVisible();
    await expect(page.getByText('Ayarlar')).toBeVisible();
    await expect(page.getByText('Çıkış Yap')).toBeVisible();
  });

  test('should handle real-time updates', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mock WebSocket connection for real-time updates
    await page.evaluate(() => {
      // Simulate real-time data update
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dashboard-update', {
          detail: { newUsers: 5, newDocuments: 3 }
        }));
      }, 1000);
    });
    
    // Wait for real-time update
    await page.waitForTimeout(2000);
    
    // Should show updated data
    await expect(page.getByText('Son Güncelleme:')).toBeVisible();
  });
});
