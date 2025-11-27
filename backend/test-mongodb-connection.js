// Comprehensive MongoDB Connection Diagnostic Script
const mongoose = require('mongoose');
const https = require('https');
require('dotenv').config();

// Get current public IP address
function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.ip);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Test MongoDB connection
async function testMongoDBConnection() {
  const MONGODB_URI = process.env.MONGODB_URI || 
    'mongodb+srv://tk42100678_db_user:dzGuoZjJJot7qRFX@cluster0.bet9lh6.mongodb.net/mr_app?retryWrites=true&w=majority';

  console.log('\n🔍 MongoDB Connection Diagnostic Tool\n');
  console.log('=' .repeat(60));
  
  // Step 1: Get public IP
  console.log('\n📡 Step 1: Getting your public IP address...');
  try {
    const publicIP = await getPublicIP();
    console.log(`   ✅ Your public IP address: ${publicIP}`);
    console.log(`\n   ⚠️  IMPORTANT: Add this IP to MongoDB Atlas Network Access whitelist!`);
    console.log(`   📝 Go to: https://cloud.mongodb.com/ → Network Access → Add IP Address`);
    console.log(`   💡 Or temporarily allow all IPs: 0.0.0.0/0 (NOT recommended for production)`);
  } catch (error) {
    console.log('   ⚠️  Could not fetch public IP:', error.message);
    console.log('   💡 You can find your IP at: https://www.whatismyip.com/');
  }

  // Step 2: Test connection
  console.log('\n📡 Step 2: Testing MongoDB connection...');
  console.log(`   🔗 Connection URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
  
  try {
    console.log('   ⏳ Attempting to connect (this may take up to 30 seconds)...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    
    console.log('\n   ✅ SUCCESS! MongoDB connection established!');
    console.log(`   📊 Database: ${mongoose.connection.name}`);
    console.log(`   🔗 Host: ${mongoose.connection.host}`);
    console.log(`   💾 Ready state: ${mongoose.connection.readyState} (1 = connected)`);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   📁 Collections found: ${collections.length}`);
    if (collections.length > 0) {
      console.log(`   📋 Collection names: ${collections.map(c => c.name).join(', ')}`);
    }
    
    await mongoose.connection.close();
    console.log('\n   🔌 Connection closed successfully');
    console.log('\n✅ All tests passed! Your MongoDB connection is working correctly.\n');
    process.exit(0);
    
  } catch (error) {
    console.log('\n   ❌ CONNECTION FAILED!');
    console.log(`   Error name: ${error.name}`);
    console.log(`   Error message: ${error.message}`);
    
    // Provide specific guidance based on error type
    if (error.name === 'MongooseServerSelectionError' || 
        error.message.includes('whitelist') ||
        error.message.includes('IP')) {
      console.log('\n   🔍 DIAGNOSIS: IP Whitelist Issue');
      console.log('   This error means your IP address is not whitelisted in MongoDB Atlas.');
      console.log('\n   📋 SOLUTION STEPS:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Select your project');
      console.log('   3. Click "Network Access" in the left sidebar');
      console.log('   4. Click "Add IP Address"');
      console.log('   5. Click "Add Current IP Address" (or enter your IP manually)');
      console.log('   6. Click "Confirm"');
      console.log('   7. Wait 1-2 minutes for changes to propagate');
      console.log('   8. Run this test again: node test-mongodb-connection.js');
      console.log('\n   💡 Quick fix (development only):');
      console.log('      - Add IP: 0.0.0.0/0 (allows all IPs - NOT secure for production)');
    } else if (error.message.includes('authentication') || error.name === 'MongoAuthenticationError') {
      console.log('\n   🔍 DIAGNOSIS: Authentication Issue');
      console.log('   Your username or password is incorrect.');
      console.log('\n   📋 SOLUTION STEPS:');
      console.log('   1. Check your MongoDB Atlas connection string');
      console.log('   2. Verify username and password in .env file');
      console.log('   3. Ensure database user exists and has proper permissions');
    } else if (error.message.includes('ENOTFOUND') || error.name === 'MongoNetworkError') {
      console.log('\n   🔍 DIAGNOSIS: Network/DNS Issue');
      console.log('   Cannot resolve MongoDB cluster hostname.');
      console.log('\n   📋 SOLUTION STEPS:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify DNS settings');
      console.log('   3. Check firewall/proxy settings');
    } else {
      console.log('\n   🔍 DIAGNOSIS: Unknown Error');
      console.log('   Please check the error details above.');
    }
    
    console.log('\n❌ Connection test failed. Please fix the issue above and try again.\n');
    process.exit(1);
  }
}

// Run the diagnostic
testMongoDBConnection();

