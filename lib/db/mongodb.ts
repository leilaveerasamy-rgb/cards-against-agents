import mongoose from 'mongoose';

const MONGODB_DB = process.env.MONGODB_DB || 'cah-agents';

let cached = (globalThis as any).mongoose;
if (!cached) cached = (globalThis as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI environment variable');
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
