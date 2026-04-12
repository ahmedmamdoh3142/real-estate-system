const express = require('express');
const router = express.Router();
const jobsController = require('/controllers/admin/jobs.controller');

// ==================== مسارات طلبات التوظيف ====================
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Jobs API is running with real database (msnodesqlv8)' });
});

router.get('/stats', jobsController.getApplicationsStats);
router.get('/', jobsController.getAllApplications);
router.get('/:id', jobsController.getApplicationById);
router.post('/', jobsController.createApplication);
router.put('/:id', jobsController.updateApplication);
router.delete('/:id', jobsController.deleteApplication);
router.get('/export/export-data', jobsController.exportApplications);

// ==================== مسارات إدارة الوظائف (Jobs) ====================
// GET    /api/admin/jobs/jobs-list          - جلب كل الوظائف
// GET    /api/admin/jobs/jobs/:id           - جلب وظيفة محددة
// POST   /api/admin/jobs/create             - إضافة وظيفة جديدة (مستخدم من الواجهة)
// PUT    /api/admin/jobs/jobs/:id           - تحديث وظيفة
// DELETE /api/admin/jobs/jobs/:id           - حذف وظيفة
// GET    /api/admin/jobs/jobs-stats         - إحصائيات الوظائف

router.get('/jobs-list', jobsController.getAllJobs);
router.get('/jobs/:id', jobsController.getJobById);
router.post('/create', jobsController.createJob);
router.put('/jobs/:id', jobsController.updateJob);
router.delete('/jobs/:id', jobsController.deleteJob);
router.get('/jobs-stats', jobsController.getJobsStats);

module.exports = router;