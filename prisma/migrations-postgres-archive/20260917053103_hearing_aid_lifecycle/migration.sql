-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('BTE', 'RIC', 'ITE', 'ITC', 'CIC', 'IIC');

-- CreateEnum
CREATE TYPE "TechnologyLevel" AS ENUM ('PREMIUM', 'ADVANCED', 'MID', 'ESSENTIAL');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DEMO', 'FITTED', 'DISPENSED', 'REPAIR', 'RETIRED');

-- CreateEnum
CREATE TYPE "DeviceCondition" AS ENUM ('NEW', 'REFURBISHED', 'USED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PatientDecision" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "DemoStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'RETURNED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FittingStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP_REQUIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EarSide" AS ENUM ('RIGHT', 'LEFT', 'BILATERAL');

-- CreateEnum
CREATE TYPE "DispensingStatus" AS ENUM ('PREPARED', 'DISPENSED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CLAIM_IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('REPORTED', 'UNDER_REVIEW', 'SENT_FOR_REPAIR', 'REPAIRED', 'READY_FOR_COLLECTION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('REPAIR', 'CLEANING', 'PART_REPLACE', 'CHECKUP');

-- CreateEnum
CREATE TYPE "AccessoryCategory" AS ENUM ('DOME', 'RECEIVER', 'EARMOULD', 'CHARGER', 'BATTERY', 'CLEANING', 'CONNECTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "AftercareStatus" AS ENUM ('PENDING', 'SCHEDULED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AftercareReason" AS ENUM ('INITIAL_FITTING_REVIEW', 'COMFORT_REVIEW', 'LISTENING_REVIEW', 'CLEANING_GUIDANCE', 'BATTERY_CHARGING_GUIDANCE', 'DEVICE_MAINTENANCE', 'OTHER');

-- CreateTable
CREATE TABLE "HearingAidBrand" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidModel" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelCode" VARCHAR(40) NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "technologyLevel" "TechnologyLevel" NOT NULL,
    "description" TEXT,
    "priceInr" INTEGER,
    "warrantyMonths" INTEGER,
    "status" "ModelStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidFeature" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(40) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(40),

    CONSTRAINT "HearingAidFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidModelFeature" (
    "modelId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "detail" VARCHAR(120),

    CONSTRAINT "HearingAidModelFeature_pkey" PRIMARY KEY ("modelId","featureId")
);

-- CreateTable
CREATE TABLE "HearingAidInventoryItem" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serialNo" VARCHAR(60) NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "DeviceCondition" NOT NULL DEFAULT 'NEW',
    "acquiredAt" TIMESTAMP(3),
    "acquiredNote" VARCHAR(200),
    "unitCostInr" INTEGER,
    "notes" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidRecommendation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "audiologistId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'DRAFT',
    "patientDecision" "PatientDecision" NOT NULL DEFAULT 'PENDING',
    "decisionAt" TIMESTAMP(3),
    "reason" VARCHAR(1000) NOT NULL,
    "listeningNeeds" VARCHAR(600),
    "communicationPrefs" VARCHAR(600),
    "handlingNotes" VARCHAR(600),
    "professionalConsiderations" VARCHAR(600),
    "followUpPlan" VARCHAR(400),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidDemo" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" "DemoStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "expectedReturnAt" TIMESTAMP(3) NOT NULL,
    "actualReturnAt" TIMESTAMP(3),
    "patientFeedback" VARCHAR(600),
    "notes" VARCHAR(400),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidDemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidFitting" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "audiologistId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "assessmentId" TEXT,
    "branchId" TEXT NOT NULL,
    "earSide" "EarSide" NOT NULL,
    "status" "FittingStatus" NOT NULL DEFAULT 'PLANNED',
    "fittingDate" TIMESTAMP(3),
    "programmingSummary" VARCHAR(600),
    "verificationNotes" VARCHAR(600),
    "patientFeedback" VARCHAR(600),
    "notes" VARCHAR(400),
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidFitting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidDispensing" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "fittingId" TEXT,
    "branchId" TEXT NOT NULL,
    "dispensedById" TEXT NOT NULL,
    "status" "DispensingStatus" NOT NULL DEFAULT 'PREPARED',
    "dispensedAt" TIMESTAMP(3),
    "notes" VARCHAR(400),
    "patientAcknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidDispensing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidWarranty" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "provider" VARCHAR(120) NOT NULL,
    "reference" VARCHAR(60),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "coverageNotes" VARCHAR(400),
    "status" "WarrantyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidWarranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidServiceRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "branchId" TEXT,
    "assignedStaffId" TEXT,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'REPAIR',
    "status" "ServiceStatus" NOT NULL DEFAULT 'REPORTED',
    "issueDescription" VARCHAR(600) NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionNotes" VARCHAR(600),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidAccessory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AccessoryCategory" NOT NULL,
    "description" TEXT,
    "priceInr" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingAidAccessoryCompatibility" (
    "accessoryId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "HearingAidAccessoryCompatibility_pkey" PRIMARY KEY ("accessoryId","modelId")
);

-- CreateTable
CREATE TABLE "HearingAidFollowUp" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fittingId" TEXT,
    "inventoryItemId" TEXT,
    "audiologistId" TEXT,
    "branchId" TEXT,
    "reason" "AftercareReason" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "notes" VARCHAR(400),
    "outcome" VARCHAR(600),
    "status" "AftercareStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HearingAidFollowUp_pkey" PRIMARY KEY ("id")
);

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

-- AddForeignKey
ALTER TABLE "HearingAidModel" ADD CONSTRAINT "HearingAidModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "HearingAidBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidModelFeature" ADD CONSTRAINT "HearingAidModelFeature_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidModelFeature" ADD CONSTRAINT "HearingAidModelFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "HearingAidFeature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidInventoryItem" ADD CONSTRAINT "HearingAidInventoryItem_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidInventoryItem" ADD CONSTRAINT "HearingAidInventoryItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidRecommendation" ADD CONSTRAINT "HearingAidRecommendation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidRecommendation" ADD CONSTRAINT "HearingAidRecommendation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidRecommendation" ADD CONSTRAINT "HearingAidRecommendation_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidRecommendation" ADD CONSTRAINT "HearingAidRecommendation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDemo" ADD CONSTRAINT "HearingAidDemo_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDemo" ADD CONSTRAINT "HearingAidDemo_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDemo" ADD CONSTRAINT "HearingAidDemo_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDemo" ADD CONSTRAINT "HearingAidDemo_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFitting" ADD CONSTRAINT "HearingAidFitting_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFitting" ADD CONSTRAINT "HearingAidFitting_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFitting" ADD CONSTRAINT "HearingAidFitting_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFitting" ADD CONSTRAINT "HearingAidFitting_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "HearingAidRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFitting" ADD CONSTRAINT "HearingAidFitting_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HearingAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFitting" ADD CONSTRAINT "HearingAidFitting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDispensing" ADD CONSTRAINT "HearingAidDispensing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDispensing" ADD CONSTRAINT "HearingAidDispensing_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDispensing" ADD CONSTRAINT "HearingAidDispensing_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "HearingAidRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDispensing" ADD CONSTRAINT "HearingAidDispensing_fittingId_fkey" FOREIGN KEY ("fittingId") REFERENCES "HearingAidFitting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDispensing" ADD CONSTRAINT "HearingAidDispensing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidDispensing" ADD CONSTRAINT "HearingAidDispensing_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidWarranty" ADD CONSTRAINT "HearingAidWarranty_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidWarranty" ADD CONSTRAINT "HearingAidWarranty_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidServiceRecord" ADD CONSTRAINT "HearingAidServiceRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidServiceRecord" ADD CONSTRAINT "HearingAidServiceRecord_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidServiceRecord" ADD CONSTRAINT "HearingAidServiceRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidServiceRecord" ADD CONSTRAINT "HearingAidServiceRecord_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidAccessoryCompatibility" ADD CONSTRAINT "HearingAidAccessoryCompatibility_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "HearingAidAccessory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidAccessoryCompatibility" ADD CONSTRAINT "HearingAidAccessoryCompatibility_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "HearingAidModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFollowUp" ADD CONSTRAINT "HearingAidFollowUp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFollowUp" ADD CONSTRAINT "HearingAidFollowUp_fittingId_fkey" FOREIGN KEY ("fittingId") REFERENCES "HearingAidFitting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFollowUp" ADD CONSTRAINT "HearingAidFollowUp_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "HearingAidInventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFollowUp" ADD CONSTRAINT "HearingAidFollowUp_audiologistId_fkey" FOREIGN KEY ("audiologistId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HearingAidFollowUp" ADD CONSTRAINT "HearingAidFollowUp_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
