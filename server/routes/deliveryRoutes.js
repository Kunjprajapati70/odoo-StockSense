import { Router } from 'express';
import { deliveries } from '../controllers/operationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', deliveries.index);
router.post('/', deliveries.create);
router.get('/:id', deliveries.show);
router.put('/:id', deliveries.update);
router.post('/:id/validate', deliveries.validate);
router.post('/:id/cancel', deliveries.cancel);

export default router;
