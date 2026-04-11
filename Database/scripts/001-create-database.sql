/*
📁 المسار: Database/scripts/001-create-database.sql
🔗 الاتصال: ملف منفصل للتشغيل أولاً
🎨 الغرض: إنشاء قاعدة البيانات والتحقق من وجودها
*/

-- 1. التحقق من وجود قاعدة البيانات وإنشاؤها إذا لزم
USE master;
GO

IF EXISTS(SELECT * FROM sys.databases WHERE name = 'abh')
BEGIN
    -- إذا كانت القاعدة موجودة، نسأل المستخدم
    PRINT '⚠️  قاعدة البيانات "abh" موجودة بالفعل.';
    PRINT '   إذا كنت تريد إعادة إنشاء القاعدة، احذفها أولاً يدوياً من SSMS.';
    PRINT '   أو اضغط F5 للمتابعة بدون إنشاء قاعدة جديدة.';
END
ELSE
BEGIN
    -- إنشاء قاعدة البيانات جديدة
    CREATE DATABASE abh
    ON PRIMARY 
    (
        NAME = 'abh_data',
        FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL16.ATTENDANCE\MSSQL\DATA\abh.mdf',
        SIZE = 50MB,
        MAXSIZE = UNLIMITED,
        FILEGROWTH = 10MB
    )
    LOG ON 
    (
        NAME = 'abh_log',
        FILENAME = 'C:\Program Files\Microsoft SQL Server\MSSQL16.ATTENDANCE\MSSQL\DATA\abh_log.ldf',
        SIZE = 10MB,
        MAXSIZE = 1GB,
        FILEGROWTH = 5MB
    );
    
    PRINT '✅ تم إنشاء قاعدة البيانات "abh" بنجاح.';
END
GO

-- 2. استخدام قاعدة البيانات الجديدة
USE abh;
GO

-- 3. إنشاء مخططات (Schemas) للتنظيم
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'core')
    EXEC('CREATE SCHEMA core');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'realestate')
    EXEC('CREATE SCHEMA realestate');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'financial')
    EXEC('CREATE SCHEMA financial');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'audit')
    EXEC('CREATE SCHEMA audit');
GO

PRINT '✅ تم إنشاء المخططات التنظيمية.';
GO