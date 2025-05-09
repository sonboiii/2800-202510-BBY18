const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}` +
  `@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;
let db;
let client; 

async function connectDB() {
  if (db) return db; // Return existing connection if it exists

  try {
    // Create a new MongoClient instance
    client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB connected');
    db = client.db(process.env.MONGODB_DATABASE)
    return db;
  } catch (err) {
    console.error('Connection error:', err);
    throw err; // Rethrow the error if needed
  }
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

module.exports = { connectDB, closeDB, uri };