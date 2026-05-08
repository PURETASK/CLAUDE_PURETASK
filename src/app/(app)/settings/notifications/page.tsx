import Link from 'next/link';

export default function NotificationsSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/settings" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Back to settings
        </Link>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-zinc-500">
          Email notifications are sent automatically for key booking and dispute events.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            label: 'Booking confirmed',
            sub: 'When your cleaner accepts a booking request',
            on: true,
          },
          {
            label: 'Work awaiting approval',
            sub: 'When your cleaner marks the job complete',
            on: true,
          },
          { label: 'Dispute response', sub: 'When your cleaner responds to a dispute', on: true },
          {
            label: 'New booking request (cleaners)',
            sub: 'When a customer requests your services',
            on: true,
          },
          {
            label: 'Payout initiated (cleaners)',
            sub: 'When a payout is sent to your account',
            on: true,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800">{item.label}</p>
              <p className="text-xs text-zinc-400">{item.sub}</p>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              On
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
        <p className="text-xs text-zinc-400">
          Push and SMS notifications will be available in a future update. Email preferences
          granularity coming soon.
        </p>
      </div>
    </div>
  );
}
