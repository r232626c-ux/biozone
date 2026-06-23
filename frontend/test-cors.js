#!/usr/bin/env node
/**
 * CORS & Backend Connectivity Test
 * Run from biozone/frontend/ directory to test backend connectivity
 */

const axios = require('axios');

const BACKEND_URL = 'http://192.168.1.114:8000';
const FRONTEND_URL = 'http://192.168.1.114:5173';

async function testBackend() {
  console.log('\n' + '='.repeat(60));
  console.log('  CORS & BACKEND CONNECTIVITY TEST');
  console.log('='.repeat(60) + '\n');

  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL:  ${BACKEND_URL}\n`);

  // Test 1: Can we reach the health check?
  console.log('📍 Test 1: Backend Health Check');
  console.log('-'.repeat(60));
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000,
      headers: {
        'Origin': FRONTEND_URL,
      }
    });
    console.log('✅ Backend is reachable and responding');
    console.log('   Response:', response.data);
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
    });
  } catch (error) {
    console.log('❌ Backend is NOT reachable');
    console.log('   Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n   ⚠️  Connection refused - Backend is not running!');
      console.log('      Start backend with: python run_app.py');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n   ⚠️  Cannot resolve hostname 192.168.1.114');
      console.log('      Check your network or use localhost:8000');
    }
    return false;
  }

  // Test 2: OPTIONS preflight request (simulating browser)
  console.log('\n📍 Test 2: CORS Preflight (OPTIONS)');
  console.log('-'.repeat(60));
  try {
    const response = await axios.options(`${BACKEND_URL}/token`, {
      timeout: 5000,
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
      }
    });
    console.log('✅ CORS preflight request succeeded');
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
    });
  } catch (error) {
    console.log('⚠️  Preflight request failed (may still work in browser)');
    console.log('   Error:', error.message);
  }

  // Test 3: Network connectivity
  console.log('\n📍 Test 3: Network Connectivity');
  console.log('-'.repeat(60));
  try {
    const response = await axios.get(`${BACKEND_URL}/docs`, {
      timeout: 5000,
    });
    console.log('✅ Backend API documentation is accessible');
    console.log('   URL: http://192.168.1.114:8000/docs');
  } catch (error) {
    console.log('❌ Could not access API documentation');
    console.log('   Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  TEST COMPLETE');
  console.log('='.repeat(60) + '\n');

  console.log('✅ If all tests passed:');
  console.log('   1. Make sure frontend is accessing http://192.168.1.114:5173');
  console.log('   2. Check browser console for any remaining errors');
  console.log('   3. Try logging in again\n');

  console.log('❌ If any test failed:');
  console.log('   1. Ensure backend is running: python run_app.py');
  console.log('   2. Verify network connectivity: ping 192.168.1.114');
  console.log('   3. Check firewall isn\'t blocking port 8000');
  console.log('   4. Restart both frontend and backend\n');
}

testBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
