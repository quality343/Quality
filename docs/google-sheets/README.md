# Appointment → Google Sheets mirror

**Turso is the source of truth. The spreadsheet is a secondary reporting view.**
Nothing here can create, change or delete an appointment, and no part of the
booking flow depends on it succeeding.

```
Visitor books
   → validated, slot claimed, appointment committed to Turso   ← source of truth
   → confirmation shown to the visitor
   → appointment POSTed to the Apps Script webhook             ← best effort
        ├─ yes → appointment.googleSheetSyncStatus = SYNCED
        └─ no  → appointment unchanged, status = FAILED + reason recorded
                 → admin can retry from the appointment table
```

The visitor never sees any of this. There is no Google Sheets UI on the public
site, and a customer never interacts with the spreadsheet.

## Files

| File | Role |
|---|---|
| `src/server/services/google-sheets.ts` | Signing, row building, sync + retry. Never throws into the booking path. |
| `src/server/services/scheduling.ts` | `bookGuestAppointment` commits to Turso, then calls the sync. |
| `src/app/(portal)/portal/actions-scheduling.ts` | `retrySheetSyncAction` — staff-only, audited. |
| `src/app/(portal)/portal/admin/appointments/AppointmentsTable.tsx` | Sync badge + "Retry Google Sheets Sync". |
| `docs/google-sheets/appointments-webhook.gs` | The Apps Script receiver. |

## Environment variables (both server-side, never `NEXT_PUBLIC_*`)

| Name | Notes |
|---|---|
| `GOOGLE_SHEETS_WEBHOOK_URL` | The Apps Script **`/exec`** URL. |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | 32+ random bytes. Must equal `SHEET_WEBHOOK_SECRET` in the Apps Script's script properties. |
| `GOOGLE_SHEETS_TIMEOUT_MS` | Optional, default `8000`. |

Set neither, and the integration is simply **off**: bookings work normally and the
dashboard shows "Not configured on this deployment". Set one of the pair without
the other and the production build **fails** (`npm run check-env`) — a half-set
pair would silently fail every booking's mirror.

```bash
openssl rand -hex 32   # GOOGLE_SHEETS_WEBHOOK_SECRET
```

## Sheet structure

One tab, named exactly **`Appointments`**, with this column order (enforced by
`SHEET_COLUMNS` in the service and `COLUMNS` in the script):

| # | Column | Notes |
|---|---|---|
| 1 | Appointment ID | `QHC-XXXXXXXX` booking reference — **the dedupe key** |
| 2 | Booking Created At | IST, `YYYY-MM-DD h:mm am/pm` |
| 3 | Patient Name | |
| 4 | Phone | |
| 5 | Email | Blank when not given |
| 6 | Appointment Type | `Clinic Visit` or `Home Consultation` |
| 7 | Service | From the database |
| 8 | Appointment Date | Clinic: slot date. Home: the patient's preferred date |
| 9 | Appointment Time | Clinic: slot time. Home: the chosen window (morning/afternoon/evening) |
| 10 | Address | Clinic: the branch address **from the database**. Home: the patient's submitted address |
| 11 | Status | `Booked`, `Checked In`, … |
| 12 | Notes | Home: instructions + confirmation status. Clinic: the reason/note |

## Setup

1. Create the spreadsheet, then **Extensions → Apps Script**.
2. Paste `appointments-webhook.gs` into `Code.gs`.
3. **Project Settings → Script properties** → add `SHEET_WEBHOOK_SECRET` with the
   same value as the Netlify variable. Optionally `SPREADSHEET_ID` (unnecessary if
   the script is bound to the sheet).
4. Run `setupSheet()` once and approve the prompt — creates the tab and header row.
5. **Deploy → New deployment → Web app**: execute as *Me*, access *Anyone*.
   Copy the **`/exec`** URL.
6. In Netlify: add `GOOGLE_SHEETS_WEBHOOK_URL` (the `/exec` URL) and
   `GOOGLE_SHEETS_WEBHOOK_SECRET`, then redeploy.
7. Confirm the deployment works before booking anything: `npm run verify:sheets`
   (see below).
8. Book a test appointment on the site and confirm exactly one row appears, with
   an Appointment ID matching the confirmation screen.
9. Delete the test rows when you're done (the sheet is a mirror, so a row is
   simply re-appended if that appointment is ever retried).

> Access must be *Anyone*, otherwise Google redirects the server-to-server POST to
> a login page and every sync fails. That is safe here because the request has to
> carry a valid HMAC signature — see below.

## Security

- No Google credentials in the app, the repo, or the browser. No service account,
  no private key, no OAuth token — just a URL and a shared secret.
- Each request is signed: `sig = HMAC-SHA256(secret, "<ts>.<raw body>")`, sent as
  query parameters `ts` and `sig` alongside the body. The receiver rejects
  anything outside a 5-minute window, so a captured URL expires.
- The signature travels in the query string, **not** headers, because an Apps
  Script Web App's `doPost(e)` exposes no request headers at all
  ([Google issue 67764685](https://issuetracker.google.com/issues/67764685)).
  Headers are still sent for conventional tooling; the script ignores them.
- Only a timestamp and a signature ever appear in a URL — never the secret, and
  never patient data.
- The retry action is gated by `requireRoleOrThrow(...CLINIC_OPS_ROLES)` and
  audited (`APPOINTMENT_SHEET_SYNC_RETRIED`). No new role was introduced.

## Failure behaviour

A sync failure is an operational annoyance, never a lost booking:

- the appointment stays in Turso, and the visitor still gets a confirmation;
- the reason is recorded on the row (`googleSheetSyncError`, truncated to 300
  chars) and logged server-side;
- the appointment table shows **Sync failed** with a **Retry Google Sheets Sync**
  button.

Retrying re-sends the same appointment with `force`. The Apps Script looks up the
Appointment ID first and appends only if absent, so **a retry cannot create a
duplicate row** — which also covers the awkward case where the row was appended
but the response was lost.

Deliberately not implemented: no queue, no cron retry. A clinic-sized volume of
bookings does not justify the machinery, and a human retry that reports its
outcome honestly is better than a background job that fails silently.

## Self-check inside the Apps Script editor

Selecting `setupSheet` and clicking **Run** only ever prints *"Execution
completed"* — the editor does not show a function's return value — so that run
tells you nothing either way. Run **`diagnose`** instead: it prints a checklist to
the Execution log (secret present and the right length, spreadsheet reachable,
the tab exists, the 12 headers match, and what to do next).

It prints the secret's length and first 4 characters, never the value, so the
output is safe to screenshot. `setupSheet` itself is idempotent: running it again
will not add a second header row.

## Verify the real webhook

Once the Apps Script is deployed, run this against it — it is the only check
that proves the *live* endpoint works, and it needs no database:

```bash
npm run verify:sheets
```

It reports on the deployment itself: reachable at all, answering our script's
JSON rather than a Google sign-in page (which is what *access: Anyone* prevents),
refusing an unsigned and a wrongly-signed request, appending one clearly-marked
`QHC-SETUPCHECK-…` row, and refusing to append it a second time. **Delete that
row afterwards** — it is a mirror row with no appointment behind it, so it will
never be updated.

Useful failure readings:

| Output | Meaning |
|---|---|
| `GET /exec responds` fails | Wrong URL, or the deployment is not published. |
| *not our script's JSON* | Access is not *Anyone*, so Google served a login page. |
| `Invalid signature` on the valid request | `GOOGLE_SHEETS_WEBHOOK_SECRET` ≠ `SHEET_WEBHOOK_SECRET`. |
| `Signature expired` | Server clock skew of more than 5 minutes. |

## Tests

```bash
npm run test:sheets        # 47 checks, creates and cleans up its own fixtures
```

`scripts/test-google-sheets-sync.ts` runs the real sync service against a local
receiver that re-implements the Apps Script contract (signature over the raw
body, 5-minute freshness window, dedupe on Appointment ID). It covers:

- clinic visit and home consultation row shaping, with the exact column order;
- the slot date/time rendered in IST, and the branch address from the database;
- a forced retry reaching the receiver and being refused as a duplicate;
- **Turso keeps the appointment** when the receiver is unreachable, records the
  reason, and succeeds on retry once it returns;
- unsigned, wrongly-signed and replayed requests rejected;
- an unconfigured deployment reporting `DISABLED` without corrupting the last
  good status.

**Not covered here:** the deployed Apps Script and the real spreadsheet, because
deploying the web app needs the clinic's Google account. `npm run verify:sheets`
closes most of that gap (it exercises the real deployment), but the final
confirmation still requires deploying the web app (Setup, steps 1–5) and booking
one real appointment end to end. Until that has been done and the row seen, treat
the Google side as unverified.
