-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CLINIC_VISIT', 'HOME_CONSULTATION');

-- CreateEnum
CREATE TYPE "HomeConfirmationStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_slotId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "appointmentType" "AppointmentType" NOT NULL DEFAULT 'CLINIC_VISIT',
ADD COLUMN     "homeAddress" VARCHAR(400),
ADD COLUMN     "homeConfirmationStatus" "HomeConfirmationStatus",
ADD COLUMN     "homeInstructions" VARCHAR(300),
ADD COLUMN     "homeLocality" VARCHAR(200);

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "homeConsultationNote" VARCHAR(300),
ADD COLUMN     "homeConsultationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homeMaxPerDay" INTEGER,
ADD COLUMN     "homeServiceAreas" TEXT;

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "mobile" VARCHAR(20) NOT NULL,
    "email" VARCHAR(200),
    "interest" VARCHAR(60),
    "appointmentType" VARCHAR(30),
    "message" VARCHAR(2000) NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_createdAt_idx" ON "ContactEnquiry"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AppointmentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

