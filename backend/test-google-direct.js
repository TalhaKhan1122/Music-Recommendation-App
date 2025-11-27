// Direct test of Google OAuth endpoint
require('dotenv').config({ path: './.env' });

const http = require('http');

console.log('🧪 Testing Google OAuth Endpoint Directly...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/google',
  method: 'GET',
  headers: {
    'User-Agent': 'Test-Script'
  }
};

console.log('Making GET request to: http://localhost:5000/api/auth/google\n');

const req = http.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 Response Headers:`);
  Object.keys(res.headers).forEach(key => {
    console.log(`   ${key}: ${res.headers[key]}`);
  });
  
  console.log('\n');
  
  if (res.statusCode === 302 || res.statusCode === 301) {
    const location = res.headers.location;
    console.log(`✅ SUCCESS! Got redirect response`);
    console.log(`📍 Redirect Location: ${location?.substring(0, 150)}...`);
    
    if (location?.includes('accounts.google.com')) {
      console.log('\n✅ Redirect URL points to Google OAuth!');
      console.log('   The endpoint is working correctly.');
    } else if (location?.includes('localhost:5173')) {
      console.log('\n⚠️  Redirects to frontend, not Google.');
      console.log('   This suggests an error occurred.');
    } else {
      console.log('\n⚠️  Unexpected redirect location.');
    }
  } else if (res.statusCode === 503) {
    console.log(`\n❌ ERROR: Service Unavailable`);
    console.log(`   Google OAuth credentials are not configured.`);
  } else if (res.statusCode === 500) {
    console.log(`\n❌ ERROR: Internal Server Error`);
    console.log(`   Check backend console for error details.`);
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
        console.log('\n📄 Response Body (JSON):');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('\n📄 Response Body:');
        console.log(data.substring(0, 500));
      }
    }
    
    console.log('\n');
    console.log('💡 If you see a Google OAuth URL in the Location header,');
    console.log('   the backend is working correctly!');
    console.log('   The issue might be with the frontend redirect.');
    console.log('\n');
  });
});

req.on('error', (error) => {
  console.error(`\n❌ ERROR: Cannot connect to backend server!`);
  console.error(`   ${error.message}`);
  console.error(`\n💡 Make sure backend server is running:`);
  console.error(`   cd backend && npm run dev`);
  console.error(`\n`);
});

req.setTimeout(5000, () => {
  console.error('\n❌ ERROR: Request timeout');
  console.error('   Backend server is not responding.');
  req.destroy();
});

req.end();

