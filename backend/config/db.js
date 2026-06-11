const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('[CRITICAL] MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Log clean connection metadata without flooding logs
    console.log(`🚀 Database operational: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Database connection failure: ${error.message}`);
    process.exit(1);
  }
};

// Monitor connection stability during app lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection dropped. Retrying to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error(`💥 Unexpected MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;