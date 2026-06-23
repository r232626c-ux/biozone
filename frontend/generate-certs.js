#!/usr/bin/env node
/**
 * Generate self-signed certificates for HTTPS development
 * Usage: node generate-certs.js
 * Run this from the frontend directory
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const certDir = __dirname;
const certPath = path.join(certDir, 'localhost.pem');
const keyPath = path.join(certDir, 'localhost-key.pem');

async function generateCerts() {
  console.log('🔐 Generating self-signed certificates for HTTPS development...\n');

  // Check if certificates already exist
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('✅ Certificates already exist:');
    console.log(`   ${keyPath}`);
    console.log(`   ${certPath}`);
    return;
  }

  try {
    // Try using openssl
    const command = `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=ZA/ST=State/L=City/O=Biozone/CN=localhost"`;
    
    console.log('🔧 Running OpenSSL...');
    await execAsync(command);

    console.log('\n✅ Certificates generated successfully!\n');
    console.log(`   Private key: ${keyPath}`);
    console.log(`   Certificate: ${certPath}`);
    console.log('\n⚠️  Browser Warning:');
    console.log('   When you access https://localhost:5173, you\'ll see a');
    console.log('   certificate warning (self-signed). This is expected.');
    console.log('   Click "Advanced" → "Proceed to localhost" to continue.\n');

  } catch (error) {
    console.error('\n❌ Error generating certificates:\n', error.message);
    console.log('\n💡 Solution: Install OpenSSL or manually create certificates.');
    console.log('   For Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
    console.log('   For Mac: brew install openssl');
    console.log('   For Linux: sudo apt-get install openssl\n');
    process.exit(1);
  }
}

generateCerts().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
