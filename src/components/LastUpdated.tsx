'use client';

interface LastUpdatedProps {
  value: string; // ISO 문자열
}

export function LastUpdated({ value }: LastUpdatedProps) {
  const date = new Date(value);

  const formatted = date.toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  });

  return (
    <time
      dateTime={value}
      className="text-sm text-zinc-500 dark:text-zinc-400"
    >
      {formatted} 갱신
    </time>
  );
}

