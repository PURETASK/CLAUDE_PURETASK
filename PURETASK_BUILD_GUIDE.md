# PureTask — Complete Build Guide
**Generated:** 2026-05-09  
**Source:** Master Analysis Report  
**Purpose:** Every feature, every file, every implementation step. Build this in order.

---

# SECTION 1 — ART ASSETS DEPLOYMENT

## 1.1 — Copy All Assets to Public Directory

**Action:** Move all art assets into the Next.js public folder so they are web-accessible.

```
public/
└── assets/
    ├── icons/
    │   ├── home_icon.jpeg
    │   ├── calendar_icon.jpeg
    │   ├── wallet_icon.jpeg
    │   ├── notification_icon.jpeg
    │   ├── settings_icon.jpeg
    │   ├── message_icon.jpeg
    │   ├── contacts_icon.jpeg
    │   ├── cleaning_icon.jpeg
    │   ├── cleaning_icon_2.png
    │   ├── checkmark_icon.png
    │   └── ai_assistant_icon.png
    ├── backgrounds/
    │   ├── bubbles_background.png
    │   ├── background_middle_empty.jpg
    │   ├── cleaning_background.png
    │   ├── legal_page_background.png
    │   ├── support_page_background.png
    │   ├── find_your_city.png
    │   ├── cleaners_wanted.png
    │   └── cleaning_supplies_background.jpg
    └── brand/
        ├── Puretask_official_logo.png
        └── dash_mascot.png
```

**Steps:**
1. Create `public/assets/icons/`, `public/assets/backgrounds/`, `public/assets/brand/` directories
2. Copy files from `art_assets/` into the correct subfolder
3. Rename files to lowercase-with-hyphens (Next.js convention): `home-icon.jpeg`, `calendar-icon.jpeg`, etc.

---

## 1.2 — Create Shared Asset Constants File

**File to create:** `src/lib/assets.ts`

```ts
export const ICONS = {
  home: '/assets/icons/home-icon.jpeg',
  calendar: '/assets/icons/calendar-icon.jpeg',
  wallet: '/assets/icons/wallet-icon.jpeg',
  notification: '/assets/icons/notification-icon.jpeg',
  settings: '/assets/icons/settings-icon.jpeg',
  message: '/assets/icons/message-icon.jpeg',
  contacts: '/assets/icons/contacts-icon.jpeg',
  cleaning: '/assets/icons/cleaning-icon.jpeg',
  cleaningAlt: '/assets/icons/cleaning-icon-2.png',
  checkmark: '/assets/icons/checkmark-icon.png',
  aiAssistant: '/assets/icons/ai-assistant-icon.png',
} as const;

export const BACKGROUNDS = {
  bubbles: '/assets/backgrounds/bubbles-background.png',
  frame: '/assets/backgrounds/background-middle-empty.jpg',
  cleaningFrame: '/assets/backgrounds/cleaning-background.png',
  legal: '/assets/backgrounds/legal-page-background.png',
  support: '/assets/backgrounds/support-page-background.png',
  findCity: '/assets/backgrounds/find-your-city.png',
  cleanersWanted: '/assets/backgrounds/cleaners-wanted.png',
} as const;

export const BRAND = {
  logo: '/assets/brand/Puretask_official_logo.png',
  dash: '/assets/brand/dash_mascot.png',
} as const;
```

---

## 1.3 — Deploy Icons to Navigation + Feature Tiles

**Files to modify:**

| Location | Icon to Add | Implementation |
|---|---|---|
| Customer dashboard hero | `cleaning` icon | `<Image src={ICONS.cleaning} width={48} height={48} />` above booking CTA |
| Cleaner dashboard earnings card | `wallet` icon | Header of earnings summary card |
| Notification bell dropdown | `notification` icon | Replace or supplement existing bell |
| Settings page header | `settings` icon | Page title area |
| Messages feature | `message` icon | Thread list header, empty state |
| Address/home sections | `home` icon | Address card header |
| Booking calendar | `calendar` icon | Date picker header |
| Profile sections | `contacts` icon | Profile card header |
| Verification/approval | `checkmark` icon | "Work approved" confirmation screen |
| Support chat | `aiAssistant` icon | Help center entry point |

---

## 1.4 — Deploy Backgrounds to Specific Pages

**Files to modify:**

**Legal pages** (`src/app/(marketing)/legal/*/page.tsx`):
```tsx
<div
  className="relative min-h-screen"
  style={{ backgroundImage: `url(${BACKGROUNDS.legal})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
>
  <div className="bg-white/80 backdrop-blur-sm min-h-screen">
    {/* page content */}
  </div>
</div>
```

**Support page** (`src/app/(app)/support/page.tsx`):
- Add `BACKGROUNDS.support` as decorative right-side element or page hero

**Coverage / Waitlist page** (new page):
- Use `BACKGROUNDS.findCity` as the full-width hero image

**For Cleaners page** (`src/app/(marketing)/for-cleaners/page.tsx`):
- Use `BACKGROUNDS.cleanersWanted` as the hero section image

**Homepage hero** (`src/app/(marketing)/page.tsx`):
- Use `BACKGROUNDS.bubbles` as the hero section background with a brand gradient overlay

---

## 1.5 — Deploy Dash Mascot

**Where to place Dash:**

1. **Customer onboarding welcome** (first step of booking wizard) — Dash flying in from right
2. **Cleaner application submitted** success state — Dash with sparkle
3. **Booking confirmed** confirmation screen — Dash + checkmark
4. **Payout landing** success state — Dash with sparkle
5. **Empty state: no bookings yet** — Dash with cleaning icon below
6. **Loading screens** — Dash with subtle animation CSS

```tsx
// Reusable Dash component
// src/components/ui/dash-mascot.tsx
import Image from 'next/image';
import { BRAND } from '@/lib/assets';

type DashSize = 'sm' | 'md' | 'lg';
const sizes: Record<DashSize, number> = { sm: 48, md: 80, lg: 120 };

export const DashMascot = ({ size = 'md', className }: { size?: DashSize; className?: string }) => (
  <Image
    src={BRAND.dash}
    width={sizes[size]}
    height={sizes[size]}
    alt="Dash the PureTask hummingbird"
    className={className}
    priority={false}
  />
);
```

---

# SECTION 2 — DATABASE SCHEMA DEPLOYMENT (B1–B8)

The 8 SQL files in `b1-b8 needs review/` are the production-ready schema. They must be deployed to Supabase before any schema-dependent features can be built.

## 2.1 — Deploy B1–B8 to Supabase

**Prerequisite:** Supabase project exists and is linked.

**Steps:**
1. Open Supabase dashboard → SQL Editor
2. Run files in EXACT order — do not skip, do not reorder:
   - B1_core_identity.sql
   - B2_booking_lifecycle.sql
   - B3_trust_evidence.sql
   - B4_cleaner_operations.sql
   - B5_money.sql
   - B6_platform_operations.sql
   - B7_onboarding_verification.sql
   - B8_audit_fixes.sql (MUST be last)
3. After each file: confirm "Success. No rows returned." before continuing
4. Run verification queries from `CLAUDE_CODE_HANDOFF.md`:
   - Table count = 54
   - Enum count = 42
   - Index count ≈ 190

**Critical rules from HANDOFF doc:**
- Do NOT modify any SQL file
- Do NOT run in parallel
- Stop immediately if any file errors

---

## 2.2 — Generate TypeScript Types from Schema

After B1–B8 are deployed, regenerate the Supabase TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
```

This gives you full type safety for all 54 tables.

---

## 2.3 — Verify Environment Variables

Ensure these are set in `.env.local`:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TAX_ENCRYPTION_KEY=   ← Required for encrypted_tax_id (AES-256-GCM, 32-byte key)
```

---

# SECTION 3 — PHASE 17: ACTIVE JOB FLOW

The most critical unbuilt feature. Cleaners need this to operate. Customers need this to trust the service.

## 3.1 — Booking State Machine Completion

**DB table:** `booking_state_events` (B2)  
**File to create:** `src/features/booking/lib/booking-states.ts`

```ts
export type BookingState =
  | 'pending_acceptance'
  | 'accepted'
  | 'en_route'          // NEW — cleaner tapped "On my way"
  | 'running_late'      // NEW — cleaner flagged late
  | 'arrived'           // NEW — cleaner confirmed arrival
  | 'clocked_in'        // NEW — job started
  | 'photos_submitted'  // NEW — all room photos uploaded
  | 'clocked_out'       // NEW — job ended
  | 'pending_approval'
  | 'approved'
  | 'disputed'
  | 'completed'
  | 'cancelled';

// Write every state transition to booking_state_events
export async function writeBookingStateEvent(
  supabase: SupabaseClient,
  bookingId: string,
  newState: BookingState,
  actorId: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from('booking_state_events').insert({
    booking_id: bookingId,
    new_state: newState,
    actor_id: actorId,
    metadata,
    created_at: new Date().toISOString(),
  });
  await supabase.from('bookings').update({ status: newState }).eq('id', bookingId);
}
```

---

## 3.2 — "On My Way" Screen (WF4)

**Route:** `/app/cleaner/jobs/[id]/on-my-way`  
**File to create:** `src/app/(app)/cleaner/jobs/[id]/on-my-way/page.tsx`  
**Component:** `src/features/booking/components/cleaner/OnMyWayScreen.tsx`

**What to build:**
```
┌─────────────────────────────────┐
│  ← Back          On My Way      │
├─────────────────────────────────┤
│  [Map stub — customer address   │
│   with route line]              │
│                                 │
│  📍 123 Oak Street, Apt 4B     │
│     Sacramento, CA 95814        │
│     ~18 min away                │
├─────────────────────────────────┤
│  ENTRY INSTRUCTIONS             │
│  Gate code: #4821               │
│  Parking: Street parking on     │
│  Oak St — free all day          │
├─────────────────────────────────┤
│  [ Call Customer ]  [ Message ] │
├─────────────────────────────────┤
│  [ I'm Running Late ]           │  ← opens WF68
│  [ I've Arrived ]               │  ← triggers geofence check
└─────────────────────────────────┘
```

**Implementation:**
1. Query booking by ID, get customer address + entry instructions
2. Tap "On My Way" → call `writeBookingStateEvent(bookingId, 'en_route', cleanerId)`
3. Send push notification to customer: "Your cleaner is on the way — ETA 18 min"
4. Map stub: use Google Maps Embed API with directions from cleaner location to job
5. "I've Arrived" → geofence check → if within 500m of address → `writeBookingStateEvent('arrived')` → navigate to Active Job screen

**Server action:** `src/features/booking/actions/cleaner-job-actions.ts`
```ts
export async function markEnRoute(bookingId: string): Promise<ActionState>
export async function markArrived(bookingId: string, cleanerLat: number, cleanerLng: number): Promise<ActionState>
```

**Art assets to use:** `BACKGROUNDS.bubbles` (subtle in map area), `ICONS.home` (address card header)

---

## 3.3 — "On My Way" Arrived State (WF4b)

After "I've Arrived" confirmed:

```
┌─────────────────────────────────┐
│  ✓ You've Arrived               │
│  Great — the customer has been  │
│  notified you're here.          │
├─────────────────────────────────┤
│  Clock-in opens in:  0:30       │  ← 30-second delay
│                                 │
│  [ Clock In and Start Job ]     │  ← enabled after delay
└─────────────────────────────────┘
```

**Implementation:** 30-second countdown timer before clock-in button enables. Prevents accidental early clock-in.

---

## 3.4 — Cleaner Running Late (WF68)

**File to create:** `src/features/booking/components/cleaner/RunningLateModal.tsx`

**What to build:**
```
┌─────────────────────────────────┐
│  Running Late?                  │
│  Let your customer know so they │
│  can plan accordingly.          │
├─────────────────────────────────┤
│  How late?                      │
│  [ 5 min ] [ 10 min ] [ 15 min ]│
│  [ 20 min ] [ 30 min ] [ Other ]│
├─────────────────────────────────┤
│  Reason (optional)              │
│  [ Traffic  ] [ Prev job ran    │
│    long     ] [ Parking ]       │
│  [ Personal ] [ Other ]         │
├─────────────────────────────────┤
│  We'll send this to the customer│
│  "Your cleaner is running ~10   │
│  minutes late. New ETA: 2:45pm" │
│                                 │
│  [ Send Update ]                │
└─────────────────────────────────┘
```

**Implementation:**
1. Chip selectors for time (5/10/15/20/30 min) and reason tags
2. Preview the message before sending
3. On submit: `writeBookingStateEvent('running_late', { minutes_late: 10, reason: 'traffic' })`
4. Send push notification to customer with new ETA
5. Update booking's `estimated_arrival_at` column

---

## 3.5 — Cleaner Active Job Screen (WF5)

**Route:** `/app/cleaner/jobs/[id]/active`  
**File to create:** `src/app/(app)/cleaner/jobs/[id]/active/page.tsx`  
**Component:** `src/features/booking/components/cleaner/ActiveJobScreen.tsx`

**What to build:**
```
┌─────────────────────────────────┐
│  Active Job                  ●  │  ← live indicator
│  Maria's Home · 123 Oak St      │
├─────────────────────────────────┤
│  ⏱  1:23:45                     │  ← running job timer
│  Clocked in at 2:00pm           │
├─────────────────────────────────┤
│  ROOMS TO PHOTOGRAPH            │
│  ✓ Living Room (2 photos)       │
│  ✓ Kitchen (2 photos)           │
│  ○ Bedroom 1                    │  ← tap to open camera
│  ○ Bedroom 2                    │
│  ○ Bathroom                     │
├─────────────────────────────────┤
│  [ + Upload Room Photos ]       │
├─────────────────────────────────┤
│  [ Clock Out ]                  │  ← enabled when all rooms done
└─────────────────────────────────┘
```

**Implementation:**
1. Job timer: `clocked_in_at` from booking → calculate elapsed time → display as `HH:MM:SS`
2. Room list pulled from booking's `scope` or a predefined list based on home size
3. Each room: tap → device camera/file picker → upload to `booking_photos` with `purpose = 'after'` and `room_name`
4. GPS capture on upload: `navigator.geolocation.getCurrentPosition()` → write `capture_lat/lng` to photo record
5. Progress: `photosComplete = rooms.every(r => r.photoCount >= 2)`
6. Clock Out: only enabled when `photosComplete === true`
7. On clock out: `writeBookingStateEvent('clocked_out', { actual_hours: elapsed })` → update `bookings.actual_hours_decimal`
8. Navigate to "Job Complete" confirmation then customer review screen

**Server actions:**
```ts
export async function clockIn(bookingId: string): Promise<ActionState>
export async function uploadRoomPhoto(bookingId: string, room: string, file: File, lat: number, lng: number): Promise<ActionState>
export async function clockOut(bookingId: string, actualHours: number): Promise<ActionState>
```

**Art assets:** `ICONS.checkmark` (completed room indicator), `ICONS.cleaning` (room photo placeholder)

---

## 3.6 — Active Job Ready to Clock Out (WF5b)

When all rooms have photos, show a completion confirmation before clock out:

```
┌─────────────────────────────────┐
│  ✓ All rooms photographed!      │
│                                 │
│  [ Dash mascot with sparkle ]   │
│                                 │
│  Job summary:                   │
│  Time: 3h 15min                 │
│  Rooms: 5 of 5 complete         │
│  Photos: 10 uploaded            │
│                                 │
│  [ Clock Out and Submit ]       │
└─────────────────────────────────┘
```

**Art assets:** `BRAND.dash` (DashMascot size="lg"), `ICONS.checkmark`

---

## 3.7 — Customer Active Job Tracker (WF9)

**Route:** `/app/bookings/[id]/tracking`  
**File to create:** `src/app/(app)/bookings/[id]/tracking/page.tsx`  
**Component:** `src/features/booking/components/customer/JobTracker.tsx`

**What to build:**
```
┌─────────────────────────────────┐
│  ← Back    Your Cleaning        │
│  Maria C. · Standard Clean      │
├─────────────────────────────────┤
│  STATUS: Cleaning in progress   │
│  Started 2:03pm · ~3h job       │
│                                 │
│  PHOTOS ARRIVING (3 of 5 rooms) │
│  [  Living Room  ] [  Kitchen  ]│
│  [  Bedroom 1   ] [  ···  ]    │
│                                 │
│  Last photo: 7 min ago          │
├─────────────────────────────────┤
│  TIMELINE                       │
│  ✓ 1:55pm — On my way           │
│  ✓ 2:00pm — Arrived             │
│  ✓ 2:03pm — Started cleaning   │
│  ● Now — Cleaning in progress   │
├─────────────────────────────────┤
│  [ Message Maria ] [ Call ]     │
└─────────────────────────────────┘
```

**Implementation:**
1. Query `booking_photos` for this booking, grouped by room
2. Query `booking_state_events` for timeline display
3. Polling: refresh every 30 seconds OR use Supabase Realtime on `booking_photos` insert
4. Photo grid: tap any photo → lightbox view
5. Timeline: map state events to human-readable labels with timestamps
6. Message button → routes to in-app messaging (WF18)

---

# SECTION 4 — PHASE 18: BOOKING LIFECYCLE COMPLETION

## 4.1 — Reschedule Flow (WF14)

**Route:** `/app/bookings/[id]/reschedule`  
**Files to create:**
- `src/app/(app)/bookings/[id]/reschedule/page.tsx`
- `src/features/booking/components/customer/RescheduleForm.tsx`
- `src/features/booking/actions/reschedule-actions.ts`

**What to build:**
```
┌─────────────────────────────────┐
│  ← Cancel      Reschedule      │
│  Current: Fri May 15 · 2:00pm  │
├─────────────────────────────────┤
│  PICK A NEW DATE                │
│  [  Calendar picker  ]          │
├─────────────────────────────────┤
│  AVAILABLE TIMES                │
│  [ 9:00am ] [ 11:00am ]        │
│  [ 2:00pm ] [ 4:00pm ]         │
├─────────────────────────────────┤
│  Note: Maria has 4 hours to     │
│  confirm your new time.         │
├─────────────────────────────────┤
│  [ Request Reschedule ]         │
└─────────────────────────────────┘
```

**Policy enforcement:**
- Check: has this booking been rescheduled before? If yes → block (only 1 free reschedule)
- Check: is this within 12h of the booking? If yes → block with message "Reschedules must be requested at least 12 hours before your cleaning"
- If policy passes → create reschedule request → cleaner gets 4h to confirm

**DB writes:**
- Write `reschedule_requested` event to `booking_state_events`
- Update booking with `reschedule_requested_at`, `proposed_new_time`
- Send push notification to cleaner: "Reschedule request — please confirm by [4h deadline]"
- If cleaner doesn't respond in 4h → auto-decline → notify customer → free to cancel

**Server actions:**
```ts
export async function requestReschedule(bookingId: string, proposedTime: Date): Promise<ActionState>
export async function confirmReschedule(bookingId: string): Promise<ActionState>  // cleaner action
export async function declineReschedule(bookingId: string): Promise<ActionState>  // cleaner action
```

---

## 4.2 — Cancel Flow with Penalty Disclosure (WF15)

**Route:** `/app/bookings/[id]/cancel`  
**Files to create:**
- `src/app/(app)/bookings/[id]/cancel/page.tsx`
- `src/features/booking/components/customer/CancelFlow.tsx`
- `src/features/booking/lib/cancellation-policy.ts`

**Policy calculation:**
```ts
export type CancellationResult = {
  allowed: boolean;
  penaltyPercent: 0 | 50 | 100;
  penaltyCents: number;
  hoursUntilBooking: number;
  message: string;
};

export function calculateCancellationPenalty(
  bookingStartAt: Date,
  totalChargeCents: number
): CancellationResult {
  const hoursUntil = (bookingStartAt.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil >= 48) {
    return { allowed: true, penaltyPercent: 0, penaltyCents: 0, hoursUntilBooking: hoursUntil,
      message: 'No charge — your cancellation is free.' };
  } else if (hoursUntil >= 24) {
    const penalty = Math.round(totalChargeCents * 0.5);
    return { allowed: true, penaltyPercent: 50, penaltyCents: penalty, hoursUntilBooking: hoursUntil,
      message: `A 50% cancellation fee of $${(penalty/100).toFixed(2)} applies.` };
  } else {
    return { allowed: true, penaltyPercent: 100, penaltyCents: totalChargeCents, hoursUntilBooking: hoursUntil,
      message: `A 100% cancellation fee of $${(totalChargeCents/100).toFixed(2)} applies.` };
  }
}
```

**What to build:**
```
┌─────────────────────────────────┐
│  Cancel Booking                 │
│  Friday, May 15 · 2:00pm        │
├─────────────────────────────────┤
│  ⚠  48-hour policy applies      │
│  Since your booking is in 30    │
│  hours, a 50% fee applies.      │
│                                 │
│  Cancellation fee: $67.50       │
│  (50% of $135.00 total)         │
├─────────────────────────────────┤
│  Why are you cancelling?        │
│  ○ Schedule conflict            │
│  ○ Found another cleaner        │
│  ○ Emergency                    │
│  ○ Other                        │
├─────────────────────────────────┤
│  [ ✓ ] I understand the $67.50  │
│  cancellation fee               │
│                                 │
│  [ Confirm Cancellation ]       │  ← disabled until checkbox checked
│  [ Keep my booking ]            │
└─────────────────────────────────┘
```

**Server action:**
```ts
export async function cancelBooking(
  bookingId: string,
  reason: string,
  acknowledgedPenalty: boolean
): Promise<ActionState>
```

On cancel: capture penalty charge if applicable, write `cancelled` to `booking_state_events`, notify cleaner.

---

## 4.3 — Auto-Approval Cron Job

**File to create:** `src/app/api/cron/auto-approve/route.ts`

```ts
// Runs every hour
// Finds bookings where:
// - status = 'pending_approval'
// - auto_approve_at <= NOW()
// - not disputed
// For each: capture payment + write 'approved' state + write 'completed' state

export async function GET(req: Request) {
  // Verify x-cron-secret header
  const overdueBookings = await supabase
    .from('bookings')
    .select('id, total_charge_cents, cleaner_id, customer_id')
    .eq('status', 'pending_approval')
    .lte('auto_approve_at', new Date().toISOString())
    .is('disputed_at', null);

  for (const booking of overdueBookings.data ?? []) {
    await capturePayment(booking);
    await writeBookingStateEvent(booking.id, 'approved', 'system');
    await writeBookingStateEvent(booking.id, 'completed', 'system');
    await notifyCustomer(booking.customer_id, 'booking_auto_approved');
    await notifyCleanerPayout(booking.cleaner_id);
  }
}
```

**Vercel cron config (`vercel.json`):**
```json
{ "crons": [{ "path": "/api/cron/auto-approve", "schedule": "0 * * * *" }] }
```

---

## 4.4 — Approve & Pay Screen Enhancement (WF10)

**File to modify:** `src/features/booking/components/customer/ApproveWorkButton.tsx` (existing)  
**File to create:** `src/features/booking/components/customer/ApprovePayScreen.tsx`

**Enhancements needed:**
- Before/after photo gallery organized by room (not just a list)
- Side-by-side before/after comparison per room
- Time accounting section:
  ```
  Scheduled: 3 hours
  Actual: 3h 15min
  Overage: $18.75 (at $75/hr)
  ```
- Full charge breakdown:
  ```
  Service: $225.00
  Platform fee: $9.99
  Overage: $18.75
  ────────────────
  Total: $253.74
  ```
- 48-hour dispute window notice: "You have 48 hours to dispute before payment is released"
- "Approve & Release Payment" primary button
- "Something's wrong — file a dispute" link at bottom

---

# SECTION 5 — PHASE 19: IN-APP MESSAGING (WF18)

## 5.1 — Messaging Thread UI

**Route:** `/app/bookings/[id]/messages`  
**Files to create:**
- `src/app/(app)/bookings/[id]/messages/page.tsx`
- `src/features/messaging/components/MessageThread.tsx`
- `src/features/messaging/components/MessageBubble.tsx`
- `src/features/messaging/components/MessageInput.tsx`
- `src/features/messaging/actions.ts`
- `src/features/messaging/queries.ts`

**DB table:** `messages` (B3) — booking-scoped, 4h auto-purge after booking ends

**What to build:**
```
┌─────────────────────────────────┐
│  ← Back    Maria C.        ●   │
│  Standard Clean · May 15        │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ Hi! I'm on my way. See  │   │  ← cleaner bubble (left)
│  │ you in about 15 min.    │   │
│  └─────────────────────────┘   │
│  2:01pm                         │
│                           ┌─────────────────────┐ │
│                           │ Great, I'll leave   │ │ ← customer bubble (right)
│                           │ the door unlocked.  │ │
│                           └─────────────────────┘ │
│                           2:03pm                   │
│                                 │
├─────────────────────────────────┤
│  ⚠ This chat closes 4 hours    │
│  after your job ends.           │
├─────────────────────────────────┤
│  [ Type a message...      ] [→] │
└─────────────────────────────────┘
```

**Implementation:**
- Use Supabase Realtime to subscribe to new messages for this booking
- `messages` table: `id, booking_id, sender_id, body, created_at, expires_at`
- `expires_at` = `booking.ended_at + 4 hours` (set when clocked_out)
- Query: only show messages where `expires_at > NOW()` (RLS policy in B8 enforces this server-side)
- Persistent banner showing expiration time
- If booking not yet ended: show "Chat available during and after your cleaning"

**Queries:**
```ts
export async function getMessages(bookingId: string) {
  return supabase.from('messages')
    .select('*, sender:users(full_name)')
    .eq('booking_id', bookingId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });
}
```

**Server action:**
```ts
export async function sendMessage(bookingId: string, body: string): Promise<ActionState>
```

**Art assets:** `ICONS.message` (thread header icon)

---

# SECTION 6 — PHASE 20: TRUST + VERIFICATION FEATURES

## 6.1 — Insurance Verified Upload Flow (WF32)

**Route:** `/app/cleaner/settings/insurance`  
**Files to create:**
- `src/app/(app)/cleaner/settings/insurance/page.tsx`
- `src/features/cleaner/components/InsuranceUpload.tsx`
- `src/features/cleaner/components/InsurancePending.tsx`
- `src/features/cleaner/components/InsuranceVerified.tsx`
- `src/features/cleaner/actions/insurance-actions.ts`

**DB table:** `insurance_policies` (B5)

**State 1 — Pitch:**
```
┌─────────────────────────────────┐
│  🛡 Earn the Insurance Verified │
│     Badge                       │
├─────────────────────────────────┤
│  Customers book cleaners with   │
│  this badge 40% more often.     │
│                                 │
│  Requirements:                  │
│  • General liability insurance  │
│  • Minimum $100,000 coverage    │
│  • Valid Certificate of         │
│    Insurance (COI)              │
├─────────────────────────────────┤
│  [ Upload my Certificate ]      │
└─────────────────────────────────┘
```

**State 2 — Pending (after upload):**
```
┌─────────────────────────────────┐
│  ⏳ Under Review                │
│  Uploaded May 9, 2026           │
├─────────────────────────────────┤
│  What happens next:             │
│  Day 1–2: Our team reviews      │
│  Day 2: Email confirmation      │
│  Day 2: Badge appears on        │
│  your profile                   │
│                                 │
│  Questions? Contact support     │
└─────────────────────────────────┘
```

**State 3 — Verified:**
```
┌─────────────────────────────────┐
│  ✓ Insurance Verified           │
│  Valid through May 2028         │
├─────────────────────────────────┤
│  🛡 Badge is live on your       │
│     profile                     │
│                                 │
│  Renewal reminder:              │
│  We'll notify you 60 days       │
│  before expiration              │
│                                 │
│  [ Upload updated COI ]         │
└─────────────────────────────────┘
```

**Implementation:**
- File upload to Supabase Storage: `certificates/cleaner_id/coi_timestamp.pdf`
- Insert to `insurance_policies`: `cleaner_id, document_url, coverage_amount, status='pending', submitted_at`
- Admin reviews in admin panel → updates status to `verified`, sets `verified_at`, `expires_at = verified_at + 2 years`
- On verify: update `cleaner_badges` with insurance badge
- `expires_at` tracked — cron job sends renewal reminder 60 days before

**Server actions:**
```ts
export async function uploadInsuranceDocument(file: File): Promise<ActionState>
export async function adminVerifyInsurance(policyId: string): Promise<ActionState>  // admin only
```

---

## 6.2 — Tax Info Collection (WF34)

**Route:** `/app/cleaner/settings/tax`  
**Files to create:**
- `src/app/(app)/cleaner/settings/tax/page.tsx`
- `src/features/cleaner/components/TaxInfoForm.tsx`
- `src/features/cleaner/actions/tax-actions.ts`

**DB column:** `cleaner_profiles.encrypted_tax_id` (BYTEA — encrypted at app layer)

**What to build:**
```
┌─────────────────────────────────┐
│  Tax Information                │
│  Required for year-end 1099     │
├─────────────────────────────────┤
│  Tax classification             │
│  ○ Individual / Sole Proprietor │
│  ○ Single-member LLC            │
│  ○ S Corporation                │
│  ○ C Corporation                │
├─────────────────────────────────┤
│  Social Security Number         │
│  [  ___-__-____  ]              │
│  🔒 Encrypted and stored securely│
├─────────────────────────────────┤
│  Legal name (as on taxes)       │
│  [  First Name  ] [  Last Name ]│
├─────────────────────────────────┤
│  Mailing address                │
│  [ Street address... ]          │
│  [ City ] [ State ] [ ZIP ]     │
├─────────────────────────────────┤
│  2026 Earnings to Date          │
│  $4,230.00                      │
│  1099 issued if earnings > $600 │
├─────────────────────────────────┤
│  [ Save Tax Information ]       │
└─────────────────────────────────┘
```

**Encryption implementation:**
```ts
// src/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY = Buffer.from(process.env.TAX_ENCRYPTION_KEY!, 'hex'); // 32-byte key

export function encryptTaxId(ssn: string): Buffer {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(ssn, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]); // iv(12) + tag(16) + ciphertext
}

export function decryptTaxId(data: Buffer): string {
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}
```

**Server action:**
```ts
export async function saveTaxInfo(formData: FormData): Promise<ActionState> {
  const ssn = formData.get('ssn') as string;
  const encrypted = encryptTaxId(ssn.replace(/-/g, ''));
  await supabase.from('cleaner_profiles')
    .update({
      encrypted_tax_id: encrypted,
      tax_classification: formData.get('classification'),
      tax_legal_name: formData.get('legal_name'),
      tax_address: formData.get('address'),
    })
    .eq('user_id', userId);
}
```

**IMPORTANT:** Never log, display, or transmit the raw SSN after encryption. Display only last 4 digits: "SSN on file: ···-··-1234"

---

## 6.3 — Badge Detail Pages (WF64, WF65, WF66)

### WF64 — Background Checked Page

**Route:** `/trust/background-checked`  
**File to create:** `src/app/(marketing)/trust/background-checked/page.tsx`

```
┌─────────────────────────────────┐
│  🛡 Background Checked          │
│     by Checkr                   │
├─────────────────────────────────┤
│  What we verify:                │
│  ✓ Identity verification        │
│  ✓ National criminal records    │
│  ✓ Sex offender registry        │
│  ✓ County court records         │
├─────────────────────────────────┤
│  What we DON'T do:              │
│  ✗ We never share personal      │
│    details with customers       │
│  ✗ No ongoing surveillance      │
│  ✗ No continuous monitoring     │
├─────────────────────────────────┤
│  Renewed every 2 years          │
│  Powered by Checkr              │
└─────────────────────────────────┘
```

**Art assets:** `ICONS.checkmark`, `BACKGROUNDS.legal` (background)

---

### WF65 — ZIP-Locked "Trusted in [Neighborhood]" Badge

**Route:** `/trust/neighborhood-expert`  
**File to create:** `src/app/(marketing)/trust/neighborhood-expert/page.tsx`

**How earned:**
- 25+ completed jobs in that specific ZIP code
- 4.7+ average rating from jobs in that ZIP
- Active (at least 1 job) in the last 90 days

---

### WF66 — Specialty Endorsement Page

**Route:** `/trust/specialties`  
**File to create:** `src/app/(marketing)/trust/specialties/page.tsx`

**Specialties grid** (from `specialties` table seeded in B4):
- 🌿 Eco-Friendly — 15+ customer "eco-friendly" review tags
- 🐾 Pet-Friendly — 15+ customer "pet-friendly" review tags
- 🏠 Deep Clean Expert — 15+ "thorough" + "detail-oriented" tags
- 📦 Move-Out Specialist — 15+ "move-out" bookings with 4.5+
- 🏡 Airbnb Ready — 15+ "Airbnb" bookings with 4.7+

**How specialties update:** Nightly cron reads `review_traits`, counts per cleaner per trait, awards `cleaner_specialties` when threshold reached.

---

## 6.4 — Tier System Explainer (WF51)

**Route:** `/app/cleaner/score/tiers`  
**File to create:** `src/app/(app)/cleaner/score/tiers/page.tsx`  
**Component:** `src/features/cleaner/components/TierExplainer.tsx`

**What to build:**
```
┌─────────────────────────────────┐
│  How Tiers Work                 │
├─────────────────────────────────┤
│  YOUR CURRENT TIER              │
│  ⭐ Proven Specialist           │
│  Score: 78 · Keep it above 70  │
├─────────────────────────────────┤
│  ↑ Rising Pro       Score ≥ 60  │
│  Platform fee: 15% (12% first 6)│
│  Minimum job: 4 hours           │
│                                 │
│  ★ Proven Specialist  ≥ 70     │  ← YOUR TIER
│  Platform fee: 13%              │
│  Minimum job: 4 hours           │
│                                 │
│  ★★ Top Performer     ≥ 82     │
│  Platform fee: 11%              │
│  Minimum job: 2 hours           │
│                                 │
│  ★★★ All-Star Expert  ≥ 92    │
│  Platform fee: 10%              │
│  Minimum job: 2 hours           │
├─────────────────────────────────┤
│  TIER CHANGE RULES              │
│  • Must stay in new band for    │
│    14 days before tier changes  │
│  • Veterans (6+ months at 75+)  │
│    get a 30-day cushion         │
└─────────────────────────────────┘
```

---

## 6.5 — Reliability Score Explainer (WF52)

**Route:** `/app/cleaner/score/explainer`  
**File to create:** `src/app/(app)/cleaner/score/explainer/page.tsx`  
**Component:** `src/features/cleaner/components/ScoreExplainer.tsx`

**What to build:**
- Large score ring with current score (e.g. 78) + band label "Proven Specialist"
- 6 metric bars with current values and weights:

| Metric | Weight | Current | Bar |
|---|---|---|---|
| On-time arrivals | 25% | 94% | ████████░░ |
| Job completion | 25% | 100% | ██████████ |
| Photo compliance | 15% | 80% | ████████░░ |
| Customer ratings | 15% | 4.6/5 | █████████░ |
| Communication | 10% | 95% | █████████░ |
| Reschedule rate | 10% | 5% | █████████░ |

- "Biggest improvement opportunity" card: identifies lowest metric, gives specific advice
- Link to tier explainer

---

## 6.6 — Score Change Notification Templates (WF53)

**File to create:** `src/lib/notifications/score-templates.ts`

**4 notification types:**

```ts
// Template 1: Small positive score change
{
  title: 'Your score improved!',
  body: '+3 points — your photo compliance rate is excellent.',
  icon: '⬆',
}

// Template 2: Score drop warning
{
  title: 'Your score dropped',
  body: 'Your on-time rate fell to 78%. Your next job is a great chance to recover.',
  icon: '⚠',
}

// Template 3: Tier promotion
{
  title: '🎉 You reached Top Performer!',
  body: 'Your platform fee drops to 11% starting now. Keep it up!',
  icon: '⭐⭐',
}

// Template 4: Tier drop warning (14-day window)
{
  title: 'Tier change warning',
  body: 'Your score has been below 82 for 7 days. You have 7 more days before your tier adjusts.',
  icon: '⚠',
}
```

These are sent by the nightly reliability cron when score bands or tiers change.

---

# SECTION 7 — PHASE 21: ADMIN TOOLS COMPLETION

## 7.1 — Admin KPI Dashboard (WF54)

**Route:** `/app/admin/dashboard` (or `/admin`)  
**Files to create/modify:**
- `src/app/(app)/admin/page.tsx`
- `src/features/admin/components/KpiGrid.tsx`
- `src/features/admin/components/GmvSparkline.tsx`
- `src/features/admin/components/ActivityFeed.tsx`
- `src/features/admin/components/NeedsAttention.tsx`

**What to build:**

**KPI Grid (top):**
```
[ Today's Bookings: 14 ] [ GMV Today: $2,847 ] [ New Applications: 3 ] [ Open Disputes: 2 ]
```

**GMV Sparkline:** 14-day line chart of daily GMV using lightweight chart library (recharts or similar)

**Needs Attention section:**
- Disputes open > 48h (critical)
- Applications pending > 7 days (stale)
- Failed payouts (needs retry)
- Cleaners in probation (needs review)

**Booking Funnel:**
```
Submitted: 24  →  Accepted: 20  →  Completed: 18  →  Approved: 16
```
Show as a horizontal funnel with drop-off percentages.

**Recent Activity Feed:** Last 20 `booking_state_events` + `admin_actions` combined

---

## 7.2 — Dispute Mediation Photo Panel (WF57 + Phase 8b)

**Route:** `/app/admin/disputes/[id]`  
**Files to create:**
- `src/app/(app)/admin/disputes/[id]/page.tsx`
- `src/features/disputes/components/DisputePhotoPanel.tsx`
- `src/features/disputes/components/DisputeResolutionPanel.tsx`

**Photo panel layout:**
```
┌──────────────────┬──────────────────┐
│ CUSTOMER CLAIM   │ CLEANER PHOTOS   │
│ "Kitchen wasn't  │ by room:         │
│  cleaned"        │                  │
│                  │ Kitchen:         │
│ [Evidence photos │ [before] [after] │
│  uploaded by     │                  │
│  customer]       │ Living Room:     │
│                  │ [before] [after] │
└──────────────────┴──────────────────┘
```

**Resolution panel:**
```
┌─────────────────────────────────┐
│ YOUR DECISION                   │
│                                 │
│ ○ Cleaner stands by work        │
│   (release payment to cleaner)  │
│                                 │
│ ● Partial refund (50%)          │
│   $67.50 returned to customer   │
│                                 │
│ ○ Full refund                   │
│   $135.00 returned to customer  │
│                                 │
│ Rationale (required):           │
│ [ Photo evidence shows kitchen  │
│   was not cleaned to standard...]│
│                                 │
│ [ Resolve Dispute ]             │
└─────────────────────────────────┘
```

**Implementation (Phase 8b spec):**
- Write resolution to `dispute_resolutions` table
- Write to `admin_actions` with before/after JSONB
- Trigger Stripe refund if applicable (via `refunds` table insert)
- Send notification to both customer and cleaner with decision + rationale
- Mark dispute as `resolved_by_admin`

---

## 7.3 — Admin Refund Processing (WF62)

**Route:** `/app/admin/bookings/[id]/refund`  
**File to create:** `src/features/admin/components/RefundForm.tsx`

**What to build:**
```
┌─────────────────────────────────┐
│  Process Refund                 │
│  Booking #PT-2847               │
├─────────────────────────────────┤
│  Booking total: $135.00         │
│  Already refunded: $0.00        │
│  Max refundable: $135.00        │
├─────────────────────────────────┤
│  Refund type:                   │
│  ○ Full refund ($135.00)        │
│  ● Partial — 50% ($67.50)      │
│  ○ Custom amount: [ $_____ ]    │
│  ○ Goodwill credit (no charge)  │
├─────────────────────────────────┤
│  Reason (required):             │
│  [ Quality issue — cleaner...  ]│
├─────────────────────────────────┤
│  Who gets notified:             │
│  ✓ Customer (refund receipt)    │
│  ✓ Cleaner (payout adjustment)  │
│                                 │
│  [ Process Refund ]             │
└─────────────────────────────────┘
```

**Server action:** Calls Stripe refund API → writes to `refunds` table → writes to `admin_actions`

---

## 7.4 — Admin Action Audit Log

**Every admin action must now write to `admin_actions` (B6).**

**File to create:** `src/features/admin/lib/audit.ts`

```ts
export async function writeAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  actionType: string,
  entityType: string,
  entityId: string,
  beforeState: Record<string, unknown>,
  afterState: Record<string, unknown>,
  notes?: string
) {
  await supabase.from('admin_actions').insert({
    admin_id: adminId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    before_state: beforeState,
    after_state: afterState,
    notes,
    created_at: new Date().toISOString(),
  });
}
```

**Wrap every admin action with this:** application approvals, rejections, dispute resolutions, refunds, manual tier adjustments, suspensions.

---

## 7.5 — Admin Booking/Cleaner/Customer Detail Views (WF58, WF59, WF60)

### WF58 — Booking Lookup

**Route:** `/app/admin/bookings`  
Searchable table: booking ID / customer name / cleaner name / service / date / total / status  
Filters: status pill, date range, service type  
Click row → booking detail with all state events timeline

### WF59 — Cleaner Detail View

**Route:** `/app/admin/cleaners/[id]`  
Sections:
- 90-day score history chart (line chart, from `reliability_score_snapshots`)
- Recent bookings table (last 20)
- Status flags: tier, background check, identity, insurance, no-show count, dispute count
- Manual actions: adjust score, change tier, process payout, flag account, reset password
- Internal notes (append-only admin notepad)

### WF60 — Customer Detail View

**Route:** `/app/admin/customers/[id]`  
Sections:
- KPIs: reliability score, total bookings, total spent, dispute count
- Booking history table
- Account details: email, phone, join date, sign-in method, addresses, payment methods, recurring schedules
- Manual actions: issue refund, apply credit, restrict account, suspend account
- Internal notes

---

# SECTION 8 — PHASE 22: CUSTOMER RETENTION FEATURES

## 8.1 — Customer First-Time Tour (WF48)

**Files to create:**
- `src/features/onboarding/components/CustomerFirstTimeTour.tsx`
- `src/features/onboarding/actions/milestone-actions.ts`

**Trigger:** Show on first visit if `user_milestones` has no `customer_tour_completed` entry

**3-slide carousel:**
```
SLIDE 1                    SLIDE 2                    SLIDE 3
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ Every cleaner │          │ Photo proof   │          │ Pay only when │
│ is verified   │          │ of every job  │          │ you approve   │
│               │          │               │          │               │
│ [checkmark    │          │ [cleaning     │          │ [Dash mascot] │
│  icon]        │          │  icon]        │          │               │
│               │          │               │          │               │
│ Background    │          │ Before & after│          │ Your payment  │
│ checked,      │          │ photos for    │          │ is held until │
│ ID verified   │          │ every room    │          │ you say yes   │
│               │          │               │          │               │
│ ○ ● ○         │          │ ○ ○ ●         │          │ ● ○ ○         │
│ [Skip]        │          │ [Skip]        │          │ [Get Started] │
└───────────────┘          └───────────────┘          └───────────────┘
```

**Milestone action:**
```ts
export async function completeMilestone(milestone: 'customer_tour' | 'cleaner_tour' | 'photo_training'): Promise<void> {
  await supabase.from('user_milestones').upsert({
    user_id: userId,
    milestone_key: milestone,
    completed_at: new Date().toISOString(),
  });
}
```

**Art assets:** Slide 1: `ICONS.checkmark`, Slide 2: `ICONS.cleaning`, Slide 3: `BRAND.dash`

---

## 8.2 — Auto-Rebook Nudge (WF24)

**Trigger:** 24 hours after a booking receives a 5-star review  
**File to create:** `src/features/booking/components/customer/AutoRebookNudge.tsx`

**Implementation:**
- Cron or post-review webhook: check if rating === 5 and no future booking with same cleaner
- If true: create a `rebook_nudge` notification (type exists in B6 notifications enum)
- Push notification + in-app notification card

**What to build:**
```
┌─────────────────────────────────┐
│  Book Maria again?              │
│  You gave her 5 stars!          │
├─────────────────────────────────┤
│  Standard Clean · 3 hours       │
│  Your home at 123 Oak St        │
├─────────────────────────────────┤
│  Next available times:          │
│  [ Thu May 22 · 10am ]          │
│  [ Fri May 23 · 2pm  ]          │
│  [ Sat May 24 · 9am  ]          │
├─────────────────────────────────┤
│  [ Book Again — $135 ]          │
│  [ Make it recurring — save 5%] │
│  [ Not right now ]              │
└─────────────────────────────────┘
```

---

## 8.3 — Customer Quick Rebook (WF69)

**Route:** `/app/bookings/rebook/[previousBookingId]`  
**File to create:** `src/features/booking/components/customer/QuickRebook.tsx`

**What to build:**
- Pre-filled booking form pulled from previous booking
- Same address, same service, same notes
- "Change anything" accordion to expand and edit
- YOUR TEAM section: recommended same cleaner first, then next-best match

```
┌─────────────────────────────────┐
│  Book Again                     │
│  Pre-filled from last time ✓    │
├─────────────────────────────────┤
│  123 Oak St, Sacramento         │
│  Standard Clean · 3 hours       │
│  "Focus on kitchen + bathrooms" │
│  [ Change anything ▾ ]          │
├─────────────────────────────────┤
│  YOUR TEAM                      │
│  ⭐ Maria C. — Recommended      │
│  4.9 · 23 jobs with you         │
│  [ Choose her ]                 │
│                                 │
│  Also available:                │
│  James T. · 4.8 rating          │
│  [ Choose him ]                 │
├─────────────────────────────────┤
│  PICK A TIME                    │
│  [ Thu May 22 · 10am ]  ← best │
│  [ Fri May 23 · 2pm  ]          │
├─────────────────────────────────┤
│  [ Book — $135.00 + $9.99 fee ] │
└─────────────────────────────────┘
```

---

## 8.4 — Customer Dashboard Enhancements (WF11)

**File to modify:** Customer dashboard page

**Additions:**
1. "Your next cleaning" card at top — if upcoming booking exists:
   ```
   Next cleaning: Fri May 15 at 2pm
   Maria C. · Standard Clean
   [ View details ] [ Reschedule ] [ Cancel ]
   ```

2. "Book again" carousel — favorite + recently-used cleaners with quick-book CTA:
   ```
   [Maria C. ⭐4.9] [James T. ⭐4.8] [Sarah M. ⭐5.0] →
   ```

3. Recurring suggestion nudge — after 2+ bookings, if no recurring:
   ```
   ┌─────────────────────────────┐
   │ Set it and forget it?       │
   │ Most customers save $30+/mo │
   │ with a recurring schedule.  │
   │ [ Set up recurring ]        │
   └─────────────────────────────┘
   ```

4. Recent cleaning history: last 5 bookings with status + approve/review prompts for pending ones

---

## 8.5 — Favorites Tab UI Enhancement (WF25)

**File to modify:** Favorites page

**Add tab navigation:**
- All tab: all favorited cleaners
- Regulars tab: cleaners with active recurring bookings (from `customer_favorites.is_recurring_relationship = true`)
- Saved tab: manually favorited cleaners without active recurring

**Regulars tab card:**
```
┌─────────────────────────────────┐
│ Maria C. ⭐4.9                  │
│ Recurring: Every 2 weeks        │
│ Next: Fri May 22 · 2pm          │
│ [ Manage recurring ]            │
└─────────────────────────────────┘
```

---

## 8.6 — Cleaner Profile Editor Enhancements (WF26)

**File to modify:** Cleaner profile editor

**Add earnings preview:**
```
At your rate of $55/hr:
4-hour job → you earn $181.50 (after 13% fee)
3-hour job → you earn $143.55

⬆ Reach Top Performer (score 82+) → 
  fee drops to 11% → you'd earn $195.80 for 4 hours
```

Add tier-impact banner when cleaner is within 5 points of next tier.

---

# SECTION 9 — PHASE 23: ART ASSETS + POLISH

## 9.1 — Skeleton Loading States (WF40a/b/c)

**File to create:** `src/components/ui/skeletons.tsx`

```tsx
export const CleanerDashboardSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    {/* Score ring skeleton */}
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-neutral-200" />
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="h-3 w-24 rounded bg-neutral-200" />
      </div>
    </div>
    {/* Earnings card skeleton */}
    <div className="h-24 rounded-xl bg-neutral-200" />
    {/* Job card skeleton */}
    <div className="h-32 rounded-xl bg-neutral-200" />
  </div>
);

export const CleanerListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex gap-3 p-4 rounded-xl border border-neutral-200">
        <div className="w-14 h-14 rounded-full bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-neutral-200" />
          <div className="h-3 w-24 rounded bg-neutral-200" />
          <div className="h-3 w-32 rounded bg-neutral-200" />
        </div>
      </div>
    ))}
  </div>
);

export const PhotoUploadSkeleton = ({ current, total }: { current: number; total: number }) => (
  <div className="flex flex-col items-center gap-4 p-6">
    <div className="w-16 h-16 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
    <p className="text-sm text-neutral-600">Uploading room {current} of {total}…</p>
  </div>
);
```

---

## 9.2 — Standardized Empty States (WF38)

**File to create:** `src/components/ui/empty-state.tsx`

```tsx
type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
    {icon && <div className="mb-2">{icon}</div>}
    <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
    <p className="text-sm text-neutral-500 max-w-xs">{description}</p>
    {action && (
      <Button asChild><Link href={action.href}>{action.label}</Link></Button>
    )}
  </div>
);
```

**Standard empty state instances to create:**

| Context | Icon | Title | Description | Action |
|---|---|---|---|---|
| Customer, no bookings | `ICONS.cleaning` | "Your first cleaning is one tap away" | "Browse verified cleaners in Sacramento" | "Browse cleaners" → /app/browse |
| Cleaner, no jobs | `BRAND.dash` | "Your inbox will fill up soon" | "New cleaners typically get their first request within 48 hours" | — |
| No cleaners in ZIP | `ICONS.home` | "We're not in your area yet" | "We're expanding soon. Join the waitlist for early access." | "Join waitlist" → /waitlist |
| No favorites | `ICONS.contacts` | "No favorites yet" | "Save cleaners you love to book them again quickly" | "Browse cleaners" |
| No notifications | `ICONS.notification` | "You're all caught up" | "Notifications about your bookings will appear here" | — |
| No disputes | `ICONS.checkmark` | "No open disputes" | "All disputes resolved" | — |

---

## 9.3 — Standardized Error States (WF39)

**File to create/modify:** `src/app/not-found.tsx` + error boundary components

**404 page:**
```tsx
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <Image src={BRAND.dash} width={80} height={80} alt="Dash" />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Page not found</h1>
        <p className="text-neutral-500 mt-2">This page doesn't exist or was moved.</p>
      </div>
      <Button asChild><Link href="/">Go home</Link></Button>
    </div>
  );
}
```

**Payment declined error state:**
```tsx
<TrustCallout variant="caution" title="Payment declined">
  Your card ending in 4242 was declined. Please update your payment method.
  <Button size="sm" className="mt-2" asChild>
    <Link href="/settings/payment">Update payment</Link>
  </Button>
</TrustCallout>
```

**Booking conflict error:**
```tsx
<TrustCallout variant="caution" title="This time was just taken">
  {cleanerName} is no longer available at {formattedTime}. 
  Choose another time to continue.
</TrustCallout>
```

---

## 9.4 — Cleaner Platform Tour (WF50)

**Files to create:**
- `src/features/onboarding/components/CleanerPlatformTour.tsx`

**5-screen carousel for newly approved cleaners:**
- Screen 1: Dashboard + score ring overview
- Screen 2: How incoming job requests work (4h window)
- Screen 3: The photo system (before/after, room by room)
- Screen 4: Earnings and payout schedule
- Screen 5: How tiers work + first-6-jobs intro rate

**Trigger:** Show once on first login after `cleaner_applications.status = 'approved'`  
**Milestone:** Write `cleaner_tour_completed` to `user_milestones`

---

## 9.5 — Background Check Status Page (WF33)

**Route:** `/app/cleaner/settings/background-check`  
**File to modify/create:** `src/app/(app)/cleaner/settings/background-check/page.tsx`

**Enhance existing page to include:**
- "What we check" section (4 items with icons)
- "Renewal due" date with prominent display
- Checkr provider attribution
- Status badge: Cleared / Pending / Requires Action

---

# SECTION 10 — PHASE 24: SEO + GROWTH PAGES

## 10.1 — Coverage Page (WF46)

**Route:** `/coverage`  
**File to create:** `src/app/(marketing)/coverage/page.tsx`

**What to build:**
- Hero: `BACKGROUNDS.findCity` image (the globe/city-pins photo)
- Active cities section: Sacramento (live)
- Launching soon section: Bay Area (Q2 2026 — update as appropriate)
- Future expansion: Reno, Fresno, etc. (waitlist)
- Each non-active city: "Join waitlist" button → pre-fills ZIP on waitlist form

**Data source:** `serviced_areas` table (B2) — `status` enum: `active`, `launching_soon`, `waitlist`

---

## 10.2 — Help Center Index (WF44)

**Route:** `/help`  
**File to create:** `src/app/(marketing)/help/page.tsx`

**What to build:**
- Search bar (filter articles client-side or route to search results)
- 6 topic tiles:
  - Booking & Scheduling (calendar icon)
  - Payment & Pricing (wallet icon)
  - Photos & Privacy (cleaning icon)
  - Trust & Safety (checkmark icon)
  - For Cleaners (contacts icon)
  - Account & Settings (settings icon)
- Popular articles list (hardcoded initially, then CMS-driven)
- Link to support ticket creation

**Art assets:** Each topic tile uses a brand icon from `ICONS`

---

## 10.3 — City × Service SEO Landing Pages (WF41)

**Route:** `/cleaning/[city]/[service]`  
**File to create:** `src/app/(marketing)/cleaning/[city]/[service]/page.tsx`

**This is a template that generates hundreds of pages.**

```tsx
// Example: /cleaning/sacramento/deep-cleaning
export async function generateStaticParams() {
  const cities = ['sacramento', 'elk-grove', 'roseville', 'folsom'];
  const services = ['house-cleaning', 'deep-cleaning', 'move-out-cleaning', 'airbnb-cleaning'];
  return cities.flatMap(city => services.map(service => ({ city, service })));
}
```

**Each page includes:**
- Hero with location + service + "Book now" widget
- Top-rated cleaners in that city (from DB query)
- "What's included" grid by service type
- Neighborhoods served
- Local testimonials (from reviews where cleaner.zip in city ZIPs)
- FAQ section (structured data markup for SEO)
- `<title>` and `<meta description>` with city + service

**This generates dozens of indexable pages targeting queries like "deep cleaning Sacramento".**

---

## 10.4 — Waitlist Page Enhancements (WF70)

**File to modify:** Waitlist page

**Add:**
- Booking frequency selection: Weekly / Biweekly / Monthly / Just once
- Service interest checkboxes: Standard / Deep / Move-out / Airbnb
- First-100 perk banner: "First 100 customers in each new city get $20 credit"
- Confirmation email with estimated launch timeline

---

# SECTION 11 — PHASE 8b: ADMIN MEDIATION SPEC IMPLEMENTATION

**From:** `phase-8b-tier-2-admin-mediation-spec.md`

## 11.1 — New DB Additions for Phase 8b

Run this SQL after B1-B8 are deployed:

```sql
-- Track each admin mediation attempt
CREATE TABLE dispute_admin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id),
  admin_id UUID NOT NULL REFERENCES users(id),
  photos_reviewed BOOLEAN DEFAULT FALSE,
  thread_reviewed BOOLEAN DEFAULT FALSE,
  decision TEXT CHECK (decision IN ('cleaner_upheld', 'partial_refund', 'full_refund')),
  refund_percent INTEGER CHECK (refund_percent BETWEEN 0 AND 100),
  rationale TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 11.2 — Acceptance Criteria (from spec)

Admin mediation is complete when:
- Admin has viewed all evidence photos (track with `photos_reviewed = true`)
- Admin has viewed the full dispute thread (`thread_reviewed = true`)
- Admin has selected a decision AND written a rationale
- Decision is submitted → triggers notification to both parties
- `admin_actions` record written with full before/after state

---

# SECTION 12 — USER MILESTONES SYSTEM

## 12.1 — Milestone Tracking

**DB table:** `user_milestones` (B1)

**Milestone keys to use:**
```ts
export const MILESTONES = {
  CUSTOMER_TOUR: 'customer_tour_completed',
  CLEANER_TOUR: 'cleaner_tour_completed',
  PHOTO_TRAINING: 'photo_training_completed',
  FIRST_BOOKING: 'first_booking_completed',
  FIRST_PAYOUT: 'first_payout_received',
  PROFILE_COMPLETE: 'profile_completed',
} as const;
```

**Hook to check milestones:**
```ts
// src/hooks/use-milestones.ts
export function useMilestone(key: string) {
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    supabase.from('user_milestones')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('milestone_key', key)
      .single()
      .then(({ data }) => setCompleted(!!data?.completed_at));
  }, [key]);
  return completed;
}
```

**Where each milestone is written:**
- `customer_tour_completed`: After customer clicks "Get Started" on tour slide 3
- `cleaner_tour_completed`: After cleaner finishes platform tour
- `photo_training_completed`: After cleaner completes photo training (Step 7 of application)
- `first_booking_completed`: After first booking reaches `approved` state
- `first_payout_received`: After first payout reaches `paid` state

---

# SECTION 13 — NOTIFICATION QUIET HOURS

**File to modify:** `src/app/(app)/settings/notifications/page.tsx`  
**DB columns:** `notification_preferences.quiet_hours_start` / `quiet_hours_end` (B6)

**What to add to notification settings:**
```
┌─────────────────────────────────┐
│  Quiet Hours                    │
│  No notifications during:       │
│                                 │
│  From: [ 10:00 PM ▾ ]          │
│  To:   [  7:00 AM ▾ ]          │
│                                 │
│  [ Enable quiet hours ] ●       │
└─────────────────────────────────┘
```

**Implementation:** Before sending any notification, check if `NOW()` is within the user's quiet hours window. If yes, defer the notification (queue it for after `quiet_hours_end`).

---

# SECTION 14 — CLEANER APPEALS SYSTEM

**DB table:** `cleaner_appeals` (B4) — polymorphic FK

## 14.1 — Appeal Form

**Route:** `/app/cleaner/score/appeal`  
**File to create:** `src/features/cleaner/components/AppealForm.tsx`

**What to build:**
- Cleaners can appeal a tier drop or a disputed reliability event
- Select what they're appealing: tier change or specific event
- Text area for explanation
- Submit → creates `cleaner_appeals` record with status `pending`
- Admin reviews in admin panel → approves (reverses the event) or denies

**Appeal window:** Must be submitted within 14 days of the tier change or event.

---

# MASTER DEPENDENCY MAP

Build in this order — each phase depends on the previous:

```
[Schema Deploy B1-B8]
         ↓
[Art Assets → public/]
         ↓
[Booking State Machine] ← required by all job-flow features
         ↓
[On My Way WF4] → [Running Late WF68] → [Active Job WF5] → [Job Tracker WF9]
         ↓
[Auto-Approval Cron] ← required before Approve & Pay is fully correct
         ↓
[Reschedule WF14] + [Cancel WF15] ← can build in parallel
         ↓
[In-App Messaging WF18] ← needs booking state (clocked_out → sets expires_at)
         ↓
[Insurance Upload WF32] + [Tax Info WF34] ← parallel
         ↓
[Badge Pages WF64/65/66] + [Tier Explainer WF51] + [Score Explainer WF52] ← parallel
         ↓
[Admin KPI Dashboard WF54] + [Mediation Panel WF57] + [Refund WF62] ← parallel
         ↓
[Customer Tour WF48] + [Cleaner Tour WF50] ← need milestones table
         ↓
[Auto-Rebook WF24] + [Quick Rebook WF69] + [Dashboard Enhancements WF11] ← parallel
         ↓
[Skeleton States] + [Empty States] + [Error States] ← polish, any order
         ↓
[Coverage Page WF46] + [Help Center WF44] + [SEO Pages WF41] ← parallel
```

---

# QUICK REFERENCE: NEW FILES TO CREATE

```
src/lib/assets.ts
src/lib/encryption.ts
src/lib/notifications/score-templates.ts
src/hooks/use-milestones.ts
src/components/ui/dash-mascot.tsx
src/components/ui/skeletons.tsx
src/components/ui/empty-state.tsx

src/features/booking/lib/booking-states.ts
src/features/booking/lib/cancellation-policy.ts
src/features/booking/actions/cleaner-job-actions.ts
src/features/booking/actions/reschedule-actions.ts
src/features/booking/components/cleaner/OnMyWayScreen.tsx
src/features/booking/components/cleaner/RunningLateModal.tsx
src/features/booking/components/cleaner/ActiveJobScreen.tsx
src/features/booking/components/customer/JobTracker.tsx
src/features/booking/components/customer/RescheduleForm.tsx
src/features/booking/components/customer/CancelFlow.tsx
src/features/booking/components/customer/AutoRebookNudge.tsx
src/features/booking/components/customer/QuickRebook.tsx
src/features/booking/components/customer/ApprovePayScreen.tsx

src/features/messaging/components/MessageThread.tsx
src/features/messaging/components/MessageBubble.tsx
src/features/messaging/components/MessageInput.tsx
src/features/messaging/actions.ts
src/features/messaging/queries.ts

src/features/cleaner/components/InsuranceUpload.tsx
src/features/cleaner/components/InsurancePending.tsx
src/features/cleaner/components/InsuranceVerified.tsx
src/features/cleaner/components/TaxInfoForm.tsx
src/features/cleaner/components/TierExplainer.tsx
src/features/cleaner/components/ScoreExplainer.tsx
src/features/cleaner/components/AppealForm.tsx
src/features/cleaner/actions/insurance-actions.ts
src/features/cleaner/actions/tax-actions.ts

src/features/admin/components/KpiGrid.tsx
src/features/admin/components/GmvSparkline.tsx
src/features/admin/components/ActivityFeed.tsx
src/features/admin/components/NeedsAttention.tsx
src/features/admin/components/DisputePhotoPanel.tsx
src/features/admin/components/DisputeResolutionPanel.tsx
src/features/admin/components/RefundForm.tsx
src/features/admin/lib/audit.ts

src/features/onboarding/components/CustomerFirstTimeTour.tsx
src/features/onboarding/components/CleanerPlatformTour.tsx
src/features/onboarding/actions/milestone-actions.ts

src/app/(app)/cleaner/jobs/[id]/on-my-way/page.tsx
src/app/(app)/cleaner/jobs/[id]/active/page.tsx
src/app/(app)/bookings/[id]/tracking/page.tsx
src/app/(app)/bookings/[id]/reschedule/page.tsx
src/app/(app)/bookings/[id]/cancel/page.tsx
src/app/(app)/bookings/[id]/messages/page.tsx
src/app/(app)/bookings/rebook/[previousBookingId]/page.tsx
src/app/(app)/cleaner/settings/insurance/page.tsx
src/app/(app)/cleaner/settings/tax/page.tsx
src/app/(app)/cleaner/settings/background-check/page.tsx
src/app/(app)/cleaner/score/tiers/page.tsx
src/app/(app)/cleaner/score/explainer/page.tsx
src/app/(app)/cleaner/score/appeal/page.tsx
src/app/(app)/admin/page.tsx
src/app/(app)/admin/disputes/[id]/page.tsx
src/app/(app)/admin/bookings/page.tsx
src/app/(app)/admin/bookings/[id]/refund/page.tsx
src/app/(app)/admin/cleaners/[id]/page.tsx
src/app/(app)/admin/customers/[id]/page.tsx

src/app/(marketing)/trust/background-checked/page.tsx
src/app/(marketing)/trust/neighborhood-expert/page.tsx
src/app/(marketing)/trust/specialties/page.tsx
src/app/(marketing)/coverage/page.tsx
src/app/(marketing)/help/page.tsx
src/app/(marketing)/cleaning/[city]/[service]/page.tsx

src/app/api/cron/auto-approve/route.ts
src/app/not-found.tsx (modify)
```

**Total new files: ~65**  
**Total features: 40+**  
**Build phases: 17–24**
