// Backend/test-simple.js
const sql = require('msnodesqlv8');

require('dotenv').config();
const connectionString = process.env.DB_CONNECTION_STRING;

console.log('🔍 اختبار اتصال قاعدة البيانات...');
console.log('📁 سلسلة الاتصال:', connectionString);

sql.query(connectionString, "SELECT DB_NAME() as dbName, @@SERVERNAME as serverName", (err, rows) => {
    if (err) {
        console.error('❌ فشل الاتصال:', err.message);
        console.log('\n🛠️ استكشاف الأخطاء وإصلاحها:');
        console.log('1. تأكد من تشغيل SQL Server');
        console.log('2. جرب تشغيل الخدمات:');
        console.log('   - SQL Server (MSSQL$ATTENDANCE)');
        console.log('   - SQL Server Browser');
        console.log('3. تحقق من اسم السيرفر في SQL Server Management Studio');
    } else {
        console.log('✅ تم الاتصال بنجاح!');
        console.log('📊 معلومات قاعدة البيانات:');
        console.log('   - اسم قاعدة البيانات:', rows[0].dbName);
        console.log('   - اسم السيرفر:', rows[0].serverName);
        
        // اختبار قراءة جدول
        sql.query(connectionString, "SELECT TOP 3 id, projectName FROM Projects", (err2, projects) => {
            if (err2) {
                console.log('⚠️ تعذر قراءة جدول Projects:', err2.message);
            } else {
                console.log(`📋 عدد المشاريع المتاحة: ${projects.length}`);
                projects.forEach((p, i) => {
                    console.log(`   ${i+1}. ${p.projectName} (ID: ${p.id})`);
                });
            }
        });
    }
});