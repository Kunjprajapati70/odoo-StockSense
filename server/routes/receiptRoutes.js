import { Router } from 'express';
import { receipts } from '../controllers/operationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', receipts.index);
router.post('/', receipts.create);
router.get('/:id', receipts.show);
router.put('/:id', receipts.update);
router.post('/:id/validate', receipts.validate);
router.post('/:id/cancel', receipts.cancel);

export default router;
