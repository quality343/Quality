# Clinical & Scheduling Flow — QUALITY Hearing Care

Implemented chain (Phases 2–3):

```
Patient → Appointment → Hearing Assessment → Diagnostic Tests → Test Results
        → Audiogram → Audiologist Review → Clinical Report
```

## End-to-end walkthrough

1. **Organization setup** (clinic-operations portal, one-time)
   - Clinic information / single clinic (`/portal/admin/branches`).
   - Create bookable services with duration + category (`/portal/admin/services`).
   - Seed script alternative: `npx tsx scripts/seed-org.ts`.

2. **Scheduling** (clinic-operations portal — `/portal/admin/availability`,
   worklist at `/portal/admin/appointments`). Note: these clinical workflows are
   deferred in the current product; the scheduling half is live.
   - Generate slots: branch + date + time window + slot length. Idempotent —
     existing slots are never overwritten; occupancy is enforced by a DB
     unique constraint, never by UI state.
   - Appointments move through a server-validated state machine:
     `BOOKED → CHECKED_IN → IN_PROGRESS → COMPLETED`, with `CANCELLED` /
     `NO_SHOW` side exits. Cancelling frees the slot and notifies the patient.

3. **Booking** (Patient portal `/portal/patient/appointments`)
   - Wizard: branch → service → open slots (live from `/api/slots`,
     session-protected) → confirm. A double-book race returns a friendly
     "slot no longer available" error (P2002 on the unique `slotId`).

4. **Assessment** (Audiologist portal `/portal/audiologist/assessments`)
   - Start from a patient search; record case history (complaints, history,
     referral) while in `DRAFT`.
   - Record tests: full PTA form (air/bone per ear × 250 Hz–8 kHz, masking
     flag) plus speech, tympanometry, ABR, OAE, vestibular, tinnitus, and
     specialized forms. A PTA save automatically creates the audiogram.
   - **Mark complete** (requires ≥ 1 test) → `COMPLETED`.

5. **Review** (state machine on the assessment)
   - `COMPLETED → REVIEWED` with a typed review/conclusion from the
     audiologist. The system never auto-interprets; charts display recorded
     data only.

6. **Report**
   - `REVIEWED` assessments can be snapshotted into a Report (DRAFT or
     FINAL). Finalizing locks the assessment as `REPORTED` and releases the
     report to the patient's portal, where it renders as a printable,
     brand-styled document via a guarded, audit-logged endpoint.

## Safety properties

- Every mutation re-checks role + branch scoping server-side.
- Patients can only ever read their own assessments/reports (joins anchored
  on the session user id, never client ids).
- Slot double-booking is impossible at the database level.
- Signed clinical content is never mutated: reports are immutable snapshots,
  and the note model supports superseding revisions.
- All security-relevant events (bookings, status changes, report
  generation/views, denials) are written to the append-only audit log with no
  PHI in metadata.
