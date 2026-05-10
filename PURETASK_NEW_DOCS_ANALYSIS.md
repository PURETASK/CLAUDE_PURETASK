# PureTask — New Documents Analysis & Implementation Report
**Generated:** 2026-05-09  
**Git snapshot:** `snapshot-pre-phase17-20260509` (safe rollback point)

---

## Documents Reviewed

| File | Lines | Status |
|---|---|---|
| `docs/sound-system-guide.md` | 780 | Fully read |
| `art theme.../v2 .1 style guide for puretask.txt` | 407 | Fully read |
| `art theme.../PureTask_New_AI_Core_Prompt.txt` | 14 | Fully read |
| `art theme.../README_Paste_Order.txt` | 23 | Fully read |
| `art theme.../source_manifest.json` | 17 | Fully read |
| `art theme.../PureTask_April_2026_AI_Paste_Pack.docx` | — | Extracted (binary) |
| `art theme.../puretask_master_brand_bible_final.pdf` | — | Unreadable (no PDF CLI tool) |

---

## What Is Already Implemented — Skip These

Everything below is confirmed live in the codebase. No further action needed.

- Clean Aero Glow color tokens in `globals.css` — exact hex values match V2.1 spec
- Shadow tiers (tier1/2/3) — same values as V2.1
- All gradient utilities (`bg-gradient-hero`, `bg-gradient-brand`, `bg-gradient-premium`, `bg-gradient-glow`)
- Motion timing tokens (`--duration-micro/control/card/confirm`) — all within V2.1 ranges
- Easing (`--ease-soft-out: cubic-bezier(0.16, 1, 0.3, 1)`) — correct
- Full component library: Button, Badge, TrustCallout, Input, Card, Progress, `.pt-field`
- Brand system applied to all 40+ component files
- All semantic colors (success, warning, error with light/dark variants)
- Entire backend: auth, booking, payments, disputes, reviews, notifications, 2FA, push, SMS

---

## PRIORITY 1 — Implement: Sound System

**Source:** `docs/sound-system-guide.md`  
**Why:** Completely new. Not in codebase. Fully specified with exact TypeScript code. Adds real UX value to emotionally significant moments — payout landing, booking accepted, work approved.

### 6 Non-Negotiable Rules

1. **Off by default.** localStorage persists the user's choice.
2. **Fast.** All sounds preloaded at startup. UI sounds < 500ms.
3. **Relevant.** Every sound communicates the function it accompanies.
4. **Quiet.** Default volume 40%. Background layer, not foreground.
5. **Accessible.** `prefers-reduced-motion: reduce` → sounds also muted.
6. **iOS-safe.** AudioContext unlocked on first user gesture (Howler handles this).

### Library

```bash
pnpm add howler
pnpm add -D @types/howler
```

Howler.js only. No alternatives needed. Handles WebM/MP3 fallback, iOS unlock, sprite maps, preloading.

### File Architecture

```
public/sounds/
├── ui-sprites.webm / .mp3       ← all button/toggle/input/nav sounds
├── events-sprites.webm / .mp3   ← booking/payment/dispute/approval sounds
└── ambient/
    ├── dashboard-loop.webm / .mp3
    └── cleaner-loop.webm / .mp3

src/lib/sound/
├── sound-ids.ts        ← TypeScript union type of all valid sound IDs
├── sound-engine.ts     ← Howler init + sprite maps
├── use-sound.ts        ← React hook: useSound()
└── index.ts            ← re-exports

src/components/providers/
└── SoundProvider.tsx   ← context: enabled / volume / setEnabled / setVolume
```

### 120 Sounds by Category

| Category | Count | Most Important Sounds |
|---|---|---|
| UI Interaction | 21 | `click_primary`, `toggle_on/off`, `input_focus`, `modal_open/close` |
| Navigation | 7 | `nav_forward`, `nav_back`, `tab_switch`, `step_advance`, `step_complete` |
| Auth | 9 | `auth_sign_in`, `auth_sign_up`, `mfa_verified`, `mfa_enrolled` |
| Cleaner Application | 10 | `application_approved`, `application_submitted`, `checkr_clear`, `identity_verified` |
| Booking (Customer) | 14 | `booking_accepted`, **`approve_work`**, **`approve_payment_released`** |
| Booking (Cleaner) | 9 | **`booking_request_arrived`**, `clock_in`, `clock_out`, `job_marked_complete` |
| Payments | 12 | **`payout_paid`**, `payment_captured`, `instant_payout`, `card_added` |
| Disputes | 9 | `dispute_open`, `dispute_resolved_customer/cleaner/split` |
| Reviews | 3 | `star_hover`, `star_select`, `review_submitted` |
| Notifications | 5 | `notification_arrive`, `notification_read`, `push_permission_granted` |
| Support | 4 | `ticket_created`, `ticket_resolved` |
| Reliability Score | 8 | **`tier_promoted`**, `tier_demoted`, `band_suspended` |
| Admin | 6 | `admin_application_approve`, `admin_dispute_resolved` |
| Ambient (optional) | 3 | `dashboard-ambient`, `cleaner-ambient`, `payments-ambient` |

**Bold = highest emotional impact. Build these first.**

### Sprite Technique (Key Concept)

All short sounds stitched into 2 audio files. Howler maps each sound to `[startMs, durationMs]`:

```ts
const UI_SPRITE_MAP = {
  click_primary:   [0,    120],
  click_secondary: [200,  100],
  toggle_on:       [900,  200],
  // ...
} satisfies Record<string, [number, number]>;
```

Result: only 4 HTTP requests for 117 sounds (2 sprite files × 2 formats).

### React Integration

```tsx
// Any component
const { play } = useSound();
play('approve_work');       // plays if sounds enabled, no-ops if disabled
play('payout_paid');
```

### Settings Integration

Add to `/settings/notifications` (page already exists):
1. Sound on/off toggle (`toggle_on/off` sound fires on the toggle itself)
2. Volume slider 0–100%, shows only when enabled, defaults to 40%

### Audio Sourcing

**Free (start here):** Freesound.org, Mixkit, Pixabay Audio, Zapsplat  
**Custom chimes:** GarageBand (free Mac) — record piano/marimba notes, export to Audacity  
**Audio spec:** 44,100 Hz · 16-bit · Mono · MP3 128kbps · WebM/Opus 64kbps · Normalize to -6dB  
**Editor:** Audacity (free) + FFmpeg plugin for WebM export

### Build Order

1. Source audio files from free sites
2. Edit each in Audacity (trim silence, normalize, 5ms fade-in, 20ms fade-out)
3. Build sprite files with FFmpeg — record `[startMs, durationMs]` per sound
4. Install Howler, create `src/lib/sound/` files
5. Add `SoundProvider` to root layout
6. Wire sounds to components (Button clicks, server action results)
7. Add toggle + slider to `/settings/notifications`
8. QA: Chrome (WebM), Safari/iOS (MP3), disabled mode, reduced-motion

---

## PRIORITY 2 — Implement: Inter Font + Type Scale

**Source:** V2.1 Style Guide Section 5  
**Why:** Currently using Geist Sans. V2.1 recommends **Inter** as the strongest default for product UI. Inter has better readability at 14px label sizes, cleaner tabular numerals for prices, and is the standard for serious SaaS products (Linear, Stripe, Notion all use it).

### 8 Type Roles

| Role | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| Display | 48–64px | 700 | 1.0–1.05 | Hero titles |
| H1 | 36–44px | 700 | 1.05–1.1 | Major page titles |
| H2 | 28–32px | 600 | 1.1 | Section headings |
| H3 | 22–24px | 600 | 1.15 | Card titles, subsections |
| Body | 16px | 400 | 1.45–1.55 | Paragraph text |
| Label | 14px | 500 | 1.3–1.4 | Input labels, metadata |
| Helper | 12–13px | 400 | 1.35–1.45 | Hints, legal microcopy |
| **Metric** | **18–28px** | **600–700** | **1.1** | **Prices, totals, % complete** |

The **Metric** role is the most impactful addition. Booking prices, payout amounts, and reliability scores should use heavier weight + tighter line-height to feel more credible and readable at a glance.

### Implementation

Switch `layout.tsx` to import Inter from `next/font/google`. Add CSS variables per type role in `globals.css`. The font swap has no JS cost — it's CSS only.

---

## PRIORITY 3 — Implement: Choice Chip Component

**Source:** V2.1 Style Guide Section 12  
**Why:** Referenced in the style guide as a core component. Currently built inline in several application step files — it needs to be extracted as a proper reusable `<Chip>` component before the booking wizard is built.

**States:**
- Default: `border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400`
- Selected: `border-brand-600 bg-brand-600/10 text-brand-600`
- Disabled: `border-neutral-100 bg-neutral-50 text-neutral-400`

**Used for:** bedrooms/bathrooms count picker, service extras (oven, fridge, windows), cleaning preferences, cleaner application service types, review trait chips.

---

## PRIORITY 4 — Implement: Service Card Component

**Source:** V2.1 Style Guide Section 12  
**Why:** Needed for the booking wizard's service-type selection step. Large selectable tile — better UX than a dropdown for 3 service options.

**States:**
- Idle: `rounded-2xl border border-neutral-200 bg-white shadow-tier1`
- Hover: `border-neutral-300 shadow-tier2 transition-shadow`
- Selected: `border-brand-600 bg-brand-600/5 ring-2 ring-brand-600/20 shadow-tier2`

**Used for:** Standard Clean, Deep Clean, Move-in/out service selection.

---

## PRIORITY 5 — CRITICAL: Booking Wizard (Phase 17 / Major Feature)

**Source:** V2.1 Style Guide Section 11 (Product Expression System)  
**Why:** The official authoritative step sequence for the full customer booking flow. Use this as the design source of truth.

### Official 13-Step Flow

```
Step  1 — Welcome           Entry point, brief intro to the booking experience
Step  2 — Contact           Phone/email verification
Step  3 — Home details      Address, home size, bedrooms/bathrooms
Step  4 — Access/Parking    Gate codes, parking notes, pet info
Step  5 — Preferences       Cleaning priorities and what matters most
Step  6 — Review profile    Customer reviews what they've entered so far
Step  7 — Service           Service type (Standard, Deep, Move-in/out)
Step  8 — Date/Time         Calendar + time slot picker
Step  9 — Scope/Extras      Rooms to clean, add-on services (oven, fridge, windows)
Step 10 — Cleaner match     Discovery/matching screen, pick a cleaner
Step 11 — Review/Confirm    Full booking summary
Step 12 — Payment/Trust     Payment method + trust signals + hold notice
Step 13 — Confirmation      Booking confirmed, what happens next
```

### UX Rules for This Flow

- One primary card per step. One category of information per screen.
- Always show visible progress (step count + percent bar).
- Right-side sticky price/trust summary panel on steps 11–12 (desktop only — collapses on mobile).
- Trust moments (price hold, approval requirement, actual hours notice) must be visually clear. Use `TrustCallout` components.
- Store home profile data after steps 3–5 so repeat bookings skip them.
- Use `<Chip>` component (Priority 3) for bedrooms, bathrooms, extras.
- Use `<ServiceCard>` component (Priority 4) for step 7.

---

## REFERENCE (No Code Required Now): Dash Mascot Usage Rules

**Source:** V2.1 Style Guide Section 9  
**When to use:** When illustration assets are commissioned or created.

**Approved use cases:** Onboarding welcome, loading states, success screens (booking confirmed, payout received, application approved), campaign hero art, social media.

**Hard rules:**
- Full beak must always be visible/uncropped inside any icon container
- Never goofy, meme-like, angry, sleepy, chaotic, or juvenile
- Never louder or more prominent than the P-house logo

**Small-size priority order:** Head shape → Eye → Full beak → Wing silhouette → Body curve

---

## REFERENCE (No Code Required Now): Print/Physical Mark Variants

**Source:** V2.1 Style Guide Section 15  
**When to use:** When brand collateral is needed (uniforms, invoices, cards, stickers, signage).

Required: full-color premium, flat-color, monochrome, dark-background, embroidery-safe

---

## Motion Timing — Already Correct, No Change Needed

| Token | Current Value | V2.1 Range | Status |
|---|---|---|---|
| `--duration-micro` | 150ms | 120–180ms | ✓ In range |
| `--duration-control` | 200ms | 180–260ms | ✓ In range |
| `--duration-card` | 350ms | 280–420ms | ✓ In range |
| `--duration-confirm` | 500ms | 400–700ms | ✓ In range |

---

## Not Worth Implementing

| Item | Why Not |
|---|---|
| Figma page map (00–09 structure) | Figma library organization — not app code |
| Asset naming conventions | For design export files, not the codebase |
| Governance / version freeze rules | Process documentation, not code |
| Ambient background audio loops | Optional extra — build after core sound system |
| PDF source hierarchy reference | Already have all content in the .txt/.md files |

---

## Implementation Sequence Summary

| # | Task | Size | Impact |
|---|---|---|---|
| 1 | Sound system (Howler + sprites + SoundProvider + 120 sounds) | Large | High — UX delight |
| 2 | Inter font + type scale tokens | Small | Medium — polish |
| 3 | `<Chip>` component | Small | High — unblocks booking |
| 4 | `<ServiceCard>` component | Small | High — unblocks booking |
| 5 | 13-step booking wizard | Very large | Critical — core product |

The Chip and ServiceCard components are quick wins that directly unblock the booking wizard. The sound system is a standalone feature that can be built in parallel or immediately after. The booking wizard is the largest remaining feature in the entire product.
