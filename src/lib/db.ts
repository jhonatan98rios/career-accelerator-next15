import mongoose from 'mongoose';
import { log, LogLevel } from "@/lib/logger"

const MONGODB_URI = process.env.MONGODB_URI!;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  await log(LogLevel.INFO, "✅ MongoDB connected");

  return mongoose.connect(MONGODB_URI, {
    dbName: process.env.MONGO_DB_NAME || "career-accelerator-dev",
  });
}
