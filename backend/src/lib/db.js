//mongodb connection logic
import mongoose from 'mongoose'
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  }
}