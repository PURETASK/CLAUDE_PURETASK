# PureTask — Soap Bubble Experience (design system)

**Codename:** Lumen Bubble  
**Goal:** A cleaning marketplace that feels like a **floating sensory journey**, not a generic SaaS dashboard.

---

## Creative direction

| Principle | Expression |
| --- | --- |
| **Not “another blue app”** | Content lives inside a **refractive soap lens** — iridescent rim, soft depth, slow drift |
| **Motion = meaning** | Tab/page change = **pop** → brief void → **inflate** new bubble with new content |
| **Sound = touch** | Optional clicks, pops, tab shifts (off by default; see `docs/sound-system-guide.md`) |
| **Trust through craft** | Playful surface, serious data (payments, disputes) stays readable inside the lens |

**Reference mood:** underwater light, morning bathroom window, premium soap commercial — **not** cartoon, not childish.

---

## Visual language

### Color (extends Clean Aero Glow)

- **Deep pool:** `#072a55` (scene background)
- **Iridescent rim:** gradient `#169af5` → `#40e8e0` → `#c4b5fd` (subtle)
- **Lens body:** `rgba(255,255,255,0.72)` + `backdrop-filter: blur(24px)`
- **Specular:** white 12% inset top highlight

### Typography (experience routes)

- **Display:** Outfit — navigation, bubble chrome, hero labels
- **Body:** DM Sans — forms, tables, legal (readability)

### The bubble lens (3D without WebGL)

CSS only:

- `perspective` on scene
- Lens: `border-radius: 2rem`, layered `box-shadow` (outer glow + inset highlight)
- Pseudo-element **caustic shimmer** (animated gradient, low opacity)
- Optional slow **float** (`translateY` 6px loop, 8s ease-in-out)

### Pop transition (navigation)

1. **Compress** (80ms) — lens scales to 0.92, rim brightens  
2. **Pop** (120ms) — scale 1.06 → particle burst overlay, play `pop` sound  
3. **Dissolve** (100ms) — content opacity 0  
4. **Inflate** (450ms) — new content fades in inside fresh lens  

Respect `prefers-reduced-motion`: cross-fade only, no pop particles, no sound.

---

## Component map (code)

| Component | Path | Role |
| --- | --- | --- |
| `BubbleExperienceProvider` | `src/features/experience/` | Pathname listener, phase state, sound prefs |
| `BubbleViewport` | same | Lens + scene wrapper |
| `BubblePopOverlay` | same | Particle burst on pop |
| `BubbleNavLink` | same | Nav with pre-navigation pop |
| `BubbleModal` | same | Modal inside mini-bubble frame |
| `BubbleTabs` | same | Tab list with pop between panels |
| `ExperienceSoundToggle` | same | Settings control |

**CSS:** `src/styles/bubble-experience.css`  
**Sound:** `src/lib/sound/sound-manager.ts` (procedural Web Audio until sprite files land in `public/sounds/`)

---

## Modals & overlays (inventory → bubble treatment)

| Surface | Current location | Bubble treatment |
| --- | --- | --- |
| Photo / waiver | `WaiverModal.tsx` | `BubbleModal` + legal tone, softer pop |
| Late to job | `OnMyWayClient.tsx` | `BubbleModal` variant `alert` |
| Cancel booking | booking cancel page / buttons | Confirm `BubbleModal` |
| Dispute file | `FileDisputeForm` | Full `BubbleModal` wizard steps |
| Instant payout confirm | `InstantPayoutButton.tsx` | `BubbleModal` + success sound |
| Payment method add | `AddPaymentMethodPanel.tsx` | `BubbleDrawer` + booking CTA |
| Clock out confirm | `ActiveJobClient.tsx` | `BubbleModal` |
| First-time tours | `CustomerFirstTimeTour`, `CleanerPlatformTour` | `BubbleTourOverlay` |
| Admin dialogs | `/admin/*` | **No bubble** — keep utilitarian (phase 3) |

Marketing (`(marketing)`) keeps lighter bubble accents only (hero background), full lens in `(app)` only for v1.

---

## Rollout phases

### Phase 1 — Foundation (current PR)

- [x] Design tokens + CSS
- [x] Provider, viewport, pop overlay, nav link
- [x] Procedural sound + toggle
- [x] Wired into `(app)/layout` main content

### Phase 2 — Components

- [x] Migrate `WaiverModal`, late modal, cancel confirm, dispute confirm → `BubbleModal`
- [x] `SettingsBubbleNav` + `BookingDetailTabs` on settings and booking detail
- [x] Marketing hero: `MarketingBubbleHero` (ambient bubbles only)

### Phase 3 — Polish

- [x] Howler WAV files in `public/sounds/ui/` (`pnpm sounds:generate`); procedural fallback retained
- [x] Preload UI sounds when sound is enabled (`BubbleExperienceProvider`)
- [x] Dashboard extra ambient orbs (`DashboardBubbleAmbience`)
- [ ] Sprite bundles (webm/mp3) per `sound-system-guide.md` — optional upgrade
- [ ] Page-specific ambient audio loops (dashboard) — visual only for now
- Reduced-motion user testing
- Performance audit (blur cost on low-end Android)

---

## Assets

- `public/assets/backgrounds/bubbles.png` — ambient scene
- `art_assets/bubbles_background.png` — source art (sync to public when updated)
- Future: Lottie or Rive pop burst (optional)

---

## Accessibility

- Sound off by default; toggle in Settings → Experience
- `prefers-reduced-motion` disables pop + particles
- Lens content remains scrollable; focus trap in `BubbleModal`
- Contrast: body text `#0f172a` on lens white ≥ 4.5:1
