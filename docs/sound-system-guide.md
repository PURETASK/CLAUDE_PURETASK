# PureTask Sound System — Complete Build Guide

> Everything needed to design, source, produce, and implement audio across the entire app.

---

## Part 1 — Philosophy & Rules

Before touching a single file, these rules govern every decision:

**Rule 1 — Sound is optional, always.** Every user gets a sound toggle in Settings. Sounds are off by default on first visit. Once the user enables them, the preference is persisted in localStorage.

**Rule 2 — Sound must be fast.** UI sounds must be under 500ms. A button click that waits 300ms for a sound to load is broken UX. Everything preloads at app startup.

**Rule 3 — Sound must be relevant.** Every sound communicates the function of the thing it accompanies. Payments sound financial. Disputes sound serious. Approvals sound satisfying. Nothing is arbitrary.

**Rule 4 — Sound must be layered, not loud.** Default volume is 40%. Sounds should feel like they exist in the background of the experience, not on top of it.

**Rule 5 — Reduce motion = reduce sound.** Users with `prefers-reduced-motion: reduce` also get sounds muted. They are opting out of stimulation.

**Rule 6 — Mobile-first audio policy.** iOS Safari requires sounds to be triggered from user gestures. Our system handles this with an audio context unlock on first tap.

---

## Part 2 — Technical Stack

### The One Library: Howler.js

```
pnpm add howler
pnpm add -D @types/howler
```

**Why Howler over everything else:**
- Handles Web Audio API + HTML5 Audio fallback automatically
- Built-in sprite support (one file, many sounds — faster loading)
- iOS/Android gesture-unlock built in
- Volume, rate, loop, fade controls
- Preload, pool, and cache management
- Used in production by major games and apps — battle-tested

**What we do NOT need:**
- `use-sound` — a thin React wrapper around Howler; we'll write our own hook that's more flexible
- Tone.js — overkill, meant for music synthesis
- Web Audio API directly — too low-level, Howler handles it

### File Format Strategy

Every sound is delivered in **two formats** — Howler picks the right one per browser:

| Format | Why |
|---|---|
| `.webm` (Opus codec) | Chrome, Firefox, Edge — smaller file, better quality |
| `.mp3` | Safari, iOS, older browsers |

Every sound needs both formats. Production spec:
- **Sample rate:** 44,100 Hz
- **Bit depth:** 16-bit
- **Channels:** Mono for all UI sounds (smaller file, same perceived quality)
- **Bitrate (MP3):** 128 kbps
- **Normalization:** -6 dB peak (prevents clipping, leaves headroom)
- **Silence trim:** Remove all leading/trailing silence (under 5ms is fine)

### Sprite Strategy

All short UI sounds (under 1 second) are bundled into **two sprite files** to minimize HTTP requests:

```
public/sounds/
├── ui-sprites.webm          ← all short interaction sounds (1 file)
├── ui-sprites.mp3           ← same, MP3 fallback
├── events-sprites.webm      ← all event/milestone sounds (1 file)
├── events-sprites.mp3       ← same, MP3 fallback
└── ambient/                 ← standalone ambient/background tracks
    ├── dashboard-loop.webm
    └── dashboard-loop.mp3
```

A sprite file is one audio file with many sounds stitched together. Howler maps each sound to a `[startMs, durationMs]` pair. Example sprite map:

```ts
const UI_SPRITES = {
  click_primary:     [0,     120],
  click_secondary:   [200,   100],
  click_ghost:       [400,   80],
  click_danger:      [600,   150],
  toggle_on:         [900,   200],
  toggle_off:        [1200,  180],
  input_focus:       [1500,  90],
  nav_forward:       [1700,  250],
  nav_back:          [2050,  250],
  tab_switch:        [2400,  150],
  modal_open:        [2650,  300],
  modal_close:       [3050,  220],
  tooltip_show:      [3370,  80],
  error_shake:       [3550,  350],
  form_submit:       [4000,  400],
  // ...etc
};
```

---

## Part 3 — Complete Sound Asset List

### 3.1 — UI Interaction Sounds (short, everyday)

These fire on micro-interactions. They must be subtle — heard dozens of times per session.

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `click_primary` | Primary button press | Soft mechanical click, slight warmth | 80–120ms |
| `click_secondary` | Secondary/outline button | Lighter click, less weight | 70–100ms |
| `click_ghost` | Ghost/text button | Almost imperceptible soft tap | 50–80ms |
| `click_danger` | Danger/red button | Lower pitch click, slight rumble undertone | 120–150ms |
| `toggle_on` | Switch/toggle enabled | Satisfying snap upward, bright | 150–200ms |
| `toggle_off` | Switch/toggle disabled | Soft snap downward, duller | 130–180ms |
| `checkbox_check` | Checkbox checked | Quick tick sound | 80ms |
| `checkbox_uncheck` | Checkbox unchecked | Soft reverse tick | 80ms |
| `input_focus` | Text input focused | Very soft, airy "pop" | 60–90ms |
| `input_type` | Typing (optional, per key) | Subtle typewriter tap | 30ms |
| `select_open` | Dropdown opens | Light whoosh downward | 120ms |
| `select_choose` | Option selected | Clean click + slight chime | 100ms |
| `tooltip_show` | Tooltip appears | Barely audible breath | 60ms |
| `hover_card` | Card hovered | Sub-perceptible high-frequency tick | 40ms |
| `favorite_add` | Favorite/heart added | Soft sparkle ping | 200ms |
| `favorite_remove` | Favorite removed | Reverse sparkle | 150ms |
| `copy_clipboard` | Copy to clipboard | Double-click snap | 120ms |
| `modal_open` | Dialog/modal opens | Soft whoosh + settle | 280–320ms |
| `modal_close` | Dialog/modal closes | Reverse whoosh | 220–260ms |
| `drawer_open` | Side drawer slides open | Smooth slide + thud | 300ms |
| `drawer_close` | Side drawer slides closed | Smooth slide + click | 250ms |

---

### 3.2 — Navigation Sounds (route changes)

These fire on every page/route transition. Must feel like motion.

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `nav_forward` | Navigate to new page | Soft forward whoosh, bright | 220–280ms |
| `nav_back` | Navigate back | Reversed whoosh, slightly lower | 200–250ms |
| `tab_switch` | Tab/pill navigation switch | Crisp click + air puff | 120–160ms |
| `sidebar_item` | Sidebar nav item clicked | Subtle click, slightly resonant | 100ms |
| `step_advance` | Wizard step forward (application, booking) | Ascending tick/chime | 200ms |
| `step_back` | Wizard step back | Descending tick | 180ms |
| `step_complete` | All wizard steps done | Short ascending arpeggio (3 notes) | 400ms |

---

### 3.3 — Auth & Account Sounds

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `auth_sign_in` | Successful sign in | Warm welcome chime, 2 ascending notes | 400ms |
| `auth_sign_out` | Sign out | Soft closing tone, descending | 300ms |
| `auth_sign_up` | Account created | Bright fanfare, short (3 notes) | 500ms |
| `auth_error` | Wrong password / auth fail | Low dull thud, slightly buzzy | 300ms |
| `password_reset_sent` | Reset email sent | Soft whoosh + ping (like an email sending) | 350ms |
| `email_verified` | Email verification success | Clean chime chord | 450ms |
| `mfa_code_entered` | TOTP digits filled | Soft click per digit (reuse `checkbox_check`) | 80ms |
| `mfa_verified` | 2FA successfully verified | Security unlock sound — metallic click + chime | 500ms |
| `mfa_error` | Wrong TOTP code | Low buzz + shake | 300ms |
| `mfa_enrolled` | New 2FA device added | Achievement-style ascending chord | 600ms |

---

### 3.4 — Cleaner Application Sounds

The application is a 10-step wizard — each step needs sound feedback.

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `application_start` | Begin application | Motivating upward chime | 400ms |
| `step_saved` | Step saved / continued | Quick affirming tick | 150ms |
| `application_submitted` | Final submission | Full submission fanfare — rising chime sequence | 800ms |
| `application_pending` | Under review state loaded | Calm holding tone | 300ms |
| `application_approved` | Admin approves application | Achievement sound — warm chord progression, triumphant | 1200ms |
| `application_rejected` | Admin rejects application | Somber descending tone | 600ms |
| `checkr_initiated` | Background check started | Searching/scanning sound — soft sweep | 350ms |
| `checkr_clear` | Background check cleared | Clean all-clear chime | 500ms |
| `identity_verified` | Stripe Identity verified | Secure verification sound — metallic confirm | 500ms |
| `connect_linked` | Stripe Connect bank linked | Cash/payment sound — coin drop + chime | 600ms |

---

### 3.5 — Booking Flow Sounds (Customer)

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `booking_form_open` | Booking form initialized | Soft page-open sound | 200ms |
| `date_selected` | Date picked on calendar | Calendar click — clean snap | 120ms |
| `time_selected` | Time slot selected | Similar to `date_selected`, slightly higher | 120ms |
| `duration_change` | Hours adjusted | Slider tick per step | 80ms |
| `booking_submitted` | Booking request sent | "Sending" sound — warm whoosh + ping | 600ms |
| `booking_accepted` | Cleaner accepts booking | Satisfying chime — 2 ascending warm notes | 700ms |
| `booking_declined` | Cleaner declines | Low soft thud, disappointed | 400ms |
| `booking_cancelled` | Booking cancelled | Soft descending tone, neutral | 400ms |
| `booking_reminder` | Pre-job reminder notification | Gentle ping, like a soft alarm | 500ms |
| `job_in_progress` | Job status → in_progress | Motivating start sound | 350ms |
| `photo_proof_ready` | Before/after photos submitted | Camera shutter + chime | 450ms |
| `approve_work` | Customer approves job | The most satisfying sound in the app — full approval chord, bright and warm | 900ms |
| `approve_payment_released` | Payment captured after approval | Cash register + chime, premium feel | 700ms |
| `receipt_ready` | Receipt generated | Printer-like tick + chime | 350ms |

---

### 3.6 — Booking Flow Sounds (Cleaner)

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `booking_request_arrived` | New booking request received | Alert ping — attention-grabbing but not harsh | 600ms |
| `booking_accept` | Cleaner accepts booking | Confirming click + warm tone | 500ms |
| `booking_decline` | Cleaner declines | Soft muted thud | 350ms |
| `clock_in` | Cleaner clocks in at location | Punch-clock-inspired but modern — clean click + beep | 500ms |
| `clock_out` | Cleaner clocks out | Reverse punch clock, softer | 400ms |
| `photo_upload_start` | Photo upload begins | Camera shutter | 200ms |
| `photo_upload_success` | Photo uploaded successfully | Quick bright ping | 250ms |
| `all_photos_complete` | All required room photos uploaded | Completion chime sequence | 600ms |
| `job_marked_complete` | Cleaner marks job complete | Satisfying completion tone | 500ms |

---

### 3.7 — Payment Sounds

Payments need to feel **premium, secure, and real**. These are the most emotionally significant sounds in the app.

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `card_added` | Payment method added | Soft card-swipe + confirmation ping | 500ms |
| `card_removed` | Payment method removed | Reverse swipe + muted click | 350ms |
| `payment_authorized` | Card authorization hold placed | Secure click — like a vault locking | 400ms |
| `payment_captured` | Final charge captured (approval) | Premium cash sound — layered coin + deep chime | 700ms |
| `payment_failed` | Payment failed / card declined | Low heavy thud, like a door closing | 500ms |
| `tip_added` | Tip submitted | Bright generous ping — coin toss feel | 400ms |
| `payout_pending` | Payout created, pending | Soft anticipation tone | 300ms |
| `payout_in_transit` | Payout in transit to bank | Whoosh — like money moving | 400ms |
| `payout_paid` | Payout lands in bank | The cleaner's best sound — satisfying cash arrival, full chord | 1000ms |
| `instant_payout` | Instant payout requested | Fast snap + immediate chime (fast!) | 350ms |
| `payout_failed` | Payout failed | Error thud, lower pitch than UI errors | 500ms |
| `earnings_loaded` | Earnings dashboard loads | Soft tally/counting sound | 300ms |

---

### 3.8 — Dispute Sounds

Disputes need to feel **serious and deliberate** — not alarming, but weighty.

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `dispute_open` | Dispute filed | Serious alert tone — low, clear, not harsh | 600ms |
| `dispute_response` | Cleaner responds to dispute | Notification ping, slightly lower than normal | 450ms |
| `dispute_escalated` | Customer escalates to admin | Escalation sound — rising tension tone | 600ms |
| `dispute_admin_reviewing` | Admin picks up dispute | Neutral investigative tone | 350ms |
| `dispute_resolved_customer` | Resolved in customer's favor | Resolution chord — relieved, warm | 800ms |
| `dispute_resolved_cleaner` | Resolved in cleaner's favor | Same resolution chord, same relief | 800ms |
| `dispute_resolved_split` | Split/compromise resolution | Balanced chord — neutral, fair-sounding | 700ms |
| `dispute_message_sent` | Thread message sent | Soft send ping | 200ms |
| `dispute_message_received` | New message in thread | Incoming ping, slightly different | 250ms |

---

### 3.9 — Review Sounds

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `star_hover` | Star rating hover | Tiny sparkle per star | 60ms |
| `star_select` | Star rating locked in | Satisfying star click — 5 stars = 5-note ascending | 80–400ms |
| `review_submitted` | Review posted | Warm affirmation chime + sparkle | 600ms |

---

### 3.10 — Notification Sounds

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `notification_arrive` | In-app notification received | Soft ping — different from push notification | 300ms |
| `notification_read` | Notification marked read | Subtle dismiss sound | 150ms |
| `notification_all_read` | All notifications cleared | Satisfying sweep clear | 300ms |
| `push_permission_granted` | Browser push enabled | Permission granted sound — clean | 400ms |
| `sms_verified` | Phone number verified | Verification chime | 400ms |

---

### 3.11 — Support Ticket Sounds

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `ticket_created` | Support ticket submitted | Submission sound — like filing a form | 450ms |
| `ticket_reply_sent` | Reply sent in thread | Message send sound | 250ms |
| `ticket_reply_received` | New reply from support | Incoming notification | 300ms |
| `ticket_resolved` | Ticket marked resolved | Resolution chime | 500ms |

---

### 3.12 — Reliability Score Sounds

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `score_load` | Score page loads, history renders | Soft tally/counting sweep | 400ms |
| `score_improved` | Current score higher than previous | Ascending motivating tone | 500ms |
| `score_declined` | Score lower than previous | Descending, somber | 400ms |
| `tier_promoted` | Tier upgrade (e.g. Rising Pro → Proven Specialist) | Achievement fanfare — major event | 1500ms |
| `tier_demoted` | Tier downgrade | Solemn descending tone | 800ms |
| `band_trusted` | Score enters "trusted" band | Triumphant ping | 600ms |
| `band_warning` | Score enters "warning" band | Cautionary low tone | 500ms |
| `band_suspended` | Score enters "suspended" band | Serious alert — not panic but urgent | 700ms |

---

### 3.13 — Admin Sounds

Admin tools are utilitarian — sounds should be efficient, not decorative.

| Sound ID | Trigger | Character | Duration |
|---|---|---|---|
| `admin_application_approve` | Admin approves cleaner application | Clean approval stamp sound | 400ms |
| `admin_application_reject` | Admin rejects application | Muted stamp, lower | 350ms |
| `admin_dispute_assigned` | Admin takes a dispute | File pickup sound | 300ms |
| `admin_dispute_resolved` | Admin resolves dispute | Gavel-inspired — clean decisive click | 500ms |
| `admin_ticket_replied` | Admin replies to support ticket | Send ping | 250ms |
| `admin_ticket_closed` | Admin closes ticket | Close/complete sound | 350ms |

---

### 3.14 — Ambient / Background (Optional Layer)

Long-form background audio — very subtle, barely perceptible.

| File | Where | Character |
|---|---|---|
| `dashboard-ambient.webm` | Customer dashboard | Very soft, airy room tone — calm, productive |
| `cleaner-ambient.webm` | Cleaner dashboard | Slightly warmer, more active feel |
| `payments-ambient.webm` | Earnings / payout pages | Low, steady, professional hum |

These are optional extras. They loop silently and default to volume 0.08 (8%). Most users won't consciously notice them — but the absence of them will feel colder.

---

## Part 4 — Sound Sourcing

### Free Sources (Start Here)

| Source | URL | Best For |
|---|---|---|
| **Freesound.org** | freesound.org | Huge library, CC0 and CC-BY, everything |
| **Mixkit** | mixkit.co/free-sound-effects | Clean UI sounds, free for commercial use |
| **Pixabay Audio** | pixabay.com/sound-effects | Free, no attribution required |
| **Zapsplat** | zapsplat.com | Free with account, good UI/UX sounds |
| **OpenGameArt** | opengameart.org | Game UI sounds — good for clicks, chimes |
| **BBC Sound Effects** | sound-effects.bbcrewind.co.uk | Massive archive, free non-commercial + some commercial |

### Paid / Premium Sources (for when free isn't good enough)

| Source | Cost | Best For |
|---|---|---|
| **Splice Sounds** | ~$8/mo | High quality, searchable, royalty-free |
| **Sonniss GDC Pack** | Free annually | Game audio dump, massive and free |
| **BOOM Library** | $50–200/pack | Professional SFX, best-in-class quality |
| **Soundsnap** | $15/mo | UI/UX specific packs, finance sounds |
| **Artlist SFX** | $199/yr | Unlimited downloads, fully cleared |
| **Adobe Audition SFX** | Included with Adobe | Large built-in library |

### Search Terms That Work

When searching the above sites:

**For clicks/buttons:**
`ui click`, `button tap`, `interface click`, `soft click`, `mechanical key`

**For navigation/transitions:**
`whoosh short`, `swoosh ui`, `air puff`, `transition sound`

**For payments:**
`cash register`, `coin drop`, `payment confirm`, `transaction sound`, `money transfer`

**For approvals/success:**
`success chime`, `level up`, `achievement`, `positive notification`, `ding`

**For disputes/alerts:**
`alert tone`, `warning sound`, `error notification`, `serious alert`

**For chimes/notifications:**
`notification ping`, `bell chime`, `ding notification`, `soft ping`

**For achievements:**
`fanfare short`, `triumphant`, `level up sound`, `achievement unlocked`

---

## Part 5 — Audio Production Tools

### For Editing & Processing (Required)

You need at minimum one audio editor to:
- Trim silence from start/end of every file
- Normalize levels to -6 dB
- Convert formats (MP3, WebM/Opus)
- Build sprite files (stitch sounds together with silence gaps)

#### Option A — Audacity (Free, All Platforms)
**audacityteam.org**
- Free, open source, runs on Windows/Mac/Linux
- Does everything needed: trim, normalize, export MP3, batch processing
- Export to MP3 built-in
- WebM/Opus export requires FFmpeg plugin (free, downloadable from Audacity)
- **Recommended for getting started — zero cost**

#### Option B — Adobe Audition (Paid, ~$22/mo)
- More powerful spectral editing
- Batch processing with presets
- Noise reduction is significantly better
- If you already have Adobe CC, use this

#### Option C — GarageBand (Free, Mac only)
- Good for creating simple chimes and tones from scratch using virtual instruments
- Can't batch-process but great for generating original sounds

#### Option D — REAPER ($60 one-time)
- **reaper.fm** — professional DAW, very affordable
- Exceptional batch processing
- Best if you want to create original sounds from scratch
- Steep learning curve

### For Creating Original Sounds (Optional but Powerful)

If you want truly unique sounds that no one else has:

| Tool | Cost | Best For |
|---|---|---|
| **BFXR** (bfxr.net) | Free, browser-based | Retro/synthesized UI sounds |
| **jsfxr** (sfxr.me) | Free, browser-based | Same as BFXR, newer version |
| **ChipTone** (sfbgames.itch.io) | Free | 8-bit inspired, clean UI sounds |
| **GarageBand** | Free (Mac) | Piano, bells, chimes, marimba — great for notification sounds |
| **Splice** | $8/mo | Pre-made sounds + mixing tools |

**Recommended workflow for original chimes:**
1. Open GarageBand or a free VST piano plugin
2. Record a single piano or marimba note
3. Layer 2–3 notes for chords
4. Export to Audacity
5. Trim, normalize, export to MP3 + WebM

### For Format Conversion & Sprite Building

| Tool | Purpose |
|---|---|
| **FFmpeg** (ffmpeg.org) | Free CLI — converts any audio format to any other, including WebM/Opus |
| **Online Audio Converter** (online-audio-converter.com) | Browser-based, no install, good for one-offs |
| **Audacity + FFmpeg plugin** | One-stop shop — edit + export to both formats |

**FFmpeg command to convert MP3 → WebM:**
```bash
ffmpeg -i sound.mp3 -c:a libopus -b:a 64k sound.webm
```

**FFmpeg command to build a sprite (concatenate with silence gaps):**
```bash
ffmpeg -i "concat:sound1.mp3|silence.mp3|sound2.mp3|silence.mp3" -acodec copy sprite.mp3
```

---

## Part 6 — Implementation Architecture

### File Structure

```
public/
└── sounds/
    ├── ui-sprites.webm
    ├── ui-sprites.mp3
    ├── events-sprites.webm
    ├── events-sprites.mp3
    └── ambient/
        ├── dashboard-loop.webm
        ├── dashboard-loop.mp3
        ├── cleaner-loop.webm
        └── cleaner-loop.mp3

src/
└── lib/
    └── sound/
        ├── index.ts            ← main export
        ├── sound-engine.ts     ← Howler initialization + sprite maps
        ├── sound-ids.ts        ← TypeScript union type of all valid sound IDs
        └── use-sound.ts        ← React hook
src/
└── components/
    └── providers/
        └── SoundProvider.tsx   ← context: enabled/disabled + volume
```

### Sound ID Type (`sound-ids.ts`)

```ts
export type UiSoundId =
  | 'click_primary'
  | 'click_secondary'
  | 'click_ghost'
  | 'click_danger'
  | 'toggle_on'
  | 'toggle_off'
  // ... all UI IDs

export type EventSoundId =
  | 'booking_submitted'
  | 'booking_accepted'
  | 'approve_work'
  | 'approve_payment_released'
  | 'payment_captured'
  | 'payout_paid'
  | 'dispute_open'
  | 'dispute_resolved_customer'
  | 'tier_promoted'
  | 'application_approved'
  // ... all event IDs

export type SoundId = UiSoundId | EventSoundId;
```

### Sound Engine (`sound-engine.ts`)

```ts
import { Howl, Howler } from 'howler';

// Sprite maps — [startMs, durationMs]
const UI_SPRITE_MAP = {
  click_primary:    [0,    120],
  click_secondary:  [200,  100],
  click_ghost:      [400,   80],
  click_danger:     [600,  150],
  toggle_on:        [900,  200],
  toggle_off:       [1200, 180],
  // ...
} satisfies Record<string, [number, number]>;

const EVENTS_SPRITE_MAP = {
  booking_submitted:          [0,    600],
  booking_accepted:           [700,  700],
  approve_work:               [1500, 900],
  approve_payment_released:   [2500, 700],
  payment_captured:           [3300, 700],
  payout_paid:                [4100, 1000],
  dispute_open:               [5200, 600],
  dispute_resolved_customer:  [5900, 800],
  tier_promoted:              [6800, 1500],
  application_approved:       [8400, 1200],
  // ...
} satisfies Record<string, [number, number]>;

const uiHowl = new Howl({
  src: ['/sounds/ui-sprites.webm', '/sounds/ui-sprites.mp3'],
  sprite: UI_SPRITE_MAP,
  preload: true,
  volume: 0.4,
});

const eventsHowl = new Howl({
  src: ['/sounds/events-sprites.webm', '/sounds/events-sprites.mp3'],
  sprite: EVENTS_SPRITE_MAP,
  preload: true,
  volume: 0.5,
});

export const playSound = (id: SoundId) => {
  if (id in UI_SPRITE_MAP) {
    uiHowl.play(id);
  } else if (id in EVENTS_SPRITE_MAP) {
    eventsHowl.play(id);
  }
};

export const setGlobalVolume = (v: number) => {
  Howler.volume(v);
};
```

### React Hook (`use-sound.ts`)

```ts
import { useCallback } from 'react';
import { useSoundContext } from '@/components/providers/SoundProvider';
import { playSound } from '@/lib/sound/sound-engine';
import type { SoundId } from '@/lib/sound/sound-ids';

export const useSound = () => {
  const { enabled } = useSoundContext();

  const play = useCallback((id: SoundId) => {
    if (!enabled) return;
    playSound(id);
  }, [enabled]);

  return { play };
};
```

### Provider (`SoundProvider.tsx`)

```tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type SoundContextValue = {
  enabled: boolean;
  volume: number;
  setEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabledState] = useState(false);
  const [volume, setVolumeState] = useState(0.4);

  // Persist to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pt_sound_enabled');
    if (stored === 'true') setEnabledState(true);
  }, []);

  const setEnabled = (v: boolean) => {
    localStorage.setItem('pt_sound_enabled', String(v));
    setEnabledState(v);
  };

  return (
    <SoundContext.Provider value={{ enabled, volume, setEnabled, setVolume: setVolumeState }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSoundContext must be used inside SoundProvider');
  return ctx;
};
```

### Usage in a Component

```tsx
import { useSound } from '@/lib/sound/use-sound';

export const ApproveWorkButton = () => {
  const { play } = useSound();

  const handleApprove = async () => {
    play('approve_work');
    // ... server action
    play('approve_payment_released'); // plays 700ms later
  };

  return <button onClick={handleApprove}>Approve work</button>;
};
```

---

## Part 7 — Settings Integration

Sound settings live at `/settings/notifications` (already exists). We add two controls:

1. **Sound toggle** — on/off switch (`toggle_on` / `toggle_off` sound fires on toggle)
2. **Volume slider** — 0–100%, defaults to 40%

```tsx
// In notification settings page
<div>
  <label>App sounds</label>
  <Toggle
    checked={soundEnabled}
    onChange={(v) => {
      setEnabled(v);
      if (v) play('toggle_on');
    }}
  />
  {soundEnabled && (
    <input
      type="range"
      min={0} max={1} step={0.05}
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
    />
  )}
</div>
```

---

## Part 8 — Accessibility Rules

| Rule | Implementation |
|---|---|
| `prefers-reduced-motion` | Check in SoundProvider init — if true, default to disabled |
| Sound toggle is visible | Accessible in settings, easy to find |
| No sound is required for understanding | Every sound is decorative — the UI works 100% without sound |
| Volume defaults to 40% | Never surprise the user with loud audio |
| iOS gesture unlock | Howler handles this — first user gesture unlocks AudioContext |
| Screen reader compatibility | Sounds do not interfere with ARIA announcements |

---

## Part 9 — Step-by-Step Production Checklist

### Step 1 — Source Every Sound
- [ ] Download Audacity + FFmpeg plugin
- [ ] Create account on Freesound.org, Mixkit, Zapsplat
- [ ] For each sound in Part 3, find a candidate file from the free sources
- [ ] Flag any that don't have a good free match (these get custom-made or bought)

### Step 2 — Edit Every Sound in Audacity
- [ ] Trim all leading and trailing silence
- [ ] Normalize to -6 dB peak (Effect → Normalize)
- [ ] Apply very slight fade-in (5ms) and fade-out (20ms) to prevent clicks
- [ ] Export as MP3 128kbps + WebM/Opus 64kbps

### Step 3 — Build Sprite Files
- [ ] Arrange UI sounds in order with 100ms silence between each
- [ ] Record the `[startMs, durationMs]` for each in the sprite map
- [ ] Export as `ui-sprites.mp3` and `ui-sprites.webm`
- [ ] Repeat for event sounds → `events-sprites.mp3` + `.webm`

### Step 4 — Install Howler
```bash
pnpm add howler
pnpm add -D @types/howler
```

### Step 5 — Build the Sound System
- [ ] Create `src/lib/sound/sound-ids.ts`
- [ ] Create `src/lib/sound/sound-engine.ts` with sprite maps
- [ ] Create `src/lib/sound/use-sound.ts`
- [ ] Create `src/components/providers/SoundProvider.tsx`
- [ ] Add `SoundProvider` to the app layout

### Step 6 — Wire Sounds to Components
- [ ] All `<Button>` components play the right `click_*` sound
- [ ] Navigation triggers `nav_forward` / `nav_back`
- [ ] Every Server Action plays its corresponding sound on result
- [ ] Star rating plays `star_hover` on hover, `star_select` on lock

### Step 7 — QA Every Sound
- [ ] Test on Chrome (WebM path)
- [ ] Test on Safari/iOS (MP3 fallback path)
- [ ] Test with system volume at 100% — nothing should be harsh
- [ ] Test with sound disabled — confirm UI works identically
- [ ] Test `prefers-reduced-motion` media query behavior

---

## Part 10 — Total Sound Count Summary

| Category | Count |
|---|---|
| UI Interaction | 21 |
| Navigation | 7 |
| Auth & Account | 9 |
| Cleaner Application | 10 |
| Booking (Customer) | 14 |
| Booking (Cleaner) | 9 |
| Payments | 12 |
| Disputes | 9 |
| Reviews | 3 |
| Notifications | 5 |
| Support Tickets | 4 |
| Reliability Score | 8 |
| Admin | 6 |
| Ambient (optional) | 3 |
| **TOTAL** | **120** |

120 distinct sounds. In sprite form, this becomes:
- 2 sprite files (UI + Events), each in 2 formats = **4 audio files**
- 3 ambient loops in 2 formats = **6 audio files**
- **10 total files in `/public/sounds/`**
