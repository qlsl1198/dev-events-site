import {
  fetchReadme,
  parseEvents,
  splitByEndDate,
  type DevEvent,
} from '@/lib/crawler';
import { EventsPageClient } from '@/components/EventsPageClient';

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
    <EventsPageClient
      ongoing={ongoing}
      ended={ended}
      initialLastUpdated={lastUpdated}
      error={error}
    />
  );
}
