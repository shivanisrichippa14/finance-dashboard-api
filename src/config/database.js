const mongoose = require("mongoose");

// This function connects to MongoDB and handles connection errors gracefully.
// We keep it separate from app.js so it's easy to mock in tests.
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    // If we can't connect to the database, the whole app is useless.
    // So we log the error and kill the process instead of running broken.
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
