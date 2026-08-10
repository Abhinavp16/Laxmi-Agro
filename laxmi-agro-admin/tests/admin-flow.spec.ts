import { test, expect } from '@playwright/test';
import { BASE_URL, loginAsAdmin } from './helpers/auth';

test.describe('Admin Panel Flow', () => {

    test('should request a magic link from the login page', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.getByRole('button', { name: 'Send Magic Link' }).click();

        // Check-inbox state appears
        await expect(page.getByText(/sign-in link has been sent/i)).toBeVisible({ timeout: 10000 });

        // Verify we can land on the dashboard with the seeded session
        await loginAsAdmin(page);
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('should navigate to products page', async ({ page }) => {
        // Login first
        await loginAsAdmin(page);
        
        // Navigate to products
        await page.click('text=Products');
        await page.waitForURL('**/products', { timeout: 5000 });
        
        // Verify products page
        await expect(page.locator('h1')).toContainText('Products');
    });

    test('should open add product page', async ({ page }) => {
        // Login first
        await loginAsAdmin(page);
        
        // Navigate to products
        await page.click('text=Products');
        await page.waitForURL('**/products', { timeout: 5000 });
        
        // Click Add Product
        await page.click('text=Add Product');
        await page.waitForURL('**/products/add', { timeout: 5000 });
        
        // Verify add product page
        await expect(page.locator('h1')).toContainText('Add New Product');
    });

    test('should create a new product', async ({ page }) => {
        // Login first
        await loginAsAdmin(page);
        
        // Navigate to add product
        await page.goto(`${BASE_URL}/products/add`);
        await page.waitForLoadState('networkidle');
        
        // Fill product form
        await page.fill('input[name="name"]', 'Test Product ' + Date.now());
        await page.fill('textarea[name="description"]', 'This is a test product description for Playwright testing.');
        
        // Select category
        await page.click('[data-slot="select-trigger"]:has-text("Select category")');
        await page.click('text=Machinery');
        
        // Fill SKU
        await page.fill('input[name="sku"]', 'TEST-' + Date.now());
        
        // Fill pricing
        await page.fill('input[name="mrp"]', '10000');
        await page.fill('input[name="retailPrice"]', '9000');
        await page.fill('input[name="wholesalePrice"]', '8000');
        await page.fill('input[name="stock"]', '100');
        await page.fill('input[name="minWholesaleQuantity"]', '10');
        
        // Fill image URL
        await page.fill('input[name="imageUrl"]', 'https://example.com/image.jpg');
        
        // Select status
        await page.click('[data-slot="select-trigger"]:has-text("draft")');
        await page.click('text=Active');
        
        // Submit form
        await page.click('button:has-text("Create Product")');
        
        // Wait for success toast or redirect
        await page.waitForURL('**/products', { timeout: 10000 });
        
        // Verify redirect to products page
        await expect(page).toHaveURL(/\/products$/);
    });

    test('should download complete product price snapshot', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(`${BASE_URL}/price-management`);

        const exportButton = page.getByRole('button', { name: 'Export Excel' });
        await expect(exportButton).toBeVisible();

        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/^product-price-snapshot-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    test('should logout when token expires', async ({ page }) => {
        // Login first
        await loginAsAdmin(page);
        
        // Clear access token to simulate expiry
        await page.evaluate(() => {
            localStorage.removeItem('accessToken');
        });
        
        // Refresh page
        await page.reload();
        
        // Should redirect to login
        await page.waitForURL('**/login', { timeout: 10000 });
        await expect(page).toHaveURL(/\/login$/);
    });

    test('should logout when the 4-hour session expires', async ({ page }) => {
        // Login first
        await loginAsAdmin(page);
        
        // Simulate a session older than 4 hours
        await page.evaluate(() => {
            localStorage.setItem('loginAt', String(Date.now() - 4 * 60 * 60 * 1000 - 1000));
        });
        
        // Refresh page - the dashboard guard should force logout
        await page.reload();
        
        await page.waitForURL('**/login', { timeout: 10000 });
        await expect(page).toHaveURL(/\/login$/);
    });
});
