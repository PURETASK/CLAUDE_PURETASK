import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Section = { heading: string; body: string };

type TopicContent = {
  title: string;
  description: string;
  sections: Section[];
};

const TOPICS: Record<string, TopicContent> = {
  booking: {
    title: 'Booking & Scheduling',
    description: 'How to book a cleaner, reschedule, cancel, and manage your appointments.',
    sections: [
      {
        heading: 'How do I book a cleaner?',
        body: 'Browse available cleaners on the Find a Cleaner page. Filter by service type, availability, and tier. Select a cleaner and choose your date and time. You\'ll receive a confirmation once they accept.',
      },
      {
        heading: 'Can I request the same cleaner again?',
        body: 'Yes — save any cleaner to your Favorites and rebook them directly from the Favorites page or your Dashboard. Your booking history also shows recent cleaners for one-tap rebooking.',
      },
      {
        heading: 'How do I reschedule a booking?',
        body: 'Open the booking from My Bookings and tap "Reschedule." You can propose a new date and time. Your cleaner has 4 hours to confirm the new slot.',
      },
      {
        heading: 'What is the cancellation policy?',
        body: 'Cancellations more than 48 hours before start time are free. Between 24–48 hours incur a 50% fee. Less than 24 hours incur a 100% fee. Exceptions apply for emergencies — contact support.',
      },
      {
        heading: 'How do I open a dispute?',
        body: 'After a job is marked complete, you have 24 hours to open a dispute. Go to the booking detail and tap "Open dispute." Upload any photos and describe the issue. The cleaner has 24 hours to respond before admin reviews.',
      },
    ],
  },
  payment: {
    title: 'Payment & Pricing',
    description: 'How billing, payouts, tips, and refunds work on PureTask.',
    sections: [
      {
        heading: 'How does payment work?',
        body: 'Your card is authorized at booking but not charged until the job is complete and you approve it. If you don\'t raise a dispute within 24 hours of completion, payment releases automatically.',
      },
      {
        heading: 'What payment methods are accepted?',
        body: 'PureTask accepts all major credit and debit cards via Stripe. Apple Pay and Google Pay are supported on mobile browsers.',
      },
      {
        heading: 'Can I tip my cleaner?',
        body: 'Yes — you\'ll see a tip prompt after approving a completed job. 100% of tips go directly to your cleaner.',
      },
      {
        heading: 'How are prices set?',
        body: 'Each cleaner sets their own hourly rate. Rates vary by tier — Tier 1 cleaners start at $40/hr, Tier 2 at $50/hr, Tier 3 at $65/hr, and Premium cleaners set their own rate. There is a 2-hour minimum per booking.',
      },
      {
        heading: 'How do I get a refund?',
        body: 'Open a dispute within 24 hours of job completion. If resolved in your favor, a refund is processed within 5–7 business days to your original payment method.',
      },
    ],
  },
  photos: {
    title: 'Photos & Privacy',
    description: 'How photos are taken, stored, and deleted — and your privacy rights.',
    sections: [
      {
        heading: 'Why does my cleaner take photos?',
        body: 'Photos document the state of your home before and after each cleaning. They protect both you and your cleaner by providing a visual record if a dispute arises.',
      },
      {
        heading: 'Who can see the photos?',
        body: 'Only you, your cleaner, and PureTask support staff can view booking photos. Photos are never shared publicly or sold.',
      },
      {
        heading: 'How long are photos kept?',
        body: 'All booking photos are automatically deleted 90 days after the job ends. This is a firm policy — there are no exceptions.',
      },
      {
        heading: 'Can I opt out of photos?',
        body: 'No — photo documentation is required for all bookings. It is the primary protection mechanism for both customers and cleaners. Cleaners who skip required photos risk suspension.',
      },
      {
        heading: "What can't cleaners photograph?",
        body: 'Cleaners are prohibited from photographing: personal documents, medications, financial information, people, pets, or any items unrelated to cleaning quality. Report violations to support immediately.',
      },
    ],
  },
  trust: {
    title: 'Trust & Safety',
    description: 'How PureTask verifies cleaners and keeps your home safe.',
    sections: [
      {
        heading: 'How are cleaners verified?',
        body: 'Every cleaner passes a Checkr background check covering national criminal records, sex offender registry, and identity verification before their first job. Checks are renewed every 2 years.',
      },
      {
        heading: 'What is the tier system?',
        body: 'Cleaners earn tiers through completed jobs and reviews. Tier 1 is entry-level. Tier 2 requires 25+ jobs with a 4.5+ rating. Tier 3 requires 100+ jobs with a 4.8+ rating. Premium requires 250+ jobs with a 4.9+ average.',
      },
      {
        heading: 'What happens if a cleaner damages something?',
        body: 'Open a dispute within 24 hours. Provide photos as evidence. PureTask will review and mediate. If damage is confirmed, you will receive a full or partial refund depending on circumstances.',
      },
      {
        heading: 'Can I block a cleaner?',
        body: 'Yes — on any cleaner\'s profile, use the "Block" option in the menu. Blocked cleaners cannot see or respond to your booking requests.',
      },
    ],
  },
  cleaners: {
    title: 'For Cleaners',
    description: 'How earnings, payouts, ratings, and the platform work for cleaning professionals.',
    sections: [
      {
        heading: 'How do I get jobs?',
        body: 'Jobs appear based on your serviced ZIP codes, availability calendar, and tier. Keep your availability up-to-date and respond to requests quickly — fast response rate is factored into your ranking.',
      },
      {
        heading: 'When will I receive my payout?',
        body: 'Payouts are processed weekly on Fridays via Stripe Connect. Funds hit your bank account within 2 business days. Minimum payout is $10.',
      },
      {
        heading: 'How is my score calculated?',
        body: 'Your score is based on: review ratings (40%), reliability/punctuality (25%), photo quality and completion (20%), and response rate (15%). The Score page in your dashboard explains each component.',
      },
      {
        heading: 'What happens if I run late?',
        body: 'Tap "Running Late" in the app before your scheduled start. The customer is notified automatically. Repeated lateness affects your reliability score. 3+ no-shows in 30 days may result in suspension.',
      },
      {
        heading: 'How do I appeal a dispute decision?',
        body: 'After a dispute is resolved, you have 72 hours to file an appeal. Go to the booking, tap "Appeal decision," and provide additional evidence. Admin reviews appeals within 5 business days.',
      },
    ],
  },
  account: {
    title: 'Account & Settings',
    description: 'Managing your profile, notifications, and account security.',
    sections: [
      {
        heading: 'How do I change my email or password?',
        body: 'Go to Settings → Account. You can update your email (requires re-verification) and password from there.',
      },
      {
        heading: 'How do I manage notification preferences?',
        body: 'Go to Settings → Notifications. You can toggle push notifications, SMS alerts, and email digests independently for bookings, payments, and system announcements.',
      },
      {
        heading: 'How do I delete my account?',
        body: 'Go to Settings → Account → Delete account. This action is irreversible. All personal data is purged within 30 days per our privacy policy.',
      },
      {
        heading: 'Can I have both a customer and cleaner account?',
        body: 'Not on the same email address. If you want to use PureTask as both a customer and a cleaner, create separate accounts with different email addresses.',
      },
    ],
  },
};

interface Props {
  params: Promise<{ topic: string }>;
}

export async function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const content = TOPICS[topic];
  if (!content) return {};
  return {
    title: `${content.title} | PureTask Help`,
    description: content.description,
  };
}

export default async function HelpTopicPage({ params }: Props) {
  const { topic } = await params;
  const content = TOPICS[topic];
  if (!content) notFound();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-6">
        <div>
          <Link href="/help" className="text-sm text-brand-600 hover:underline">
            ← Help Center
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{content.title}</h1>
          <p className="mt-2 text-neutral-600">{content.description}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-tier1 divide-y divide-neutral-100">
          {content.sections.map(({ heading, body }) => (
            <div key={heading} className="px-6 py-5">
              <h2 className="font-semibold text-neutral-900">{heading}</h2>
              <p className="mt-2 text-sm text-neutral-600">{body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-tier1">
          <p className="font-semibold text-neutral-900">Still have questions?</p>
          <p className="mt-1 text-sm text-neutral-600">Our support team responds within 2 hours.</p>
          <a
            href="mailto:support@puretask.com"
            className="mt-4 inline-block rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
