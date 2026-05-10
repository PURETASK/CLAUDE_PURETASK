# Phase 10c — Marketing Pages + SEO Infrastructure Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 10c will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual customer feedback on landing page conversion, Schema.org rich snippet observations from Google Search Console, real cleaner data populating dynamic pages, and SEO ranking observations after 30/60/90 days. Phase 10 Lock 9 confirmed marketing pages NOT BLOCKING for launch — defer or ship lean. Treat this as an aggressive draft.

**Phase goal:** Public marketing surfaces drive customer acquisition. WF 41 City × Service SEO landing pages generated per active metro × service. WF 42 pricing, WF 43 about, WF 44 help center, WF 45 FAQ, WF 46 coverage, WF 67 press kit live. Schema.org markup non-negotiable for SEO. Sitemap auto-generated. Pre-launch metros excluded from SEO pages.

**Estimated duration:** ~2 weeks of focused engineering (10 working days).

**Depends on:**
- Phase 5 metro config (active vs waitlist states)
- Phase 6 reviews populated for testimonials
- Phase 7 cleaner cards exist for landing page social proof
- Phase 10b state components (for landing page edge cases)
- Lawyer-reviewed marketing copy (pricing, terms, privacy)

**Wireframes covered:** WF 1 (component reuse), WF 41 (SEO landing), WF 42 (pricing), WF 43 (about), WF 44 (help center), WF 45 (FAQ), WF 46 (coverage), WF 67 (press kit).

**Phase 10c sub-sections (parallel):**

- **10c-1** — SEO landing pages (WF 41) (~5 days)
- **10c-2** — Static marketing pages (WF 42-46, 67) (~4 days)
- **10c-3** — Sitemap + SEO infrastructure (~1 day)

---

## 0. External account prerequisites

### 0.1 Google Search Console

Required for SEO measurement:
1. Verify domain ownership
2. Submit sitemap.xml
3. Monitor indexed pages
4. Track rich snippet errors

### 0.2 Schema.org validator access

Test JSON-LD output via Google Rich Results Test before deploy. Rich snippets are make-or-break for landing page CTR.

### 0.3 Lawyer review on marketing copy

All static marketing pages require lawyer review:
- WF 42 pricing — fee transparency claims
- WF 43 about — company representations
- WF 44 help — operational commitments
- WF 45 FAQ — answer accuracy + liability
- WF 46 coverage — service area claims
- WF 67 press kit — company facts

Don't ship marketing without legal review.

### 0.4 Press kit assets

Brand assets, logos, founder photos, screenshots for press@ requests.

---

## 1. Summary

Phase 10c is **the customer acquisition layer.** Concretely, by the end of Phase 10c:

1. **City × Service landing pages auto-generated.** `/sacramento/standard`, `/sacramento/deep-clean`, etc. Active metros only.

2. **Schema.org JSON-LD markup live.** LocalBusiness + Service + FAQPage. Google rich snippets target.

3. **6 static marketing pages live.** Pricing, About, Help Center, FAQ, Coverage, Press Kit.

4. **Sitemap auto-generated.** Daily revalidation.

5. **Robots.txt configured.** Crawler instructions.

6. **Open Graph + meta tags.** Social sharing renders correctly.

7. **Page load <2s p95 on landing pages.** SEO-critical.

What Phase 10c does NOT do:
- Paid ads (defer to post-launch growth phase)
- Email marketing campaigns (defer)
- Blog content management (defer)
- Multi-language SEO (defer)

**Phase 10 Lock 9: Phase 10c is NOT BLOCKING for launch.** Can ship leaner version or defer entirely. Decision deferred until Phase 10 starts.

---

## 2. Acceptance criteria

### 10c-1 SEO landing pages (WF 41)

- [ ] `/[city-slug]/[service-slug]` renders for each active metro × 4 services combo
- [ ] Pre-launch (waitlist) metros excluded
- [ ] Page composition matches WF 41:
  - Top breadcrumb: `SACRAMENTO · STANDARD CLEANING`
  - H1 with neighborhood mentions
  - Local social proof (real cleaner counts + ratings)
  - Address input → WF 8 conversion
  - Top 3 cleaner cards filtered to ZIP
  - "What's included" panel
  - Local timing + price anchor
  - Neighborhood pills
  - Local testimonials (real reviews)
  - FAQ accordion
  - Bottom CTA
- [ ] Schema.org JSON-LD: LocalBusiness + Service + FAQPage
- [ ] Validates via Google Rich Results Test
- [ ] Static generation via Next.js `generateStaticParams`
- [ ] Daily revalidation via on-demand revalidation
- [ ] Page load <2s p95
- [ ] Open Graph: title + description + og:image per page

### 10c-2 Static marketing pages

- [ ] WF 42 `/pricing` — fee transparency, examples, lawyer-reviewed
- [ ] WF 43 `/about` — company story, founder, mission
- [ ] WF 44 `/help` — help article CMS (markdown-driven)
- [ ] WF 45 `/faq` — categorized FAQ with Schema.org markup
- [ ] WF 46 `/coverage` — interactive metro list with active/waitlist states
- [ ] WF 67 `/press` — press kit with downloadable assets
- [ ] All pages mobile-responsive
- [ ] All pages keyboard-navigable
- [ ] All pages WCAG 2.1 AA compliant

### 10c-3 Sitemap + SEO infrastructure

- [ ] `/sitemap.xml` auto-generated; lists all SEO pages
- [ ] Updates nightly via cron
- [ ] `/robots.txt` configured (allow crawlers; disallow admin routes)
- [ ] Pre-launch metros excluded from sitemap
- [ ] Google Search Console submission verified

### Cross-cutting

- [ ] All Phase 10c code has unit tests; coverage ≥75%
- [ ] Lighthouse score >90 on all marketing pages
- [ ] Real cleaner data renders correctly (no placeholder data)

---

## 3. Database state required

### Existing tables

- Metro config from Phase 5
- `cleaner_profiles` for landing page social proof
- `reviews` for testimonials
- `services` for service definitions

### New migrations (Phase 10c)

```sql
-- Phase 10c migration (minimal — most data already exists)

-- Help articles CMS
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'getting_started', 'booking', 'payments', 'cleaners', 'safety', 'account'
  )),
  body_markdown TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_help_articles_published 
  ON help_articles (category, display_order) WHERE published = TRUE;

-- FAQ items (separate from help articles for Schema.org markup)
CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer_markdown TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_faq_published ON faq_items (category, display_order) WHERE published = TRUE;
```

### Public read RLS

```sql
-- Help articles: public read; admin write
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY help_articles_public_read ON help_articles
  FOR SELECT USING (published = TRUE);

CREATE POLICY help_articles_admin_write ON help_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- FAQ: same pattern
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY faq_public_read ON faq_items
  FOR SELECT USING (published = TRUE);
CREATE POLICY faq_admin_write ON faq_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

---

## 4. Files to create

### App routes (~8 files)

- `/app/[city-slug]/[service-slug]/page.tsx` — WF 41 landing
- `/app/pricing/page.tsx` — WF 42
- `/app/about/page.tsx` — WF 43
- `/app/help/page.tsx` — WF 44 help index
- `/app/help/[article-slug]/page.tsx` — individual help article
- `/app/faq/page.tsx` — WF 45
- `/app/coverage/page.tsx` — WF 46
- `/app/press/page.tsx` — WF 67

### Components — Landing (~6 files)

- `/features/marketing/landing/LandingHero.tsx`
- `/features/marketing/landing/LocalSocialProof.tsx`
- `/features/marketing/landing/TopCleanersSnippet.tsx` — top 3 cards
- `/features/marketing/landing/WhatsIncludedPanel.tsx`
- `/features/marketing/landing/NeighborhoodPills.tsx`
- `/features/marketing/landing/LocalTestimonials.tsx`

### Components — Static pages (~6 files)

- `/features/marketing/pricing/PricingTable.tsx`
- `/features/marketing/about/CompanyStory.tsx`
- `/features/marketing/help/HelpCategoryGrid.tsx`
- `/features/marketing/help/HelpArticleViewer.tsx`
- `/features/marketing/faq/FAQAccordion.tsx`
- `/features/marketing/press/PressKitAssets.tsx`

### Library code (~5 files)

- `/lib/seo/landing_page_generator.ts` — combines metro + service + cleaner data
- `/lib/seo/schema_org_renderer.ts` — generates JSON-LD blocks
- `/lib/seo/sitemap_generator.ts` — auto-builds sitemap
- `/lib/seo/og_meta_renderer.ts` — Open Graph + meta
- `/lib/seo/markdown_renderer.ts` — for help articles

### Server actions (~3 files)

- `/app/sitemap.xml/route.ts` — sitemap generation
- `/app/robots.txt/route.ts` — robots config
- `/app/api/help/articles/route.ts` — help article queries

### Background jobs (1 file)

- `/jobs/landing_page_revalidator.ts` — daily on-demand revalidation

### Database migrations (1 file)

- `migrations/2026XXXXXX_phase_10c_schema.sql`

### Docs (3 files)

- (Phase 10 overview already exists)
- `phase-10c-marketing-pages-seo-spec.md` — this file
- `phase-10c-marketing-pages-seo-walkthrough.md`

---

## 5. Implementation order

### 10c-1 — SEO landing pages (~5 days)

**Day 1 — Static generation infrastructure.** `generateStaticParams`. Test with one metro × service combo.

**Day 2 — Landing page composition.** All sections per WF 41. Real cleaner data wiring.

**Day 3 — Schema.org JSON-LD.** `lib/seo/schema_org_renderer.ts`. Validate via Rich Results Test.

**Day 4 — Open Graph + meta tags + revalidation.** Per-page meta. Daily revalidation cron.

**Day 5 — Edge cases + closeout.** Empty states (new metro with few cleaners), waitlist metros excluded, slow-network performance.

### 10c-2 — Static marketing pages (~4 days)

**Day 6 — Pricing + About.** WF 42 + WF 43 with lawyer-reviewed copy.

**Day 7 — Help center + Help articles.** WF 44 with markdown CMS.

**Day 8 — FAQ + Coverage.** WF 45 with Schema.org. WF 46 metro list with state indicators.

**Day 9 — Press kit + closeout.** WF 67 with downloadable assets. Mobile + a11y verification.

### 10c-3 — Sitemap + SEO (~1 day)

**Day 10 — Sitemap + robots.txt + Search Console.** Auto-generated sitemap. Robots config. Submit to Google Search Console.

---

## 6. Specific gotchas

### Gotcha A — Stale landing pages

**The problem:** Sacramento has 50 cleaners at deploy. 6 months later, 200 cleaners. Landing page shows old social proof.

**The fix:** Daily on-demand revalidation. Page rebuilds with fresh data nightly. Don't use static-forever; use ISR with daily TTL.

### Gotcha B — Schema.org markup invalid

**The problem:** Schema generated programmatically. Edge case (cleaner with 0 reviews) produces invalid JSON-LD. Google rejects.

**The fix:** Validation in `schema_org_renderer.ts`. Before rendering, validate against Schema.org spec. Skip optional fields if data missing.

### Gotcha C — Pre-launch metros leak into sitemap

**The problem:** Sitemap generation pulls all metros. Waitlist Sacramento metros included. Google indexes pages that 404 (no cleaners → empty results).

**The fix:** Sitemap query filters `metro.state = 'active'` only. Verify post-deploy: `curl /sitemap.xml | grep waitlist-metro` returns nothing.

### Gotcha D — Performance regression on landing pages

**The problem:** Real-time queries for cleaner cards = slow. p95 5s. Bad SEO.

**The fix:** Pre-compute cleaner data at static generation. Daily revalidation refreshes. Page itself renders in <2s with no live queries.

### Gotcha E — Help articles use sensitive markdown

**The problem:** Admin writes article: `<script>alert('xss')</script>`. Rendered raw. XSS vulnerability.

**The fix:** Markdown renderer sanitizes via DOMPurify or similar. Whitelist: standard markdown only. No HTML script tags.

### Gotcha F — FAQ Schema.org duplicate questions

**The problem:** Two FAQ items with same question (admin error). Google sees duplicate. Rich snippet rejected.

**The fix:** Database constraint: question unique within category. Admin tooling validates.

### Gotcha G — Open Graph image generation

**The problem:** Each landing page needs unique og:image showing city + service. Manually creating 50+ images = unscalable.

**The fix:** Dynamic OG image generation via Next.js `ImageResponse` API. Templated SVG with city + service inserted. Cached.

### Gotcha H — Robots.txt blocks important pages

**The problem:** Robots disallow `/admin/*` but accidentally also blocks `/about` (regex too broad). Google de-indexes about page.

**The fix:** Explicit allow + disallow lists. Test post-deploy with Google's robots.txt tester.

---

## 7. Testing strategy

### Unit tests
- `lib/seo/schema_org_renderer.ts`: invalid data scenarios produce valid JSON-LD or skip
- `lib/seo/sitemap_generator.ts`: only active metros included
- `lib/seo/markdown_renderer.ts`: XSS sanitization

### Integration tests
- Landing page renders with real cleaner data
- Schema.org validates via Rich Results Test
- Sitemap excludes waitlist metros

### Manual QA
- Lighthouse audit per page
- Google Search Console submission verified
- Mobile responsive testing
- Real device testing

---

## 8. Deployment plan

### Pre-deploy
- [ ] Lawyer-reviewed marketing copy in place
- [ ] Press kit assets prepared
- [ ] Migrations applied
- [ ] Help articles + FAQ items seeded

### Deployment order
1. Migrations
2. Static marketing pages (no SEO complexity)
3. Help articles + FAQ CMS
4. Landing page generator
5. Sitemap
6. Google Search Console submission
7. Soft launch: 30 days monitoring (SEO needs time to surface)

### Rollback
- App code revert if bugs surface
- Don't roll back published help articles

---

## 9. Phase 10c → Phase 10d handoff

Phase 10c output ready for Phase 10d:
- Help articles available for support routing
- FAQ items available for customer support links
- Press kit available for press inquiries

---

## 10. Open questions

1. **Phase 10c launch decision.** Per Lock 9: NOT BLOCKING. Decide pre-build whether to ship full Phase 10c or defer.
2. **OG image generation tool.** Recommend Next.js ImageResponse API. Alternative: pre-generated assets.
3. **Help article CMS UX.** Markdown only v1; rich editor Phase 11+.
4. **Multi-language SEO.** Defer.

---

This spec is the canonical Phase 10c build reference. Walkthrough lives in `phase-10c-marketing-pages-seo-walkthrough.md`.
