import { Router } from 'express';
import { listLedger } from '../controllers/catalogController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', listLedger);

export default router;
