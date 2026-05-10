# Phase 10c — Plain-English Breakdown

This document walks through `phase-10c-marketing-pages-seo-spec.md` in plain English.

Phase 10c is **the customer acquisition layer.** Before Phase 10c, customers find PureTask only via direct link or word of mouth. After Phase 10c, Google's organic search delivers customers via city × service landing pages, Schema.org rich snippets surface PureTask in search results, and 6 static marketing pages answer common questions before customers even sign up.

**Phase 10 Lock 9 says Phase 10c is NOT BLOCKING for launch.** Can ship lean (just sitemap + 1-2 critical pages), defer fully until post-launch, or build complete. Decision deferred.

---

# Section 0 — External account prerequisites

## What it means in plain English

Three pre-launch items:
1. **Google Search Console** verification
2. **Schema.org Rich Results Test** access
3. **Lawyer-reviewed marketing copy** for all 6 static pages

Press kit assets prepared (logos, founder photos, screenshots).

## Why lawyer review on marketing copy

Pricing claims = legal exposure if misleading.
Service area claims = liability if false.
Company representations = securities-adjacent.

Don't ship marketing without legal review. Even small claims compound.

## Beginner traps

- **Don't ship marketing without lawyer.** Cheap insurance.
- **Don't skip Search Console.** Can't measure SEO without it.

---

# Section 1 — Summary

## What it means in plain English

Seven things will work after Phase 10c:

1. City × Service landing pages auto-generated
2. Schema.org JSON-LD live
3. 6 static pages live
4. Sitemap auto-generated
5. Robots.txt configured
6. Open Graph + meta tags
7. <2s page load p95

## Why "auto-generated landing pages"

Manually building landing pages per metro × service:
- Sacramento × Standard
- Sacramento × Deep Clean
- Oakland × Standard
- ...

50 metros × 4 services = 200 pages. Manual = unscalable.

`generateStaticParams` + Next.js ISR + daily revalidation = each page builds at deploy + refreshes nightly. Real cleaner data baked in.

## Why Schema.org markup matters

Google rich snippets transform search result CTR:
- LocalBusiness markup → "PureTask · 4.9★ (312 reviews) · Sacramento"
- FAQPage markup → expandable FAQ in search results
- Service markup → service details visible without click

Without Schema.org, your result is plain text. CTR drops 30-50%.

## Why "Phase 10c not blocking for launch"

Marketing pages drive future growth, not current launch. Launch with:
- Functional product (Phases 1-9)
- Working sign-up flow (Phase 5)
- Word-of-mouth/referrals
- Direct outreach to first customers

SEO compounds over months. Phase 10c can ship 60-90 days post-launch.

## Beginner traps

- **Don't try to launch Phase 10c at full scope.** Lean minimum: pricing + about + FAQ + sitemap.
- **Don't skip Schema.org.** Free CTR boost.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: SEO landing, static pages, sitemap.

### SEO landing (WF 41)

URL: `/sacramento/standard`. Active metros only (Phase 5 metro state = 'active'). Pre-launch metros excluded.

Page composition matches WF 41 exactly. Real data: real cleaner counts, real reviews.

Schema.org JSON-LD: LocalBusiness + Service + FAQPage. Validates via Rich Results Test.

Static generation + ISR daily revalidation = fast + fresh.

### Static pages (WF 42-46, 67)

Pricing, About, Help, FAQ, Coverage, Press Kit.

Help articles markdown-driven (CMS-lite via database).

FAQ Schema.org for rich snippets.

All pages mobile + WCAG 2.1 AA + Lighthouse >90.

### Sitemap

Auto-generated. Updated nightly. Excludes waitlist metros + admin routes.

Robots.txt allows crawlers; disallows admin.

Google Search Console submission verified post-deploy.

### Cross-cutting

75% test coverage. Lower than financial code because UI mostly.

## Beginner traps

- **Don't include waitlist metros in sitemap.** Empty pages = SEO penalty.
- **Don't ship invalid Schema.org.** Rich snippets rejected.

---

# Section 3 — Database state required

## What it means in plain English

Most data exists. Phase 10c adds:
- `help_articles` table (markdown-based CMS)
- `faq_items` table (separate for Schema.org markup)

Public read RLS — anyone can read published articles.

### Why separate FAQ from help_articles

FAQ items get Schema.org FAQPage markup. Different rendering. Different Q+A constraint. Cleaner separation.

## Beginner traps

- **Don't sanitize markdown in storage.** Render-time sanitization (DOMPurify).
- **Don't use HTML in markdown.** Markdown only.

---

# Section 4 — Files to create

## What it means in plain English

~30 files:
- 8 routes (1 dynamic + 7 static)
- 12 components
- 5 library files
- 3 server actions
- 1 cron
- Migration

Heavy on components because each marketing page has multiple sections.

## Beginner traps

- **Don't put SEO logic in components.** Library code.
- **Don't hardcode metro list.** Dynamic from DB.

---

# Section 5 — Implementation order

## What it means in plain English

10 days:
- Days 1-5: SEO landing pages (most complex)
- Days 6-9: static marketing pages
- Day 10: sitemap + closeout

## Why landing pages get 5 days

- Static generation infrastructure (Day 1)
- Composition (Day 2)
- Schema.org (Day 3)
- OG + revalidation (Day 4)
- Edge cases + closeout (Day 5)

Each step needs testing.

## Beginner traps

- **Don't skip Day 5 edge cases.** New metros + waitlist filter important.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Stale landing pages
Old social proof. **Fix:** daily revalidation.

### B — Invalid Schema.org
Edge cases break JSON-LD. **Fix:** validation pre-render.

### C — Waitlist metros leak
404 pages indexed. **Fix:** filter to active.

### D — Performance regression
Live queries slow page. **Fix:** pre-compute at static gen.

### E — Markdown XSS
Admin writes script tags. **Fix:** DOMPurify sanitization.

### F — Duplicate FAQ questions
Schema rejected. **Fix:** unique constraint.

### G — OG image generation
50+ images = unscalable. **Fix:** dynamic ImageResponse API.

### H — Robots.txt over-blocks
Important pages de-indexed. **Fix:** test with Google tool.

## Why these matter

SEO mistakes compound. Bad robots.txt = 6 months recovery. Invalid schema = lost CTR.

## Beginner traps

- **Don't trust Schema.org rendering blindly.** Validate.
- **Don't write robots.txt without testing.** De-indexing risk.

---

# Section 7 — Testing strategy

Standard layers. Lighthouse audit per page critical (>90 target). Real device testing important.

## Beginner traps

- **Don't skip Lighthouse.** Free quality signal.

---

# Section 8 — Deployment plan

Standard. **30-day monitoring** because SEO surfaces over weeks.

---

# Section 9 — Handoff

Phase 10c output for Phase 10d:
- Help articles available for support routing
- FAQ items for support links
- Press kit for press inquiries

---

# Section 10 — Open questions

1. **Launch decision.** Per Lock 9: NOT BLOCKING. Decide ship full / lean / defer.
2. OG image tool (Next.js ImageResponse recommended)
3. Help CMS UX (markdown only v1)
4. Multi-language SEO (defer)

---

# Notes on what comes next

Phase 10d (tours + support + a11y + polish) — final pre-launch phase.

Phase 10c can ship lean to focus engineering on Phase 10d. Decide based on launch timeline.

---

This walkthrough is the Phase 10c learning document.
