import type { Book, NextChapter, ReadingProgress } from "./types";

const LEGACY_BOOK_ID_MAP: Record<string, string> = {
  genesis: "gen",
  psalms: "psa",
  matthew: "mat",
  mark: "mrk",
  luke: "luk",
};

export function normalizeBookId(bookId: string, books: Book[]) {
  if (books.some((book) => book.id === bookId)) return bookId;
  const mapped = LEGACY_BOOK_ID_MAP[bookId];
  if (mapped && books.some((book) => book.id === mapped)) return mapped;
  return books[0]?.id ?? bookId;
}

export function getBookById(bookId: string, books: Book[]) {
  return books.find((book) => book.id === bookId) ?? books[0];
}

export function getNextChapter(progress: ReadingProgress, books: Book[]): NextChapter {
  const currentBook = getBookById(normalizeBookId(progress.lastBookId, books), books);
  const currentChapterIndex = currentBook.chapters.findIndex(
    (chapter) => chapter.chapter === progress.lastChapter,
  );

  if (
    currentChapterIndex >= 0 &&
    currentChapterIndex < currentBook.chapters.length - 1
  ) {
    return {
      bookId: currentBook.id,
      bookName: currentBook.name,
      chapter: currentBook.chapters[currentChapterIndex + 1].chapter,
      verse: 1,
    };
  }

  const currentBookIndex = books.findIndex((book) => book.id === currentBook.id);
  const nextBook = books[(currentBookIndex + 1) % books.length];

  return {
    bookId: nextBook.id,
    bookName: nextBook.name,
    chapter: nextBook.chapters[0].chapter,
    verse: 1,
  };
}

export function paginateVerses<T>(items: T[], pageSize: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

function estimateVerseLineUnits(text: string, charsPerLine: number) {
  const compact = text.trim();
  if (!compact) return 1;
  const lengthBased = Math.ceil(compact.length / Math.max(8, charsPerLine));
  const punctuationBonus = (compact.match(/[,.!?;:]/g) ?? []).length * 0.08;
  return Math.max(1, Math.ceil(lengthBased + punctuationBonus));
}

export function paginateVersesByLineBudget<T extends { text: string }>(
  verses: T[],
  lineBudget: number,
  charsPerLine: number,
): T[][] {
  if (!verses.length) return [];
  const pages: T[][] = [];
  let page: T[] = [];
  let used = 0;
  const safeBudget = Math.max(4, lineBudget);

  for (const verse of verses) {
    const units = estimateVerseLineUnits(verse.text, charsPerLine);
    if (page.length > 0 && used + units > safeBudget) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(verse);
    used += units;
  }

  if (page.length > 0) pages.push(page);
  return pages;
}
