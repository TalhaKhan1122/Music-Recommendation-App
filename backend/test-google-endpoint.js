// Test if Google OAuth endpoint is accessible
require('dotenv').config({ path: './.env' });

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/google',
  method: 'GET',
  maxRedirects: 0, // Don't follow redirects, just see the response
};

console.log('🧪 Testing Google OAuth Endpoint...\n');
console.log('Making request to: http://localhost:5000/api/auth/google\n');

const req = http.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 Response Headers:`, res.headers);
  
  if (res.statusCode === 302 || res.statusCode === 301) {
    const location = res.headers.location;
    console.log(`\n✅ SUCCESS! Endpoint is working!`);
    console.log(`📍 Redirecting to: ${location?.substring(0, 100)}...`);
    
    if (location?.includes('accounts.google.com')) {
      console.log('✅ Redirect URL looks correct (points to Google)');
    } else {
      console.log('⚠️  Redirect URL might be incorrect');
    }
  } else if (res.statusCode === 503) {
    console.log(`\n❌ ERROR: Service unavailable`);
    console.log(`   This usually means Google OAuth is not configured.`);
    console.log(`   Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in .env file`);
  } else {
    console.log(`\n⚠️  Unexpected status code: ${res.statusCode}`);
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (data) {
      try {
        const json = JSON.parse(data);
        console.log('\n📄 Response Body:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('\n📄 Response Body:', data.substring(0, 200));
      }
    }
    console.log('\n');
  });
});

req.on('error', (error) => {
  console.error(`\n❌ ERROR: Cannot connect to backend server!`);
  console.error(`   ${error.message}`);
  console.error(`\n💡 Make sure backend server is running:`);
  console.error(`   cd backend && npm run dev`);
});

req.end();

