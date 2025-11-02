import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getConnectionStatus } from './config/db.config';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  const dbStatus = getConnectionStatus();
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

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
    
    // Verify connection status
    const dbStatus = getConnectionStatus();
    if (dbStatus !== 'connected') {
      console.error(`❌ MongoDB connection failed. Status: ${dbStatus}`);
      console.error('❌ Server cannot start without database connection');
      process.exit(1);
    } else {
      console.log('✅ MongoDB connection verified');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API info: http://localhost:${PORT}/api`);
      console.log(`💾 Database status: ${getConnectionStatus()}`);
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

