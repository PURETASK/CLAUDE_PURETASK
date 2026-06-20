# Phase 6d-3 — Clock-in / Geofence / Photo Verification (Scaffold)

> Companion to [`phase-6d-gps-on-the-way-spec.md`](./phase-6d-gps-on-the-way-spec.md). This document covers a minimal scaffold that lands the verification feature **without** the full Mapbox/GPS-ping pipeline, so the rest of the booking lifecycle (`arrived → in_progress → completed → awaiting_approval → approved`) can flow end-to-end against the existing payments + reviews features.

## What landed

| Piece | File |
|---|---|
| Haversine geofence (default 100 m per phase-6d spec — implemented at **150 m** as a more forgiving v0; tune later) | `src/features/verification/geofence.ts` |
| Per-service required photo counts | `src/features/verification/photo-rules.ts` |
| Server actions: startTransit / markArrived / clockIn / uploadPhoto / clockOut / approve / dispute | `src/features/verification/actions.ts` |
| Read helpers + signed-URL fetcher | `src/features/verification/queries.ts` |
| Cleaner UI: clock buttons (uses `navigator.geolocation`) | `src/features/verification/components/ClockButtons.tsx` |
| Cleaner UI: photo uploader per purpose | `src/features/verification/components/PhotoUploader.tsx` |
| Read-only photo grid (server component, signed URLs) | `src/features/verification/components/PhotoGrid.tsx` |
| Customer approve/dispute UI for `awaiting_approval` | `src/features/verification/components/CustomerApprovalActions.tsx` |
| Private Supabase Storage bucket + RLS for `booking-photos` | `db/migrations/0017_phase6d_photos_bucket_rls.sql` |
| Pure-fn tests (haversine + photo rules) | `src/features/verification/{geofence,photo-rules}.test.ts` |

## What is intentionally NOT in this scaffold

These are part of the full Phase 6d but defer to follow-ups:

- 3-minute GPS ping cadence during transit (6d-2)
- Mapbox/Google Directions ETA for customer's moving-marker map (6d-2, WF 9)
- Late notice flow (6d-4, WF 68)
- Integration with `recordReliabilityEvent()` dispatcher (Phase 7a)
- Push/email notifications on state transitions (uses existing booking-confirmed email pattern when wired)
- Automatic `confirmed → imminent` system transition (T-24h)

## Integration points the host pages need

To turn this on for users:

1. **Cleaner booking detail page** (`src/app/(app)/app/cleaner/bookings/[id]/page.tsx`):
   - Render `<ClockButtons bookingId state />` when state is `confirmed | imminent | in_transit | arrived | in_progress`
   - Render `<PhotoUploader>` (×2: before + after) when state is `in_progress`
   - Render `<PhotoGrid>` when state is `in_progress` or later
2. **Customer booking detail page** (`src/app/(app)/app/bookings/[id]/page.tsx`):
   - Render `<PhotoGrid>` when state is `awaiting_approval` or later
   - Render `<CustomerApprovalActions>` when state is `awaiting_approval`

This scaffold does **not** modify either page in this PR — they're left for a follow-up so the wiring choices can match whatever the host pages currently look like.

## Migration

Apply `0017_phase6d_photos_bucket_rls.sql` in Supabase. Creates:
- Bucket `booking-photos` (private, 10 MB limit, jpeg/png/webp/heic)
- Helper fn `public.booking_id_from_object_name(text)` for RLS pattern matching
- RLS policies on `storage.objects`:
  - INSERT: cleaner of the booking, only when state = `in_progress`
  - SELECT: customer + cleaner of the booking
  - UPDATE/DELETE: not allowed (cleanup job uses service role)

## Storage decision

Original schema comments referenced Cloudflare R2. Using Supabase Storage since R2 isn't provisioned. Object key shape (`bookings/{booking_id}/photos/{uuid}.{ext}`) matches the planned R2 layout so a future migration is a straight `aws s3 cp`.
