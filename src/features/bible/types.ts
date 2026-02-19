export type Verse = { verse: number; text: string };
export type Chapter = { chapter: number; verses: Verse[] };
export type Book = {
  id: string;
  testament: "OT" | "NT";
  name: string;
  chapters: Chapter[];
};

export type TabKey = "home" | "read" | "my";
export type Testament = "OT" | "NT";

export type ReadingProgress = {
  lastBookId: string;
  lastChapter: number;
  lastVerse: number;
};

export type ReadPosition = {
  bookId: string;
  chapter: number;
  pageIndex: number;
  updatedAt: string;
};

export type ReadingLog = {
  memberId: string;
  bookId: string;
  chapter: number;
  verse: number;
  readAt: string;
};

export type GroupMember = {
  id: string;
  name: string;
  bookName: string;
  chapter: number;
  weeklyReadChapters: number;
};

export type ReaderFont = "pretendard" | "nanum-myeongjo";

export type NextChapter = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
};
