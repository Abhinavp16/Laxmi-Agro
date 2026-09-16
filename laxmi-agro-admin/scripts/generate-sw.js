/* Build-time generator for public/sw.js.
 * Reads Firebase web config from environment (.env.local supported) and
 * bakes it into the shared PWA + FCM service worker. All values are
 * public browser keys by design. If config is incomplete, the worker is
 * still generated with FCM disabled (PWA install/offline keeps working).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function loadDotEnvFile(filename) {
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvFile('.env.local');
loadDotEnvFile('.env');

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const fcmEnabled = Object.values(config).every(Boolean);
const version = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

const template = fs.readFileSync(path.join(root, 'public', 'sw.template.js'), 'utf8');
const output = template
  .replaceAll('__SW_VERSION__', version)
  .replaceAll('__FCM_ENABLED__', fcmEnabled ? '1' : '0')
  .replace('__FIREBASE_CONFIG_JSON__', JSON.stringify(config));

fs.writeFileSync(path.join(root, 'public', 'sw.js'), output);
console.log(`[generate-sw] public/sw.js written (fcm=${fcmEnabled ? 'enabled' : 'disabled'}, version=${version})`);
