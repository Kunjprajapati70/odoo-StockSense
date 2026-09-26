import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/catalogController.js';
import { authorize, requireAuth } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const manager = authorize(ROLES.MANAGER);

router.use(requireAuth);
router.get('/', listCategories);
router.post('/', manager, createCategory);
router.put('/:id', manager, updateCategory);
router.delete('/:id', manager, deleteCategory);

export default router;
