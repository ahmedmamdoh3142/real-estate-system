/*
📁 المسار: Database/scripts/004-create-views.sql
🔗 الاتصال: يعمل بعد إدخال البيانات
🎨 الغرض: إنشاء مناظير للاستعلامات المتكررة
*/

USE abh;
GO

PRINT '👁️  بدء إنشاء المناظير...';
GO

-- ============================================
-- 1. منظر المشاريع النشطة مع تفاصيل إضافية
-- ============================================
CREATE OR ALTER VIEW vw_ActiveProjects
AS
SELECT 
    p.id,
    p.projectCode,
    p.projectName,
    p.projectType,
    p.location,
    p.city,
    p.price,
    p.priceType,
    p.area,
    p.bedrooms,
    p.bathrooms,
    p.status,
    p.availableUnits,
    p.totalUnits,
    (SELECT TOP 1 imageUrl FROM ProjectImages WHERE projectId = p.id AND imageType = 'صورة_رئيسية' ORDER BY displayOrder) AS mainImage,
    (SELECT COUNT(*) FROM Inquiries i WHERE i.projectId = p.id AND i.status != 'ملغي') AS inquiryCount,
    (SELECT COUNT(*) FROM Contracts c WHERE c.projectId = p.id AND c.contractStatus = 'نشط') AS activeContracts,
    p.createdAt
FROM Projects p
WHERE p.status IN ('جاهز_للتسليم', 'مكتمل', 'نشط')
  AND p.availableUnits > 0;
GO

PRINT '✅ تم إنشاء vw_ActiveProjects';

-- ============================================
-- 2. منظر العقود النشطة مع تفاصيل الدفع
-- ============================================
CREATE OR ALTER VIEW vw_ActiveContracts
AS
SELECT 
    c.contractNumber,
    c.customerName,
    c.customerPhone,
    c.unitDetails,
    c.contractType,
    c.startDate,
    c.endDate,
    c.totalAmount,
    c.paidAmount,
    c.remainingAmount,
    c.monthlyPayment,
    c.contractStatus,
    c.paymentStatus,
    p.projectName,
    p.projectCode,
    u.fullName AS accountManager,
    (SELECT COUNT(*) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.status = 'مسدد') AS paidInstallments,
    (SELECT COUNT(*) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.status = 'مستحق') AS pendingInstallments,
    (SELECT COUNT(*) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.isOverdue = 1) AS overdueInstallments,
    (SELECT SUM(amountDue) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.status = 'مستحق') AS totalPendingAmount,
    (SELECT SUM(amountDue) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.isOverdue = 1) AS totalOverdueAmount,
    DATEDIFF(DAY, GETDATE(), c.endDate) AS daysUntilEnd
FROM Contracts c
INNER JOIN Projects p ON c.projectId = p.id
LEFT JOIN Users u ON c.createdBy = u.id
WHERE c.contractStatus = 'نشط';
GO

PRINT '✅ تم إنشاء vw_ActiveContracts';

-- ============================================
-- 3. منظر الدفعات المتأخرة
-- ============================================
CREATE OR ALTER VIEW vw_OverduePayments
AS
SELECT 
    c.contractNumber,
    c.customerName,
    c.customerPhone,
    ps.installmentNumber,
    ps.dueDate,
    ps.amountDue,
    ps.paidAmount,
    (ps.amountDue - ps.paidAmount) AS remainingAmount,
    DATEDIFF(DAY, ps.dueDate, GETDATE()) AS daysOverdue,
    p.projectName,
    u.fullName AS assignedTo
FROM PaymentSchedules ps
INNER JOIN Contracts c ON ps.contractId = c.id
INNER JOIN Projects p ON c.projectId = p.id
LEFT JOIN Users u ON c.createdBy = u.id
WHERE ps.status = 'مستحق'
  AND ps.dueDate < CAST(GETDATE() AS DATE)
  AND ps.isOverdue = 1
ORDER BY ps.dueDate ASC;
GO

PRINT '✅ تم إنشاء vw_OverduePayments';

-- ============================================
-- 4. منظر الاستفسارات غير المرد عليها
-- ============================================
CREATE OR ALTER VIEW vw_PendingInquiries
AS
SELECT 
    i.inquiryCode,
    i.customerName,
    i.customerEmail,
    i.customerPhone,
    i.message,
    i.inquiryType,
    i.status,
    i.createdAt,
    DATEDIFF(HOUR, i.createdAt, GETDATE()) AS hoursSinceCreation,
    p.projectName,
    u.fullName AS assignedToName,
    CASE 
        WHEN i.assignedTo IS NULL THEN 'غير معين'
        ELSE 'معين'
    END AS assignmentStatus
FROM Inquiries i
LEFT JOIN Projects p ON i.projectId = p.id
LEFT JOIN Users u ON i.assignedTo = u.id
WHERE i.status IN ('جديد', 'تحت_المراجعة')
ORDER BY i.createdAt DESC;
GO

PRINT '✅ تم إنشاء vw_PendingInquiries';

-- ============================================
-- 5. منظر الإحصائيات الشهرية
-- ============================================
CREATE OR ALTER VIEW vw_MonthlyStatistics
AS
WITH MonthlyData AS (
    SELECT 
        YEAR(createdAt) AS Year,
        MONTH(createdAt) AS Month,
        DATENAME(MONTH, createdAt) AS MonthName,
        COUNT(*) AS TotalCount
    FROM Contracts
    WHERE contractStatus = 'نشط'
    GROUP BY YEAR(createdAt), MONTH(createdAt), DATENAME(MONTH, createdAt)
),
PaymentData AS (
    SELECT 
        YEAR(paymentDate) AS Year,
        MONTH(paymentDate) AS Month,
        SUM(amount) AS TotalPayments,
        COUNT(*) AS PaymentCount
    FROM Payments
    WHERE status = 'مؤكد'
    GROUP BY YEAR(paymentDate), MONTH(paymentDate)
)
SELECT 
    COALESCE(m.Year, p.Year) AS Year,
    COALESCE(m.Month, p.Month) AS Month,
    COALESCE(m.MonthName, DATENAME(MONTH, DATEFROMPARTS(p.Year, p.Month, 1))) AS MonthName,
    COALESCE(m.TotalCount, 0) AS NewContracts,
    COALESCE(p.TotalPayments, 0) AS TotalRevenue,
    COALESCE(p.PaymentCount, 0) AS PaymentTransactions
FROM MonthlyData m
FULL OUTER JOIN PaymentData p ON m.Year = p.Year AND m.Month = p.Month
WHERE COALESCE(m.Year, p.Year) = YEAR(GETDATE())
ORDER BY COALESCE(m.Month, p.Month) DESC;
GO

PRINT '✅ تم إنشاء vw_MonthlyStatistics';

-- ============================================
-- 6. منظر لوحة تحكم المدير
-- ============================================
CREATE OR ALTER VIEW vw_DashboardStats
AS
SELECT 
    -- إحصائيات المشاريع
    (SELECT COUNT(*) FROM Projects WHERE status != 'معلق') AS TotalProjects,
    (SELECT COUNT(*) FROM Projects WHERE isFeatured = 1 AND status != 'معلق') AS FeaturedProjects,
    (SELECT COUNT(*) FROM Projects WHERE availableUnits > 0 AND status IN ('جاهز_للتسليم', 'مكتمل')) AS AvailableProjects,
    
    -- إحصائيات العملاء
    (SELECT COUNT(*) FROM Inquiries WHERE status != 'ملغي') AS TotalInquiries,
    (SELECT COUNT(*) FROM Inquiries WHERE status = 'جديد') AS NewInquiries,
    (SELECT COUNT(*) FROM Leads WHERE status != 'فقد') AS TotalLeads,
    (SELECT COUNT(*) FROM Leads WHERE status = 'مؤهل') AS QualifiedLeads,
    
    -- إحصائيات العقود
    (SELECT COUNT(*) FROM Contracts WHERE contractStatus = 'نشط') AS ActiveContracts,
    (SELECT COUNT(*) FROM Contracts WHERE contractStatus = 'متأخر') AS OverdueContracts,
    (SELECT COUNT(*) FROM Contracts WHERE contractStatus = 'منتهي' AND YEAR(updatedAt) = YEAR(GETDATE())) AS CompletedContractsThisYear,
    
    -- إحصائيات المدفوعات
    (SELECT SUM(amount) FROM Payments WHERE status = 'مؤكد' AND YEAR(paymentDate) = YEAR(GETDATE())) AS YearlyRevenue,
    (SELECT SUM(amount) FROM Payments WHERE status = 'مؤكد' AND MONTH(paymentDate) = MONTH(GETDATE()) AND YEAR(paymentDate) = YEAR(GETDATE())) AS MonthlyRevenue,
    (SELECT SUM(amountDue - paidAmount) FROM PaymentSchedules WHERE isOverdue = 1) AS TotalOverdueAmount,
    
    -- إحصائيات أخرى
    (SELECT COUNT(*) FROM Notifications WHERE isRead = 0) AS UnreadNotifications,
    (SELECT COUNT(*) FROM Users WHERE isActive = 1) AS ActiveUsers;
GO

PRINT '✅ تم إنشاء vw_DashboardStats';

PRINT '🎉 اكتمل إنشاء جميع المناظير بنجاح!';
GO