# Stripe Setup Guide (PureTask-specific)

Step-by-step to get Stripe keys and configure Stripe **exactly the way this codebase uses it**. Do the whole thing in **Test mode** first — you can run the full staging E2E without touching live money.

> **Time:** ~30–45 min. **Prereq:** an email address and (for live, later) business details.

---

## 0. What PureTask actually uses

Three Stripe products, wired in `src/lib/stripe/` and `src/features/{booking,payments,cleaner}`:

| Product | What for | Code |
| --- | --- | --- |
| **Payments** (PaymentIntents) | Authorize the customer's card at booking (`capture_method: 'manual'`, `off_session`), capture at approval | `booking/actions.ts`, `booking/lib/settle-approval.ts` |
| **Connect (Express)** | Onboard cleaners as connected accounts; pay them via **transfers** | `lib/stripe/connect.ts`, `payments/actions.ts`, `cron/weekly-payout` |
| **Identity** | Cleaner ID document verification during application | `lib/stripe/identity.ts` |

**Money model — "separate charges and transfers"** (important): the platform charges the customer on the **platform account**, then later **transfers** the cleaner's share to their connected account. It is *not* destination charges. So your platform account holds funds and pays cleaners out via `transfers.create({ destination })` + Express payouts.

The SDK pins the API version (`2026-04-22.dahlia` in `lib/stripe/webhooks.ts`) — you don't set that in the dashboard.

---

## 1. Create the account / open Test mode

1. Go to **https://dashboard.stripe.com** → sign up (or sign in).
2. Top-right, make sure the **Test mode** toggle is **ON** (it says "Test mode"). Everything below is in test mode.
3. You do **not** need to finish business activation to use test mode.

---

## 2. Get the API keys → 2 env vars

1. Dashboard → **Developers → API keys** (or **Home** shows them in test mode).
2. Copy:
   - **Publishable key** — starts `pk_test_…` → env `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** — click *Reveal*, starts `sk_test_…` → env `STRIPE_SECRET_KEY`
3. Keep the secret key secret — server-only, never commit it.

> ⚠️ **Client-side note:** the publishable key is currently a server-only var (`STRIPE_PUBLISHABLE_KEY`). The browser card-entry / Connect / Identity launchers (issues #27–#29) aren't wired yet; when they are, the publishable key must also be exposed to the browser as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. For now, just set `STRIPE_PUBLISHABLE_KEY`.

---

## 3. Enable Connect (Express)

1. Dashboard → **Connect** → **Get started** (test mode).
2. Platform type: choose **Platform or marketplace**.
3. In **Connect → Settings**:
   - Fill the **platform profile** (business name "PureTask", support email, statement descriptor). Test mode is lenient but fill the basics.
   - Under **Capabilities / account types**, ensure **Express** accounts are allowed. The code requests the **`transfers`** capability (`createExpressAccount`), so no card-payments capability is needed on the connected accounts.
4. No extra key needed here — Connect uses the same `STRIPE_SECRET_KEY`. Connected accounts and transfers all run through your platform key.

---

## 4. Enable Identity

1. Dashboard → **Identity** → **Get started / Enable** (test mode).
2. The code creates `verificationSessions` of `type: 'document'` — no extra config required to test. (For live, Identity has its own activation + pricing.)

---

## 5. Configure webhooks → 2 signing secrets

This codebase has **two** webhook routes. Base URL = your deployed URL (e.g. `https://staging.puretask.co`) or your Stripe-CLI tunnel for local (see step 6).

### 5a. Platform + Connect events → `/api/webhooks/stripe-connect`

This single endpoint handles **both** connected-account onboarding **and** the booking payment lifecycle, so it must listen to events on your account **and** on connected accounts.

1. Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://<your-domain>/api/webhooks/stripe-connect`
3. **Listen to:** select **Events on your account** AND check **"Also listen to events on Connected accounts"**.
4. **Select events:**
   - `account.updated`  *(Connect onboarding readiness — code checks `charges_enabled` / `details_submitted`)*
   - `payment_intent.amount_capturable_updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Create it → copy the **Signing secret** (`whsec_…`) → env `STRIPE_CONNECT_WEBHOOK_SECRET`.

### 5b. Identity events → `/api/webhooks/stripe-identity`

1. **Add endpoint** again.
2. **Endpoint URL:** `https://<your-domain>/api/webhooks/stripe-identity`
3. **Select events:**
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.processing`
   - `identity.verification_session.canceled`
4. Create it → copy the **Signing secret** (`whsec_…`) → env `STRIPE_IDENTITY_WEBHOOK_SECRET`.

> Tip: the signing secret is **per-endpoint**. The two secrets are different. Don't reuse one.

---

## 6. Local development (Stripe CLI)

To test webhooks against `localhost`, you forward events with the Stripe CLI instead of a public URL.

1. Install: `https://stripe.com/docs/stripe-cli` (Windows: `scoop install stripe` or download the .exe).
2. `stripe login` (opens browser, authorizes the CLI in test mode).
3. Forward each endpoint in its own terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe-connect
   stripe listen --forward-to localhost:3000/api/webhooks/stripe-identity
   ```
4. Each `stripe listen` prints a **webhook signing secret** (`whsec_…`) — use THAT value locally for the matching `STRIPE_*_WEBHOOK_SECRET` (it differs from the dashboard one).
5. Trigger test events while developing, e.g.:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger account.updated
   ```

---

## 7. Set the env vars

### Local (`.env.local`)
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxx        # from `stripe listen` for the connect endpoint
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_xxx       # from `stripe listen` for the identity endpoint
```
These are validated (as optional) in `src/lib/env.ts`. If Stripe keys are absent, the app degrades gracefully — `isStripeConfigured()` gates the payment paths.

### Vercel (staging/prod)
Project → **Settings → Environment Variables** → add the same four, using the **dashboard** signing secrets from step 5 (not the CLI ones). Scope them to the right environment (Preview/Production).

---

## 8. Verify it's working

1. **Boot check:** `pnpm dev` (or the deploy) starts without env errors.
2. **Integration status:** the app exposes `isStripeConfigured()` / `getIntegrationStatuses()` (`src/lib/integrations.ts`) — Stripe should read as configured.
3. **Test card numbers** (any future expiry, any CVC, any ZIP):
   - `4242 4242 4242 4242` — success
   - `4000 0000 0000 9995` — declined (insufficient funds)
   - `4000 0025 0000 3155` — requires 3D Secure / authentication
4. **Test Connect:** when you reach Express onboarding, Stripe's test flow lets you click through with prefilled test data; use test SSN `000-00-0000`, routing `110000000`, account `000123456789`.
5. **Test Identity:** the test verification flow accepts Stripe's sample document — no real ID needed in test mode.
6. **Test the booking money path** end-to-end against the [E2E checklist](./v1-staging-e2e-checklist.md) section C: book → card authorized (`payment_intent.amount_capturable_updated`) → approve → captured (`payment_intent.succeeded`) → payout transfer.

---

## 9. Where each key lands in the code (reference)

| Env var | Used by |
| --- | --- |
| `STRIPE_SECRET_KEY` | `getStripe()` server client — all charges, transfers, Connect, Identity |
| `STRIPE_PUBLISHABLE_KEY` | client card entry (once launchers wired) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `/api/webhooks/stripe-connect` signature verify |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | `/api/webhooks/stripe-identity` signature verify |

---

## 10. Going live (later — not needed for staging)

1. Complete **business activation** in the dashboard (legal entity, bank account, tax info).
2. Switch the **Test mode** toggle off; re-copy the **live** `sk_live_…` / `pk_live_…` keys.
3. Re-create the **two webhook endpoints** in live mode → new live signing secrets.
4. **Stripe Connect** requires platform review/approval for live (2–4 weeks) — start early.
5. **Identity** + the cleaner-onboarding launchers must be wired (issues #27–#29) before real cleaners can onboard.
6. Update all four env vars in Vercel **Production** with the live values.

---

## TL;DR — the four things to hand back for staging

```
STRIPE_SECRET_KEY=sk_test_…
STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_…   (endpoint: /api/webhooks/stripe-connect — account.updated + payment_intent.* + charge.refunded)
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_…  (endpoint: /api/webhooks/stripe-identity — identity.verification_session.*)
```

Once these are set, ping me and I'll wire the three onboarding launchers (#27/#28/#29) against them.
