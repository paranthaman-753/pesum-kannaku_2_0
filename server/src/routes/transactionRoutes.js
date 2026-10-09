import { Router } from 'express';
import { createTransaction, listTransactions } from '../controllers/transactionController.js';

const router = Router();
router.post('/', createTransaction);
router.get('/', listTransactions);

export default router;
