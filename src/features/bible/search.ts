import type { Book } from "@/features/bible/types";

export type BibleSearchResult = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  preview: string;
  matchType: "reference" | "exact_phrase" | "partial";
};

type SearchRow = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  normalizedText: string;
};

export type BibleSearchIndex = {
  rows: SearchRow[];
};

const BOOK_ALIASES: Record<string, string> = {
  창: "gen", 창세: "gen", 창세기: "gen",
  출: "exo", 출애: "exo", 출애굽기: "exo",
  레: "lev", 레위기: "lev",
  민: "num", 민수기: "num",
  신: "deu", 신명기: "deu",
  수: "jos", 여호수아: "jos",
  삿: "jdg", 사사기: "jdg",
  룻: "rut", 룻기: "rut",
  삼상: "1sa", 사무엘상: "1sa",
  삼하: "2sa", 사무엘하: "2sa",
  왕상: "1ki", 열왕기상: "1ki",
  왕하: "2ki", 열왕기하: "2ki",
  대상: "1ch", 역대상: "1ch",
  대하: "2ch", 역대하: "2ch",
  스: "ezr", 에스라: "ezr",
  느: "neh", 느헤미야: "neh",
  에: "est", 에스더: "est",
  욥: "job", 욥기: "job",
  시: "psa", 시편: "psa",
  잠: "pro", 잠언: "pro",
  전: "ecc", 전도서: "ecc",
  아: "sng", 아가: "sng",
  사: "isa", 이사야: "isa",
  렘: "jer", 예레미야: "jer",
  애: "lam", 예레미야애가: "lam",
  겔: "ezk", 에스겔: "ezk",
  단: "dan", 다니엘: "dan",
  호: "hos", 호세아: "hos",
  욜: "jol", 요엘: "jol",
  암: "amo", 아모스: "amo",
  옵: "oba", 오바댜: "oba",
  욘: "jon", 요나: "jon",
  미: "mic", 미가: "mic",
  나: "nam", 나훔: "nam",
  합: "hab", 하박국: "hab",
  습: "zep", 스바냐: "zep",
  학: "hag", 학개: "hag",
  슥: "zec", 스가랴: "zec",
  말: "mal", 말라기: "mal",
  마: "mat", 마태: "mat", 마태복음: "mat",
  막: "mrk", 마가: "mrk", 마가복음: "mrk",
  눅: "luk", 누가: "luk", 누가복음: "luk",
  요: "jhn", 요한복음: "jhn",
  행: "act", 사도행전: "act",
  롬: "rom", 로마서: "rom",
  고전: "1co", 고린도전서: "1co",
  고후: "2co", 고린도후서: "2co",
  갈: "gal", 갈라디아서: "gal",
  엡: "eph", 에베소서: "eph",
  빌: "php", 빌립보서: "php",
  골: "col", 골로새서: "col",
  살전: "1th", 데살로니가전서: "1th",
  살후: "2th", 데살로니가후서: "2th",
  딤전: "1ti", 디모데전서: "1ti",
  딤후: "2ti", 디모데후서: "2ti",
  딛: "tit", 디도서: "tit",
  몬: "phm", 빌레몬서: "phm",
  히: "heb", 히브리서: "heb",
  약: "jas", 야고보서: "jas",
  벧전: "1pe", 베드로전서: "1pe",
  벧후: "2pe", 베드로후서: "2pe",
  요일: "1jn", 요한일서: "1jn",
  요이: "2jn", 요한이서: "2jn",
  요삼: "3jn", 요한삼서: "3jn",
  유: "jud", 유다서: "jud",
  계: "rev", 요한계시록: "rev",
};

function normalize(value: string) {
  return value.replace(/[\s\-_.]/g, "").toLowerCase();
}

function buildPreview(text: string, query: string, span = 16) {
  const q = query.trim();
  if (!q) return text;
  const index = text.indexOf(q);
  if (index < 0) return text;
  const start = Math.max(0, index - span);
  const end = Math.min(text.length, index + q.length + span);
  const head = start > 0 ? "..." : "";
  const tail = end < text.length ? "..." : "";
  return `${head}${text.slice(start, end)}${tail}`;
}

function findBookByName(input: string, books: Book[]) {
  const normalized = normalize(input);
  const aliasId = BOOK_ALIASES[normalized];
  if (aliasId) {
    const byAlias = books.find((book) => book.id === aliasId);
    if (byAlias) return byAlias;
  }
  return books.find((book) => normalize(book.name).includes(normalized));
}

export function createSearchIndex(books: Book[]): BibleSearchIndex {
  const rows: SearchRow[] = [];
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        rows.push({
          bookId: book.id,
          bookName: book.name,
          chapter: chapter.chapter,
          verse: verse.verse,
          text: verse.text,
          normalizedText: normalize(verse.text),
        });
      }
    }
  }
  return { rows };
}

export function searchBible(
  query: string,
  books: Book[],
  limit = 20,
  index?: BibleSearchIndex,
): BibleSearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const refMatch = q.match(/^(.+?)\s*(\d+)(?:\s*[:장]\s*(\d+))?$/);
  if (refMatch) {
    const [, rawBook, rawChapter, rawVerse] = refMatch;
    const book = findBookByName(rawBook, books);
    if (!book) return [];

    const chapterNum = Number(rawChapter);
    const chapter = book.chapters.find((c) => c.chapter === chapterNum);
    if (!chapter) return [];

    if (rawVerse) {
      const verseNum = Number(rawVerse);
      const verse = chapter.verses.find((v) => v.verse === verseNum);
      if (!verse) return [];
      return [{
        bookId: book.id,
        bookName: book.name,
        chapter: chapterNum,
        verse: verseNum,
        text: verse.text,
        preview: verse.text,
        matchType: "reference",
      }];
    }

    return chapter.verses.slice(0, 5).map((verse) => ({
      bookId: book.id,
      bookName: book.name,
      chapter: chapterNum,
      verse: verse.verse,
      text: verse.text,
      preview: verse.text,
      matchType: "reference",
    }));
  }

  const normalizedQuery = normalize(q);
  const scoreRow = (row: SearchRow) => {
    if (row.normalizedText === normalizedQuery) return 300;
    if (row.text.includes(q)) return 240;
    if (row.normalizedText.startsWith(normalizedQuery)) return 200;
    if (row.normalizedText.includes(normalizedQuery)) return 120;
    return -1;
  };

  const toResult = (row: SearchRow, score: number): BibleSearchResult => ({
    bookId: row.bookId,
    bookName: row.bookName,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    preview: buildPreview(row.text, q),
    matchType: score >= 240 ? "exact_phrase" : "partial",
  });

  const source = index?.rows;
  if (source) {
    const ranked: Array<{ row: SearchRow; score: number }> = [];
    for (const row of source) {
      const score = scoreRow(row);
      if (score < 0) continue;
      ranked.push({ row, score });
    }
    ranked.sort((a, b) => b.score - a.score || a.row.chapter - b.row.chapter || a.row.verse - b.row.verse);
    return ranked.slice(0, limit).map(({ row, score }) => toResult(row, score));
  }

  const ranked: Array<{ row: SearchRow; score: number }> = [];
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const row: SearchRow = {
          bookId: book.id,
          bookName: book.name,
          chapter: chapter.chapter,
          verse: verse.verse,
          text: verse.text,
          normalizedText: normalize(verse.text),
        };
        const score = scoreRow(row);
        if (score < 0) continue;
        ranked.push({ row, score });
      }
    }
  }

  ranked.sort((a, b) => b.score - a.score || a.row.chapter - b.row.chapter || a.row.verse - b.row.verse);
  return ranked.slice(0, limit).map(({ row, score }) => toResult(row, score));
}
