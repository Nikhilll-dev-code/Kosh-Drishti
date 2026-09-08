const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB limit per SRS ERR-ING-02

const api = require('../controllers/apiControllers');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/auth');

// Public Dashboard & Analytics Endpoints
router.get('/dashboard/summary', api.getDashboardSummary);
router.get('/constituencies', api.getConstituencies);
router.get('/data-quality', api.getDataQuality);
router.get('/risk/geography', api.getGeographicRisk);
router.get('/analytics/financial', api.getFinancialAnalytics);
router.get('/analytics/rules', api.getRuleAnalytics);
router.get('/analytics/agencies', api.getAgencyAnalytics);
router.get('/states', api.getStates);
router.get('/states/:stateName', api.getStateDetails);
router.get('/mps/:mp_id', api.getMPProfile);
router.get('/works', api.getWorks);
router.get('/works/:work_id', api.getWorkDetail);
router.post('/works/:work_id/reanalyze', api.reanalyzeWork);

// Authentication & Profile Endpoints
router.post('/auth/register', api.register);
router.post('/auth/login', api.login);

// AI Explanation Endpoint (public - for demo display)
router.post('/explain', api.explainWork);

// Auditor Case Management Endpoints
router.get('/cases', api.getCases);
router.get('/cases/:case_id/pdf', api.generateCasePDF);
router.patch('/cases/:case_id/status', requireAuth, requireRole(['Auditor', 'Administrator']), api.updateCaseStatus);
router.post('/cases/:case_id/notes', requireAuth, requireRole(['Auditor', 'Administrator']), api.addCaseNote);
router.post('/cases/:case_id/assign', requireAuth, requireRole(['Administrator']), api.assignCase);

// Data Ingestion & Curator Endpoints (Requires Curator or Admin role)
router.post('/ingest', requireAuth, requireRole(['Curator', 'Administrator']), upload.single('file'), api.ingestCSV);
router.post('/admin/works/import', requireAuth, requireRole(['Curator', 'Administrator']), upload.single('file'), api.importWorks);
router.post('/admin/re-score', requireAuth, requireRole(['Curator', 'Administrator']), api.triggerScoringPipeline);

// Administrator Endpoints (Requires Admin role)
router.get('/admin/users', requireAuth, requireRole(['Administrator']), api.getAdminUsers);
router.post('/admin/users/:user_id/approve', requireAuth, requireRole(['Administrator']), api.approveUser);
router.get('/admin/config', requireAuth, requireRole(['Administrator']), api.getRuleConfig);
router.put('/admin/config', requireAuth, requireRole(['Administrator']), api.updateRuleConfig);
router.get('/admin/audit-log', requireAuth, requireRole(['Administrator']), api.getAuditLogs);

module.exports = router;