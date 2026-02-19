import { describe, expect, it } from "vitest";
import {
  getCurrentReadStreak,
  getLongestReadStreak,
  getMonthlyReads,
} from "@/features/reading-plan/calendar";
import type { ReadingLog } from "@/features/bible/types";

function log(memberId: string, readAt: string, bookId = "luk", chapter = 1, verse = 1): ReadingLog {
  return { memberId, readAt, bookId, chapter, verse };
}

describe("reading calendar metrics", () => {
  it("calculates current streak based on consecutive daily logs", () => {
    const logs: ReadingLog[] = [
      log("me", "2026-02-17T10:00:00"),
      log("me", "2026-02-18T10:00:00"),
      log("me", "2026-02-19T10:00:00"),
      log("other", "2026-02-19T10:00:00"),
    ];
    const streak = getCurrentReadStreak(logs, "me", new Date(2026, 1, 19, 12, 0, 0));
    expect(streak).toBe(3);
  });

  it("calculates longest streak across gaps", () => {
    const logs: ReadingLog[] = [
      log("me", "2026-02-10T10:00:00.000Z"),
      log("me", "2026-02-11T10:00:00.000Z"),
      log("me", "2026-02-14T10:00:00.000Z"),
      log("me", "2026-02-15T10:00:00.000Z"),
      log("me", "2026-02-16T10:00:00.000Z"),
    ];
    expect(getLongestReadStreak(logs, "me")).toBe(3);
  });

  it("returns full monthly rows", () => {
    const logs: ReadingLog[] = [log("me", "2026-02-01T09:00:00.000Z"), log("me", "2026-02-19T09:00:00.000Z")];
    const rows = getMonthlyReads(logs, "me", new Date("2026-02-19T12:00:00.000Z"));
    expect(rows).toHaveLength(28);
    expect(rows[0].day).toBe(1);
    expect(rows[18].count).toBeGreaterThanOrEqual(1);
  });
});
