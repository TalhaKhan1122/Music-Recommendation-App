import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
// This ensures .env is loaded before any module tries to read process.env
// Try multiple paths to find .env file
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

console.log('🔍 Looking for .env file...');
console.log('   Current working directory:', process.cwd());
console.log('   __dirname:', __dirname);

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const fs = require('fs');
    if (fs.existsSync(envPath)) {
      console.log(`   ✅ Found .env at: ${envPath}`);
      const result = dotenv.config({ path: envPath });
      if (!result.error) {
        envLoaded = true;
        console.log(`✅ Successfully loaded .env from: ${envPath}`);
        break;
      } else {
        console.log(`   ⚠️  Error loading from ${envPath}:`, result.error);
      }
    } else {
      console.log(`   ❌ Not found: ${envPath}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking ${envPath}:`, error);
  }
}

if (!envLoaded) {
  console.log('⚠️  Trying default dotenv.config()...');
  const result = dotenv.config();
  if (result.error) {
    console.error('❌ Failed to load .env file:', result.error);
  } else {
    console.log('✅ Loaded .env from default location');
    envLoaded = true;
  }
}

if (!envLoaded) {
  console.error('❌ CRITICAL: Could not load .env file from any location!');
  console.error('   Please ensure .env file exists in backend/ directory');
}

// Log environment variables status (for debugging)
console.log('🔍 Environment Variables Status:');
console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('   SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
console.log('   BACKEND_URL:', process.env.BACKEND_URL || 'http://localhost:5000');
console.log('');

import { connectDB } from './config/db.config';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to MR App API',
    version: '1.0.0',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      }
    }
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB before starting server
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API info: http://localhost:${PORT}/api`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.message || error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify MongoDB Atlas IP whitelist includes your IP');
    console.error('   3. Check MongoDB connection string credentials');
    console.error('   4. Ensure MongoDB Atlas cluster is running');
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;

