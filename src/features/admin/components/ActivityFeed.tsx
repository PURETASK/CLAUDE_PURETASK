interface ActivityEvent {
  id: string;
  description: string;
  createdAt: string;
  type: 'booking' | 'admin' | 'dispute';
}

interface Props {
  events: ActivityEvent[];
}

const TYPE_COLORS: Record<ActivityEvent['type'], string> = {
  booking: 'bg-brand-600',
  admin: 'bg-neutral-400',
  dispute: 'bg-error',
};

export const ActivityFeed = ({ events }: Props) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
      <h2 className="mb-4 font-semibold text-neutral-900">Recent Activity</h2>
      {events.length === 0 ? (
        <p className="text-sm text-neutral-400">No recent activity.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              <div
                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${TYPE_COLORS[event.type]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-700">{event.description}</p>
                <p className="text-xs text-neutral-400">
                  {new Date(event.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
