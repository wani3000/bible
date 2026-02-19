import type { ReadingLog } from "@/features/bible/types";

export type DailyRead = {
  dateKey: string;
  count: number;
};

export type MonthlyRead = {
  dateKey: string;
  day: number;
  count: number;
};

function getDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayDateKey(now = new Date()) {
  return getDateKey(now);
}

export function getDayOfYearFromDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return 1;
  const date = new Date(y, m - 1, d);
  const start = new Date(y, 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export function getLastNDaysReads(
  logs: ReadingLog[],
  memberId: string,
  days = 7,
  now = new Date(),
): DailyRead[] {
  const map = new Map<string, Set<string>>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - (days - 1 - i));
    map.set(getDateKey(day), new Set<string>());
  }

  for (const log of logs) {
    if (log.memberId !== memberId) continue;
    const dateKey = log.readAt.slice(0, 10);
    const bucket = map.get(dateKey);
    if (!bucket) continue;
    bucket.add(`${log.bookId}:${log.chapter}`);
  }

  return Array.from(map.entries()).map(([dateKey, set]) => ({
    dateKey,
    count: set.size,
  }));
}

function buildDailyReadMap(logs: ReadingLog[], memberId: string) {
  const map = new Map<string, Set<string>>();
  for (const log of logs) {
    if (log.memberId !== memberId) continue;
    const dateKey = log.readAt.slice(0, 10);
    const existing = map.get(dateKey) ?? new Set<string>();
    existing.add(`${log.bookId}:${log.chapter}`);
    map.set(dateKey, existing);
  }
  return map;
}

export function getMonthlyReads(logs: ReadingLog[], memberId: string, now = new Date()): MonthlyRead[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map = buildDailyReadMap(logs, memberId);
  const rows: MonthlyRead[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = getDateKey(new Date(year, month, day));
    rows.push({
      dateKey,
      day,
      count: map.get(dateKey)?.size ?? 0,
    });
  }

  return rows;
}

export function getCurrentReadStreak(logs: ReadingLog[], memberId: string, now = new Date()) {
  const map = buildDailyReadMap(logs, memberId);
  let streak = 0;
  let cursor = new Date(now);

  while (true) {
    const dateKey = getDateKey(cursor);
    if ((map.get(dateKey)?.size ?? 0) <= 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getLongestReadStreak(logs: ReadingLog[], memberId: string) {
  const map = buildDailyReadMap(logs, memberId);
  const keys = Array.from(map.keys()).sort();
  if (!keys.length) return 0;

  let longest = 0;
  let current = 0;
  let previous = "";

  for (const key of keys) {
    if ((map.get(key)?.size ?? 0) <= 0) continue;
    if (!previous) {
      current = 1;
    } else {
      const prevDate = new Date(previous);
      prevDate.setDate(prevDate.getDate() + 1);
      const expected = getDateKey(prevDate);
      current = expected === key ? current + 1 : 1;
    }
    if (current > longest) longest = current;
    previous = key;
  }

  return longest;
}
