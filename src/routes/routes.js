import express from 'express';
import { handleError } from '../middleware/errorHandler.js';
import { handleRegisterStart, handleRegisterFinish } from '../controllers/registration.js';
import { handleLoginStart, handleLoginFinish } from '../controllers/authentication.js';

const router = express.Router();

router.post('/registerStart', handleRegisterStart);
router.post('/registerFinish', handleRegisterFinish);
router.post('/loginStart', handleLoginStart);
router.post('/loginFinish', handleLoginFinish);

router.use(handleError);

export { router };