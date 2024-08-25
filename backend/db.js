const mongoose = require('mongoose');
require('dotenv').config(); // If you're using environment variables to store sensitive info

const connectDB = async () => {
  try {
    // Replace 'your_connection_string' with the actual connection string
    await mongoose.connect(process.env.MONGO_URI || 'your_connection_string', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
