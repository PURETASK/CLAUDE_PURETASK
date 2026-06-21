# Notification Matrix

What each user is notified about, on which channels, from which trigger. Source of truth for the notification system.

## Architecture

- **Catalog:** `notification_type` enum (63 values) in `0006_b6_platform_operations.sql`.
- **Channels:** in-app inbox (`notifications` table) · web push (VAPID) · SMS (Twilio) · email (Resend). Push/SMS respect each user's `notification_preferences`; missing providers degrade silently.
- **Dispatcher:** [`src/features/notifications/dispatch.ts`](../src/features/notifications/dispatch.ts)
  - `notify({ recipientUserId, type, title, body, deepLink?, email? })` — one call → in-app + push + SMS + (optional) email. Channel failures are caught so a notification never breaks the triggering action.
  - `notifyBookingParty(bookingId, 'customer'|'cleaner', …)` — resolves the party's user_id from the booking.
  - `notifyAdmins(type, title, body, …)` — fans out to every active `admin_profiles` row.
- **Inbox UI:** `/app/notifications` (+ unread count, mark-read); prefs at `/app/settings/notifications`.

> **Enum note:** the catalog has no admin-specific values, so admin alerts reuse the closest valid enum (`announcement`, `dispute_filed`). The title/body carry the meaning.

---

## Wired now

### Customer

| Situation                            | Type                       | Channels                | Trigger                                         |
| ------------------------------------ | -------------------------- | ----------------------- | ----------------------------------------------- |
| Cleaner accepted your booking        | `booking_request_accepted` | in-app/push/SMS + email | `acceptBookingAction`                           |
| Cleaner declined your request        | `booking_request_declined` | in-app/push/SMS         | `declineBookingAction`                          |
| Cleaner on the way                   | `cleaner_on_the_way`       | in-app/push/SMS         | `startTransitAction`                            |
| Cleaner arrived                      | `cleaner_arrived`          | in-app/push/SMS         | `markArrivedAction`                             |
| Cleaning complete — review & approve | `cleaning_complete`        | in-app/push/SMS         | `clockOutAction`                                |
| Payment processed                    | `payment_captured`         | in-app/push/SMS         | `settleApprovedBooking` (manual + auto-approve) |

### Cleaner

| Situation                        | Type                            | Channels                | Trigger                 |
| -------------------------------- | ------------------------------- | ----------------------- | ----------------------- |
| New booking request              | `booking_request_sent`          | in-app/push/SMS + email | `createBookingAction`   |
| Customer cancelled               | `booking_cancelled_by_customer` | in-app/push/SMS         | `cancelBookingAction`   |
| Job approved — added to earnings | `job_approved`                  | in-app/push/SMS         | `settleApprovedBooking` |
| New review                       | `review_received`               | in-app/push/SMS         | `submitReviewAction`    |
| You received a tip               | `tip_received`                  | in-app/push/SMS         | `addTipAction`          |
| A dispute was filed              | `dispute_filed`                 | in-app/push/SMS + email | `fileDisputeAction`     |
| Payout initiated                 | `payout_initiated`              | email                   | instant/weekly payout   |

### Admin

| Situation                           | Type                      | Channels        | Trigger                           |
| ----------------------------------- | ------------------------- | --------------- | --------------------------------- |
| New cleaner application             | `announcement`            | in-app/push/SMS | `submitApplicationAction`         |
| New dispute filed                   | `dispute_filed`           | in-app/push/SMS | `fileDisputeAction`               |
| New / urgent support ticket         | `announcement`            | in-app/push/SMS | `createTicketAction`              |
| Support ticket reply (to submitter) | `support_ticket_response` | in-app/push/SMS | `adminReplyAction` (pre-existing) |

Also pre-existing emails kept as-is: `awaiting_approval` (mark-complete).

### Wave 2 (added)

| Situation                         | Type                        | Recipient | Channels        | Trigger                          |
| --------------------------------- | --------------------------- | --------- | --------------- | -------------------------------- |
| Cleaner responded to your dispute | `dispute_response_received` | customer  | in-app/push/SMS | `cleanerRespondAction`           |
| Dispute resolved (mutual)         | `dispute_resolved`          | cleaner   | in-app/push/SMS | `customerAcceptResolutionAction` |
| Dispute escalated to mediation    | `dispute_escalated`         | cleaner + **admins** | in-app/push/SMS | `customerRejectResolutionAction` |
| Dispute resolved by admin         | `dispute_resolved`          | both      | in-app/push/SMS | `adminResolveAction`             |
| Refund issued (dispute)           | `refund_issued`             | customer  | in-app/push/SMS | `adminResolveAction`             |
| Refund issued (cancellation)      | `refund_issued`             | customer  | in-app/push/SMS | `cancelBookingAction`            |
| Payout on the way                 | `payout_initiated`          | cleaner   | in-app/push/SMS + email | `requestInstantPayoutAction` |
| Password changed                  | `password_changed`          | user      | in-app/push/SMS | `resetPasswordAction`            |

---

## Deferred (catalog types not yet wired)

Tracked for the next notification wave — infrastructure supports them, just need trigger-site calls:

- **Booking:** `booking_imminent_reminder` (T-24h cron), `cleaner_running_late`, `cleaner_eta_update`, reschedule (`reschedule_request_received/accepted/declined`).
- **Money:** `charge_failed`, `payout_paid/failed`, weekly-cron `payout_initiated` (instant-payout path is wired; the weekly cron still email-only).
- **Reviews/loyalty:** `review_prompt` (24h nudge), `rebook_nudge`, `tip_thank_you_prompt`.
- **Disputes:** `dispute_in_mediation`.
- **Reliability:** `score_increased/decreased`, `tier_promoted/demoted`, `badge_earned`, `specialty_earned`, probation/suspension/appeal.
- **Recurring:** `recurring_setup_confirmed`, `recurring_next_in_24hr`, `recurring_ending_in_14_days`.
- **Onboarding/trust:** `background_check_complete`, `insurance_*`, `account_verified`.
- **Security:** `new_login_detected`.

Most remaining items fire from crons or the reliability engine — each is a one-line `notify()` / `notifyBookingParty()` at the trigger site.

---

## Channel reach (what actually sends today)

| Channel      | Status                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- |
| In-app inbox | ✅ live for every wired event above                                                             |
| Web push     | ✅ if user enabled + `VAPID_*` set                                                              |
| SMS          | ✅ if user enabled + `TWILIO_*` set                                                             |
| Email        | ✅ for the 4 templates (booking confirmed/requested, dispute filed, payout); others in-app only |
