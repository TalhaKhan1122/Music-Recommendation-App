// Simple Spotify API test script
require('dotenv').config();
const axios = require('axios');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

async function testSpotify() {
  try {
    console.log('🔄 Testing Spotify API connection...');
    
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('❌ Spotify credentials not found!');
      console.error('   Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env file');
      process.exit(1);
    }

    console.log('✅ Credentials found');
    console.log('🔑 Client ID:', SPOTIFY_CLIENT_ID.substring(0, 10) + '...');

    // Get access token
    console.log('🔄 Getting access token...');
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    console.log('✅ Access token obtained!');
    const token = tokenResponse.data.access_token;

    // Test search
    console.log('🔄 Testing search for "happy upbeat" tracks...');
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: 'happy upbeat',
        type: 'track',
        limit: 5,
        market: 'US',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const tracks = searchResponse.data.tracks.items;
    console.log(`✅ Found ${tracks.length} tracks!`);
    
    if (tracks.length > 0) {
      console.log('\n📀 Sample track:');
      console.log('   Name:', tracks[0].name);
      console.log('   Artist:', tracks[0].artists[0].name);
      console.log('   Preview URL:', tracks[0].preview_url || 'Not available');
    }

    console.log('\n✅ Spotify API is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Spotify API test failed!');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n💡 Issue: Invalid credentials');
      console.error('   Please verify your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
    } else if (error.response?.status === 400) {
      console.error('\n💡 Issue: Bad request');
      console.error('   Please check your Spotify app settings');
    }
    
    process.exit(1);
  }
}

testSpotify();

