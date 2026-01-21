import express from 'express';
import {
  getAllSessions,
  getSessionById,
  getSessionByToken,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.get('/token/:token', getSessionByToken);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
