import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login screen on first visit', async ({ page }) => {
    await page.goto('/');
    
    // Should see the Venice Studio title
    await expect(page.getByText('Venice Studio')).toBeVisible();
    
    // Should see login form elements
    await expect(page.getByPlaceholder('Enter username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
    await expect(page.getByRole('button', { name: /unlock vault/i })).toBeVisible();
  });

  test('should show registration form when clicking Create User', async ({ page }) => {
    await page.goto('/');
    
    // Click the "Create User" link
    await page.getByText('Create User').click();
    
    // Button text should change to "Create Vault"
    await expect(page.getByRole('button', { name: /create vault/i })).toBeVisible();
  });

  test('should show password strength indicator during registration', async ({ page }) => {
    await page.goto('/');
    
    // Switch to registration mode
    await page.getByText('Create User').click();
    
    // Enter a weak password
    await page.getByPlaceholder('Enter password').fill('123');
    
    // Should show strength indicator with "Very Weak" or similar
    await expect(page.getByText(/weak/i)).toBeVisible();
    
    // Enter a stronger password
    await page.getByPlaceholder('Enter password').fill('MyStr0ng!P@ssw0rd2024');
    
    // Should show improved strength
    await expect(page.getByText(/strong/i)).toBeVisible();
  });

  test('should allow dev mode login', async ({ page }) => {
    await page.goto('/');
    
    // Enter dev credentials
    await page.getByPlaceholder('Enter username').fill('dev');
    await page.getByPlaceholder('Enter password').fill('dev');
    
    // Click login
    await page.getByRole('button', { name: /unlock vault/i }).click();
    
    // Should navigate to the main app (Studio view)
    await expect(page.getByText('Studio')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Main App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login with dev mode for all tests
    await page.goto('/');
    await page.getByPlaceholder('Enter username').fill('dev');
    await page.getByPlaceholder('Enter password').fill('dev');
    await page.getByRole('button', { name: /unlock vault/i }).click();
    await expect(page.getByText('Studio')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Gallery view', async ({ page }) => {
    // Click Gallery nav button
    await page.getByRole('button', { name: /gallery/i }).click();
    
    // Should show Vault header (gallery view title)
    await expect(page.getByText('Vault')).toBeVisible();
  });

  test('should navigate to Chat view', async ({ page }) => {
    // Click Chat nav button
    await page.getByRole('button', { name: /chat/i }).click();
    
    // Should show Assistant header
    await expect(page.getByText('Assistant')).toBeVisible();
  });

  test('should navigate to Settings view', async ({ page }) => {
    // Click Settings nav button
    await page.getByRole('button', { name: /settings/i }).click();
    
    // Should show Configuration header
    await expect(page.getByText('Configuration')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Click logout button
    await page.getByRole('button', { name: /log out/i }).click();
    
    // Should return to login screen
    await expect(page.getByText('Venice Studio')).toBeVisible();
    await expect(page.getByPlaceholder('Enter username')).toBeVisible();
  });
});

test.describe('Gallery Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login with dev mode
    await page.goto('/');
    await page.getByPlaceholder('Enter username').fill('dev');
    await page.getByPlaceholder('Enter password').fill('dev');
    await page.getByRole('button', { name: /unlock vault/i }).click();
    await expect(page.getByText('Studio')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Gallery
    await page.getByRole('button', { name: /gallery/i }).click();
    await expect(page.getByText('Vault')).toBeVisible();
  });

  test('should show filter and sort controls', async ({ page }) => {
    // Should have model filter dropdown
    await expect(page.getByText('All Models')).toBeVisible();
    
    // Should have sort dropdown
    await expect(page.getByText('Newest First')).toBeVisible();
  });

  test('should display gallery items', async ({ page }) => {
    // Dev mode includes a test image - should show Full Gallery section
    await expect(page.getByText('Full Gallery')).toBeVisible();
  });
});
