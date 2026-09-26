import { Router } from 'express';
import { adjustments } from '../controllers/operationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', adjustments.index);
router.post('/', adjustments.create);
router.get('/:id', adjustments.show);
router.put('/:id', adjustments.update);
router.post('/:id/validate', adjustments.validate);
router.post('/:id/cancel', adjustments.cancel);

export default router;
