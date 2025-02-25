// src/app/lib/mongodb.js
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // Trong development, sử dụng biến global để tránh tạo nhiều kết nối khi hot reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Ở production, tạo kết nối mới
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Hàm kết nối đến MongoDB và trả về { client, db }
 */
export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  return { client, db };
}
