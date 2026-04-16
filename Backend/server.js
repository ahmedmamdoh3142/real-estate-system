// Backend/server.js - Production Ready with mssql (tedious)
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = require('./app');
const sql = require('mssql');

const PORT = process.env.PORT || 3001;

// ==================== إعدادات قاعدة البيانات ====================
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// ==================== START LOGS ====================
console.log('\n' + '🚀'.repeat(10));
console.log('بدء تشغيل نظام إدارة العقارات');
console.log('='.repeat(50));
console.log('📅 التاريخ:', new Date().toLocaleString('ar-SA'));
console.log('💻 المنفذ:', PORT);

// ==================== إضافة خدمة الملفات الثابتة (Static Files) ====================
const uploadsPath = path.join(__dirname, 'uploads');
console.log(`📁 مسار مجلد المرفقات: ${uploadsPath}`);

// التأكد من وجود المجلد
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('📁 تم إنشاء مجلد uploads');
}

// الحل الأول: استخدام express.static (الأفضل)
app.use('/uploads', express.static(uploadsPath));
console.log('✅ تم تفعيل خدمة الملفات الثابتة للمجلد: uploads');

// الحل الثاني: مسار مخصص كنسخة احتياطية (للتأكد من العمل في كل الأحوال)
app.get('/uploads/*', (req, res) => {
    // استخراج المسار بعد /uploads/
    const filePath = req.params[0];
    const fullPath = path.join(uploadsPath, filePath);
    
    // التحقق من وجود الملف
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.warn(`⚠️ ملف غير موجود: ${fullPath}`);
            return res.status(404).json({ 
                success: false, 
                message: 'الملف غير موجود',
                path: req.path
            });
        }
        // إرسال الملف
        res.sendFile(fullPath);
    });
});
console.log('✅ تم تفعيل المسار المخصص للملفات كنسخة احتياطية');

// ==================== الاتصال بقاعدة البيانات ====================
let pool = null;

async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        global.dbPool = pool;
        console.log('✅ قاعدة البيانات متصلة بنجاح!');
        app.locals.dbConnected = true;
        app.locals.dbPool = pool;

        try {
            const result = await pool.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM Projects) as projects,
                    (SELECT COUNT(*) FROM Users) as users
            `);
            console.log(`📊 الإحصائيات: ${result.recordset[0].projects} مشروع, ${result.recordset[0].users} مستخدم`);
        } catch (err) {
            console.log('⚠️ لا يمكن قراءة الإحصائيات:', err.message);
        }

        return true;
    } catch (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        app.locals.dbConnected = false;
        app.locals.dbPool = null;
        return false;
    }
}

// ==================== بدء الخادم ====================
async function startServer() {
    await connectToDatabase();

    const server = app.listen(PORT, () => {
        console.log('\n' + '🎉'.repeat(10));
        console.log('✅ نظام إدارة العقارات يعمل الآن!');
        console.log('='.repeat(50));
        console.log(`📍 الرابط: http://localhost:${PORT}`);
        console.log('📡 APIs متاحة:');
        console.log('   GET  /api/health');
        console.log('   GET  /api/public/home/stats');
        console.log('   GET  /api/public/home/featured-projects');
        console.log('   GET  /uploads/* (الملفات المرفوعة)');
        console.log('\n⚡ جاهز لاستقبال الطلبات!');

        if (!app.locals.dbConnected) {
            console.log('\n⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
            console.log('⚠️ قاعدة البيانات غير متصلة');
            console.log('⚠️ النظام يعمل ببيانات افتراضية');
            console.log('⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
        }
    });

    process.on('SIGINT', async () => {
        console.log('\n👋 إيقاف الخادم...');
        if (pool) {
            await pool.close();
            console.log('✅ تم إغلاق اتصال قاعدة البيانات');
        }
        server.close(() => {
            console.log('✅ تم إغلاق الخادم بنجاح');
            process.exit(0);
        });
    });
}

startServer();