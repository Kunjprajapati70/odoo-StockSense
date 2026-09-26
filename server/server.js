import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB, ensureCollections } from './config/db.js';
import { verifyMailer } from './utils/mailer.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stocksense';

const server = app.listen(PORT, () => {
  console.log(`StockSense API listening on port ${PORT}`);
  verifyMailer();
});

server.on('error', (error) => {
  console.error(`StockSense API could not listen on port ${PORT}: ${error.message}`);
  process.exit(1);
});

connectDB(MONGO_URI)
  .then(() => ensureCollections())
  .catch((error) => {
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
