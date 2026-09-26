import { Router } from 'express';
import { transfers } from '../controllers/operationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', transfers.index);
router.post('/', transfers.create);
router.get('/:id', transfers.show);
router.put('/:id', transfers.update);
router.post('/:id/validate', transfers.validate);
router.post('/:id/cancel', transfers.cancel);

export default router;
