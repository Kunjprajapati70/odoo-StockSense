import { Router } from 'express';
import * as products from '../controllers/productController.js';
import { authorize, requireAuth } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const manager = authorize(ROLES.MANAGER);

router.use(requireAuth);
router.get('/options', products.options);
router.get('/', products.index);
router.get('/:id', products.show);
router.post('/', manager, products.create);
router.put('/:id', manager, products.update);
router.delete('/:id', manager, products.remove);

export default router;
