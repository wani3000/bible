import type {
  GroupMember,
  ReadPosition,
  ReaderFont,
  ReadingLog,
  ReadingProgress,
} from "@/features/bible/types";

const STORAGE_KEYS = {
  progress: "bible.progress",
  group: "bible.groupMembers",
  readerFont: "bible.readerFont",
  readPosition: "bible.readPosition",
  readingLogs: "bible.readingLogs",
} as const;

export const INITIAL_PROGRESS: ReadingProgress = {
  lastBookId: "luke",
  lastChapter: 1,
  lastVerse: 4,
};

export const INITIAL_READ_POSITION: ReadPosition = {
  bookId: "luke",
  chapter: 1,
  pageIndex: 0,
  updatedAt: new Date(0).toISOString(),
};

export const INITIAL_GROUP: GroupMember[] = [
  {
    id: "user-001",
    name: "유저1",
    bookName: "누가복음",
    chapter: 2,
    weeklyReadChapters: 3,
  },
  {
    id: "user-002",
    name: "유저2",
    bookName: "마가복음",
    chapter: 1,
    weeklyReadChapters: 2,
  },
];

export function loadReadingProgress() {
  const raw = localStorage.getItem(STORAGE_KEYS.progress);
  if (!raw) return INITIAL_PROGRESS;

  try {
    return JSON.parse(raw) as ReadingProgress;
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveReadingProgress(progress: ReadingProgress) {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
}

export function loadGroupMembers() {
  const raw = localStorage.getItem(STORAGE_KEYS.group);
  if (!raw) return INITIAL_GROUP;

  try {
    return JSON.parse(raw) as GroupMember[];
  } catch {
    return INITIAL_GROUP;
  }
}

export function saveGroupMembers(groupMembers: GroupMember[]) {
  localStorage.setItem(STORAGE_KEYS.group, JSON.stringify(groupMembers));
}

export function loadReaderFont() {
  const raw = localStorage.getItem(STORAGE_KEYS.readerFont);
  if (raw === "pretendard" || raw === "nanum-myeongjo") {
    return raw as ReaderFont;
  }
  return "pretendard" as ReaderFont;
}

export function saveReaderFont(readerFont: ReaderFont) {
  localStorage.setItem(STORAGE_KEYS.readerFont, readerFont);
}

export function loadReadPosition() {
  const raw = localStorage.getItem(STORAGE_KEYS.readPosition);
  if (!raw) return INITIAL_READ_POSITION;
  try {
    return JSON.parse(raw) as ReadPosition;
  } catch {
    return INITIAL_READ_POSITION;
  }
}

export function saveReadPosition(position: ReadPosition) {
  localStorage.setItem(STORAGE_KEYS.readPosition, JSON.stringify(position));
}

export function loadReadingLogs() {
  const raw = localStorage.getItem(STORAGE_KEYS.readingLogs);
  if (!raw) return [] as ReadingLog[];
  try {
    const parsed = JSON.parse(raw) as Array<Partial<ReadingLog>>;
    return parsed
      .filter((log): log is Partial<ReadingLog> & { memberId: string; bookId: string; chapter: number; readAt: string } =>
        !!log && typeof log.memberId === "string" && typeof log.bookId === "string" && typeof log.chapter === "number" && typeof log.readAt === "string",
      )
      .map((log) => ({
        memberId: log.memberId,
        bookId: log.bookId,
        chapter: log.chapter,
        verse: typeof log.verse === "number" ? log.verse : 1,
        readAt: log.readAt,
      }));
  } catch {
    return [] as ReadingLog[];
  }
}

export function saveReadingLogs(logs: ReadingLog[]) {
  localStorage.setItem(STORAGE_KEYS.readingLogs, JSON.stringify(logs));
}
