'use client';

import { useState } from 'react';
import { EventList, type EventItem } from '@/components/EventList';
import { LastUpdated } from '@/components/LastUpdated';

export function EventsPageClient({
  ongoing,
  ended,
  initialLastUpdated,
  error,
}: {
  ongoing: EventItem[];
  ended: EventItem[];
  initialLastUpdated: string;
  error?: string;
}) {
  const [lastUpdated, setLastUpdated] = useState<string>(initialLastUpdated);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            개발자 행사
          </h1>
          <LastUpdated value={lastUpdated} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        ) : (
          <EventList
            ongoing={ongoing}
            ended={ended}
            onLastUpdatedChange={(v) => setLastUpdated(v)}
          />
        )}
      </main>
    </div>
  );
}

