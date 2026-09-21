-- Make released slots rebookable: drop the blanket unique on Appointment.slotId
-- and enforce exclusivity with a partial unique index over ACTIVE statuses only.
-- Cancelled / completed / no-show appointments keep their slotId for history.

DROP INDEX IF EXISTS "Appointment_slotId_key";

CREATE UNIQUE INDEX "Appointment_active_slot_unique"
  ON "Appointment"("slotId")
  WHERE "slotId" IS NOT NULL
    AND "status" IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

-- slotId is now nullable (null only in the pathological detach case).
ALTER TABLE "Appointment" ALTER COLUMN "slotId" DROP NOT NULL;
