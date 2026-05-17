# PureTask — Post–V1 Launch Backlog

Items explicitly **deferred** from [v1-launch-scope.md](./v1-launch-scope.md). Pull from here after staging E2E is green — not before.

---

## Phase 10 — Polish & growth

| ID | Item | Phase ref | Notes |
| --- | --- | --- | --- |
| P10-01 | Unified notification dispatcher + Supabase Realtime inbox | 10a | Critical events only in v1 |
| P10-02 | FCM / native push (Expo path in master outline) | 10a | Web Push sufficient for web v1 |
| P10-03 | Empty / error / loading component library | 10b | Standardize per wireframes WF 38–40 |
| P10-04 | Full marketing + SEO (all city × service pages) | 10c | Home + pricing + coverage in v1 |
| P10-05 | Press kit, expanded help CMS | 10c | |
| P10-06 | Customer + cleaner tours polish | 10d | Milestone APIs exist |
| P10-07 | Accessibility audit pass | 10d | |
| P10-08 | Animation / motion refinement | 10d | |

---

## Product features (code may exist; not v1-gating)

| ID | Item | Notes |
| --- | --- | --- |
| PL-01 | Recurring schedules as launch marketing feature | `src/features/recurring/` |
| PL-02 | Favorites UX polish | discovery actions |
| PL-03 | Waitlist → notify when metro opens | phase 5 |
| PL-04 | Instant payout product rules | payments |
| PL-05 | Tier 3 escalation admin flows | phase 8c specs in wireframes folder |
| PL-06 | Tax 1099 reconciliation UI | phase 9c |
| PL-07 | Consolidate trust logic into `src/features/trust/` | optional refactor |

---

## Engineering

| ID | Item | Notes |
| --- | --- | --- |
| ENG-01 | Playwright E2E suite (sign-up → book → approve) | After manual checklist stable |
| ENG-02 | Expand Vitest beyond pricing + scoring | Per feature validation |
| ENG-03 | Preview deploy smoke on Vercel | `docs/phases/preview-deploy-check.md` |
| ENG-04 | Archive or git-ignore duplicate wireframe HTML batches | `all_wireframes_needs_review/` |

---

## Design / assets

| ID | Item | Notes |
| --- | --- | --- |
| DES-01 | Wireframe parity audit vs implemented routes | Use `wireframes_INDEX.md` in archive |
| DES-02 | Brand bible → Tailwind token pass | `art theme and art style guidelines/` |
| DES-03 | Move `art_assets/` into `public/` with stable paths | `src/lib/assets.ts` |
