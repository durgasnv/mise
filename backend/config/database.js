import mongoose from "mongoose";

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI or MONGODB_URI in environment.");
  }

  mongoose.set("strictQuery", true);
  connectionPromise ??= mongoose.connect(mongoUri).catch((error) => {
    connectionPromise = null;
    throw error;
  });

  const connection = await connectionPromise;
  console.log(`MongoDB connected: ${connection.connection.host}`);

  return connection.connection;
}
