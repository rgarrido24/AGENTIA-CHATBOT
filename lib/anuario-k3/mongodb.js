import mongoose from 'mongoose';

const uri = process.env.ANUARIO_K3_MONGODB_URI || process.env.MONGODB_URI;
if (!uri) throw new Error('ANUARIO_K3_MONGODB_URI o MONGODB_URI no definida');

let cached = global.anuarioK3Mongoose;
if (!cached) cached = global.anuarioK3Mongoose = { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
