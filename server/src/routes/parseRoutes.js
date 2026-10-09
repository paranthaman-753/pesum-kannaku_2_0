import { Router } from 'express';
import { parseText } from '../controllers/parseController.js';

const router = Router();
router.post('/', parseText);

export default router;
