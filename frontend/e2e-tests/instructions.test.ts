import { test, expect } from '@playwright/test';

test.describe('Instructions E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.getByLabel('E-posta').fill('admin@example.com');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display instructions list', async ({ page }) => {
    await page.goto('/instructions');
    
    // Check main elements
    await expect(page.getByText('Talimatlar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yeni Talimat' })).toBeVisible();
    
    // Check search and filter controls
    await expect(page.getByPlaceholder('Talimat ara...')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Kategori' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Öncelik' })).toBeVisible();
  });

  test('should create new instruction', async ({ page }) => {
    await page.goto('/instructions');
    
    // Click create button
    await page.getByRole('button', { name: 'Yeni Talimat' }).click();
    
    // Should open create modal
    await expect(page.getByText('Yeni Talimat Oluştur')).toBeVisible();
    
    // Fill form
    await page.getByLabel('Başlık').fill('Test Safety Instruction');
    await page.getByLabel('İçerik').fill('This is a test safety instruction content');
    await page.getByRole('combobox', { name: 'Kategori' }).selectOption('safety');
    await page.getByRole('combobox', { name: 'Öncelik' }).selectOption('high');
    await page.getByRole('combobox', { name: 'Durum' }).selectOption('active');
    
    // Submit form
    await page.getByRole('button', { name: 'Oluştur' }).click();
    
    // Should show success message
    await expect(page.getByText('Talimat başarıyla oluşturuldu')).toBeVisible();
    
    // Should close modal and show new instruction in list
    await expect(page.getByText('Test Safety Instruction')).toBeVisible();
  });

  test('should edit existing instruction', async ({ page }) => {
    await page.goto('/instructions');
    
    // Find and click edit button for first instruction
    await page.locator('[data-testid="instruction-item"]').first().hover();
    await page.locator('[data-testid="edit-button"]').first().click();
    
    // Should open edit modal
    await expect(page.getByText('Talimat Düzenle')).toBeVisible();
    
    // Update title
    await page.getByLabel('Başlık').fill('Updated Safety Instruction');
    
    // Submit form
    await page.getByRole('button', { name: 'Güncelle' }).click();
    
    // Should show success message
    await expect(page.getByText('Talimat başarıyla güncellendi')).toBeVisible();
    
    // Should show updated instruction
    await expect(page.getByText('Updated Safety Instruction')).toBeVisible();
  });

  test('should delete instruction', async ({ page }) => {
    await page.goto('/instructions');
    
    // Find and click delete button for first instruction
    await page.locator('[data-testid="instruction-item"]').first().hover();
    await page.locator('[data-testid="delete-button"]').first().click();
    
    // Should show confirmation dialog
    await expect(page.getByText('Bu talimatı silmek istediğinizden emin misiniz?')).toBeVisible();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Sil' }).click();
    
    // Should show success message
    await expect(page.getByText('Talimat başarıyla silindi')).toBeVisible();
  });

  test('should search instructions', async ({ page }) => {
    await page.goto('/instructions');
    
    // Search for specific instruction
    await page.getByPlaceholder('Talimat ara...').fill('safety');
    await page.keyboard.press('Enter');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="instruction-item"]')).toHaveCount(1);
    await expect(page.getByText('safety', { exact: false })).toBeVisible();
  });

  test('should filter instructions by category', async ({ page }) => {
    await page.goto('/instructions');
    
    // Filter by safety category
    await page.getByRole('combobox', { name: 'Kategori' }).selectOption('safety');
    
    // Should show only safety instructions
    await expect(page.locator('[data-testid="instruction-item"]')).toHaveCount(1);
  });

  test('should filter instructions by priority', async ({ page }) => {
    await page.goto('/instructions');
    
    // Filter by high priority
    await page.getByRole('combobox', { name: 'Öncelik' }).selectOption('high');
    
    // Should show only high priority instructions
    await expect(page.locator('[data-testid="instruction-item"]')).toHaveCount(1);
  });

  test('should view instruction details', async ({ page }) => {
    await page.goto('/instructions');
    
    // Click on first instruction
    await page.locator('[data-testid="instruction-item"]').first().click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/instructions\/\d+/);
    
    // Should show instruction details
    await expect(page.getByText('Talimat Detayları')).toBeVisible();
    await expect(page.locator('[data-testid="instruction-content"]')).toBeVisible();
  });

  test('should upload instruction file', async ({ page }) => {
    await page.goto('/instructions');
    
    // Click on first instruction
    await page.locator('[data-testid="instruction-item"]').first().click();
    
    // Click upload button
    await page.getByRole('button', { name: 'Dosya Yükle' }).click();
    
    // Should open file upload dialog
    await expect(page.getByText('Dosya Yükle')).toBeVisible();
    
    // Upload test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-instruction.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test file content')
    });
    
    // Submit upload
    await page.getByRole('button', { name: 'Yükle' }).click();
    
    // Should show success message
    await expect(page.getByText('Dosya başarıyla yüklendi')).toBeVisible();
  });

  test('should distribute instruction', async ({ page }) => {
    await page.goto('/instructions');
    
    // Find and click distribute button
    await page.locator('[data-testid="instruction-item"]').first().hover();
    await page.locator('[data-testid="distribute-button"]').first().click();
    
    // Should open distribution modal
    await expect(page.getByText('Talimat Dağıt')).toBeVisible();
    
    // Select users
    await page.getByLabel('Kullanıcılar').click();
    await page.getByText('test@example.com').click();
    
    // Add message
    await page.getByLabel('Mesaj').fill('Lütfen bu talimatı inceleyin');
    
    // Submit distribution
    await page.getByRole('button', { name: 'Dağıt' }).click();
    
    // Should show success message
    await expect(page.getByText('Talimat başarıyla dağıtıldı')).toBeVisible();
  });

  test('should use instruction templates', async ({ page }) => {
    await page.goto('/instructions');
    
    // Click create button
    await page.getByRole('button', { name: 'Yeni Talimat' }).click();
    
    // Click template button
    await page.getByRole('button', { name: 'Şablon Kullan' }).click();
    
    // Should show template selection
    await expect(page.getByText('Şablon Seç')).toBeVisible();
    
    // Select template
    await page.getByText('Safety Template').click();
    
    // Should populate form with template data
    await expect(page.getByLabel('Başlık')).toHaveValue('Safety Template');
  });

  test('should handle instruction errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/instructions', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/instructions');
    
    // Should show error message
    await expect(page.getByText('Talimatlar yüklenirken hata oluştu')).toBeVisible();
    
    // Should show retry button
    await expect(page.getByRole('button', { name: 'Tekrar Dene' })).toBeVisible();
  });

  test('should paginate instructions', async ({ page }) => {
    await page.goto('/instructions');
    
    // Check pagination controls
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Click next page
    await page.getByRole('button', { name: 'Sonraki' }).click();
    
    // Should show page 2
    await expect(page.getByText('Sayfa 2')).toBeVisible();
  });

  test('should sort instructions', async ({ page }) => {
    await page.goto('/instructions');
    
    // Click sort dropdown
    await page.getByRole('combobox', { name: 'Sırala' }).click();
    
    // Select sort option
    await page.getByText('Tarihe Göre (Yeni)').click();
    
    // Should sort instructions
    await expect(page.locator('[data-testid="instruction-item"]')).toHaveCount(1);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/instructions');
    
    // Check mobile layout
    await expect(page.getByText('Talimatlar')).toBeVisible();
    
    // Check mobile menu
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });
});
