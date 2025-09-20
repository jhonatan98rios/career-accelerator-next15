import mongoose, { Connection } from "mongoose";
import { log, LogLevel } from "@/lib/logger";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGO_DB_NAME || "career-accelerator-dev";

// This will survive across hot reloads in dev and across invocations in prod
let cached = (global as any).mongoose as {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false, // avoids memory bloat in serverless
    });
  }

  try {
    cached.conn = (await cached.promise).connection;
    await log(LogLevel.INFO, "✅ MongoDB connected (reused)");
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}