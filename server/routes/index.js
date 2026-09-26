import { Router } from 'express';
import mongoose from 'mongoose';
import adjustmentRoutes from './adjustmentRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import moveRoutes from './moveRoutes.js';
import productRoutes from './productRoutes.js';
import receiptRoutes from './receiptRoutes.js';
import reorderRoutes from './reorderRoutes.js';
import transferRoutes from './transferRoutes.js';
import warehouseRoutes from './warehouseRoutes.js';
import { alerts, listLocations, listUsers } from '../controllers/catalogController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', (req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, service: 'StockSense API', database });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/receipts', receiptRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/transfers', transferRoutes);
router.use('/adjustments', adjustmentRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/reorder-rules', reorderRoutes);
router.use('/moves', moveRoutes);
router.use('/ledger', moveRoutes);
router.use('/dashboard', dashboardRoutes);
router.get('/locations', requireAuth, listLocations);
router.get('/users', requireAuth, listUsers);
router.get('/alerts', requireAuth, alerts);

export default router;
