import mongoose from 'mongoose';
import Adjustment from '../models/Adjustment.js';
import Category from '../models/Category.js';
import Counter from '../models/Counter.js';
import Delivery from '../models/Delivery.js';
import Location from '../models/Location.js';
import Product from '../models/Product.js';
import Receipt from '../models/Receipt.js';
import ReorderRule from '../models/ReorderRule.js';
import StockLedger from '../models/StockLedger.js';
import StockLevel from '../models/StockLevel.js';
import Transfer from '../models/Transfer.js';
import User from '../models/User.js';
import Warehouse from '../models/Warehouse.js';

const models = [
  User, Category, Warehouse, Location, Product, StockLevel, ReorderRule,
  Counter, Receipt, Delivery, Transfer, Adjustment, StockLedger,
];

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

export async function ensureCollections() {
  for (const model of models) {
    await model.createCollection();
    await model.syncIndexes();
  }
}

export { models };
