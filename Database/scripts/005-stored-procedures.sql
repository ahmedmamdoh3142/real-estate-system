/*
📁 المسار: Database/scripts/005-stored-procedures.sql
🔗 الاتصال: يعمل في النهاية
🎨 الغرف: إنشاء الإجراءات المخزنة والمشغلات المتقدمة
*/

USE abh;
GO

PRINT '⚙️  بدء إنشاء الإجراءات المخزنة والمشغلات...';
GO

-- ============================================
-- 1. إجراءات المستخدمين والمصادقة
-- ============================================

-- إجراء تسجيل الدخول
CREATE OR ALTER PROCEDURE sp_UserLogin
    @username NVARCHAR(50),
    @passwordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @userId INT;
    DECLARE @isActive BIT;
    
    SELECT @userId = id, @isActive = isActive
    FROM Users
    WHERE username = @username 
      AND passwordHash = @passwordHash;
    
    IF @userId IS NOT NULL
    BEGIN
        IF @isActive = 1
        BEGIN
            -- تحديث وقت آخر تسجيل دخول
            UPDATE Users 
            SET lastLogin = GETDATE()
            WHERE id = @userId;
            
            -- إرجاع بيانات المستخدم
            SELECT 
                id,
                username,
                fullName,
                email,
                phone,
                role,
                lastLogin
            FROM Users
            WHERE id = @userId;
            
            PRINT '✅ تسجيل الدخول ناجح';
        END
        ELSE
        BEGIN
            RAISERROR('الحساب غير مفعل، يرجى التواصل مع الإدارة', 16, 1);
        END
    END
    ELSE
    BEGIN
        RAISERROR('اسم المستخدم أو كلمة المرور غير صحيحة', 16, 1);
    END
END;
GO

PRINT '✅ تم إنشاء sp_UserLogin';

-- ============================================
-- 2. إجراءات إدارة المشاريع
-- ============================================

-- إجراء البحث المتقدم في المشاريع
CREATE OR ALTER PROCEDURE sp_SearchProjects
    @city NVARCHAR(100) = NULL,
    @projectType NVARCHAR(50) = NULL,
    @minPrice DECIMAL(15,2) = NULL,
    @maxPrice DECIMAL(15,2) = NULL,
    @minArea DECIMAL(10,2) = NULL,
    @maxArea DECIMAL(10,2) = NULL,
    @bedrooms INT = NULL,
    @status NVARCHAR(30) = NULL,
    @isFeatured BIT = NULL,
    @pageNumber INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@pageNumber - 1) * @pageSize;
    
    -- نتائج البحث
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
        pi.imageUrl AS mainImage,
        (SELECT STRING_AGG(featureName, ', ') 
         FROM ProjectFeatures pf 
         WHERE pf.projectId = p.id) AS features,
        ROW_NUMBER() OVER (ORDER BY p.createdAt DESC) AS RowNum
    INTO #TempResults
    FROM Projects p
    LEFT JOIN ProjectImages pi ON p.id = pi.projectId 
        AND pi.imageType = 'صورة_رئيسية'
    WHERE (@city IS NULL OR p.city = @city)
      AND (@projectType IS NULL OR p.projectType = @projectType)
      AND (@minPrice IS NULL OR p.price >= @minPrice)
      AND (@maxPrice IS NULL OR p.price <= @maxPrice)
      AND (@minArea IS NULL OR p.area >= @minArea)
      AND (@maxArea IS NULL OR p.area <= @maxArea)
      AND (@bedrooms IS NULL OR p.bedrooms = @bedrooms)
      AND (@status IS NULL OR p.status = @status)
      AND (@isFeatured IS NULL OR p.isFeatured = @isFeatured)
      AND p.status != 'معلق'
      AND p.availableUnits > 0;
    
    -- إرجاع النتائج مع الترقيم
    SELECT 
        id, projectCode, projectName, projectType, location,
        city, price, priceType, area, bedrooms, bathrooms,
        status, availableUnits, mainImage, features
    FROM #TempResults
    WHERE RowNum BETWEEN @offset + 1 AND @offset + @pageSize
    ORDER BY RowNum;
    
    -- إرجاع العدد الكلي
    SELECT COUNT(*) AS TotalCount
    FROM #TempResults;
    
    DROP TABLE #TempResults;
END;
GO

PRINT '✅ تم إنشاء sp_SearchProjects';

-- ============================================
-- 3. إجراءات إدارة العقود
-- ============================================

-- إجراء إنشاء عقد جديد مع جدول الدفعات
CREATE OR ALTER PROCEDURE sp_CreateContract
    @leadId INT,
    @projectId INT,
    @customerId INT,
    @customerName NVARCHAR(100),
    @customerNationalId NVARCHAR(20),
    @customerPhone NVARCHAR(20),
    @customerEmail NVARCHAR(100),
    @customerAddress NVARCHAR(300),
    @unitDetails NVARCHAR(200),
    @contractType NVARCHAR(50),
    @startDate DATE,
    @endDate DATE,
    @totalAmount DECIMAL(15,2),
    @downPayment DECIMAL(15,2),
    @monthlyPayment DECIMAL(15,2),
    @createdBy INT,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @contractId INT;
        DECLARE @durationMonths INT;
        DECLARE @remainingAmount DECIMAL(15,2);
        DECLARE @currentDate DATE = @startDate;
        DECLARE @installmentCount INT = 1;
        
        -- حساب المدة بالأشهر
        SET @durationMonths = DATEDIFF(MONTH, @startDate, @endDate);
        SET @remainingAmount = @totalAmount - @downPayment;
        
        -- إنشاء العقد
        INSERT INTO Contracts (
            leadId, projectId, customerId, customerName, customerNationalId,
            customerPhone, customerEmail, customerAddress, unitDetails,
            contractType, startDate, endDate, durationMonths, totalAmount,
            paidAmount, remainingAmount, monthlyPayment, contractStatus,
            paymentStatus, createdBy, notes
        )
        VALUES (
            @leadId, @projectId, @customerId, @customerName, @customerNationalId,
            @customerPhone, @customerEmail, @customerAddress, @unitDetails,
            @contractType, @startDate, @endDate, @durationMonths, @totalAmount,
            @downPayment, @remainingAmount, @monthlyPayment, 'معلق',
            'لم_يبدأ', @createdBy, @notes
        );
        
        SET @contractId = SCOPE_IDENTITY();
        
        -- إذا كان هناك دفعة أولى، تسجيلها
        IF @downPayment > 0
        BEGIN
            INSERT INTO Payments (
                contractId, amount, paymentDate, paymentMethod,
                status, collectedBy
            )
            VALUES (
                @contractId, @downPayment, GETDATE(), 'تحويل_بنكي',
                'مؤكد', @createdBy
            );
        END
        
        -- إنشاء جدول الدفعات الشهرية
        WHILE @installmentCount <= @durationMonths
        BEGIN
            INSERT INTO PaymentSchedules (
                contractId, installmentNumber, dueDate, amountDue, status
            )
            VALUES (
                @contractId, @installmentCount, @currentDate, @monthlyPayment, 'مستحق'
            );
            
            SET @currentDate = DATEADD(MONTH, 1, @currentDate);
            SET @installmentCount = @installmentCount + 1;
        END
        
        -- تحديث حالة العميل المحتمل
        UPDATE Leads
        SET status = 'متحول_لعقد',
            updatedAt = GETDATE()
        WHERE id = @leadId;
        
        -- تحديث عدد الوحدات المتاحة في المشروع
        UPDATE Projects
        SET availableUnits = availableUnits - 1,
            updatedAt = GETDATE()
        WHERE id = @projectId;
        
        COMMIT TRANSACTION;
        
        -- إرجاع بيانات العقد المنشأ
        SELECT 
            contractNumber,
            contractType,
            startDate,
            endDate,
            totalAmount,
            paidAmount,
            remainingAmount,
            monthlyPayment,
            (SELECT COUNT(*) FROM PaymentSchedules WHERE contractId = @contractId) AS totalInstallments
        FROM Contracts
        WHERE id = @contractId;
        
        PRINT '✅ تم إنشاء العقد وجدول الدفعات بنجاح';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

PRINT '✅ تم إنشاء sp_CreateContract';

-- ============================================
-- 4. إجراءات المدفوعات
-- ============================================

-- إجراء تسجيل دفعة جديدة
CREATE OR ALTER PROCEDURE sp_RecordPayment
    @contractId INT,
    @amount DECIMAL(15,2),
    @paymentDate DATE,
    @paymentMethod NVARCHAR(50),
    @bankName NVARCHAR(100) = NULL,
    @referenceNumber NVARCHAR(100) = NULL,
    @collectedBy INT,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @remainingAmount DECIMAL(15,2);
        DECLARE @paidAmount DECIMAL(15,2);
        DECLARE @paymentId INT;
        DECLARE @scheduleId INT;
        DECLARE @overdueAmount DECIMAL(15,2);
        
        -- البحث عن دفعة مستحقة للعقد (الأقدم أولاً)
        SELECT TOP 1 @scheduleId = id, @overdueAmount = (amountDue - paidAmount)
        FROM PaymentSchedules
        WHERE contractId = @contractId 
          AND status = 'مستحق'
        ORDER BY dueDate ASC;
        
        -- تسجيل الدفعة
        INSERT INTO Payments (
            contractId, paymentScheduleId, amount, paymentDate, paymentMethod,
            bankName, referenceNumber, collectedBy, notes, status
        )
        VALUES (
            @contractId, @scheduleId, @amount, @paymentDate, @paymentMethod,
            @bankName, @referenceNumber, @collectedBy, @notes, 'مؤقت'
        );
        
        SET @paymentId = SCOPE_IDENTITY();
        
        -- تحديث جدول الدفعات إذا كان هناك دفعة مقابلة
        IF @scheduleId IS NOT NULL
        BEGIN
            UPDATE PaymentSchedules
            SET paidAmount = paidAmount + @amount,
                status = CASE 
                    WHEN (amountDue - (paidAmount + @amount)) <= 0 THEN 'مسدد'
                    ELSE 'مستحق'
                END,
                paidAt = CASE 
                    WHEN (amountDue - (paidAmount + @amount)) <= 0 THEN GETDATE()
                    ELSE paidAt
                END,
                updatedAt = GETDATE()
            WHERE id = @scheduleId;
        END
        
        -- تحديث العقد
        UPDATE Contracts
        SET paidAmount = paidAmount + @amount,
            remainingAmount = remainingAmount - @amount,
            paymentStatus = CASE 
                WHEN (remainingAmount - @amount) <= 0 THEN 'مسدد'
                ELSE 'مسدد جزئياً'
            END,
            updatedAt = GETDATE()
        WHERE id = @contractId;
        
        -- تسجيل في سجلات التدقيق
        INSERT INTO AuditLogs (userId, action, tableName, recordId, newValue)
        VALUES (@collectedBy, 'تسجيل_دفعة', 'Payments', @paymentId, 
                CONCAT('تم تسديد ', @amount, ' للعقد ', @contractId));
        
        COMMIT TRANSACTION;
        
        -- إرجاع بيانات الدفعة المسجلة
        SELECT 
            paymentNumber,
            amount,
            paymentDate,
            paymentMethod,
            (SELECT contractNumber FROM Contracts WHERE id = @contractId) AS contractNumber
        FROM Payments
        WHERE id = @paymentId;
        
        PRINT '✅ تم تسجيل الدفعة بنجاح';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT '✅ تم إنشاء sp_RecordPayment';

-- ============================================
-- 5. المشغلات المتقدمة (Triggers)
-- ============================================

-- مشغل لتحديث حالة العقد عند سداد جميع الدفعات
CREATE OR ALTER TRIGGER trg_UpdateContractStatus
ON Payments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(status)
    BEGIN
        DECLARE @contractId INT;
        DECLARE @paidAmount DECIMAL(15,2);
        DECLARE @totalAmount DECIMAL(15,2);
        
        -- الحصول على العقد المرتبط بالدفعة المحدثة
        SELECT @contractId = contractId
        FROM inserted;
        
        -- حساب المبالغ
        SELECT 
            @paidAmount = paidAmount,
            @totalAmount = totalAmount
        FROM Contracts
        WHERE id = @contractId;
        
        -- إذا تم سداد كامل المبلغ، تحديث حالة العقد
        IF @paidAmount >= @totalAmount
        BEGIN
            UPDATE Contracts
            SET contractStatus = 'منتهي',
                paymentStatus = 'مسدد',
                updatedAt = GETDATE()
            WHERE id = @contractId
              AND contractStatus != 'منتهي';
        END
    END
END;
GO

PRINT '✅ تم إنشاء trg_UpdateContractStatus';

-- مشغل سجلات التدقيق للتغيرات في العقود
CREATE OR ALTER TRIGGER trg_AuditContractChanges
ON Contracts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @userId INT;
    DECLARE @action NVARCHAR(50);
    DECLARE @ipAddress NVARCHAR(50);
    DECLARE @userAgent NVARCHAR(500);
    
    -- الحصول على معلومات المستخدم (بسيطة - يمكن تحسينها في الإنتاج)
    SET @userId = (SELECT createdBy FROM inserted);
    SET @action = 'تحديث_عقد';
    
    INSERT INTO AuditLogs (userId, action, tableName, recordId, oldValue, newValue)
    SELECT 
        @userId,
        @action,
        'Contracts',
        i.id,
        (SELECT d.contractStatus FROM deleted d WHERE d.id = i.id),
        i.contractStatus
    FROM inserted i;
END;
GO

PRINT '✅ تم إنشاء trg_AuditContractChanges';

-- مشغل لتوليد إشعارات للدفعات المتأخرة
CREATE OR ALTER TRIGGER trg_OverduePaymentNotification
ON PaymentSchedules
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(isOverdue)
    BEGIN
        DECLARE @contractId INT;
        DECLARE @dueDate DATE;
        DECLARE @amountDue DECIMAL(15,2);
        DECLARE @customerName NVARCHAR(100);
        DECLARE @assignedTo INT;
        
        SELECT 
            @contractId = i.contractId,
            @dueDate = i.dueDate,
            @amountDue = i.amountDue
        FROM inserted i
        WHERE i.isOverdue = 1;
        
        -- الحصول على بيانات العقد والموظف المسؤول
        SELECT 
            @customerName = c.customerName,
            @assignedTo = c.createdBy
        FROM Contracts c
        WHERE c.id = @contractId;
        
        -- إنشاء إشعار للموظف المسؤول
        IF @assignedTo IS NOT NULL
        BEGIN
            INSERT INTO Notifications (userId, title, message, notificationType, relatedId, relatedTable)
            VALUES (
                @assignedTo,
                'دفعة متأخرة',
                CONCAT('دفعة متأخرة للعميل ', @customerName, ' بقيمة ', @amountDue, ' ر.س بتاريخ استحقاق ', FORMAT(@dueDate, 'dd/MM/yyyy')),
                'تحذير',
                @contractId,
                'Contracts'
            );
        END
    END
END;
GO

PRINT '✅ تم إنشاء trg_OverduePaymentNotification';

-- ============================================
-- 6. إجراءات التقارير
-- ============================================

-- إجراء لتقرير المبيعات الشهري
CREATE OR ALTER PROCEDURE sp_MonthlySalesReport
    @year INT = NULL,
    @month INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @year IS NULL SET @year = YEAR(GETDATE());
    IF @month IS NULL SET @month = MONTH(GETDATE());
    
    SELECT 
        p.projectName,
        p.projectCode,
        c.contractNumber,
        c.customerName,
        c.customerPhone,
        c.contractType,
        c.startDate,
        c.endDate,
        c.totalAmount,
        c.paidAmount,
        c.remainingAmount,
        c.monthlyPayment,
        u.fullName AS accountManager,
        (SELECT COUNT(*) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.status = 'مسدد') AS paidInstallments,
        (SELECT COUNT(*) FROM PaymentSchedules ps WHERE ps.contractId = c.id AND ps.status = 'مستحق') AS pendingInstallments,
        (SELECT SUM(amount) FROM Payments py WHERE py.contractId = c.id AND py.status = 'مؤكد' 
         AND YEAR(py.paymentDate) = @year AND MONTH(py.paymentDate) = @month) AS monthlyCollection
    FROM Contracts c
    INNER JOIN Projects p ON c.projectId = p.id
    LEFT JOIN Users u ON c.createdBy = u.id
    WHERE YEAR(c.createdAt) = @year
      AND MONTH(c.createdAt) = @month
      AND c.contractStatus != 'ملغي'
    ORDER BY c.createdAt DESC;
END;
GO

PRINT '✅ تم إنشاء sp_MonthlySalesReport';

-- إجراء لتقرير الأداء الشامل
CREATE OR ALTER PROCEDURE sp_PerformanceReport
    @startDate DATE = NULL,
    @endDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @startDate IS NULL SET @startDate = DATEADD(MONTH, -1, GETDATE());
    IF @endDate IS NULL SET @endDate = GETDATE();
    
    -- ملخص الأداء
    SELECT 
        (SELECT COUNT(*) FROM Inquiries WHERE createdAt BETWEEN @startDate AND @endDate) AS totalInquiries,
        (SELECT COUNT(*) FROM Leads WHERE createdAt BETWEEN @startDate AND @endDate) AS totalLeads,
        (SELECT COUNT(*) FROM Contracts WHERE createdAt BETWEEN @startDate AND @endDate) AS totalContracts,
        (SELECT SUM(totalAmount) FROM Contracts WHERE createdAt BETWEEN @startDate AND @endDate) AS totalContractValue,
        (SELECT SUM(amount) FROM Payments WHERE paymentDate BETWEEN @startDate AND @endDate AND status = 'مؤكد') AS totalCollections,
        (SELECT AVG(DATEDIFF(HOUR, i.createdAt, i.respondedAt)) 
         FROM Inquiries i 
         WHERE i.respondedAt IS NOT NULL AND i.createdAt BETWEEN @startDate AND @endDate) AS avgResponseTimeHours;
    
    -- أداء الموظفين
    SELECT 
        u.fullName,
        u.role,
        (SELECT COUNT(*) FROM Inquiries i WHERE i.assignedTo = u.id AND i.createdAt BETWEEN @startDate AND @endDate) AS inquiriesHandled,
        (SELECT COUNT(*) FROM Leads l WHERE l.assignedTo = u.id AND l.createdAt BETWEEN @startDate AND @endDate) AS leadsGenerated,
        (SELECT COUNT(*) FROM Contracts c WHERE c.createdBy = u.id AND c.createdAt BETWEEN @startDate AND @endDate) AS contractsClosed,
        (SELECT SUM(c.totalAmount) FROM Contracts c WHERE c.createdBy = u.id AND c.createdAt BETWEEN @startDate AND @endDate) AS contractValue
    FROM Users u
    WHERE u.isActive = 1
    ORDER BY u.role, u.fullName;
END;
GO

PRINT '✅ تم إنشاء sp_PerformanceReport';

PRINT '🎉 اكتمل إنشاء جميع الإجراءات والمشغلات بنجاح!';
GO

-- ============================================
-- اختبار بعض الإجراءات
-- ============================================
PRINT '🧪 بدء اختبار الإجراءات...';
GO

-- اختبار البحث في المشاريع
PRINT 'اختبار البحث في المشاريع:';
EXEC sp_SearchProjects 
    @city = 'الرياض',
    @projectType = 'سكني',
    @minPrice = 100000,
    @maxPrice = 5000000,
    @pageNumber = 1,
    @pageSize = 5;
GO

-- اختبار تقرير الأداء
PRINT 'اختبار تقرير الأداء:';
EXEC sp_PerformanceReport;
GO

PRINT '✅ اكتملت جميع العمليات بنجاح!';
PRINT '========================================';
PRINT '📊 قاعدة البيانات جاهزة للاستخدام';
PRINT '🔗 Server: DESKTOP-54ST25S\ATTENDANCE';
PRINT '📁 Database: abh';
PRINT '👥 Users: 4 users (admin/123456)';
PRINT '🏢 Projects: 5 sample projects';
PRINT '📝 Contracts: 2 active contracts';
PRINT '💰 Payments: 2 sample payments';
PRINT '========================================';
GO