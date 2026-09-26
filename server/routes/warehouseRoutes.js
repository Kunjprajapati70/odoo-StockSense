import { Router } from 'express';
import {
  createLocation,
  createWarehouse,
  listLocations,
  listWarehouses,
  updateLocation,
  updateWarehouse,
} from '../controllers/catalogController.js';
import { authorize, requireAuth } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const manager = authorize(ROLES.MANAGER);

router.use(requireAuth);
router.get('/', listWarehouses);
router.post('/', manager, createWarehouse);
router.put('/:id', manager, updateWarehouse);
router.get('/locations/all', listLocations);
router.post('/locations', manager, createLocation);
router.put('/locations/:id', manager, updateLocation);

export default router;
