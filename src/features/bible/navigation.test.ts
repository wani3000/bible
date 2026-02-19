import { describe, expect, it } from "vitest";
import { paginateVersesByLineBudget } from "@/features/bible/navigation";

describe("paginateVersesByLineBudget", () => {
  it("splits verses by estimated line budget", () => {
    const verses = [
      { verse: 1, text: "짧은 구절입니다." },
      { verse: 2, text: "이 구절은 조금 더 길어서 한 페이지를 더 빨리 채웁니다." },
      { verse: 3, text: "매우 긴 구절입니다. 반복 텍스트를 추가해 줄 예측을 늘립니다. 매우 긴 구절입니다." },
      { verse: 4, text: "다음 구절" },
    ];

    const pages = paginateVersesByLineBudget(verses, 4, 18);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat().map((v) => v.verse)).toEqual([1, 2, 3, 4]);
  });

  it("keeps single huge verse in one page", () => {
    const verses = [{ verse: 1, text: "긴문장 ".repeat(100) }];
    const pages = paginateVersesByLineBudget(verses, 4, 18);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(1);
  });
});
