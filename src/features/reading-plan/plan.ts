import type { Book } from "@/features/bible/types";

export type ReadingPlanChapter = {
  bookId: string;
  bookName: string;
  chapter: number;
};

export type ReadingPlanDay = {
  day: number;
  chapters: ReadingPlanChapter[];
};

const PLAN_DAYS = 365;

export function buildYearReadingPlan(books: Book[]): ReadingPlanDay[] {
  const flat: ReadingPlanChapter[] = [];
  for (const book of books) {
    for (const chapter of book.chapters) {
      flat.push({
        bookId: book.id,
        bookName: book.name,
        chapter: chapter.chapter,
      });
    }
  }

  if (flat.length === 0) return [];

  const base = Math.floor(flat.length / PLAN_DAYS);
  const extra = flat.length % PLAN_DAYS;

  const plan: ReadingPlanDay[] = [];
  let cursor = 0;

  for (let day = 1; day <= PLAN_DAYS; day += 1) {
    const size = base + (day <= extra ? 1 : 0);
    plan.push({
      day,
      chapters: flat.slice(cursor, cursor + size),
    });
    cursor += size;
  }

  return plan;
}

export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function getTodayPlanEntry(plan: ReadingPlanDay[], date = new Date()) {
  if (!plan.length) return null;
  const day = Math.min(PLAN_DAYS, Math.max(1, getDayOfYear(date)));
  return plan[day - 1] ?? null;
}

export function getReadingPlanPreview(plan: ReadingPlanDay[], count = 5) {
  return plan.slice(0, count).map((entry) => {
    if (!entry.chapters.length) return `${entry.day}일차: -`;

    const first = entry.chapters[0];
    const last = entry.chapters[entry.chapters.length - 1];
    if (
      first.bookId === last.bookId &&
      first.chapter === last.chapter
    ) {
      return `${entry.day}일차: ${first.bookName} ${first.chapter}장`;
    }
    return `${entry.day}일차: ${first.bookName} ${first.chapter}장 ~ ${last.bookName} ${last.chapter}장`;
  });
}
