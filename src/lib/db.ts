import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  console.log("✅ MongoDB connected");

  return mongoose.connect(MONGODB_URI, {
    dbName: 'career-accelerator',
  });
}
