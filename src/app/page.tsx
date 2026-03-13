import {
  fetchReadme,
  parseEvents,
  splitByEndDate,
  type DevEvent,
} from '@/lib/crawler';
import { EventList } from '@/components/EventList';
import { LastUpdated } from '@/components/LastUpdated';

export const revalidate = 86400; // 24시간마다 재검증 (매일 업데이트)

function serializeEvent(e: DevEvent) {
  return {
    ...e,
    startDate: e.startDate?.toISOString() ?? null,
    endDate: e.endDate?.toISOString() ?? null,
  };
}

export default async function Home() {
  let ongoing: ReturnType<typeof serializeEvent>[] = [];
  let ended: ReturnType<typeof serializeEvent>[] = [];
  // ISR로 생성된 시점을 기준으로, 서버 시간(UTC)을 그대로 넘기고
  // 클라이언트에서 Asia/Seoul 기준으로 포맷한다.
  const lastUpdated = new Date().toISOString();
  let error = '';

  try {
    const readme = await fetchReadme();
    const events = parseEvents(readme);
    const split = splitByEndDate(events);
    ongoing = split.ongoing.map(serializeEvent);
    ended = split.ended.map(serializeEvent);
  } catch (e) {
    console.error('Failed to fetch events:', e);
    error = '이벤트 정보를 불러오는데 실패했습니다.';
  }

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
          <EventList ongoing={ongoing} ended={ended} />
        )}
      </main>
    </div>
  );
}
