import type { GroupMember, ReadingLog } from "@/features/bible/types";

function getStartOfDay(date: Date) {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

export function getRecentDaysBoundary(days: number, now = new Date()) {
  const start = getStartOfDay(now);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

export function calcWeeklyReadCountFromLogs(
  logs: ReadingLog[],
  memberId: string,
  now = new Date(),
) {
  const boundary = getRecentDaysBoundary(7, now).getTime();

  const dedup = new Set<string>();
  for (const log of logs) {
    if (log.memberId !== memberId) continue;
    const readTime = new Date(log.readAt).getTime();
    if (Number.isNaN(readTime) || readTime < boundary) continue;
    dedup.add(`${log.memberId}:${log.bookId}:${log.chapter}`);
  }
  return dedup.size;
}

export function calcWeeklyGroupTotal(
  members: GroupMember[],
  logs: ReadingLog[],
  currentMemberId: string,
  now = new Date(),
) {
  return members.reduce((sum, member) => {
    const hasLogs = logs.some((log) => log.memberId === member.id);
    if (member.id === currentMemberId || hasLogs) {
      return sum + calcWeeklyReadCountFromLogs(logs, member.id, now);
    }
    return sum + member.weeklyReadChapters;
  }, 0);
}

export function getMemberWeeklyRead(
  member: GroupMember,
  logs: ReadingLog[],
  currentMemberId: string,
  now = new Date(),
) {
  const hasLogs = logs.some((log) => log.memberId === member.id);
  if (member.id === currentMemberId || hasLogs) {
    return calcWeeklyReadCountFromLogs(logs, member.id, now);
  }
  return member.weeklyReadChapters;
}

export function getMemberTimeline(logs: ReadingLog[], memberId: string, limit = 5) {
  return logs
    .filter((log) => log.memberId === memberId)
    .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
    .slice(0, limit);
}
