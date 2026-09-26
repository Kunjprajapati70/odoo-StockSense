import { Router } from 'express';
import { deleteReorderRule, listReorderRules, saveReorderRule } from '../controllers/catalogController.js';
import { authorize, requireAuth } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const manager = authorize(ROLES.MANAGER);

router.use(requireAuth);
router.get('/', listReorderRules);
router.post('/', manager, saveReorderRule);
router.delete('/:id', manager, deleteReorderRule);

export default router;
