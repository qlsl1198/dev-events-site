import fs from 'fs';
import path from 'path';

const README_URL =
  'https://raw.githubusercontent.com/brave-people/Dev-Event/master/README.md';

export interface DevEvent {
  id: string;
  title: string;
  url: string;
  categories: string[];
  host: string;
  dateType: '접수' | '일시';
  dateRaw: string;
  startDate: Date | null;
  endDate: Date | null;
  monthSection: string;
}

/**
 * Try to load a structured JSON snapshot from the local data/ folder (if present).
 * Returns null if no structured file is found.
 */
export async function fetchStructured(): Promise<DevEvent[] | null> {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) return null;
    const files = fs.readdirSync(dataDir).filter((f) => /dev-event-.*structured\.json$/i.test(f));
    if (files.length === 0) return null;
    // pick the newest file by mtime
    const fullPaths = files.map((f) => path.join(dataDir, f));
    fullPaths.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const latest = fullPaths[0];
    const raw = fs.readFileSync(latest, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const eventsRaw = (parsed as { events?: unknown }).events;
    if (!Array.isArray(eventsRaw)) return null;

    const asStringArray = (v: unknown): string[] => {
      if (!Array.isArray(v)) return [];
      return v.filter((x): x is string => typeof x === 'string');
    };

    // map to DevEvent (convert date strings to Date)
    const events: DevEvent[] = eventsRaw.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        return {
          id: `structured-${idx}`,
          title: '',
          url: '',
          categories: [],
          host: '',
          dateType: '접수',
          dateRaw: '',
          startDate: null,
          endDate: null,
          monthSection: '',
        };
      }

      const e = item as Record<string, unknown>;

      const id = typeof e.id === 'string' ? e.id : `structured-${idx}`;
      const title =
        typeof e.title === 'string'
          ? e.title
          : typeof e.name === 'string'
            ? e.name
            : '';
      const url =
        typeof e.url === 'string' ? e.url : typeof e.link === 'string' ? e.link : '';

      const categories = asStringArray(e.categories) || asStringArray(e.tags);
      const host = typeof e.host === 'string' ? e.host : '';

      const dateTypeCandidate = e.dateType;
      const dateType =
        dateTypeCandidate === '접수' || dateTypeCandidate === '일시'
          ? dateTypeCandidate
          : '접수';

      const dateRaw =
        typeof e.dateRaw === 'string'
          ? e.dateRaw
          : typeof e.date_raw === 'string'
            ? e.date_raw
            : '';

      const startDate =
        typeof e.startDate === 'string' && e.startDate
          ? new Date(e.startDate)
          : null;
      const endDate =
        typeof e.endDate === 'string' && e.endDate ? new Date(e.endDate) : null;

      const monthSection =
        typeof e.monthSection === 'string' ? e.monthSection : '';

      return {
        id,
        title,
        url,
        categories,
        host,
        dateType,
        dateRaw,
        startDate,
        endDate,
        monthSection,
      };
    });
    return events;
  } catch (err) {
    console.error('fetchStructured error', err);
    return null;
  }
}

/**
 * Fetch README content from GitHub
 */
export async function fetchReadme(options?: { force?: boolean }): Promise<string> {
  const force = options?.force ?? false;
  const res = await fetch(README_URL, {
    // `force: true`인 경우 캐시를 완전히 우회해서 최신 데이터를 가져옵니다.
    cache: force ? 'no-store' : undefined,
    next: { revalidate: force ? 0 : 3600 }, // Revalidate every hour for daily updates
    headers: {
      'User-Agent': 'Dev-Event-Tracker/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch README: ${res.status}`);
  }

  return res.text();
}

/**
 * Parse Korean date format: "MM. DD(요일) ~ MM. DD(요일)" or "MM. DD(요일) ~ MM. DD(요일) HH:MM"
 * Returns end date for comparison (events are "ended" when end date < today)
 */
function parseKoreanDate(
  dateStr: string,
  yearPrefix: number
): { start: Date | null; end: Date | null } {
  // Match: MM. DD(요일) ~ MM. DD(요일) or MM. DD(요일) ~ MM. DD(요일) HH:MM
  const rangeMatch = dateStr.match(
    /(\d{1,2})\.\s*(\d{1,2})\([^)]+\)\s*~\s*(\d{1,2})\.\s*(\d{1,2})\([^)]+\)(?:\s+(\d{1,2}):(\d{2}))?/
  );

  if (!rangeMatch) return { start: null, end: null };

  const [, startMonth, startDay, endMonth, endDay, endHour, endMin] =
    rangeMatch;

  const year = 2000 + yearPrefix; // 26 -> 2026
  const sm = parseInt(startMonth, 10);
  const em = parseInt(endMonth, 10);
  // Handle year wrap-around (e.g. 12. 20 ~ 01. 15)
  const endYear = em < sm ? year + 1 : year;

  const startDate = new Date(year, sm - 1, parseInt(startDay, 10));
  const endDate = new Date(
    endYear,
    em - 1,
    parseInt(endDay, 10),
    endHour ? parseInt(endHour, 10) : 23,
    endMin ? parseInt(endMin, 10) : 59,
    59
  );

  return { start: startDate, end: endDate };
}

/**
 * Parse markdown and extract events
 */
export function parseEvents(readme: string): DevEvent[] {
  const events: DevEvent[] = [];
  const lines = readme.split('\n');

  let currentMonthSection = '';
  let currentEvent: Partial<DevEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match ## `YY년 MM월` section headers
    const monthMatch = line.match(/^##\s*`(\d{2})년\s*(\d{2})월`/);
    if (monthMatch) {
      currentMonthSection = `${monthMatch[1]}년 ${monthMatch[2]}월`;
      continue;
    }

    // Stop at "지난 행사 기록" or "----------------"
    if (
      line.includes('지난 행사 기록') ||
      line.trim() === '----------------' ||
      line.includes('이전 행사 모음')
    ) {
      break;
    }

    // Match event title: - __[Title](URL)__ (allow leading space)
    const titleMatch = line.match(/^\s*-\s*__\[([^\]]+)\]\((https?:\/\/[^)]+)\)__/);
    if (titleMatch) {
      if (currentEvent && currentEvent.title) {
        events.push(currentEvent as DevEvent);
      }
      currentEvent = {
        id: `${currentMonthSection}-${titleMatch[1].slice(0, 30)}-${events.length}`,
        title: titleMatch[1],
        url: titleMatch[2],
        categories: [],
        host: '',
        dateType: '접수',
        dateRaw: '',
        startDate: null,
        endDate: null,
        monthSection: currentMonthSection,
      };
      continue;
    }

    if (currentEvent) {
      // Match 분류 (categories)
      const categoryMatch = line.match(/^\s*-\s*분류:\s*`([^`]+)`/);
      if (categoryMatch) {
        currentEvent.categories = categoryMatch[1]
          .split(',')
          .map((c) => c.trim());
        continue;
      }

      // Match 주최 (host)
      const hostMatch = line.match(/^\s*-\s*주최:\s*(.+)/);
      if (hostMatch) {
        currentEvent.host = hostMatch[1].trim();
        continue;
      }

      // Match 접수 or 일시 (date)
      const dateMatch = line.match(/^\s*-\s*(접수|일시):\s*(.+)/);
      if (dateMatch) {
        currentEvent.dateType = dateMatch[1] as '접수' | '일시';
        currentEvent.dateRaw = dateMatch[2].trim();

        const yearPrefix = parseInt(currentMonthSection.slice(0, 2), 10);
        const { start, end } = parseKoreanDate(
          currentEvent.dateRaw,
          yearPrefix
        );
        currentEvent.startDate = start;
        currentEvent.endDate = end;
        continue;
      }
    }
  }

  if (currentEvent && currentEvent.title) {
    events.push(currentEvent as DevEvent);
  }

  return events;
}

/**
 * Split events into ongoing and ended based on today's date
 */
export function splitByEndDate(events: DevEvent[]): {
  ongoing: DevEvent[];
  ended: DevEvent[];
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ongoing: DevEvent[] = [];
  const ended: DevEvent[] = [];

  for (const event of events) {
    // If no end date parsed, treat as ongoing
    if (!event.endDate) {
      ongoing.push(event);
    } else {
      const endDate = new Date(event.endDate);
      endDate.setHours(23, 59, 59, 999);

      if (endDate < today) {
        ended.push(event);
      } else {
        ongoing.push(event);
      }
    }
  }

  return { ongoing, ended };
}
