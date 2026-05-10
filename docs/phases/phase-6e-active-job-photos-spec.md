# Phase 6e — Active Job Photo System Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 6e will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: storage cost projections at scale, photo upload reliability across mobile networks, EXIF stripping library behavior on diverse devices, and customer feedback on photo viewing UX. Treat this as an aggressive draft.

**Phase goal:** During an `in_progress` booking (post-clock-in from Phase 6d), cleaner captures per-room before/after photos. Required rooms must be photographed before clock-out (WF 5b). Photos upload in background with retry queue. EXIF data stripped server-side for privacy + integrity. 30-day auto-deletion respects WF 29 retention policy. Customer sees photos at approval (WF 10). Photo training acknowledgment from Phase 4 (WF 49) gates this work.

**Estimated duration:** ~2-3 weeks of focused engineering (12-15 working days). Wide range because mobile camera UX is full of edge cases.

**Depends on:**
- Phase 6d complete (clock-in transitions to `in_progress`)
- Phase 4 cleaner photo training acknowledgment (WF 49) — required for cleaner to take photos
- Phase 6a booking includes room list (customer specifies which rooms)
- Phase 3a customer photo policy (skip rooms) — Phase 6e respects
- B2 schema deployed (`booking_photos` table exists)
- Supabase Storage bucket configured

**Wireframes covered:** WF 5 (active job photo capture), WF 5b (clock-out blocked), WF 49 (photo etiquette training, gated in Phase 4).

**Phase 6e sub-sections (mostly sequential):**

- **6e-1** — Photo capture flow (WF 5) (~5 days)
- **6e-2** — Required-rooms enforcement (WF 5b) (~3 days)
- **6e-3** — Photo storage + integrity + retention (~4 days)
- **Closeout + integration testing** (~2 days)

---

## 0. External account prerequisites

### 0.1 Supabase Storage configuration

**Required actions:**

1. **Bucket creation.** Create `booking-photos` bucket in Supabase Storage (production + staging separate).

2. **Bucket policies.** Configure to require signed URLs only — no public access. Photos accessible only via short-lived signed URLs.

3. **CORS policy.** Allow uploads from your domain only. Reject cross-origin uploads.

4. **Storage class.** Standard tier for v1. Consider Cold Storage for older photos at scale.

5. **Test upload + signed URL.** Hello-world: upload test image, get signed URL, verify retrieval, verify expiry.

### 0.2 EXIF stripping library

**Required actions:**

1. **Choose library.** Sharp (Node) for server-side processing. Strips EXIF, resizes, optimizes.

2. **Install + verify.** `npm install sharp`. Test pipeline: input image with GPS EXIF → output without GPS, resized to 2000px max edge.

3. **Error handling.** Sharp can fail on corrupt images. Fallback: reject upload, surface clear error.

### 0.3 Image processing budget

Photos at scale = real cost. Budget early:

- Avg 10 photos/booking × 1000 bookings/month = 10,000 photos/month
- ~2 MB each post-resize = 20 GB/month new photos
- 30-day retention = ~20 GB rolling storage
- Supabase Storage: $0.021/GB/month + $0.090/GB egress
- Estimated: ~$5/month storage + ~$10/month egress = $15/month at this scale

Manageable. Re-evaluate at 10x scale.

### 0.4 No lawyer items

Phase 6e inherits WF 29 lawyer-reviewed retention copy. No new lawyer items.

---

## 1. Summary

Phase 6e is **the most photo-intensive phase.** Concretely, by the end of Phase 6e:

1. **Cleaner captures photos per room during in_progress.** WF 5 camera UI. Each photo labeled by room + before/after.

2. **Required rooms enforced at clock-out.** WF 5b: clock-out disabled until all required rooms photographed. Skip rooms (per customer policy) excluded from required list.

3. **Photos upload in background with retry queue.** Network drop → queue persists locally → flush on reconnect.

4. **EXIF stripped server-side.** GPS coords, device IDs, edit history removed before storage. Privacy + integrity.

5. **30-day auto-deletion.** Per WF 29 retention. Daily cron deletes photos past 30 days post-completion.

6. **Integrity flag for suspicious images.** If processing detects manipulation evidence, flag for admin review during dispute (Phase 8).

7. **Signed URLs only.** Customer + cleaner access photos via short-lived signed URLs (1-hour expiry). No public URLs.

What Phase 6e does NOT do:
- Customer photo viewing UI (Phase 6f WF 10 approval)
- Dispute photo flow (Phase 8a — separate `dispute_photos` with 7-year retention)
- Cleaner profile portfolio photos (Phase 4 — different table)

---

## 2. Acceptance criteria

### 6e-1 Photo capture (WF 5)

- [ ] `/cleaner/job/[booking_id]/photos` route accessible only during `in_progress` state
- [ ] Camera UI launches via mobile native camera intent
- [ ] Each photo tagged with: room_label, before_or_after, captured_at
- [ ] Photo uploaded in background to Supabase Storage
- [ ] Upload queue persists across app close (local storage)
- [ ] Network drop: photo queued; flushes on reconnect
- [ ] Server-side: EXIF stripped (verified by inspecting metadata)
- [ ] Server-side: image resized to max 2000px on long edge
- [ ] `booking_photos` row inserted with storage_path, room, before/after, captured_at, uploaded_at

### 6e-2 Required rooms enforcement (WF 5b)

- [ ] Required rooms list rendered: kitchen + all bathrooms + all bedrooms + common areas, minus skip rooms
- [ ] Each required room shows status: complete (green check), pending (gray), missing (red)
- [ ] Clock-out button DISABLED until all required rooms have at least 1 photo
- [ ] Disabled state shows hint: "Need photos for: kitchen, bathroom 1"
- [ ] Skip rooms excluded from required list (per customer photo policy)
- [ ] Cleaner can take voluntary extras beyond required
- [ ] Voluntary extras counted as `photos_complete_with_voluntary_extras` event for Phase 7a (+1 score)

### 6e-3 Storage + integrity + retention

- [ ] Photos stored in `booking-photos` bucket (production)
- [ ] Bucket policy: signed URLs only; no public access
- [ ] Customer/cleaner access via signed URL with 1-hour expiry
- [ ] EXIF stripped server-side (verified via `exiftool` output: no GPS, no device, no edit history)
- [ ] Integrity scanner flags suspicious images (cropped to weird aspect ratios, edit history present despite strip)
- [ ] Daily retention cron deletes photos older than 30 days post-completion
- [ ] Customer earlier-deletion request (per Phase 3b) deletes immediately
- [ ] Dispute pending: photos NOT deleted (Phase 8 copies to `dispute_photos` with 7-year retention)

### Cross-cutting

- [ ] All Phase 6e code has unit tests; coverage ≥75%
- [ ] RLS: cleaner reads/writes own booking's photos; customer reads own bookings'; admin all
- [ ] Performance: photo upload <5s p95 on 4G; <2s on Wi-Fi
- [ ] Mobile: camera UI works on iOS + Android
- [ ] Storage: 30-day retention working (verify with backdated test data)

---

## 3. Database state required

### Existing tables (no changes)

- `booking_photos` (B2) — exists
- `bookings` — has state machine

### New migrations (Phase 6e)

```sql
-- Phase 6e migration

-- Add columns to booking_photos for Phase 6e specifics
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS room_label TEXT NOT NULL DEFAULT 'unspecified';
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS before_or_after TEXT NOT NULL DEFAULT 'after'
  CHECK (before_or_after IN ('before', 'after', 'unspecified'));
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ;
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS integrity_concern BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS integrity_concern_reason TEXT;
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS dimensions JSONB; -- {width, height}

-- Required rooms specification on booking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS required_rooms JSONB NOT NULL DEFAULT '[]'::JSONB;
-- Populated at booking creation (Phase 6a) from customer's room list minus skip rooms

-- Photo retention deletion tracking
CREATE TABLE photo_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_photo_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'retention_policy_30_days',
    'customer_requested_early_deletion',
    'admin_manual_deletion'
  )),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_photo_deletion_log_recent ON photo_deletion_log (deleted_at DESC);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_booking_photos_booking
  ON booking_photos (booking_id, room_label);
CREATE INDEX IF NOT EXISTS idx_booking_photos_retention
  ON booking_photos (uploaded_at)
  WHERE uploaded_at < NOW() - INTERVAL '25 days';
```

### RLS policies

```sql
-- booking_photos: customer + cleaner of booking + admin
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_photos_parties ON booking_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_photos.booking_id
      AND (b.customer_user_id = auth.uid() OR b.cleaner_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Write: only cleaner of booking
CREATE POLICY booking_photos_cleaner_write ON booking_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_photos.booking_id
      AND b.cleaner_user_id = auth.uid()
      AND b.state = 'in_progress'
    )
  );
```

---

## 4. Files to create

### App routes (~2 files)

- `/app/cleaner/job/[booking_id]/photos/page.tsx` — WF 5 photo capture
- `/app/cleaner/job/[booking_id]/clock-out/page.tsx` — WF 5b clock-out (gated)

### Components — Camera + capture (~6 files)

- `/features/photos/components/PhotoCaptureScreen.tsx` — WF 5 main UI
- `/features/photos/components/CameraButton.tsx` — launches native camera
- `/features/photos/components/RoomTagger.tsx` — assign room label
- `/features/photos/components/BeforeAfterToggle.tsx`
- `/features/photos/components/PhotoUploadQueue.tsx` — visible queue + retry
- `/features/photos/components/PhotoThumbnail.tsx`

### Components — Required rooms (~3 files)

- `/features/photos/components/RequiredRoomsChecklist.tsx` — WF 5b status
- `/features/photos/components/ClockOutButton.tsx` — gated on completion
- `/features/photos/components/MissingRoomsHint.tsx`

### Library code (~7 files — heavy)

- `/lib/photos/photo_uploader.ts` — upload to Supabase Storage + create booking_photos row
- `/lib/photos/exif_stripper.ts` — Sharp-based EXIF removal + resize
- `/lib/photos/integrity_scanner.ts` — flags suspicious images
- `/lib/photos/required_rooms_calculator.ts` — derives required from booking + skip rooms
- `/lib/photos/clock_out_validator.ts` — checks all required rooms photographed
- `/lib/photos/upload_queue_manager.ts` — mobile-side persistent queue
- `/lib/photos/signed_url_generator.ts` — Supabase Storage signed URLs

### Server actions / API routes (~4 files)

- `/app/api/photos/upload/[booking_id]/route.ts` — POST photo upload
- `/app/api/photos/[photo_id]/url/route.ts` — GET signed URL
- `/app/api/photos/[photo_id]/delete/route.ts` — DELETE (customer-initiated early deletion)
- `/app/api/photos/required-rooms/[booking_id]/route.ts` — GET required rooms status

### Background jobs (~2 files)

- `/jobs/photo_retention_cron.ts` — daily cron deletes photos past 30 days
- `/jobs/integrity_scan_cron.ts` — periodic scan for suspicious uploads

### Phase 7a integration

Modify `clock-out` flow to fire Phase 7a events:
- `photos_complete_required_only` (delta 0 — baseline) when only required photographed
- `photos_complete_with_voluntary_extras` (+1) when extras included
- `photo_integrity_concern` (-3) when scanner flags
- `photos_missing_after_clockout_attempt` (-2) when cleaner attempts clock-out without required

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_6e_schema.sql`

### Docs (3 files)

- (Phase 6 overview already exists)
- `phase-6e-active-job-photos-spec.md` — this file
- `phase-6e-active-job-photos-walkthrough.md`

---

## 5. Implementation order

### 6e-1 — Photo capture flow (~5 days)

**Day 1 — Schema + photo uploader library.** Migration. Build `lib/photos/photo_uploader.ts`. Test Supabase Storage upload.

**Day 2 — EXIF stripper + image processing.** Build `lib/photos/exif_stripper.ts` with Sharp. Test EXIF removal + resize.

**Day 3 — Mobile camera UI.** `PhotoCaptureScreen` with native camera intent. Photo preview. Room tagging.

**Day 4 — Upload queue.** `PhotoUploadQueue` + persistent local storage. Test network drop + reconnect flush.

**Day 5 — Server upload endpoint + integration.** `/api/photos/upload/[booking_id]`. End-to-end: capture → upload → row created.

### 6e-2 — Required rooms enforcement (~3 days)

**Day 6 — Required rooms calculator.** Build `lib/photos/required_rooms_calculator.ts`. Reads booking room list + skip rooms.

**Day 7 — Checklist UI + clock-out gate.** `RequiredRoomsChecklist`, `ClockOutButton` gated on completion.

**Day 8 — Skip room respect + voluntary extras.** Test skip room exclusion. Test voluntary extras +1 score event.

### 6e-3 — Storage + integrity + retention (~4 days)

**Day 9 — Signed URL generator.** `lib/photos/signed_url_generator.ts`. 1-hour expiry. Customer access endpoint.

**Day 10 — Integrity scanner.** `lib/photos/integrity_scanner.ts`. Detection rules: aspect ratio anomalies, edit history present.

**Day 11 — Retention deletion cron.** `jobs/photo_retention_cron.ts`. Daily run. Test with backdated photos.

**Day 12 — Customer early deletion + Phase 8 dispute coordination.** Customer-side delete flow. Test dispute pending = no deletion.

### Closeout (~2 days)

**Day 13-14 — End-to-end integration testing.** Real device camera testing. Network conditions. Multi-room booking. Skip room handling. Edge cases.

---

## 6. Specific gotchas

### Gotcha A — Mobile camera permissions denied

**The problem:** Cleaner denies camera permission on first install. Phase 6e photo flow requires camera. Cleaner stuck.

**The fix:** Check permission state on `/cleaner/job/[id]/photos` route entry. If denied, surface UI: "Camera access is required for this job. Open Settings to enable." Deep link to OS settings.

### Gotcha B — Upload queue lost on app force-close

**The problem:** Cleaner force-closes app mid-upload. Queue in memory only. Lost.

**The fix:** Persist queue to local storage (AsyncStorage / localStorage). On app open, resume queue. Don't lose photos.

### Gotcha C — EXIF stripping doesn't remove all metadata

**The problem:** Sharp strips standard EXIF but some manufacturer-specific metadata persists. Privacy leak.

**The fix:** Whitelist approach instead of blacklist. Sharp `.withMetadata({})` removes everything. Then add back only safe fields (orientation). Verify with `exiftool` post-processing.

### Gotcha D — Resize ratio causes UI artifacts

**The problem:** Photo 4032x3024 → resize to 2000px on long edge → 2000x1500. Aspect ratio 4:3 preserved. But customer expecting square thumbnail = 4:3 displays wrong.

**The fix:** Server resizes to 2000px max edge preserving aspect. Component renders responsive thumbnail with `object-fit: cover`. Don't crop server-side.

### Gotcha E — Integrity scanner false positives

**The problem:** Cleaner takes photo with phone in landscape. Phone defaults to portrait crop. EXIF orientation says landscape. Scanner flags as "edit history present."

**The fix:** Tune integrity rules carefully. Orientation tags are normal; don't flag. Only flag explicit edit signatures (Photoshop, third-party processing tools).

### Gotcha F — Required rooms list mismatch

**The problem:** Customer specified 3 bedrooms at booking. Cleaner photographs 2 (one bedroom door locked). Required check fails. Cleaner can't clock out.

**The fix:** Cleaner UI offers "Skip room (with reason)" option. Reason logged. Phase 7a evaluates: if frequent skip pattern, flag for admin review. Don't dead-end the cleaner.

### Gotcha G — 30-day retention vs dispute window

**The problem:** Customer disputes on day 28 post-completion. Photos retained 2 more days. Customer takes 5 days to respond. Photos deleted before response.

**The fix:** Phase 8a copies photos to `dispute_photos` table at dispute opening. Original `booking_photos` continues 30-day deletion. Dispute copies retained 7 years. Phase 6e doesn't need to know about dispute state — Phase 8a handles copy.

### Gotcha H — Photo upload size at scale

**The problem:** Cleaner uploads 5 MB photos. 10 photos × 1000 bookings/month = 50 GB/month. Storage bill grows.

**The fix:** Server resize to max 2000px preserves quality at ~2 MB per photo. 80% reduction. Verify Sharp pipeline produces target sizes.

---

## 7. Testing strategy

### Unit tests
- `lib/photos/exif_stripper.ts`: EXIF removal verified with `exiftool`
- `lib/photos/required_rooms_calculator.ts`: skip rooms excluded
- `lib/photos/clock_out_validator.ts`: missing rooms detected
- `lib/photos/signed_url_generator.ts`: 1-hour expiry enforced

### Integration tests
- Full flow: capture → queue → upload → row → signed URL access
- Network drop during upload → queue persists → reconnect flushes
- Customer accesses photo via signed URL; expired URL fails
- Retention cron deletes 30-day-old photos

### Manual QA
- Real iOS + Android devices (camera UX varies)
- Slow network (throttle to 3G)
- Multi-room booking (full E2E)
- Skip room respected
- Permission denied flow

---

## 8. Deployment plan

### Pre-deploy checklist
- [ ] Migrations applied
- [ ] Supabase Storage bucket configured (production)
- [ ] Bucket policy: signed URLs only
- [ ] Sharp library tested
- [ ] Phase 4 photo training acknowledged for test cleaners
- [ ] Phase 7a stub or real for events

### Deployment order
1. Migrations
2. Storage bucket setup
3. Library code (uploader, EXIF stripper, integrity)
4. Server endpoints
5. Mobile UI
6. Retention cron activation
7. Soft launch: 7 days monitoring

### Rollback
- App code revert if bugs surface
- Don't roll back schema or delete photos
- Storage costs predictable; budget verified

---

## 9. Phase 6e → Phase 6f/8a handoff

Phase 6e output ready for:
- **Phase 6f** (approve & pay) — customer views photos at WF 10 approval; signed URL via 6e endpoint
- **Phase 8a** (disputes) — dispute opening copies photos to `dispute_photos` (7-year retention)

---

## 10. Open questions

1. **Voluntary extra count threshold for +1 event.** 1 extra photo? 5? Recommend 3+ extras = voluntary_extras event.
2. **Skip room frequency threshold for admin flag.** 3 skip rooms in 30 days? Recommend tune post-launch.
3. **Photo deletion request UX.** Per-booking delete vs bulk? Per-booking sufficient v1.
4. **Customer consent for integrity scanning.** Lawyer review if scanning content beyond technical metadata.

---

This spec is the canonical Phase 6e build reference. Walkthrough lives in `phase-6e-active-job-photos-walkthrough.md`.
