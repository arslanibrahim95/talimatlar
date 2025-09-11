import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('E-posta')).toBeVisible();
    await expect(page.getByLabel('Şifre')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Giriş Yap' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    
    await expect(page.getByText('E-posta zorunludur')).toBeVisible();
    await expect(page.getByText('Şifre zorunludur')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByLabel('E-posta').fill('invalid-email');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    
    await expect(page.getByText('Geçerli bir e-posta adresi girin')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.getByLabel('E-posta').fill('test@example.com');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('E-posta').fill('wrong@example.com');
    await page.getByLabel('Şifre').fill('wrongpassword');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    
    await expect(page.getByText('E-posta veya şifre hatalı')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: 'Hesap oluştur' }).click();
    
    await expect(page).toHaveURL('/auth/register');
    await expect(page.getByText('Kayıt Ol')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: 'Şifremi unuttum' }).click();
    
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.getByText('Şifre Sıfırlama')).toBeVisible();
  });
});

test.describe('Registration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByLabel('Ad')).toBeVisible();
    await expect(page.getByLabel('Soyad')).toBeVisible();
    await expect(page.getByLabel('E-posta')).toBeVisible();
    await expect(page.getByLabel('Şifre')).toBeVisible();
    await expect(page.getByLabel('Şifre Tekrar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kayıt Ol' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Kayıt Ol' }).click();
    
    await expect(page.getByText('Ad zorunludur')).toBeVisible();
    await expect(page.getByText('Soyad zorunludur')).toBeVisible();
    await expect(page.getByText('E-posta zorunludur')).toBeVisible();
    await expect(page.getByText('Şifre zorunludur')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByLabel('Ad').fill('Test');
    await page.getByLabel('Soyad').fill('User');
    await page.getByLabel('E-posta').fill('test@example.com');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByLabel('Şifre Tekrar').fill('different');
    await page.getByRole('button', { name: 'Kayıt Ol' }).click();
    
    await expect(page.getByText('Şifreler eşleşmiyor')).toBeVisible();
  });

  test('should successfully register with valid data', async ({ page }) => {
    await page.getByLabel('Ad').fill('Test');
    await page.getByLabel('Soyad').fill('User');
    await page.getByLabel('E-posta').fill('newuser@example.com');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByLabel('Şifre Tekrar').fill('password123');
    await page.getByRole('button', { name: 'Kayıt Ol' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});

test.describe('Logout E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('E-posta').fill('test@example.com');
    await page.getByLabel('Şifre').fill('password123');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should successfully logout', async ({ page }) => {
    await page.getByRole('button', { name: 'Çıkış Yap' }).click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByText('Giriş Yap')).toBeVisible();
  });

  test('should clear user data after logout', async ({ page }) => {
    await page.getByRole('button', { name: 'Çıkış Yap' }).click();
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });
});
