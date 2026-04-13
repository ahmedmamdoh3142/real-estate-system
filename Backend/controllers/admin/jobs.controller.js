const jobsService = require('../../services/admin/jobs.service');

// ==================== طلبات التوظيف (Applications) ====================

exports.getAllApplications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            sort = 'newest',
            search = '',
            status = '',
            department = '',
            job_type = '',
            experience = '',
            education = '',
            nationality = '',
            city = '',
            gender = '',
            residence = '',
            region = '',
            marital = '',
            disability = '',
            employment_status = '',
            transferable = '',
            notice_period = '',
            previous_contact = '',
            date = ''
        } = req.query;

        const filters = {
            search: search || '',
            status: status ? status.split(',') : [],
            department: department ? department.split(',') : [],
            job_type: job_type ? job_type.split(',') : [],
            experience: experience ? experience.split(',') : [],
            education: education ? education.split(',') : [],
            nationality: nationality ? nationality.split(',') : [],
            city: city ? city.split(',') : [],
            gender: gender ? gender.split(',') : [],
            residence: residence ? residence.split(',') : [],
            region: region ? region.split(',') : [],
            marital: marital ? marital.split(',') : [],
            disability: disability ? disability.split(',') : [],
            employment_status: employment_status ? employment_status.split(',') : [],
            transferable: transferable ? transferable.split(',') : [],
            notice_period: notice_period ? notice_period.split(',') : [],
            previous_contact: previous_contact ? previous_contact.split(',') : [],
            date: date ? date.split(',') : []
        };

        const result = await jobsService.getAllApplications(
            parseInt(page),
            parseInt(limit),
            sort,
            filters
        );

        res.json({
            success: true,
            message: 'تم جلب طلبات التوظيف بنجاح',
            data: result.applications,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('❌ getAllApplications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await jobsService.getApplicationById(parseInt(id));
        if (!application) {
            return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
        }
        res.json({ success: true, data: application });
    } catch (error) {
        console.error('❌ getApplicationById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createApplication = async (req, res) => {
    try {
        const newApplication = await jobsService.createApplication(req.body);
        res.status(201).json({ success: true, message: 'تم إنشاء الطلب بنجاح', data: newApplication });
    } catch (error) {
        console.error('❌ createApplication error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await jobsService.updateApplication(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث الطلب بنجاح', data: updated });
    } catch (error) {
        console.error('❌ updateApplication error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        await jobsService.deleteApplication(parseInt(id));
        res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
    } catch (error) {
        console.error('❌ deleteApplication error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getApplicationsStats = async (req, res) => {
    try {
        const stats = await jobsService.getApplicationsStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getApplicationsStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportApplications = async (req, res) => {
    try {
        const data = await jobsService.exportApplications();
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ exportApplications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== إدارة الوظائف (Jobs) ====================

exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await jobsService.getAllJobs();
        res.json({ success: true, data: jobs });
    } catch (error) {
        console.error('❌ getAllJobs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await jobsService.getJobById(parseInt(id));
        if (!job) {
            return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة' });
        }
        res.json({ success: true, data: job });
    } catch (error) {
        console.error('❌ getJobById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createJob = async (req, res) => {
    try {
        const newJob = await jobsService.createJob(req.body);
        res.status(201).json({ success: true, message: 'تم إضافة الوظيفة بنجاح', data: newJob });
    } catch (error) {
        console.error('❌ createJob error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await jobsService.updateJob(parseInt(id), req.body);
        res.json({ success: true, message: 'تم تحديث الوظيفة بنجاح', data: updated });
    } catch (error) {
        console.error('❌ updateJob error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await jobsService.deleteJob(parseInt(id));
        res.json({ success: true, message: 'تم حذف الوظيفة بنجاح' });
    } catch (error) {
        console.error('❌ deleteJob error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getJobsStats = async (req, res) => {
    try {
        const stats = await jobsService.getJobsStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ getJobsStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};