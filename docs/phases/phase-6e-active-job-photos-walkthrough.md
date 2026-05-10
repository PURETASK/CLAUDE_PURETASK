# Phase 6e — Plain-English Breakdown

This document walks through `phase-6e-active-job-photos-spec.md` in plain English.

Phase 6e is **the most photo-intensive phase.** Storage costs, privacy compliance, integrity controls all apply. Before Phase 6e, the platform has no photo evidence of work. After Phase 6e, every job has structured before/after photos per room, viewable at approval, retained 30 days for privacy, copied to dispute storage if disputed.

The two non-negotiables: **EXIF stripping** (privacy) and **30-day auto-deletion** (also privacy). Both surface in WF 29 and WF 64 lawyer-reviewed copy. Don't compromise either.

---

# Section 0 — External account prerequisites

## What it means in plain English

Phase 6e needs:
1. **Supabase Storage bucket** — already part of your stack
2. **Sharp library** — npm install for EXIF stripping + resizing

No new vendors. Configuration matters more than vendor selection.

## Why signed URLs only

If photos accessible via public URL, anyone with the URL can view forever. Customer's bedroom photo shared by accident = irreversible privacy leak.

Signed URLs expire (1 hour). After expiry, URL useless. Even if leaked, leak window is 1 hour.

## Why image processing budget matters

10 photos × 1000 bookings/month × 2 MB each = 20 GB/month of new photos. Multiplied by retention.

At expected scale: ~$15/month total. At 10x scale (Phase 11+ growth): ~$150/month. Plan ahead.

## Beginner traps

- **Don't expose public URLs.** Privacy leak.
- **Don't skip image resizing.** Cost explosion.
- **Don't use cheap CDN without signed URL support.** Most cloud storage supports it; verify.

---

# Section 1 — Summary

## What it means in plain English

Seven things will work after Phase 6e:

1. Cleaner captures photos per room during in_progress
2. Required rooms enforced (clock-out gated)
3. Background upload with retry queue
4. EXIF stripped server-side
5. 30-day auto-deletion
6. Integrity flag for suspicious images
7. Signed URLs only

## Why "EXIF stripped server-side"

EXIF metadata can include:
- GPS coordinates (where photo taken — leaks customer address)
- Device identifiers (links photos to specific phone)
- Edit history (reveals if photo was manipulated)

Strip server-side because client-side stripping can be bypassed by malicious client. Server is trusted boundary.

## Why "30-day auto-deletion"

Customer privacy. Photos of someone's home aren't permanent records. WF 29 commits to 30 days. Phase 6e enforces.

Exception: dispute pending → photos copied to `dispute_photos` (7-year retention) before original deletion. Phase 8a handles copy.

## Why integrity flag

Cleaner could photograph a perfectly clean kitchen they didn't actually clean. Stock photo from internet. Or before-photo from previous booking.

Integrity scanner detects suspicious patterns: weird aspect ratios, edit history despite stripping, identical hashes to other photos. Flag for admin review at dispute.

## Beginner traps

- **Don't strip EXIF client-side only.** Trust the server.
- **Don't skip integrity scanning.** Disputes need evidence.
- **Don't delete photos blindly at 30 days.** Check for active disputes first.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: capture, required rooms, storage.

### Photo capture

Background upload critical. Cleaner shouldn't wait for upload to take next photo. Queue handles asynchrony.

Persistent queue (local storage) survives app close. Cleaner force-closes app mid-upload? Photos still queued; flush on next open.

### Required rooms

The clock-out gate is the enforcement mechanism. Without it, cleaners could skip photos and clock out. With it, photos are mandatory.

Skip room respect matters. Customer specified "don't photograph the bedroom" in privacy settings. Cleaner can't violate. Phase 6e respects skip list.

Voluntary extras give +1 score event. Encourages over-documentation. Cleaners who consistently document everything = higher score.

### Storage + integrity

Signed URLs with 1-hour expiry. Customer has time to view; URL dies after.

Integrity scanner with tuned rules. Aggressive rules = false positives, cleaners frustrated. Conservative rules = real cheaters miss. Tune carefully.

30-day cron runs daily. Test with backdated data.

### Cross-cutting

75% test coverage. Lower than 9a (85%) because photos less financially direct. But still meaningful.

## Beginner traps

- **Don't gate clock-out without clear UI feedback.** Cleaner needs to know which rooms missing.
- **Don't trust client-reported room labels.** Server validates against booking room list.
- **Don't expose raw URLs.** Signed URLs only.

---

# Section 3 — Database state required

## What it means in plain English

B2 has `booking_photos`. Phase 6e adds columns:
- `room_label`, `before_or_after`, `captured_at`, `uploaded_at`
- `integrity_concern`, `integrity_concern_reason`
- `file_size_bytes`, `dimensions`

Plus:
- `bookings.required_rooms` JSONB (populated at booking creation)
- `photo_deletion_log` table (audit trail)

### Why audit deletion

When customer asks "where's my photo from last month?" — log says "deleted Day 30 per retention policy." Provable.

Also useful for: admin investigations, compliance audits, retention policy verification.

## Beginner traps

- **Don't UPDATE booking_photos.** New row per upload. Audit trail.
- **Don't skip deletion log.** Need provable deletion records.

---

# Section 4 — Files to create

## What it means in plain English

~25 files. Heavy on:
- 9 components (camera UX is complex)
- 7 library files (image processing logic)
- 4 server actions
- 2 background jobs

### Why so many components

Camera UX has many moving parts:
- `PhotoCaptureScreen` — main orchestrator
- `CameraButton` — native camera intent
- `RoomTagger` — room assignment
- `BeforeAfterToggle` — before/after flag
- `PhotoUploadQueue` — queue visualization
- `PhotoThumbnail` — preview display
- `RequiredRoomsChecklist` — clock-out status
- `ClockOutButton` — gated action
- `MissingRoomsHint` — UI hint

Each does one thing. Composable.

### Why heavy library code

Image processing is high-stakes:
- EXIF stripping (privacy)
- Integrity scanning (dispute evidence)
- Required rooms calculator (clock-out gate)
- Upload queue (mobile state management)
- Signed URL generation (access control)

Pure functions. Testable. Reusable.

## Beginner traps

- **Don't put image processing in components.** Library code only.
- **Don't write upload queue inline.** Persistent queue is its own complexity.

---

# Section 5 — Implementation order

## What it means in plain English

12-15 days. Wide range because mobile camera has edge cases.

### Days 1-5: Capture flow

Schema → uploader → EXIF → camera UI → queue → server endpoint. By Day 5, full capture works.

### Days 6-8: Required rooms

Calculator → checklist UI → clock-out gate. By Day 8, enforcement works.

### Days 9-12: Storage + integrity + retention

Signed URLs → integrity scanner → retention cron → customer early deletion. By Day 12, full storage layer.

### Days 13-14: Closeout

Real device testing. Edge cases. Performance.

## Why the wide range (12-15 days)

Mobile camera testing always reveals more bugs than expected:
- iOS vs Android camera intent differences
- Network conditions
- Permission flows
- Storage edge cases (low disk space)

Budget extra time.

## Beginner traps

- **Don't underestimate mobile camera.** Real devices, real conditions.
- **Don't skip permission denied flow.** Common edge case.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Camera permissions denied
Cleaner stuck. **Fix:** detect early; deep link to settings.

### B — Upload queue lost on force-close
In-memory queue lost. **Fix:** persist to local storage.

### C — EXIF stripping incomplete
Manufacturer metadata persists. **Fix:** whitelist approach; verify with exiftool.

### D — Resize ratio causes UI artifacts
Aspect ratio confusion. **Fix:** preserve aspect server-side; UI handles display.

### E — Integrity scanner false positives
Normal phone photos flagged. **Fix:** tune rules conservatively.

### F — Required rooms list mismatch
Cleaner can't reach a room. **Fix:** "Skip with reason" option.

### G — 30-day retention vs dispute window
Day 28 dispute risks photo deletion. **Fix:** Phase 8a copies to dispute_photos at dispute opening.

### H — Storage cost at scale
50 GB/month if not resized. **Fix:** Sharp resize to 2000px max edge.

## Why these matter

Phase 6e touches privacy + storage + dispute evidence. Bugs are expensive.

## Beginner traps

- **Don't skip exiftool verification.** Sharp claims to strip; verify.
- **Don't dead-end the cleaner.** Always offer escape ("skip with reason").

---

# Section 7 — Testing strategy

Standard layers. EXIF removal verified with exiftool (third-party tool — don't trust your own library to verify itself). Real device camera testing critical.

## Beginner traps

- **Don't trust Sharp's claim to strip EXIF.** Verify.
- **Don't test only on simulator.** Real cameras differ.

---

# Section 8 — Deployment plan

Standard. Storage bucket configuration is critical pre-deploy. Test signed URL access before code deploy.

## Beginner traps

- **Don't enable public bucket access.** Even briefly. Signed URLs only.

---

# Section 9 — Handoff

Phase 6e output for:
- Phase 6f (approve & pay) — customer views photos at approval
- Phase 8a (disputes) — copies photos to dispute_photos at dispute opening

Phase 6e doesn't need to know about disputes. Phase 8a handles the copy.

---

# Section 10 — Open questions

1. Voluntary extras threshold (recommend 3+)
2. Skip room frequency flag (post-launch tuning)
3. Per-booking vs bulk photo deletion (per-booking sufficient v1)
4. Content scanning consent (lawyer review if scanning content)

---

# Notes on what comes next

Phase 6f (approve & pay + review + tip) — depends on Phase 6e photos uploaded.

Phase 6e is the foundation for trust evidence. Photos are the proof that work happened. Get this right.

---

This walkthrough is the Phase 6e learning document.
