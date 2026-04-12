// Backend/server.js - Production Ready (Fixed)
require('dotenv').config();

const app = require('./app');
const sql = require('msnodesqlv8');

const PORT = process.env.PORT || 3001;

// ==================== START LOGS ====================
console.log('\n' + '🚀'.repeat(10));
console.log('بدء تشغيل نظام إدارة العقارات');
console.log('='.repeat(50));
console.log('📅 التاريخ:', new Date().toLocaleString('ar-SA'));
console.log('💻 المنفذ:', PORT);

// ==================== CONNECTION STRING ====================
const connectionString = process.env.DB_CONNECTION_STRING;

if (!connectionString) {
    console.error('❌ DB_CONNECTION_STRING غير موجود في .env');
    process.exit(1);
}

console.log('📁 قاعدة البيانات: RealEstateDB');
console.log('🔌 بدء اختبار الاتصال...');

// ==================== TEST DATABASE ====================
sql.query(connectionString, "SELECT 1 as test", (err, rows) => {
    if (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);

        console.log('\n⚠️ سيتم تشغيل الخادم بدون قاعدة البيانات');
        app.locals.dbConnected = false;

        startServer();
    } else {
        console.log('✅ قاعدة البيانات متصلة بنجاح!');
        app.locals.dbConnected = true;

        // ==================== QUICK STATS ====================
        sql.query(
            connectionString,
            `
            SELECT 
                (SELECT COUNT(*) FROM Projects) as projects,
                (SELECT COUNT(*) FROM Users) as users
            `,
            (err2, stats) => {
                if (!err2 && stats && stats.length > 0) {
                    console.log(
                        `📊 الإحصائيات: ${stats[0].projects} مشروع, ${stats[0].users} مستخدم`
                    );
                }

                startServer();
            }
        );
    }
});

// ==================== START SERVER ====================
function startServer() {
    const server = app.listen(PORT, () => {
        console.log('\n' + '🎉'.repeat(10));
        console.log('✅ نظام إدارة العقارات يعمل الآن!');
        console.log('='.repeat(50));
        console.log(`📍 الرابط: http://localhost:${PORT}`);
        console.log('📡 APIs متاحة:');
        console.log('   GET  /api/health');
        console.log('   GET  /api/public/home/stats');
        console.log('   GET  /api/public/home/featured-projects');
        console.log('\n⚡ جاهز لاستقبال الطلبات!');

        if (!app.locals.dbConnected) {
            console.log('\n⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
            console.log('⚠️ قاعدة البيانات غير متصلة');
            console.log('⚠️ النظام يعمل ببيانات افتراضية');
            console.log('⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️');
        }
    });

    // ==================== GRACEFUL SHUTDOWN ====================
    process.on('SIGINT', () => {
        console.log('\n👋 إيقاف الخادم...');

        server.close(() => {
            console.log('✅ تم إغلاق الخادم بنجاح');
            process.exit(0);
        });
    });
}