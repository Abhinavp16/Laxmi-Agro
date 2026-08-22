#!/usr/bin/env node

/**
 * iOS Push Notification Diagnostic Tool
 *
 * Answers three questions that cannot be inferred from the app UI:
 *   1. Is Firebase Admin actually configured on this backend?
 *   2. Does the user have a registered, active iOS device token?
 *   3. What exact error does FCM/APNs return when pushing to that token?
 *
 * Usage:
 *   node src/scripts/diagnoseIosPush.js <phone-or-email>
 *   node src/scripts/diagnoseIosPush.js <phone-or-email> --send
 *
 * Without --send it only inspects configuration and stored tokens.
 * With --send it delivers a real test notification to the iOS tokens.
 */

require('dotenv').config();

const connectDB = require('../config/database');
const { getMessaging } = require('../config/firebase');
const { User, DeviceToken } = require('../models');

const APNS_HINTS = {
  'messaging/third-party-auth-error':
    'Firebase cannot authenticate with Apple. Upload a valid APNs auth key (.p8) with the correct Key ID and Team ID in Firebase Console > Project settings > Cloud Messaging, for bundle ID com.laxmiagro.app.',
  'messaging/registration-token-not-registered':
    'This token is dead. The app was deleted/reinstalled or the token rotated. Open the app and log in again to register a fresh token.',
  'messaging/invalid-registration-token':
    'The stored token is malformed. Re-register the device from the app.',
  'messaging/mismatched-credential':
    'The token belongs to a different Firebase project than this backend service account. Check FIREBASE_PROJECT_ID and GoogleService-Info.plist match.',
  'messaging/invalid-argument':
    'FCM rejected the message payload or token. Check the APNs configuration and payload shape.',
  'messaging/server-unavailable':
    'Transient FCM outage. Retry shortly. Do not deactivate the token.',
};

const maskToken = (token) => {
  if (!token) return 'unknown';
  return token.length <= 16 ? token : `${token.slice(0, 12)}...${token.slice(-6)}`;
};

async function main() {
  const identifier = process.argv[2];
  const shouldSend = process.argv.includes('--send');

  if (!identifier) {
    console.error('\nUsage: node src/scripts/diagnoseIosPush.js <phone-or-email> [--send]\n');
    process.exit(1);
  }

  console.log('\niOS Push Notification Diagnostic');
  console.log('='.repeat(60));

  // Step 1 - backend Firebase credentials
  console.log('\n[1] Firebase Admin configuration');
  const requiredEnv = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  requiredEnv.forEach((key) => {
    const value = process.env[key];
    const shown = key === 'FIREBASE_PRIVATE_KEY'
      ? (value ? `set (${value.length} chars)` : 'MISSING')
      : (value || 'MISSING');
    console.log(`    ${key}: ${shown}`);
  });

  if (missingEnv.length > 0) {
    console.error('\n    RESULT: Firebase is NOT configured on this backend.');
    console.error('    No push notification can ever be delivered until these are set.');
    process.exit(2);
  }

  const messaging = getMessaging();
  if (!messaging) {
    console.error('\n    RESULT: Firebase Admin failed to initialize. Check the credential values.');
    process.exit(2);
  }
  console.log(`    RESULT: Firebase Admin ready for project ${process.env.FIREBASE_PROJECT_ID}`);

  // Step 2 - locate the user and inspect stored device tokens
  await connectDB();

  console.log('\n[2] Device tokens');
  const normalized = identifier.trim();
  const user = await User.findOne({
    $or: [
      { phone: normalized },
      { phone: normalized.replace(/^\+91/, '') },
      { email: normalized.toLowerCase() },
    ],
  }).select('_id name phone email role');

  if (!user) {
    console.error(`    No user found for "${identifier}".`);
    process.exit(3);
  }

  console.log(`    User: ${user.name || 'unnamed'} (${user.phone || user.email}) role=${user.role}`);

  const tokens = await DeviceToken.find({ userId: user._id }).sort({ updatedAt: -1 });
  if (tokens.length === 0) {
    console.error('\n    RESULT: This user has NO device tokens at all.');
    console.error('    The app never successfully called /notifications/register-token while logged in.');
    process.exit(4);
  }

  tokens.forEach((token) => {
    console.log(
      `    - platform=${token.platform} active=${token.isActive} updated=${token.updatedAt.toISOString()} token=${maskToken(token.fcmToken)}`
    );
  });

  const iosTokens = tokens.filter((t) => t.platform === 'ios' && t.isActive);
  const inactiveIos = tokens.filter((t) => t.platform === 'ios' && !t.isActive);

  if (iosTokens.length === 0) {
    console.error('\n    RESULT: No ACTIVE iOS token for this user.');
    if (inactiveIos.length > 0) {
      console.error(`    ${inactiveIos.length} iOS token(s) exist but were deactivated by a previous send failure.`);
      console.error('    Open the app on the iPhone and log in again to re-register.');
    } else {
      console.error('    The iPhone app has not registered an iOS token yet.');
      console.error('    Confirm Firebase initializes on iOS and that login completes.');
    }
    process.exit(5);
  }

  console.log(`    RESULT: ${iosTokens.length} active iOS token(s) found.`);

  // Step 3 - real delivery attempt
  if (!shouldSend) {
    console.log('\n[3] Delivery test skipped. Re-run with --send to push a real test notification.\n');
    process.exit(0);
  }

  console.log('\n[3] Sending test push to iOS token(s)');
  const response = await messaging.sendEachForMulticast({
    tokens: iosTokens.map((t) => t.fcmToken),
    notification: {
      title: 'Laxmi Agro test',
      body: 'If you can see this in Notification Center, iOS push delivery works.',
    },
    data: {
      type: 'diagnostic',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    apns: {
      headers: {
        'apns-push-type': 'alert',
        'apns-priority': '10',
      },
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  });

  console.log(`    success=${response.successCount} failure=${response.failureCount}`);

  response.responses.forEach((resp, idx) => {
    const token = maskToken(iosTokens[idx].fcmToken);
    if (resp.success) {
      console.log(`    OK   ${token} messageId=${resp.messageId}`);
      return;
    }

    const code = resp.error?.code || 'unknown';
    console.error(`    FAIL ${token} code=${code}`);
    console.error(`         message: ${resp.error?.message || 'none'}`);
    if (APNS_HINTS[code]) {
      console.error(`         cause: ${APNS_HINTS[code]}`);
    }
  });

  if (response.successCount > 0) {
    console.log('\n    FCM accepted the push. If the iPhone shows nothing, the remaining');
    console.log('    cause is on the device: check the app is backgrounded and not in Focus mode.');
  }

  console.log('');
  process.exit(response.failureCount > 0 ? 6 : 0);
}

main().catch((error) => {
  console.error('\nDiagnostic failed:', error.message);
  process.exit(1);
});
