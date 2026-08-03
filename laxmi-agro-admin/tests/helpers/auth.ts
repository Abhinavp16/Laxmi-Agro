import { expect, Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/laxmi_agro';
const JWT_SECRET = process.env.JWT_SECRET || 'agrimart-super-secret-jwt-key-dev-2024';

// Fixed magic link admins (see backend ADMIN_EMAILS)
const ADMIN_EMAIL = 'abhinavpandey12201@gmail.com';

/**
 * Establishes an authenticated admin session for E2E tests.
 *
 * Magic link login cannot be automated end-to-end because the raw token
 * is never stored (only its SHA-256 hash) and is delivered via email.
 * Instead we seed a valid JWT pair directly (same secret as the backend),
 * mirroring what a successful /auth/magic-link/verify stores client-side.
 */
export async function loginAsAdmin(page: Page) {
  const { execSync } = require('child_process');
  const script = `
    const jwt = require('${process.cwd()}/../laxmi-agro-backend/node_modules/jsonwebtoken');
    const mongoose = require('${process.cwd()}/../laxmi-agro-backend/node_modules/mongoose');
    (async () => {
      await mongoose.connect(${JSON.stringify(MONGODB_URI)});
      const user = await mongoose.connection.db.collection('users').findOne({ email: ${JSON.stringify(ADMIN_EMAIL)} });
      if (!user) { console.error('Admin user not found - run scripts/seedMagicAdmins.js'); process.exit(1); }
      const userId = user._id.toString();
      const accessToken = jwt.sign({ userId }, ${JSON.stringify(JWT_SECRET)}, { expiresIn: '12h' });
      const refreshToken = jwt.sign({ userId, type: 'refresh' }, ${JSON.stringify(JWT_SECRET)}, { expiresIn: '7d' });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await mongoose.connection.db.collection('refreshtokens').insertOne({
        userId: user._id, token: refreshToken, deviceInfo: 'playwright', expiresAt, createdAt: new Date(), updatedAt: new Date(),
      });
      const safeUser = { _id: userId, name: user.name, email: user.email, role: user.role };
      console.log(JSON.stringify({ accessToken, refreshToken, user: safeUser }));
      await mongoose.disconnect();
    })();
  `;

  const output = execSync(`node -e ${JSON.stringify(script)}`, { encoding: 'utf8' }).trim();
  const { accessToken, refreshToken, user } = JSON.parse(output.split('\n').pop() as string);

  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginAt', String(Date.now()));
    },
    { accessToken, refreshToken, user }
  );
  await page.goto(`${BASE_URL}/`);
  await expect(page).toHaveURL(BASE_URL + '/', { timeout: 10000 });
}
