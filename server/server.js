import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stocksense';

const server = app.listen(PORT, () => {
  console.log(`StockSense API listening on port ${PORT}`);
});

connectDB(MONGO_URI).catch((error) => {
  console.error(`MongoDB connection failed: ${error.message}`);
});

function shutdown() {
  server.close(() => {
    mongoose.connection.close().finally(() => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
