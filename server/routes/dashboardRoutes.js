import { Router } from 'express';
import { dashboard } from '../controllers/operationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', dashboard);

export default router;
