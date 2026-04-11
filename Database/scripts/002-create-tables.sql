/*
📁 المسار: Database/scripts/002-create-tables.sql
🔗 الاتصال: يعمل بعد إنشاء قاعدة البيانات
🎨 الغرض: إنشاء جميع الجداول والعلاقات
*/

USE abh;
GO

PRINT '🚀 بدء إنشاء الجداول...';
GO

-- ============================================
-- 1. جدول المستخدمين (النواة الأساسية)
-- ============================================
IF OBJECT_ID('Users', 'U') IS NOT NULL
    DROP TABLE Users;
GO

CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) UNIQUE NOT NULL,
    passwordHash NVARCHAR(255) NOT NULL,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    phone NVARCHAR(20),
    role NVARCHAR(50) NOT NULL CHECK (role IN ('موظف_استقبال', 'مدير_مشاريع', 'محاسب', 'مشرف_عام')),
    isActive BIT DEFAULT 1,
    lastLogin DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT CHK_Email CHECK (email LIKE '%@%.%')
);
GO

PRINT '✅ تم إنشاء جدول Users';

-- ============================================
-- 2. جدول المشاريع العقارية
-- ============================================
IF OBJECT_ID('Projects', 'U') IS NOT NULL
    DROP TABLE Projects;
GO

CREATE TABLE Projects (
    id INT PRIMARY KEY IDENTITY(1,1),
    projectCode NVARCHAR(20) UNIQUE NOT NULL,
    projectName NVARCHAR(200) NOT NULL,
    projectType NVARCHAR(50) NOT NULL CHECK (projectType IN ('سكني', 'تجاري', 'مكتبي', 'صناعي', 'فندقي')),
    description NVARCHAR(MAX),
    location NVARCHAR(300) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    district NVARCHAR(100),
    totalUnits INT NOT NULL,
    availableUnits INT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    priceType NVARCHAR(20) CHECK (priceType IN ('شراء', 'تأجير', 'إيجار_تشغيلي')),
    area DECIMAL(10,2) NOT NULL,
    areaUnit NVARCHAR(20) DEFAULT 'متر_مربع',
    bedrooms INT,
    bathrooms INT,
    isFeatured BIT DEFAULT 0,
    status NVARCHAR(30) NOT NULL CHECK (status IN ('قيد_الإنشاء', 'جاهز_للتسليم', 'مكتمل', 'معلق', 'مباع')),
    completionDate DATE,
    createdBy INT FOREIGN KEY REFERENCES Users(id),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT CHK_Units CHECK (availableUnits <= totalUnits AND availableUnits >= 0),
    CONSTRAINT CHK_Price CHECK (price > 0),
    CONSTRAINT CHK_Area CHECK (area > 0)
);
GO

-- إنشاء فهرس للبحث السريع
CREATE INDEX IX_Projects_Status ON Projects(status);
CREATE INDEX IX_Projects_City ON Projects(city);
CREATE INDEX IX_Projects_IsFeatured ON Projects(isFeatured);
GO

PRINT '✅ تم إنشاء جدول Projects';

-- ============================================
-- 3. جدول صور المشاريع
-- ============================================
IF OBJECT_ID('ProjectImages', 'U') IS NOT NULL
    DROP TABLE ProjectImages;
GO

CREATE TABLE ProjectImages (
    id INT PRIMARY KEY IDENTITY(1,1),
    projectId INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
    imageUrl NVARCHAR(500) NOT NULL,
    imageType NVARCHAR(50) CHECK (imageType IN ('صورة_رئيسية', 'صورة_داخلية', 'صورة_الموقع', 'مخطط')),
    displayOrder INT DEFAULT 0,
    isActive BIT DEFAULT 1,
    uploadedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT UQ_ProjectImage UNIQUE(projectId, imageUrl)
);
GO

PRINT '✅ تم إنشاء جدول ProjectImages';

-- ============================================
-- 4. جدول ميزات المشاريع
-- ============================================
IF OBJECT_ID('ProjectFeatures', 'U') IS NOT NULL
    DROP TABLE ProjectFeatures;
GO

CREATE TABLE ProjectFeatures (
    id INT PRIMARY KEY IDENTITY(1,1),
    projectId INT NOT NULL FOREIGN KEY REFERENCES Projects(id) ON DELETE CASCADE,
    featureName NVARCHAR(100) NOT NULL,
    featureValue NVARCHAR(200),
    icon NVARCHAR(100),
    displayOrder INT DEFAULT 0
);
GO

PRINT '✅ تم إنشاء جدول ProjectFeatures';

-- ============================================
-- 5. جدول الاستفسارات
-- ============================================
IF OBJECT_ID('Inquiries', 'U') IS NOT NULL
    DROP TABLE Inquiries;
GO

CREATE TABLE Inquiries (
    id INT PRIMARY KEY IDENTITY(1,1),
    inquiryCode AS ('INQ-' + RIGHT('00000' + CAST(id AS NVARCHAR(5)), 5)) PERSISTED,
    projectId INT FOREIGN KEY REFERENCES Projects(id),
    customerName NVARCHAR(100) NOT NULL,
    customerEmail NVARCHAR(100) NOT NULL,
    customerPhone NVARCHAR(20) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    inquiryType NVARCHAR(50) CHECK (inquiryType IN ('استفسار_عام', 'طلب_زيارة', 'طلب_عرض_سعر', 'تفاصيل_إضافية')),
    status NVARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'تحت_المراجعة', 'تم_الرد', 'متحول_لعميل', 'ملغي')),
    assignedTo INT FOREIGN KEY REFERENCES Users(id),
    response NVARCHAR(MAX),
    respondedAt DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT CHK_InquiryEmail CHECK (customerEmail LIKE '%@%.%')
);
GO

CREATE INDEX IX_Inquiries_Status ON Inquiries(status);
CREATE INDEX IX_Inquiries_CreatedAt ON Inquiries(createdAt);
GO

PRINT '✅ تم إنشاء جدول Inquiries';

-- ============================================
-- 6. جدول العملاء المحتملين (Leads)
-- ============================================
IF OBJECT_ID('Leads', 'U') IS NOT NULL
    DROP TABLE Leads;
GO

CREATE TABLE Leads (
    id INT PRIMARY KEY IDENTITY(1,1),
    leadCode AS ('LEAD-' + RIGHT('00000' + CAST(id AS NVARCHAR(5)), 5)) PERSISTED,
    inquiryId INT UNIQUE FOREIGN KEY REFERENCES Inquiries(id),
    customerName NVARCHAR(100) NOT NULL,
    customerEmail NVARCHAR(100) NOT NULL,
    customerPhone NVARCHAR(20) NOT NULL,
    customerNationalId NVARCHAR(20),
    customerAddress NVARCHAR(300),
    projectId INT NOT NULL FOREIGN KEY REFERENCES Projects(id),
    unitType NVARCHAR(100),
    budget DECIMAL(15,2),
    leadSource NVARCHAR(50) CHECK (leadSource IN ('موقع_إلكتروني', 'زيارة_مكتب', 'توصية', 'وسائل_تواصل', 'إعلان')),
    status NVARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'تحت_المتابعة', 'مؤهل', 'غير_مؤهل', 'متحول_لعقد', 'فقد')),
    priority NVARCHAR(20) CHECK (priority IN ('منخفض', 'متوسط', 'عالي', 'عاجل')),
    assignedTo INT FOREIGN KEY REFERENCES Users(id),
    notes NVARCHAR(MAX),
    nextFollowUp DATE,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT CHK_LeadBudget CHECK (budget > 0 OR budget IS NULL)
);
GO

CREATE INDEX IX_Leads_Status ON Leads(status);
CREATE INDEX IX_Leads_NextFollowUp ON Leads(nextFollowUp);
GO

PRINT '✅ تم إنشاء جدول Leads';

-- ============================================
-- 7. جدول العقود الرئيسي
-- ============================================
IF OBJECT_ID('Contracts', 'U') IS NOT NULL
    DROP TABLE Contracts;
GO

CREATE TABLE Contracts (
    id INT PRIMARY KEY IDENTITY(1,1),
    contractNumber AS ('CON-' + RIGHT('00000' + CAST(id AS NVARCHAR(5)), 5)) PERSISTED,
    leadId INT UNIQUE FOREIGN KEY REFERENCES Leads(id),
    projectId INT NOT NULL FOREIGN KEY REFERENCES Projects(id),
    customerId INT NOT NULL,
    customerName NVARCHAR(100) NOT NULL,
    customerNationalId NVARCHAR(20) NOT NULL,
    customerPhone NVARCHAR(20) NOT NULL,
    customerEmail NVARCHAR(100),
    customerAddress NVARCHAR(300),
    
    unitDetails NVARCHAR(200) NOT NULL,
    contractType NVARCHAR(50) NOT NULL CHECK (contractType IN ('تأجير', 'بيع', 'إيجار_تشغيلي')),
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    durationMonths INT NOT NULL,
    totalAmount DECIMAL(15,2) NOT NULL,
    paidAmount DECIMAL(15,2) DEFAULT 0,
    remainingAmount DECIMAL(15,2) NOT NULL,
    monthlyPayment DECIMAL(15,2),
    
    contractStatus NVARCHAR(30) DEFAULT 'مسودة' CHECK (contractStatus IN ('مسودة', 'معلق', 'نشط', 'متأخر', 'منتهي', 'ملغي')),
    paymentStatus NVARCHAR(30) DEFAULT 'لم_يبدأ' CHECK (paymentStatus IN ('لم_يبدأ', 'مسدد', 'متأخر', 'متخلف')),
    
    contractFileUrl NVARCHAR(500),
    signedAt DATETIME,
    signedBy NVARCHAR(100),
    
    createdBy INT NOT NULL FOREIGN KEY REFERENCES Users(id),
    approvedBy INT FOREIGN KEY REFERENCES Users(id),
    approvedAt DATETIME,
    
    notes NVARCHAR(MAX),
    terminationReason NVARCHAR(MAX),
    terminatedAt DATETIME,
    
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT CHK_ContractDates CHECK (endDate > startDate),
    CONSTRAINT CHK_ContractAmounts CHECK (totalAmount = paidAmount + remainingAmount AND totalAmount > 0),
    CONSTRAINT CHK_DurationMonths CHECK (durationMonths > 0)
);
GO

-- فهرسة متقدمة للبحث
CREATE INDEX IX_Contracts_ContractStatus ON Contracts(contractStatus);
CREATE INDEX IX_Contracts_PaymentStatus ON Contracts(paymentStatus);
CREATE INDEX IX_Contracts_CustomerPhone ON Contracts(customerPhone);
CREATE INDEX IX_Contracts_EndDate ON Contracts(endDate);
GO

PRINT '✅ تم إنشاء جدول Contracts';

-- ============================================
-- 8. جدول جدول الدفعات
-- ============================================
IF OBJECT_ID('PaymentSchedules', 'U') IS NOT NULL
    DROP TABLE PaymentSchedules;
GO

CREATE TABLE PaymentSchedules (
    id INT PRIMARY KEY IDENTITY(1,1),
    contractId INT NOT NULL FOREIGN KEY REFERENCES Contracts(id) ON DELETE CASCADE,
    installmentNumber INT NOT NULL,
    dueDate DATE NOT NULL,
    amountDue DECIMAL(15,2) NOT NULL,
    status NVARCHAR(30) DEFAULT 'مستحق' CHECK (status IN ('مستحق', 'مسدد', 'متأخر', 'ملغي')),
    paidAmount DECIMAL(15,2) DEFAULT 0,
    paidAt DATETIME,
    notes NVARCHAR(200),
    
    -- حقل محسوب
    isOverdue AS CASE 
        WHEN status = 'مستحق' AND dueDate < CAST(GETDATE() AS DATE) THEN 1
        ELSE 0
    END,
    
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT UQ_Contract_Installment UNIQUE(contractId, installmentNumber),
    CONSTRAINT CHK_InstallmentAmount CHECK (amountDue > 0)
);
GO

CREATE INDEX IX_PaymentSchedules_DueDate ON PaymentSchedules(dueDate);
CREATE INDEX IX_PaymentSchedules_Status ON PaymentSchedules(status);
CREATE INDEX IX_PaymentSchedules_Contract ON PaymentSchedules(contractId, status);
GO

PRINT '✅ تم إنشاء جدول PaymentSchedules';

-- ============================================
-- 9. جدول المدفوعات الفعلية
-- ============================================
IF OBJECT_ID('Payments', 'U') IS NOT NULL
    DROP TABLE Payments;
GO

CREATE TABLE Payments (
    id INT PRIMARY KEY IDENTITY(1,1),
    paymentNumber AS ('PAY-' + RIGHT('00000' + CAST(id AS NVARCHAR(5)), 5)) PERSISTED,
    contractId INT NOT NULL FOREIGN KEY REFERENCES Contracts(id),
    paymentScheduleId INT FOREIGN KEY REFERENCES PaymentSchedules(id),
    
    amount DECIMAL(15,2) NOT NULL,
    paymentDate DATE NOT NULL,
    paymentMethod NVARCHAR(50) NOT NULL CHECK (paymentMethod IN ('نقدي', 'تحويل_بنكي', 'شيك', 'بطاقة_ائتمان')),
    bankName NVARCHAR(100),
    referenceNumber NVARCHAR(100),
    
    receiptNumber NVARCHAR(50),
    receiptFileUrl NVARCHAR(500),
    
    collectedBy INT FOREIGN KEY REFERENCES Users(id),
    verifiedBy INT FOREIGN KEY REFERENCES Users(id),
    verifiedAt DATETIME,
    
    notes NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'مؤقت' CHECK (status IN ('مؤقت', 'مؤكد', 'ملغي')),
    
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT CHK_PaymentAmount CHECK (amount > 0),
    CONSTRAINT CHK_PaymentDate CHECK (paymentDate <= CAST(GETDATE() AS DATE))
);
GO

CREATE INDEX IX_Payments_ContractId ON Payments(contractId);
CREATE INDEX IX_Payments_PaymentDate ON Payments(paymentDate);
CREATE INDEX IX_Payments_Status ON Payments(status);
GO

PRINT '✅ تم إنشاء جدول Payments';

-- ============================================
-- 10. جدول سجلات التدقيق
-- ============================================
IF OBJECT_ID('AuditLogs', 'U') IS NOT NULL
    DROP TABLE AuditLogs;
GO

CREATE TABLE AuditLogs (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT FOREIGN KEY REFERENCES Users(id),
    action NVARCHAR(50) NOT NULL,
    tableName NVARCHAR(100) NOT NULL,
    recordId INT NOT NULL,
    oldValue NVARCHAR(MAX),
    newValue NVARCHAR(MAX),
    ipAddress NVARCHAR(50),
    userAgent NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_AuditLogs_TableRecord ON AuditLogs(tableName, recordId);
CREATE INDEX IX_AuditLogs_CreatedAt ON AuditLogs(createdAt);
GO

PRINT '✅ تم إنشاء جدول AuditLogs';

-- ============================================
-- 11. جدول الإشعارات
-- ============================================
IF OBJECT_ID('Notifications', 'U') IS NOT NULL
    DROP TABLE Notifications;
GO

CREATE TABLE Notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL FOREIGN KEY REFERENCES Users(id),
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    notificationType NVARCHAR(50) CHECK (notificationType IN ('معلومات', 'تحذير', 'نجاح', 'دفعة', 'تذكير')),
    relatedId INT,
    relatedTable NVARCHAR(100),
    isRead BIT DEFAULT 0,
    readAt DATETIME,
    createdAt DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Notifications_UserId ON Notifications(userId, isRead);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(createdAt);
GO

PRINT '✅ تم إنشاء جدول Notifications';

-- ============================================
-- 12. جدول إعدادات النظام
-- ============================================
IF OBJECT_ID('SystemSettings', 'U') IS NOT NULL
    DROP TABLE SystemSettings;
GO

CREATE TABLE SystemSettings (
    id INT PRIMARY KEY IDENTITY(1,1),
    settingKey NVARCHAR(100) UNIQUE NOT NULL,
    settingValue NVARCHAR(MAX),
    settingType NVARCHAR(50) DEFAULT 'نص',
    category NVARCHAR(100),
    description NVARCHAR(300),
    isEditable BIT DEFAULT 1,
    updatedAt DATETIME DEFAULT GETDATE(),
    updatedBy INT FOREIGN KEY REFERENCES Users(id)
);
GO

PRINT '✅ تم إنشاء جدول SystemSettings';

-- ============================================
-- 13. إنشاء التريجرات الأساسية
-- ============================================

-- تريجر لتحديث updatedAt تلقائياً
CREATE TRIGGER trg_UpdateTimestamp_Users
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users 
    SET updatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

CREATE TRIGGER trg_UpdateTimestamp_Projects
ON Projects
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Projects 
    SET updatedAt = GETDATE()
    FROM Projects p
    INNER JOIN inserted i ON p.id = i.id;
END;
GO

CREATE TRIGGER trg_UpdateTimestamp_Contracts
ON Contracts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Contracts 
    SET updatedAt = GETDATE()
    FROM Contracts c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO

PRINT '✅ تم إنشاء تريجرات تحديث الوقت التلقائية';
PRINT '🎉 اكتمل إنشاء جميع الجداول بنجاح!';
GO