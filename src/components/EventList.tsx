'use client';

import { useState } from 'react';

/** Serializable event (Date -> string) for client */
export interface EventItem {
  id: string;
  title: string;
  url: string;
  categories: string[];
  host: string;
  dateType: string;
  dateRaw: string;
  startDate?: string | null;
  endDate?: string | null;
  monthSection: string;
}

interface EventListProps {
  ongoing: EventItem[];
  ended: EventItem[];
  onLastUpdatedChange?: (value: string) => void;
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500/50"
    >
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
        {event.title}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        주최: {event.host}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.categories.map((cat) => (
          <span
            key={cat}
            className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            {cat}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {event.dateType}: {event.dateRaw}
      </p>
    </a>
  );
}

function EventCardEnded({ event }: { event: EventItem }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 opacity-80 transition-all hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 line-through">
        {event.title}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        주최: {event.host}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.categories.map((cat) => (
          <span
            key={cat}
            className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
          >
            {cat}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {event.dateType}: {event.dateRaw}
      </p>
      <span className="mt-2 block text-xs font-medium text-zinc-400">
        종료됨
      </span>
    </a>
  );
}

export function EventList({
  ongoing,
  ended,
  onLastUpdatedChange,
}: EventListProps) {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'ended'>('ongoing');
  const [ongoingState, setOngoingState] = useState<EventItem[]>(ongoing);
  const [endedState, setEndedState] = useState<EventItem[]>(ended);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const res = await fetch('/api/events', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data: {
        ongoing: EventItem[];
        ended: EventItem[];
        lastUpdated: string;
      } = await res.json();

      setOngoingState(data.ongoing);
      setEndedState(data.ended);
      setLastUpdated(data.lastUpdated);
      onLastUpdatedChange?.(data.lastUpdated);
    } catch {
      setRefreshError('업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'ongoing'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
            }`}
          >
            진행 중 ({ongoingState.length})
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'ended'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
            }`}
          >
            종료됨 ({endedState.length})
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isRefreshing
              ? 'cursor-not-allowed bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
          }`}
        >
          {isRefreshing ? '업데이트 중...' : '업데이트'}
        </button>
      </div>

      {refreshError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {refreshError}
        </div>
      ) : null}

      {lastUpdated ? (
        <p className="mb-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          마지막 업데이트: {new Date(lastUpdated).toLocaleString('ko-KR')}
        </p>
      ) : null}

      {activeTab === 'ongoing' ? (
        <div className="space-y-4">
          {ongoingState.length === 0 ? (
            <p className="py-12 text-center text-zinc-500 dark:text-zinc-400">
              현재 진행 중인 이벤트가 없습니다.
            </p>
          ) : (
            ongoingState.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {endedState.length === 0 ? (
            <p className="py-12 text-center text-zinc-500 dark:text-zinc-400">
              종료된 이벤트가 없습니다.
            </p>
          ) : (
            endedState.map((event) => (
              <EventCardEnded key={event.id} event={event} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
