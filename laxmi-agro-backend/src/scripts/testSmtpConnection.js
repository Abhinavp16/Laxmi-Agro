#!/usr/bin/env node

/**
 * SMTP Connection and Email Delivery Test Script
 * 
 * Tests the SMTP configuration and attempts to send a test email
 * to diagnose magic-link email delivery issues.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const TEST_EMAIL = process.env.ADMIN_EMAILS?.split(',')[0]?.trim() || process.env.SMTP_USER;

console.log('\n🔍 Magic Link Email Diagnostic Tool\n');
console.log('═'.repeat(60));

// Step 1: Check environment variables
console.log('\n📋 Step 1: Checking Environment Variables...\n');
console.log(`NODE_ENV:        ${process.env.NODE_ENV || 'not set'}`);
console.log(`SMTP_HOST:       ${process.env.SMTP_HOST || '❌ MISSING'}`);
console.log(`SMTP_PORT:       ${process.env.SMTP_PORT || '❌ MISSING (defaulting to 587)'}`);
console.log(`SMTP_USER:       ${process.env.SMTP_USER || '❌ MISSING'}`);
console.log(`SMTP_PASS:       ${process.env.SMTP_PASS ? '✅ SET (length: ' + process.env.SMTP_PASS.length + ')' : '❌ MISSING'}`);
console.log(`EMAIL_FROM:      ${process.env.EMAIL_FROM || process.env.SMTP_USER || '❌ MISSING'}`);
console.log(`ADMIN_EMAILS:    ${process.env.ADMIN_EMAILS || '❌ MISSING'}`);
console.log(`ADMIN_PANEL_URL: ${process.env.ADMIN_PANEL_URL || '❌ MISSING'}`);

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('\n❌ ERROR: SMTP credentials are not properly configured in .env file');
  process.exit(1);
}

// Step 2: Test SMTP connection
async function testConnection() {
  console.log('\n📡 Step 2: Testing SMTP Connection...\n');
  
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    
    console.log('Attempting to verify connection...');
    await transporter.verify();
    
    console.log('✅ SMTP connection successful!');
    console.log(`   Connected to: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`);
    console.log(`   Authentication: ${SMTP_CONFIG.auth.user}`);
    
    return transporter;
  } catch (error) {
    console.error('❌ SMTP connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Possible causes:');
      console.error('   • App password is incorrect or expired');
      console.error('   • 2-Step Verification is not enabled on Gmail');
      console.error('   • "Less secure app access" is disabled');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection timeout. Possible causes:');
      console.error('   • Firewall blocking SMTP port 587');
      console.error('   • Network connectivity issues');
      console.error('   • Incorrect SMTP host or port');
    }
    
    throw error;
  }
}

// Step 3: Send test email
async function sendTestEmail(transporter) {
  console.log('\n📧 Step 3: Sending Test Email...\n');
  console.log(`Recipient: ${TEST_EMAIL}`);
  
  try {
    const testLink = `${process.env.ADMIN_PANEL_URL || 'http://localhost:3001'}/login/verify?token=TEST_TOKEN_${Date.now()}`;
    
    const info = await transporter.sendMail({
      from: `"Laxmi Agro Admin" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: TEST_EMAIL,
      subject: '🧪 Test Email - Magic Link Diagnostic',
      text: `This is a test email to verify SMTP configuration.\n\nTest link: ${testLink}\n\nIf you received this, the SMTP service is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2>🧪 SMTP Test Email</h2>
          <p>This is a test email to verify your SMTP configuration for magic-link authentication.</p>
          <p style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px; margin: 16px 0;">
            <strong>Status:</strong> ✅ SMTP service is working correctly!
          </p>
          <p style="font-size: 12px; color: #64748b;">
            Test link: <code>${testLink}</code>
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email!');
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

// Main execution
async function runDiagnostics() {
  try {
    const transporter = await testConnection();
    await sendTestEmail(transporter);
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ All tests passed! SMTP is configured correctly.');
    console.log('\n💡 If you still don\'t receive magic-link emails, check:');
    console.log('   1. Spam/Junk folder');
    console.log('   2. Gmail filters or blocks');
    console.log('   3. Production environment variables match local .env');
    console.log('\n' + '═'.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.log('\n' + '═'.repeat(60));
    console.error('\n❌ Diagnostics failed. Please fix the issues above.\n');
    console.log('═'.repeat(60) + '\n');
    process.exit(1);
  }
}

runDiagnostics();
