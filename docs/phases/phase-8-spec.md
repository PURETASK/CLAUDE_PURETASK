# Phase 8 — Photo Verification + GPS Check-in/Check-out Spec

> **Goal:** Cleaners clock in/out at the customer's address (GPS-verified geofence), upload required before/after photos, and customers approve or dispute the completed work within 24h.
> **Status:** Scaffolded. Production-ready storage backend (Supabase Storage) wired; geofence + photo enforcement live in server actions.
> **Prerequisite:** Phase 6 booking flow live; Phase 7 payment scaffold in place.

---

## Acceptance criteria

- [ ] Cleaner on a `confirmed`/`imminent` booking can tap "On my way" (`→ in_transit`)
- [ ] System advances `in_transit → arrived` when cleaner is within geofence radius of the booking address
- [ ] Cleaner can tap "Clock in" on `arrived` (`→ in_progress`), recorded with timestamp
- [ ] Cleaner can upload before/after photos on `in_progress`; UI shows current count vs. required
- [ ] Cleaner can tap "Clock out" on `in_progress` (`→ completed`) only if minimum photos uploaded
- [ ] `completed → awaiting_approval` happens immediately (system); 24h auto-approval timer set
- [ ] Customer can approve (`→ approved`) or dispute (`→ disputed`) on `awaiting_approval`
- [ ] Background job auto-approves `awaiting_approval` bookings whose `auto_approval_due_at` has passed
- [ ] Photos are stored in a private Supabase Storage bucket; access enforced by RLS (customer + cleaner of the booking + admin)
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` all pass

---

## State machine (Phase 8 additions)

```
confirmed   ─system T-24h──► imminent
imminent    ─cleaner tap───► in_transit
in_transit  ─geofence hit──► arrived       (system)
arrived     ─cleaner tap───► in_progress   (clock in)
in_progress ─cleaner tap───► completed     (clock out, requires N photos)
completed   ─system────────► awaiting_approval
awaiting_approval ─customer ► approved
awaiting_approval ─system timer (24h) ► auto_approved
awaiting_approval ─customer ► disputed
```

All transitions already covered by [`state-machine.ts`](../../src/features/booking/state-machine.ts) and tested in [`state-machine.test.ts`](../../src/features/booking/state-machine.test.ts).

---

## Geofence rules

- Radius: **150 meters** from the address centroid (`addresses.latitude/longitude`)
- Distance: haversine formula on cleaner-submitted GPS at clock-in attempt
- If cleaner is outside radius:
  - `in_transit` clock-in is blocked with a clear error showing distance
  - Manual override is recorded in `booking_state_events.metadata` for admin audit
- If address has no lat/lng (geocoding pending), bypass the geofence check and warn

Pure helper: [`src/features/verification/geofence.ts`](../../src/features/verification/geofence.ts)

---

## Required photo counts (by service type)

| Service type    | Min photos                                |
| --------------- | ----------------------------------------- |
| standard_clean  | 4 (kitchen, bathroom, living, exit-state) |
| deep_clean      | 6                                         |
| move_in_out     | 8                                         |
| airbnb_turnover | 4                                         |

Stored as a typed map in [`src/features/verification/photo-rules.ts`](../../src/features/verification/photo-rules.ts).

---

## Files (current scaffold)

### New

| File                                                               | Description                                                                                                                                              |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/verification/geofence.ts`                            | `haversineMeters`, `isWithinGeofence`, defaults                                                                                                          |
| `src/features/verification/photo-rules.ts`                         | `REQUIRED_PHOTO_COUNTS`, `meetsRequirements`                                                                                                             |
| `src/features/verification/actions.ts`                             | `startTransitAction`, `markArrivedAction`, `clockInAction`, `uploadBookingPhotoAction`, `clockOutAction`, `approveBookingAction`, `disputeBookingAction` |
| `src/features/verification/queries.ts`                             | `getBookingPhotos`, `getRequiredPhotoCount`                                                                                                              |
| `src/features/verification/components/ClockButtons.tsx`            | Cleaner-facing transit / arrive / clock-in / clock-out buttons (uses navigator.geolocation)                                                              |
| `src/features/verification/components/PhotoUploader.tsx`           | Drag-drop or file-input upload via the upload action                                                                                                     |
| `src/features/verification/components/PhotoGrid.tsx`               | Read-only grid for customer + cleaner                                                                                                                    |
| `src/features/verification/components/CustomerApprovalActions.tsx` | Approve / Dispute on `awaiting_approval`                                                                                                                 |
| `src/features/verification/geofence.test.ts`                       | Pure-fn unit tests                                                                                                                                       |
| `src/features/verification/photo-rules.test.ts`                    | Pure-fn unit tests                                                                                                                                       |
| `db/migrations/0014_phase8_photos_bucket_rls.sql`                  | Supabase Storage bucket + RLS for `booking-photos`                                                                                                       |

### Modified

| File                                               | Change                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| `src/app/(app)/app/cleaner/bookings/[id]/page.tsx` | Show clock buttons + photo uploader by state             |
| `src/app/(app)/app/bookings/[id]/page.tsx`         | Show photo grid + approve/dispute on `awaiting_approval` |

---

## Storage decision

The original DB schema comments reference Cloudflare R2 (`booking_photos.storage_key` shape: `bookings/{booking_id}/photos/{uuid}.jpg`). Since R2 isn't provisioned and Supabase is already in the stack, **Phase 8 uses a private Supabase Storage bucket named `booking-photos`** with the same key shape so a future R2 migration is a straight copy.

`cdn_url` / `thumbnail_url` are populated with Supabase signed URLs (short TTL).

---

## Background job (deferred)

Auto-approval of stale `awaiting_approval` bookings is a Vercel Cron job that scans for `auto_approval_due_at < NOW()` and calls `autoApproveAction(bookingId)` per booking. Add `vercel.ts` cron config in the next phase or when keys are ready; the action itself is implemented now.

---

## Out of scope (defer)

- Real-time customer notifications (Phase 9 — reviews & disputes wires push/email)
- AI photo-quality scoring (post-MVP)
- Cleaner running-late flag UI (DB already supports `is_running_late`)
- Cancellation penalty computation on late cancels (Phase 10)
