import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — PureTask',
  description:
    'Answers to common questions about booking cleaners, payments, disputes, and cancellations on PureTask.',
};

const FAQS = [
  {
    section: 'Booking',
    items: [
      {
        q: 'How do I book a cleaner?',
        a: 'Create a free account, add your service address, then browse cleaners in your area. Select a cleaner, choose a service type and time slot, add a payment method, and confirm. Your cleaner has 4 hours to accept.',
      },
      {
        q: "What if my cleaner doesn't respond?",
        a: 'Booking requests expire after 4 hours without a response. At that point, PureTask automatically offers the booking to the next-best matched cleaner for your ZIP code.',
      },
      {
        q: 'Can I cancel a booking?',
        a: 'Yes — before the cleaner accepts, you can cancel for free. After acceptance, cancellation policies apply (coming soon). Your card is never charged until you approve completed work.',
      },
      {
        q: 'Is my payment method charged immediately?',
        a: 'No. Your card is authorized (a hold is placed) when you book, but the charge is only captured after you review and approve the completed work.',
      },
    ],
  },
  {
    section: 'Trust & Safety',
    items: [
      {
        q: 'How are cleaners vetted?',
        a: 'Every PureTask cleaner must pass a Checkr background check and Stripe Identity verification before being approved. They also complete photo etiquette training.',
      },
      {
        q: 'What is the tier system?',
        a: 'Cleaners are assigned one of four tiers — Rising Pro, Proven Specialist, Top Performer, or All-Star Expert — based on a nightly reliability score. Tier determines their maximum hourly rate range and platform commission.',
      },
      {
        q: 'What is photo proof?',
        a: 'Cleaners are required to upload before/after photos for every room during the job. The first photo must be taken within 15 minutes of clock-in, and all required room photos must be uploaded before they can clock out.',
      },
      {
        q: 'Is my home address shared with cleaners before the job?',
        a: 'Your full entry instructions are only revealed to cleaners 2 hours before the scheduled start time, when they tap "On my way." This is a deliberate privacy decision.',
      },
    ],
  },
  {
    section: 'Disputes',
    items: [
      {
        q: "What if I'm not happy with the cleaning?",
        a: 'You have a 48-hour window after approving the work to file a dispute. Describe the issue, select your desired outcome, and your cleaner receives a notification to respond within 48 hours.',
      },
      {
        q: 'What are the dispute resolution options?',
        a: "Your cleaner can offer a free re-clean, a partial refund, or stand by their work. If you don't agree, you can escalate to PureTask admin for mediation.",
      },
      {
        q: 'What if the dispute goes to admin?',
        a: 'An admin reviews the full photo evidence, dispute thread, and booking history and issues a binding resolution — no refund, partial refund, or full refund. Refund execution is handled by PureTask.',
      },
    ],
  },
  {
    section: 'For Cleaners',
    items: [
      {
        q: 'How do payouts work?',
        a: 'Earnings from approved bookings are paid out every Friday at noon Pacific for free. You can also request an instant payout any day for a 5% fee.',
      },
      {
        q: 'Can I lose my tier?',
        a: "Yes. Your reliability score must stay below a tier's threshold for 14 consecutive days before a tier drop is triggered. You receive a notification and a 48-hour appeal window before any demotion.",
      },
      {
        q: 'What is the 12% intro commission?',
        a: 'New cleaners (Rising Pros) pay only 12% commission for their first 6 completed jobs — a recruiting incentive. After 6 jobs, the standard Rising Pro rate of 15% applies.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">Frequently asked questions</h1>
          <p className="text-neutral-500">Everything you need to know before your first booking.</p>
        </div>

        <div className="space-y-14">
          {FAQS.map((section) => (
            <section key={section.section}>
              <h2 className="mb-6 text-xl font-bold text-neutral-900">{section.section}</h2>
              <div className="divide-y divide-neutral-100">
                {section.items.map((item) => (
                  <div key={item.q} className="py-5">
                    <p className="mb-2 font-semibold text-neutral-900">{item.q}</p>
                    <p className="text-sm leading-relaxed text-neutral-500">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
