import { env } from '@/lib/env';

const BASE_URL = env.NEXT_PUBLIC_SITE_URL;

const layout = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #f4f4f5">
          <span style="font-size:18px;font-weight:700;color:#09090b">PureTask</span>
        </td></tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f4f4f5;background:#fafafa">
          <p style="margin:0;font-size:12px;color:#a1a1aa">PureTask · Northern California's trusted cleaning marketplace</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#09090b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500">${label}</a>`;

const p = (text: string) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3f3f46">${text}</p>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#09090b">${text}</h1>`;

const meta = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;font-size:13px;color:#71717a;width:140px">${label}</td><td style="padding:6px 0;font-size:13px;color:#3f3f46;font-weight:500">${value}</td></tr>`;

const table = (rows: string) =>
  `<table cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;width:100%"><tbody style="padding:12px 16px;display:block">${rows}</tbody></table>`;

// ── Templates ─────────────────────────────────────────────────────────────

export const bookingConfirmedEmail = (opts: {
  customerName: string;
  cleanerName: string;
  bookingNumber: string;
  serviceDate: string;
  bookingId: string;
}) => ({
  subject: `Your cleaning is confirmed — ${opts.bookingNumber}`,
  html: layout(`
    ${h1('Your cleaning is confirmed')}
    ${p(`Hi ${opts.customerName}, your booking has been accepted by ${opts.cleanerName}.`)}
    ${table(
      meta('Booking', opts.bookingNumber) +
        meta('Cleaner', opts.cleanerName) +
        meta('Date', opts.serviceDate),
    )}
    ${btn(`${BASE_URL}/app/bookings/${opts.bookingId}`, 'View booking')}
  `),
});

export const newBookingRequestEmail = (opts: {
  cleanerName: string;
  customerName: string;
  bookingNumber: string;
  serviceDate: string;
  bookingId: string;
}) => ({
  subject: `New booking request — ${opts.bookingNumber}`,
  html: layout(`
    ${h1('You have a new booking request')}
    ${p(`Hi ${opts.cleanerName}, ${opts.customerName} has requested a booking.`)}
    ${table(
      meta('Booking', opts.bookingNumber) +
        meta('Customer', opts.customerName) +
        meta('Date', opts.serviceDate),
    )}
    ${p('You have 4 hours to accept or decline before the request expires.')}
    ${btn(`${BASE_URL}/app/cleaner/bookings/${opts.bookingId}`, 'Review request')}
  `),
});

export const awaitingApprovalEmail = (opts: {
  customerName: string;
  cleanerName: string;
  bookingNumber: string;
  bookingId: string;
}) => ({
  subject: `Your cleaner finished — please approve — ${opts.bookingNumber}`,
  html: layout(`
    ${h1('Your cleaning is complete')}
    ${p(`Hi ${opts.customerName}, ${opts.cleanerName} has marked the job complete.`)}
    ${p('Please review the work and approve it. You have 24 hours before payment is released automatically.')}
    ${table(meta('Booking', opts.bookingNumber) + meta('Cleaner', opts.cleanerName))}
    ${btn(`${BASE_URL}/app/bookings/${opts.bookingId}`, 'Approve work')}
  `),
});

export const disputeFiledEmail = (opts: {
  cleanerName: string;
  customerName: string;
  bookingNumber: string;
  issueCategory: string;
  disputeBookingId: string;
}) => ({
  subject: `Customer filed a dispute — ${opts.bookingNumber}`,
  html: layout(`
    ${h1('A customer filed a dispute')}
    ${p(`Hi ${opts.cleanerName}, ${opts.customerName} has opened a dispute on booking ${opts.bookingNumber}.`)}
    ${table(
      meta('Issue', opts.issueCategory) +
        meta('Booking', opts.bookingNumber) +
        meta('Customer', opts.customerName),
    )}
    ${p('Please respond within 48 hours. You can offer a re-clean, partial refund, or stand by your work.')}
    ${btn(`${BASE_URL}/app/cleaner/bookings/${opts.disputeBookingId}/dispute`, 'Respond to dispute')}
  `),
});

export const disputeResponseEmail = (opts: {
  customerName: string;
  cleanerName: string;
  bookingNumber: string;
  responseType: string;
  bookingId: string;
}) => ({
  subject: `Your cleaner responded to your dispute — ${opts.bookingNumber}`,
  html: layout(`
    ${h1('Your cleaner responded')}
    ${p(`Hi ${opts.customerName}, ${opts.cleanerName} has responded to your dispute.`)}
    ${table(
      meta('Response', opts.responseType) +
        meta('Booking', opts.bookingNumber) +
        meta('Cleaner', opts.cleanerName),
    )}
    ${p('You can accept their resolution or escalate to our team for review.')}
    ${btn(`${BASE_URL}/app/bookings/${opts.bookingId}/dispute`, 'Review response')}
  `),
});

export const payoutInitiatedEmail = (opts: {
  cleanerName: string;
  amountFormatted: string;
  isInstant: boolean;
}) => ({
  subject: `Your ${opts.isInstant ? 'instant ' : ''}payout is on its way`,
  html: layout(`
    ${h1('Your payout is on the way')}
    ${p(`Hi ${opts.cleanerName}, your ${opts.isInstant ? 'instant ' : ''}payout of ${opts.amountFormatted} has been initiated.`)}
    ${p(opts.isInstant ? 'Instant payouts typically arrive within minutes.' : 'Standard payouts arrive within 2–5 business days.')}
    ${btn(`${BASE_URL}/app/cleaner/earnings`, 'View earnings')}
  `),
});
