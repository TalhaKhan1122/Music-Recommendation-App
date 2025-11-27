// Quick test script to verify Google OAuth configuration
require('dotenv').config({ path: './.env' });

console.log('🧪 Testing Google OAuth Configuration...\n');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

console.log('📋 Configuration Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 30)}...` : '❌ MISSING');
console.log('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? `${GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : '❌ MISSING');
console.log('FRONTEND_URL:', FRONTEND_URL);
console.log('BACKEND_URL:', BACKEND_URL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ ERROR: Google OAuth credentials are missing!');
  console.error('   Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.\n');
  process.exit(1);
}

if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
  console.warn('⚠️  WARNING: GOOGLE_CLIENT_ID format looks incorrect.');
  console.warn('   Expected format: xxxxxx-xxxxx.apps.googleusercontent.com\n');
}

if (GOOGLE_CLIENT_SECRET.length < 20) {
  console.warn('⚠️  WARNING: GOOGLE_CLIENT_SECRET seems too short.');
  console.warn('   Expected length: ~40+ characters\n');
}

// Test redirect URI
const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;
console.log('🔗 Expected Redirect URI:', redirectUri);
console.log('\n✅ Configuration looks good!');
console.log('\n📝 Next steps:');
console.log('   1. Make sure this redirect URI is added in Google Cloud Console');
console.log('   2. Verify OAuth consent screen is configured');
console.log('   3. Restart your backend server');
console.log('   4. Test the OAuth flow in your frontend\n');

