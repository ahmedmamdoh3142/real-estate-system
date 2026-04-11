const { validationResult } = require('express-validator');

/**
 * @desc    التحقق من صحة البيانات المدخلة
 * @param   {Object} req - طلب Express
 * @param   {Object} res - رد Express
 * @param   {Function} next - دالة الانتقال
 */
exports.validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg
        }));
        
        console.warn('⚠️ أخطاء في التحقق من الصحة:', errorMessages);
        
        return res.status(400).json({
            success: false,
            message: 'تحقق من صحة البيانات المدخلة',
            errors: errorMessages
        });
    }
    
    next();
};

