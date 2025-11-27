import mongoose from 'mongoose';

// Get MongoDB URI from environment (lazy evaluation)
// Don't validate at module load time - wait until connectDB is called
const getMongoDBUri = (): string => {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  // Validate connection string
  if (!MONGODB_URI || MONGODB_URI.trim() === '') {
    throw new Error('MONGODB_URI is not defined. Please set it in your .env file.');
  }
  
  return MONGODB_URI;
};

/**
 * Connect to MongoDB database
 * @returns Promise<void>
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Get MongoDB URI (validates at call time, not module load time)
    const MONGODB_URI = getMongoDBUri();
    
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('📦 MongoDB already connected');
      return;
    }

    // If connection is in progress or disconnecting, wait a bit
    if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
      console.log('⏳ MongoDB connection in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again
      if (mongoose.connection.readyState === 1) {
        console.log('📦 MongoDB connected after wait');
        return;
      }
      
      // If still not connected, close any stale connections
      if (mongoose.connection.readyState !== 0) {
        console.log('🔄 Closing stale connection...');
        await mongoose.connection.close();
      }
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`🔗 Connection URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`); // Hide password

    // Set up connection event handlers BEFORE connecting (only once)
    if (mongoose.connection.listeners('connected').length === 0) {
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
      });
    }

    // Connect to MongoDB with timeout and better error handling
    // Using simpler options that match the working test connection
    // MongoDB Atlas automatically uses TLS with mongodb+srv:// URIs
    const connectionOptions = {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      // Don't override TLS settings - let MongoDB handle it automatically
    };

    console.log('⏳ Connecting with options:', JSON.stringify(connectionOptions, null, 2));
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    // Verify connection was successful
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connection established successfully');
      console.log(`📊 Connected to database: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}`);
      console.log(`🔌 Port: ${mongoose.connection.port || 'default'}`);
    } else {
      throw new Error(`Connection state is ${mongoose.connection.readyState}, expected 1 (connected)`);
    }

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed due to application termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed due to application termination');
      process.exit(0);
    });

  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Handle specific error types
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔍 MongoDB Server Selection Error:');
      console.error('   Possible causes:');
      console.error('   1. Network connectivity issue');
      console.error('   2. MongoDB Atlas IP whitelist restriction');
      console.error('   3. DNS resolution failure');
      console.error('   4. Firewall blocking connection');
      console.error('   5. MongoDB Atlas cluster is paused or unavailable');
    }
    
    if (error.name === 'MongoNetworkError' || error.message?.includes('ENOTFOUND')) {
      console.error('🔍 Network Error:');
      console.error('   - Cannot resolve MongoDB cluster hostname');
      console.error('   - Check your internet connection');
      console.error('   - Verify DNS settings');
      console.error('   - Check firewall/proxy settings');
    }
    
    if (error.message?.includes('authentication') || error.name === 'MongoAuthenticationError') {
      console.error('🔍 Authentication Error:');
      console.error('   - Check username and password in connection string');
      console.error('   - Verify database user exists and has proper permissions');
      console.error('   - Check if user is locked or disabled');
    }

    if (error.message?.includes('ENOTFOUND')) {
      console.error('🔍 DNS Resolution Error:');
      console.error('   - Cannot resolve MongoDB cluster hostname');
      console.error('   - Check your internet connection');
      console.error('   - Verify DNS settings');
    }

    // Re-throw the error so the server startup can handle it properly
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns Promise<void>
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Get MongoDB connection status
 * @returns ConnectionState
 */
export const getConnectionStatus = (): string => {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

