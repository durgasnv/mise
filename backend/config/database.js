import mongoose from "mongoose";

let connectionPromise = null;
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    // Graceful skip if no MongoDB configured
    return null;
  }

  connectionPromise ??= mongoose.connect(mongoUri).catch((error) => {
    connectionPromise = null;
    console.warn("MongoDB connection notice:", error.message);
    return null;
  });

  const connection = await connectionPromise;
  if (connection?.connection?.host) {
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection.connection;
  }
  return null;
}

