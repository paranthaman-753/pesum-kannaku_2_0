import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer } from '../controllers/customerController.js';

const router = Router();
router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);

export default router;
