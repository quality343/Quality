-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "mrn" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "branchId" TEXT,
    CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Patient_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "designation" TEXT,
    "licenseNo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "acceptsOnlineBookings" BOOLEAN NOT NULL DEFAULT true,
    "homeConsultationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "homeConsultationNote" TEXT,
    "homeServiceAreas" TEXT,
    "homeMaxPerDay" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BranchService" (
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("branchId", "serviceId"),
    CONSTRAINT "BranchService_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BranchService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT,
    "serviceId" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppointmentSlot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AppointmentSlot_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AppointmentSlot_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "slotId" TEXT,
    "serviceId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "source" TEXT NOT NULL DEFAULT 'ONLINE',
    "bookedById" TEXT,
    "reason" TEXT,
    "cancelReason" TEXT,
    "bookingRef" TEXT,
    "appointmentType" TEXT NOT NULL DEFAULT 'CLINIC_VISIT',
    "homeAddress" TEXT,
    "homeLocality" TEXT,
    "homeInstructions" TEXT,
    "homeConfirmationStatus" TEXT,
    "manageTokenHash" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AppointmentSlot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "interest" TEXT,
    "appointmentType" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HearingAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "audiologistId" TEXT,
    "reviewedById" TEXT,
    "appointmentId" TEXT,
    "branchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "referredBy" TEXT,
    "complaints" TEXT,
    "history" TEXT,
    "reviewText" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAssessment_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAssessment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAssessment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAssessment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "performedById" TEXT,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TestResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestResult_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audiogram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testResultId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Audiogram_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "body" TEXT NOT NULL,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" DATETIME,
    "supersedesId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicalNote_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClinicalNote_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "ClinicalNote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "generatedById" TEXT NOT NULL,
    "finalizedById" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "branchId" TEXT,
    "assessmentId" TEXT,
    "dueDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FollowUp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FollowUp_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FollowUp_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HearingAidModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelCode" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "technologyLevel" TEXT NOT NULL,
    "description" TEXT,
    "priceInr" INTEGER,
    "warrantyMonths" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "HearingAidBrand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidFeature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "HearingAidModelFeature" (
    "modelId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "detail" TEXT,

    PRIMARY KEY ("modelId", "featureId"),
    CONSTRAINT "HearingAidModelFeature_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidModelFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "HearingAidFeature" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidInventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT NOT NULL DEFAULT 'NEW',
    "acquiredAt" DATETIME,
    "acquiredNote" TEXT,
    "unitCostInr" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidInventoryItem_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidInventoryItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "audiologistId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "patientDecision" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionAt" DATETIME,
    "reason" TEXT NOT NULL,
    "listeningNeeds" TEXT,
    "communicationPrefs" TEXT,
    "handlingNotes" TEXT,
    "professionalConsiderations" TEXT,
    "followUpPlan" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidRecommendation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidRecommendation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidRecommendation_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidRecommendation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidDemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" DATETIME,
    "expectedReturnAt" DATETIME NOT NULL,
    "actualReturnAt" DATETIME,
    "patientFeedback" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidDemo_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDemo_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDemo_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDemo_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidFitting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "audiologistId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "assessmentId" TEXT,
    "branchId" TEXT NOT NULL,
    "earSide" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "fittingDate" DATETIME,
    "programmingSummary" TEXT,
    "verificationNotes" TEXT,
    "patientFeedback" TEXT,
    "notes" TEXT,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidFitting_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFitting_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFitting_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFitting_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "HearingAidRecommendation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFitting_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFitting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidDispensing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "fittingId" TEXT,
    "branchId" TEXT NOT NULL,
    "dispensedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "dispensedAt" DATETIME,
    "notes" TEXT,
    "patientAcknowledgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidDispensing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDispensing_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDispensing_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "HearingAidRecommendation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDispensing_fittingId_fkey" FOREIGN KEY ("fittingId") REFERENCES "HearingAidFitting" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDispensing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidDispensing_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidWarranty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "reference" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "coverageNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidWarranty_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidWarranty_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidServiceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "branchId" TEXT,
    "assignedStaffId" TEXT,
    "serviceType" TEXT NOT NULL DEFAULT 'REPAIR',
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "issueDescription" TEXT NOT NULL,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionNotes" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidServiceRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidServiceRecord_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidServiceRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidServiceRecord_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidAccessory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "priceInr" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HearingAidAccessoryCompatibility" (
    "accessoryId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    PRIMARY KEY ("accessoryId", "modelId"),
    CONSTRAINT "HearingAidAccessoryCompatibility_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "HearingAidAccessory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidAccessoryCompatibility_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingAidFollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "fittingId" TEXT,
    "inventoryItemId" TEXT,
    "audiologistId" TEXT,
    "branchId" TEXT,
    "reason" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "notes" TEXT,
    "outcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HearingAidFollowUp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFollowUp_fittingId_fkey" FOREIGN KEY ("fittingId") REFERENCES "HearingAidFitting" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFollowUp_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFollowUp_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HearingAidFollowUp_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_mrn_key" ON "Patient"("mrn");

-- CreateIndex
CREATE INDEX "Patient_isGuest_phone_idx" ON "Patient"("isGuest", "phone");

-- CreateIndex
CREATE INDEX "Patient_branchId_idx" ON "Patient"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_branchId_idx" ON "Staff"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE INDEX "AppointmentSlot_branchId_status_startsAt_idx" ON "AppointmentSlot"("branchId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "AppointmentSlot_staffId_startsAt_idx" ON "AppointmentSlot"("staffId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSlot_branchId_startsAt_staffId_key" ON "AppointmentSlot"("branchId", "startsAt", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_bookingRef_key" ON "Appointment"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Appointment_patientId_status_idx" ON "Appointment"("patientId", "status");

-- CreateIndex
CREATE INDEX "Appointment_branchId_status_idx" ON "Appointment"("branchId", "status");

-- CreateIndex
CREATE INDEX "Appointment_staffId_status_idx" ON "Appointment"("staffId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_createdAt_idx" ON "ContactEnquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAssessment_appointmentId_key" ON "HearingAssessment"("appointmentId");

-- CreateIndex
CREATE INDEX "HearingAssessment_patientId_status_idx" ON "HearingAssessment"("patientId", "status");

-- CreateIndex
CREATE INDEX "HearingAssessment_branchId_status_idx" ON "HearingAssessment"("branchId", "status");

-- CreateIndex
CREATE INDEX "HearingAssessment_audiologistId_idx" ON "HearingAssessment"("audiologistId");

-- CreateIndex
CREATE INDEX "TestResult_assessmentId_idx" ON "TestResult"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Audiogram_testResultId_key" ON "Audiogram"("testResultId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_supersedesId_key" ON "ClinicalNote"("supersedesId");

-- CreateIndex
CREATE INDEX "ClinicalNote_patientId_idx" ON "ClinicalNote"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalNote_assessmentId_idx" ON "ClinicalNote"("assessmentId");

-- CreateIndex
CREATE INDEX "Report_patientId_status_idx" ON "Report"("patientId", "status");

-- CreateIndex
CREATE INDEX "Report_assessmentId_idx" ON "Report"("assessmentId");

-- CreateIndex
CREATE INDEX "FollowUp_status_dueDate_idx" ON "FollowUp"("status", "dueDate");

-- CreateIndex
CREATE INDEX "FollowUp_patientId_idx" ON "FollowUp"("patientId");

-- CreateIndex
CREATE INDEX "GalleryItem_isActive_sortOrder_idx" ON "GalleryItem"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAidBrand_name_key" ON "HearingAidBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAidModel_modelCode_key" ON "HearingAidModel"("modelCode");

-- CreateIndex
CREATE INDEX "HearingAidModel_deviceType_status_idx" ON "HearingAidModel"("deviceType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAidModel_brandId_modelName_key" ON "HearingAidModel"("brandId", "modelName");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAidFeature_key_key" ON "HearingAidFeature"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HearingAidInventoryItem_serialNo_key" ON "HearingAidInventoryItem"("serialNo");

-- CreateIndex
CREATE INDEX "HearingAidInventoryItem_modelId_status_idx" ON "HearingAidInventoryItem"("modelId", "status");

-- CreateIndex
CREATE INDEX "HearingAidInventoryItem_branchId_status_idx" ON "HearingAidInventoryItem"("branchId", "status");

-- CreateIndex
CREATE INDEX "HearingAidRecommendation_patientId_status_idx" ON "HearingAidRecommendation"("patientId", "status");

-- CreateIndex
CREATE INDEX "HearingAidRecommendation_audiologistId_idx" ON "HearingAidRecommendation"("audiologistId");

-- CreateIndex
CREATE INDEX "HearingAidRecommendation_assessmentId_idx" ON "HearingAidRecommendation"("assessmentId");

-- CreateIndex
CREATE INDEX "HearingAidDemo_inventoryItemId_status_idx" ON "HearingAidDemo"("inventoryItemId", "status");

-- CreateIndex
CREATE INDEX "HearingAidDemo_patientId_status_idx" ON "HearingAidDemo"("patientId", "status");

-- CreateIndex
CREATE INDEX "HearingAidFitting_patientId_status_idx" ON "HearingAidFitting"("patientId", "status");

-- CreateIndex
CREATE INDEX "HearingAidFitting_inventoryItemId_idx" ON "HearingAidFitting"("inventoryItemId");

-- CreateIndex
CREATE INDEX "HearingAidDispensing_patientId_status_idx" ON "HearingAidDispensing"("patientId", "status");

-- CreateIndex
CREATE INDEX "HearingAidDispensing_inventoryItemId_idx" ON "HearingAidDispensing"("inventoryItemId");

-- CreateIndex
CREATE INDEX "HearingAidWarranty_patientId_idx" ON "HearingAidWarranty"("patientId");

-- CreateIndex
CREATE INDEX "HearingAidWarranty_inventoryItemId_idx" ON "HearingAidWarranty"("inventoryItemId");

-- CreateIndex
CREATE INDEX "HearingAidServiceRecord_patientId_status_idx" ON "HearingAidServiceRecord"("patientId", "status");

-- CreateIndex
CREATE INDEX "HearingAidServiceRecord_inventoryItemId_idx" ON "HearingAidServiceRecord"("inventoryItemId");

-- CreateIndex
CREATE INDEX "HearingAidFollowUp_status_dueDate_idx" ON "HearingAidFollowUp"("status", "dueDate");

-- CreateIndex
CREATE INDEX "HearingAidFollowUp_patientId_idx" ON "HearingAidFollowUp"("patientId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- ONE ACTIVE APPOINTMENT PER SLOT  (the double-booking guard)
--
-- This is the guarantee that two visitors cannot both book the same time slot.
-- It is a DATABASE constraint, not application logic, which is why it survives
-- the move from PostgreSQL to Turso: SQLite supports partial indexes, so the
-- semantics are identical.
--
-- The booking service still checks availability inside a transaction, but two
-- concurrent requests can both read "OPEN" before either writes. The unique
-- index is what makes the loser fail, and the service maps that violation to the
-- visitor-facing "This time slot is no longer available."
--
-- It is PARTIAL on purpose: cancelled / completed / no-show appointments keep
-- their slotId for history, so a released slot becomes bookable again without
-- deleting the old row.
--
-- Prisma's schema language cannot express a partial unique index, so it lives
-- here in raw SQL. Do not drop it.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "Appointment_active_slot_unique"
  ON "Appointment"("slotId")
  WHERE "slotId" IS NOT NULL
    AND "status" IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');
