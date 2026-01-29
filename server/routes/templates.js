import express from 'express';
import {
  getAllTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementViewCount,
  getTemplatesWithStats,
} from '../controllers/templateController.js';

const router = express.Router();

router.get('/', getAllTemplates);
router.get('/with-stats', getTemplatesWithStats);
router.get('/slug/:slug', getTemplateBySlug);
router.post('/slug/:slug/view', incrementViewCount);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
