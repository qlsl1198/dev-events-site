import {
  fetchReadme,
  parseEvents,
  splitByEndDate,
  type DevEvent,
} from '@/lib/crawler';

function serializeEvent(e: DevEvent) {
  return {
    ...e,
    startDate: e.startDate?.toISOString() ?? null,
    endDate: e.endDate?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const readme = await fetchReadme();
    const events = parseEvents(readme);
    const { ongoing, ended } = splitByEndDate(events);

    return Response.json({
      ongoing: ongoing.map(serializeEvent),
      ended: ended.map(serializeEvent),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Events API error:', error);
    return Response.json(
      { error: '이벤트 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
