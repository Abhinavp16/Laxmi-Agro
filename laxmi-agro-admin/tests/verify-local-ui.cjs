const path = require('path');
const { chromium } = require('@playwright/test');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const adminBase = 'http://localhost:3001';
  const siteBase = 'http://localhost:3000';
  const imagePath = path.resolve(__dirname, '..', '..', 'laxmi-agro-app', 'assets', 'images', 'laxmi-agro-logo.png');

  await page.goto(`${adminBase}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[name="email"]').fill('admin@laxmiagro.com');
  await page.locator('input[name="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(`${adminBase}/`, { timeout: 30000 });

  await page.goto(`${adminBase}/manage-website`, { waitUntil: 'networkidle' });
  const adminPreview = page.locator('img[alt="Hero preview 1"]');
  const uploadResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/upload/image?folder=website') &&
      response.request().method() === 'POST' &&
      response.status() === 200,
    { timeout: 30000 }
  );
  await page.locator('#hero-upload-0').setInputFiles(imagePath);
  const uploadResponse = await uploadResponsePromise;
  const uploadJson = await uploadResponse.json();
  const uploadedUrl = uploadJson?.data?.url;
  if (!uploadedUrl || !uploadedUrl.includes('/uploads/website/')) {
    throw new Error(`Upload endpoint returned unexpected URL: ${uploadedUrl}`);
  }
  await page.waitForFunction(
    (uploadedUrl) => {
      return Array.from(document.querySelectorAll('input'))
        .some((input) => input.value && input.value.includes(uploadedUrl));
    },
    uploadedUrl,
    { timeout: 30000 }
  );

  await page.getByRole('button', { name: 'Save Hero Images' }).click();
  await page.waitForTimeout(2000);

  const sitePage = await browser.newPage();
  await sitePage.goto(siteBase, { waitUntil: 'networkidle' });
  const heroMatch = sitePage.locator(`div[style*="${uploadedUrl}"]`).first();
  await heroMatch.waitFor({ state: 'visible', timeout: 30000 });

  console.log(JSON.stringify({
    success: true,
    uploadedUrl,
    adminVerified: true,
    siteVerified: true,
  }));

  await browser.close();
}

run().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
