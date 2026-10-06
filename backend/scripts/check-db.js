import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { getQuotaCollection } from '../lib/generation-quota.js';

try {
  if (!process.env.MONGO_URI?.trim() && !process.env.MONGODB_URI?.trim()) {
    throw new Error('Set MONGODB_URI in backend/.env. For local development, start npm run dev:db first.');
  }
  const connection = await connectDB();
  if (!connection?.db) throw new Error('Database connection failed. Check that MongoDB is running and the configured URI is correct.');
  await connection.db.command({ ping: 1 }, { maxTimeMS: 3000 });
  await getQuotaCollection();
  console.log('MongoDB connection and quota index verified. Quota concurrency can be checked against a dedicated test database with MONGO_QUOTA_TEST_URI.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
