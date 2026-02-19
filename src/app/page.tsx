"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { KORRV_BOOKS, KORRV_COPYRIGHT_NOTICE } from "@/data/bibleKorRvMock";
import type {
  Book,
  GroupMember,
  ReadPosition,
  ReadingLog,
  ReaderFont,
  ReadingProgress,
  TabKey,
  Testament,
} from "@/features/bible/types";
import {
  getBookById,
  getNextChapter,
  normalizeBookId,
  paginateVersesByLineBudget,
} from "@/features/bible/navigation";
import {
  createSearchIndex,
  searchBible,
  type BibleSearchResult,
} from "@/features/bible/search";
import { loadBibleFromPublic } from "@/features/bible/dataLoader";
import { buildLocalMemberId, normalizeInviteInput } from "@/features/group/invite";
import {
  acceptInviteToMember,
  canInviteBeAccepted,
  createInvite,
  isInviteExpired,
  isInviteCodeFormatValid,
  type InviteAuditAction,
  type InviteAuditLog,
  normalizeInviteCode,
  loadGroupInvites,
  saveGroupInvites,
  type GroupInvite,
} from "@/features/group/inviteStore";
import {
  calcWeeklyGroupTotal,
  calcWeeklyReadCountFromLogs,
  getMemberTimeline,
  getMemberWeeklyRead,
} from "@/features/group/stats";
import {
  buildYearReadingPlan,
  getReadingPlanPreview,
  getTodayPlanEntry,
} from "@/features/reading-plan/plan";
import {
  getDayOfYearFromDateKey,
  getCurrentReadStreak,
  getLastNDaysReads,
  getLongestReadStreak,
  getMonthlyReads,
  getTodayDateKey,
} from "@/features/reading-plan/calendar";
import {
  calcPlanCompletionPercent,
  loadPlanChecks,
  savePlanChecks,
  togglePlanDay,
  type PlanChecks,
} from "@/features/reading-plan/checkState";
import { calcOverallChapterProgress } from "@/features/reading-plan/progress";
import {
  INITIAL_GROUP,
  INITIAL_PROGRESS,
  INITIAL_READ_POSITION,
  loadGroupMembers,
  loadReadPosition,
  loadReadingLogs,
  loadReaderFont,
  loadReadingProgress,
  saveGroupMembers,
  saveReadPosition,
  saveReadingLogs,
  saveReaderFont,
  saveReadingProgress,
} from "@/features/storage/localState";

const CURRENT_MEMBER_ID = "my-reader";

function formatDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getPageIndexForVerseInPages(
  pages: { verse: number; text: string }[][],
  verse: number,
) {
  const index = pages.findIndex((page) => page.some((item) => item.verse === verse));
  return index >= 0 ? index : 0;
}

function appendInviteAudit(
  invite: GroupInvite,
  action: InviteAuditAction,
  actorId: string,
  detail?: string,
  context?: Partial<InviteAuditLog>,
) {
  return {
    ...invite,
    auditHistory: [
      ...invite.auditHistory,
      {
        action,
        at: new Date().toISOString(),
        actorId,
        detail,
        ...context,
      },
    ],
  };
}

function getInviteAuditContext(): Partial<InviteAuditLog> {
  if (typeof window === "undefined") return {};
  const key = "bible.audit.sessionId";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return {
    sessionId,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ipHint: "client-unavailable",
  };
}

export default function BiblePrototypePage() {
  const [books, setBooks] = useState<Book[]>(KORRV_BOOKS);
  const [hasFullBibleData, setHasFullBibleData] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [activeTestament, setActiveTestament] = useState<Testament>("NT");
  const [activeBookId, setActiveBookId] = useState("luke");
  const [activeChapter, setActiveChapter] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageLineBudget, setPageLineBudget] = useState(12);
  const [charsPerLine, setCharsPerLine] = useState(22);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasRestoredVersePage, setHasRestoredVersePage] = useState(false);
  const currentYear = new Date().getFullYear();

  const [progress, setProgress] = useState<ReadingProgress>(INITIAL_PROGRESS);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(INITIAL_GROUP);
  const [readPosition, setReadPosition] = useState<ReadPosition>(INITIAL_READ_POSITION);
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);

  const [inviteName, setInviteName] = useState("");
  const [inviteId, setInviteId] = useState("");
  const [inviteOneTime, setInviteOneTime] = useState(true);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteActionMessage, setInviteActionMessage] = useState("");
  const [readerFont, setReaderFont] = useState<ReaderFont>("pretendard");
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [planChecks, setPlanChecks] = useState<PlanChecks>({});
  const [historyMemberId, setHistoryMemberId] = useState<string | null>(null);
  const chapterPageCacheRef = useRef(new Map<string, { verse: number; text: string }[][]>());
  const searchIndex = useMemo(() => createSearchIndex(books), [books]);
  const readingPlan = useMemo(() => buildYearReadingPlan(books), [books]);
  const todayPlan = useMemo(() => getTodayPlanEntry(readingPlan), [readingPlan]);
  const planPreview = useMemo(
    () => getReadingPlanPreview(readingPlan, 5),
    [readingPlan],
  );
  const recentDailyReads = useMemo(
    () => getLastNDaysReads(readingLogs, CURRENT_MEMBER_ID, 7),
    [readingLogs],
  );
  const monthlyReads = useMemo(
    () => getMonthlyReads(readingLogs, CURRENT_MEMBER_ID),
    [readingLogs],
  );
  const currentStreak = useMemo(
    () => getCurrentReadStreak(readingLogs, CURRENT_MEMBER_ID),
    [readingLogs],
  );
  const longestStreak = useMemo(
    () => getLongestReadStreak(readingLogs, CURRENT_MEMBER_ID),
    [readingLogs],
  );
  const firstDayOfMonthWeekday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  }, []);
  const myTimeline = useMemo(
    () => getMemberTimeline(readingLogs, CURRENT_MEMBER_ID, 5),
    [readingLogs],
  );
  const todayReadCount =
    recentDailyReads.find((entry) => entry.dateKey === getTodayDateKey())?.count ?? 0;
  const latestLogByMemberId = useMemo(() => {
    const map = new Map<string, ReadingLog>();
    for (const log of readingLogs) {
      const existing = map.get(log.memberId);
      if (!existing || new Date(log.readAt).getTime() > new Date(existing.readAt).getTime()) {
        map.set(log.memberId, log);
      }
    }
    return map;
  }, [readingLogs]);
  const planCompletionPercent = calcPlanCompletionPercent(planChecks, 365);
  const inviteRows = useMemo(
    () =>
      groupInvites.map((invite) => {
        const expired = invite.status === "PENDING" && isInviteExpired(invite);
        const exhausted =
          invite.status === "PENDING" && invite.acceptedCount >= invite.maxAcceptCount;
        const effectiveStatus = expired
          ? "EXPIRED"
          : exhausted
            ? "LIMIT_REACHED"
            : invite.status;
        return {
          ...invite,
          effectiveStatus,
          canAccept: canInviteBeAccepted(invite),
          canRevoke: effectiveStatus === "PENDING",
          canReissue: true,
        };
      }),
    [groupInvites],
  );
  const inviteAcceptHistoryRows = useMemo(
    () =>
      inviteRows
        .flatMap((invite) =>
          invite.acceptHistory.map((history, idx) => ({
            ...history,
            code: invite.code,
            targetId: invite.targetId,
            key: `${invite.code}-${history.acceptedAt}-${idx}`,
          })),
        )
        .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime()),
    [inviteRows],
  );
  const inviteAuditRows = useMemo(
    () =>
      inviteRows
        .flatMap((invite) =>
          invite.auditHistory.map((audit, idx) => ({
            ...audit,
            code: invite.code,
            targetId: invite.targetId,
            key: `${invite.code}-${audit.at}-${audit.action}-${idx}`,
          })),
        )
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [inviteRows],
  );
  const historyMember = useMemo(
    () => groupMembers.find((member) => member.id === historyMemberId) ?? null,
    [groupMembers, historyMemberId],
  );
  const historyTimeline = useMemo(() => {
    if (!historyMemberId) return [];
    return getMemberTimeline(readingLogs, historyMemberId, 30);
  }, [historyMemberId, readingLogs]);

  useEffect(() => {
    setProgress(loadReadingProgress());
    setGroupMembers(loadGroupMembers());
    setReaderFont(loadReaderFont());
    setReadPosition(loadReadPosition());
    setReadingLogs(loadReadingLogs());
    setGroupInvites(loadGroupInvites());
    setPlanChecks(loadPlanChecks(currentYear));
    setIsHydrated(true);
  }, [currentYear]);

  useEffect(() => {
    let cancelled = false;
    loadBibleFromPublic()
      .then((payload) => {
        if (cancelled) return;
        if (payload.books.length >= 66) {
          setBooks(payload.books);
          setHasFullBibleData(true);
        }
      })
      .catch(() => {
        // Fallback to bundled mock data when full dataset is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveReadingProgress(progress);
  }, [progress, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveGroupMembers(groupMembers);
  }, [groupMembers, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveReaderFont(readerFont);
  }, [readerFont, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveReadPosition(readPosition);
  }, [readPosition, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveReadingLogs(readingLogs);
  }, [readingLogs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveGroupInvites(groupInvites);
  }, [groupInvites, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    savePlanChecks(currentYear, planChecks);
  }, [currentYear, planChecks, isHydrated]);

  const booksByTestament = useMemo(
    () => books.filter((book) => book.testament === activeTestament),
    [activeTestament, books],
  );

  useEffect(() => {
    if (!booksByTestament.length) return;
    if (!booksByTestament.some((book) => book.id === activeBookId)) {
      setActiveBookId(booksByTestament[0].id);
      setActiveChapter(booksByTestament[0].chapters[0].chapter);
      setPageIndex(0);
    }
  }, [booksByTestament, activeBookId]);

  useEffect(() => {
    if (!books.length) return;
    const normalized = normalizeBookId(progress.lastBookId, books);
    if (normalized !== progress.lastBookId) {
      setProgress((prev) => ({ ...prev, lastBookId: normalized }));
    }
  }, [books, progress.lastBookId]);

  useEffect(() => {
    if (!books.length) return;
    const normalizedBookId = normalizeBookId(readPosition.bookId, books);
    const targetBook = getBookById(normalizedBookId, books);
    const targetChapter =
      targetBook.chapters.find((chapter) => chapter.chapter === readPosition.chapter)?.chapter ??
      targetBook.chapters[0].chapter;

    setActiveBookId(normalizedBookId);
    setActiveChapter(targetChapter);
    setPageIndex(Math.max(0, readPosition.pageIndex));
  }, [books, readPosition.bookId, readPosition.chapter, readPosition.pageIndex]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearchResults(searchBible(query, books, 12, searchIndex));
  }, [searchQuery, books, searchIndex]);

  useEffect(() => {
    const updatePageMetrics = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = Math.min(window.innerWidth, 420);
      const cardHeight = Math.max(240, viewportHeight - 360);
      const lineHeight = 32;
      const horizontalPadding = 56;
      const computedCharsPerLine = Math.max(
        14,
        Math.floor((viewportWidth - horizontalPadding) / (readerFont === "nanum-myeongjo" ? 17 : 16)),
      );
      const computedLineBudget = Math.max(8, Math.floor((cardHeight - 24) / lineHeight));
      setCharsPerLine(computedCharsPerLine);
      setPageLineBudget(computedLineBudget);
    };

    updatePageMetrics();
    window.addEventListener("resize", updatePageMetrics);
    return () => window.removeEventListener("resize", updatePageMetrics);
  }, [readerFont]);

  const activeBook = getBookById(activeBookId, books);
  const activeChapterData =
    activeBook.chapters.find((chapter) => chapter.chapter === activeChapter) ??
    activeBook.chapters[0];

  const getChapterPages = (bookId: string, chapter: number) => {
    const key = `${bookId}:${chapter}:${pageLineBudget}:${charsPerLine}`;
    const cached = chapterPageCacheRef.current.get(key);
    if (cached) return cached;

    const book = getBookById(bookId, books);
    const chapterData = book.chapters.find((c) => c.chapter === chapter) ?? book.chapters[0];
    const pages = paginateVersesByLineBudget(
      chapterData.verses,
      pageLineBudget,
      charsPerLine,
    );
    chapterPageCacheRef.current.set(key, pages);
    return pages;
  };

  const versePages = useMemo(() => {
    return getChapterPages(activeBook.id, activeChapterData.chapter);
  }, [activeBook.id, activeChapterData.chapter, pageLineBudget, charsPerLine]);

  useEffect(() => {
    const index = activeBook.chapters.findIndex((chapter) => chapter.chapter === activeChapterData.chapter);
    if (index > 0) {
      const prevChapter = activeBook.chapters[index - 1].chapter;
      getChapterPages(activeBook.id, prevChapter);
    }
    if (index < activeBook.chapters.length - 1) {
      const nextChapter = activeBook.chapters[index + 1].chapter;
      getChapterPages(activeBook.id, nextChapter);
    }
  }, [activeBook, activeChapterData.chapter, pageLineBudget, charsPerLine]);

  useEffect(() => {
    if (pageIndex > versePages.length - 1) {
      setPageIndex(Math.max(0, versePages.length - 1));
    }
  }, [pageIndex, versePages.length]);

  useEffect(() => {
    if (!books.length || hasRestoredVersePage) return;
    const normalizedBookId = normalizeBookId(progress.lastBookId, books);
    if (
      normalizedBookId === activeBook.id &&
      progress.lastChapter === activeChapterData.chapter
    ) {
      const targetPage = getPageIndexForVerseInPages(versePages, progress.lastVerse);
      setPageIndex(Math.min(Math.max(0, targetPage), Math.max(0, versePages.length - 1)));
      setHasRestoredVersePage(true);
    }
  }, [
    books,
    hasRestoredVersePage,
    progress.lastBookId,
    progress.lastChapter,
    progress.lastVerse,
    activeBook.id,
    activeChapterData.chapter,
    versePages.length,
    versePages,
  ]);

  const nextChapter = getNextChapter(progress, books);
  const currentBookForProgress = getBookById(normalizeBookId(progress.lastBookId, books), books);
  const currentBookReadPercent = Math.min(
    100,
    Math.round((progress.lastChapter / currentBookForProgress.chapters.length) * 100),
  );
  const overallReadPercent = calcOverallChapterProgress(books, progress);

  const myWeeklyRead = calcWeeklyReadCountFromLogs(readingLogs, CURRENT_MEMBER_ID);
  const totalWeeklyRead = calcWeeklyGroupTotal(
    groupMembers,
    readingLogs,
    CURRENT_MEMBER_ID,
  );

  useEffect(() => {
    if (!books.length) return;
    setReadPosition({
      bookId: activeBook.id,
      chapter: activeChapterData.chapter,
      pageIndex,
      updatedAt: new Date().toISOString(),
    });
  }, [books.length, activeBook.id, activeChapterData.chapter, pageIndex]);

  const moveChapter = (direction: "prev" | "next") => {
    const chapterIndex = activeBook.chapters.findIndex(
      (chapter) => chapter.chapter === activeChapter,
    );

    if (direction === "prev" && chapterIndex > 0) {
      setActiveChapter(activeBook.chapters[chapterIndex - 1].chapter);
      setPageIndex(0);
      return;
    }

    if (direction === "next" && chapterIndex < activeBook.chapters.length - 1) {
      setActiveChapter(activeBook.chapters[chapterIndex + 1].chapter);
      setPageIndex(0);
    }
  };

  const moveToSearchResult = (result: BibleSearchResult) => {
    const book = getBookById(result.bookId, books);
    const pages = getChapterPages(result.bookId, result.chapter);
    setActiveTab("read");
    setActiveTestament(book.testament);
    setActiveBookId(book.id);
    setActiveChapter(result.chapter);
    setPageIndex(getPageIndexForVerseInPages(pages, result.verse));
    setHasRestoredVersePage(true);
  };

  const togglePlanCheck = (day: number) => {
    setPlanChecks((prev) => togglePlanDay(prev, day));
  };

  const markReadUntilHere = () => {
    const currentPageVerses = versePages[pageIndex] ?? [];
    const lastVerse =
      currentPageVerses[currentPageVerses.length - 1]?.verse ??
      activeChapterData.verses[activeChapterData.verses.length - 1].verse;

    setProgress({
      lastBookId: activeBook.id,
      lastChapter: activeChapterData.chapter,
      lastVerse,
    });

    const today = new Date().toISOString().slice(0, 10);
    const logKey = `${CURRENT_MEMBER_ID}:${activeBook.id}:${activeChapterData.chapter}:${today}`;
    setReadingLogs((prev) => {
      const existingIndex = prev.findIndex((log) => {
        const day = log.readAt.slice(0, 10);
        const key = `${log.memberId}:${log.bookId}:${log.chapter}:${day}`;
        return key === logKey;
      });
      if (existingIndex >= 0) {
        const next = [...prev];
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          verse: Math.max(existing.verse, lastVerse),
          readAt: new Date().toISOString(),
        };
        return next;
      }
      return [
        ...prev,
        {
          memberId: CURRENT_MEMBER_ID,
          bookId: activeBook.id,
          chapter: activeChapterData.chapter,
          verse: lastVerse,
          readAt: new Date().toISOString(),
        },
      ];
    });

    setActiveTab("home");
  };

  const inviteMember = () => {
    const normalizedName = normalizeInviteInput(inviteName);
    if (!normalizedName) {
      setInviteActionMessage("초대할 사용자 이름을 입력하세요.");
      return;
    }
    const normalizedId = buildLocalMemberId(inviteId);

    const auditContext = getInviteAuditContext();
    const invite = createInvite(
      normalizedName,
      normalizedId,
      inviteOneTime,
      groupInvites,
      CURRENT_MEMBER_ID,
      "초대코드 생성",
      auditContext,
    );
    setGroupInvites((prev) => [invite, ...prev]);
    setInviteId("");
    setInviteName("");
    setInviteActionMessage("초대코드가 생성되었습니다.");
  };

  const removeMember = (id: string) => {
    setGroupMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const revokeInvite = (code: string) => {
    const auditContext = getInviteAuditContext();
    setGroupInvites((prev) =>
      prev.map((invite) =>
        invite.code === code
          ? appendInviteAudit(
              {
                ...invite,
                status: "REVOKED",
                revokedAt: new Date().toISOString(),
              },
              "REVOKED",
              CURRENT_MEMBER_ID,
              "수동 만료 처리",
              auditContext,
            )
          : invite,
      ),
    );
  };

  const reissueInvite = (code: string) => {
    const source = groupInvites.find((invite) => invite.code === code);
    if (!source) {
      setInviteActionMessage("재발급 대상 코드를 찾을 수 없습니다.");
      return;
    }

    const auditContext = getInviteAuditContext();
    const nextInvite = createInvite(
      source.name,
      source.targetId,
      source.maxAcceptCount === 1,
      groupInvites,
      CURRENT_MEMBER_ID,
      `재발급: ${source.code}`,
      auditContext,
    );

    setGroupInvites((prev) => [
      appendInviteAudit(
        nextInvite,
        "REISSUED",
        CURRENT_MEMBER_ID,
        `이전 코드: ${source.code}`,
        auditContext,
      ),
      ...prev.map((invite) =>
        invite.code === source.code
          ? appendInviteAudit(
              {
                ...invite,
                status: "REVOKED",
                revokedAt: new Date().toISOString(),
              },
              "REISSUED",
              CURRENT_MEMBER_ID,
              `신규 코드: ${nextInvite.code}`,
              auditContext,
            )
          : invite,
      ),
    ]);

    setInviteActionMessage(`코드를 재발급했습니다: ${nextInvite.code}`);
  };

  const acceptInvite = (code: string) => {
    const auditContext = getInviteAuditContext();
    const normalizedCode = normalizeInviteCode(code);
    if (!isInviteCodeFormatValid(normalizedCode)) {
      setInviteActionMessage("코드 형식이 올바르지 않습니다.");
      return;
    }
    const invite = groupInvites.find((item) => item.code === normalizedCode);
    if (!invite) {
      setInviteActionMessage("등록되지 않은 초대코드입니다.");
      return;
    }
    if (invite.status === "REVOKED") {
      setInviteActionMessage("관리자가 회수한 코드입니다.");
      return;
    }
    if (isInviteExpired(invite)) {
      setInviteActionMessage("만료된 코드입니다.");
      return;
    }
    if (invite.acceptedCount >= invite.maxAcceptCount || invite.status === "ACCEPTED") {
      setInviteActionMessage("사용 한도가 모두 소진된 코드입니다.");
      return;
    }
    if (!canInviteBeAccepted(invite)) {
      setInviteActionMessage("수락할 수 없는 코드입니다.");
      return;
    }
    if (groupMembers.some((member) => member.id === invite.targetId)) {
      setInviteActionMessage("이미 그룹에 포함된 사용자입니다.");
      return;
    }

    const newMember = acceptInviteToMember(invite);
    const acceptedAt = new Date().toISOString();
    setGroupInvites((prev) =>
      prev.map((item) =>
        item.code === normalizedCode
          ? appendInviteAudit(
              {
                ...item,
                acceptedCount: item.acceptedCount + 1,
                acceptedAt,
                acceptHistory: [
                  ...item.acceptHistory,
                  {
                    acceptedAt,
                    acceptedBy: CURRENT_MEMBER_ID,
                    acceptedMemberId: newMember.id,
                  },
                ],
                status:
                  item.acceptedCount + 1 >= item.maxAcceptCount
                    ? "ACCEPTED"
                    : item.status,
              },
              "ACCEPTED",
              CURRENT_MEMBER_ID,
              `수락 대상: ${newMember.id}`,
              auditContext,
            )
          : item
      ),
    );
    setGroupMembers((prev) => {
      if (prev.some((member) => member.id === newMember.id)) return prev;
      return [newMember, ...prev];
    });
    setInviteCodeInput("");
    setInviteActionMessage("초대코드를 수락했습니다.");
  };

  const bibleTextStyle =
    readerFont === "nanum-myeongjo"
      ? ({ fontFamily: "'Nanum Myeongjo', serif", fontSize: 18 } as const)
      : ({ fontFamily: "'Pretendard', sans-serif", fontSize: 18 } as const);

  const renderHome = () => (
    <div className="space-y-4 pb-24">
      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <p className="text-sm text-slate-500">{formatDate(new Date())}</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          오늘은 {nextChapter.bookName} {nextChapter.chapter}장 {nextChapter.verse}절을 읽을 차례예요.
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          마지막 기록: {currentBookForProgress.name} {progress.lastChapter}장 {progress.lastVerse}절
        </p>
        {todayPlan ? (
          <p className="mt-1 text-sm text-slate-600">
            오늘 일독표: {todayPlan.chapters[0]?.bookName} {todayPlan.chapters[0]?.chapter}장 시작
          </p>
        ) : null}
        <p className="mt-1 text-sm text-slate-600">
          {todayReadCount > 0
            ? `오늘 ${todayReadCount}장 읽었어요.`
            : "오늘 읽기 기록이 아직 없어요. 최소 1장 읽기를 권장합니다."}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          연속 읽기 {currentStreak}일 / 최장 {longestStreak}일
        </p>
      </section>

      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">성경일독표</h3>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => setShowPlanSheet(true)}
          >
            페이지 보기
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          현재 {currentBookForProgress.name}를 {currentBookReadPercent}% 읽었어요.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          전체 성경 기준 진행률은 {overallReadPercent}%예요.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          일독표 체크 누적 달성률은 {planCompletionPercent}%예요.
        </p>
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${currentBookReadPercent}%` }}
          />
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">그룹</h3>
        <p className="mt-2 text-sm text-slate-600">
          우리 그룹은 최근 일주일간 총 {totalWeeklyRead}장을 읽었어요.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          내 최근 일주일 읽기 기록은 {myWeeklyRead}장이에요.
        </p>
        <ul className="mt-3 space-y-2">
          {groupMembers.map((member) => {
            const latest = getMemberTimeline(readingLogs, member.id, 1)[0];
            const latestLog = latestLogByMemberId.get(member.id);
            const latestBookName =
              books.find((book) => book.id === latestLog?.bookId)?.name ?? member.bookName;
            const latestChapter = latestLog?.chapter ?? member.chapter;
            const latestVerse = latestLog?.verse ?? 1;
            return (
              <li key={member.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  {member.name}({member.id}) - {latestBookName} {latestChapter}장 {latestVerse}절까지 / 최근 7일{" "}
                  {getMemberWeeklyRead(member, readingLogs, CURRENT_MEMBER_ID)}장
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  최근 기록:{" "}
                  {latest
                    ? `${new Date(latest.readAt).toLocaleString("ko-KR")} ${latestBookName} ${latest.chapter}장 ${latest.verse}절`
                    : "기록 없음"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {showPlanSheet ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-sky-900">성경일독표</h4>
            <button
              type="button"
              className="text-sm font-medium text-sky-700"
              onClick={() => setShowPlanSheet(false)}
            >
              닫기
            </button>
          </div>
          <p className="mt-2 text-sm text-sky-900">
            {planPreview.slice(0, 3).join(" / ")}
          </p>
          <p className="mt-1 text-sm text-sky-900">{planPreview.slice(3).join(" / ")}</p>
          <div className="mt-3 rounded-lg bg-white p-3">
            <p className="text-xs font-semibold text-slate-600">최근 7일 읽기 캘린더</p>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {recentDailyReads.map((entry) => (
                <div
                  key={entry.dateKey}
                  className={`rounded-md p-2 text-center text-xs ${
                    entry.count > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <p>{entry.dateKey.slice(5)}</p>
                  <p>{entry.count}장</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-600">일독표 체크(최근 7일)</p>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {recentDailyReads.map((entry) => {
                  const day = getDayOfYearFromDateKey(entry.dateKey);
                  const checked = !!planChecks[day];
                  return (
                    <button
                      key={`check-${entry.dateKey}`}
                      type="button"
                      className={`rounded-md p-2 text-xs ${checked ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      onClick={() => togglePlanCheck(day)}
                    >
                      {day}일
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-600">이번 달 읽기 캘린더</p>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonthWeekday }).map((_, idx) => (
                  <div
                    key={`blank-${idx}`}
                    className="rounded-md bg-slate-50 p-2"
                    aria-hidden="true"
                  />
                ))}
                {monthlyReads.map((entry) => {
                  const checked = !!planChecks[getDayOfYearFromDateKey(entry.dateKey)];
                  return (
                    <button
                      key={`month-${entry.dateKey}`}
                      type="button"
                      className={`rounded-md border p-2 text-xs ${
                        entry.count > 0
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                      onClick={() => togglePlanCheck(getDayOfYearFromDateKey(entry.dateKey))}
                    >
                      <p>{entry.day}</p>
                      <p>{entry.count}장</p>
                      <p>{checked ? "체크" : "-"}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );

  const renderRead = () => (
    <div className="pb-24">
      <section className="card border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="tabs tabs-box flex gap-2">
          <button
            type="button"
            className={`tab ${activeTestament === "OT" ? "tab-active" : ""}`}
            onClick={() => setActiveTestament("OT")}
          >
            구약
          </button>
          <button
            type="button"
            className={`tab ${activeTestament === "NT" ? "tab-active" : ""}`}
            onClick={() => setActiveTestament("NT")}
          >
            신약
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="본문 검색 (예: 요 3:16, 사랑)"
            className="input input-bordered w-full"
          />
          {searchResults.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {searchResults.map((result) => (
                <li key={`${result.bookId}-${result.chapter}-${result.verse}`} className="mb-1 last:mb-0">
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-slate-100"
                    onClick={() => moveToSearchResult(result)}
                  >
                    <p className="font-semibold text-slate-700">
                      {result.bookName} {result.chapter}:{result.verse}
                    </p>
                    <p className="truncate text-slate-600">{result.preview}</p>
                    <p className="text-[11px] text-slate-400">
                      {result.matchType === "reference"
                        ? "참조 검색"
                        : result.matchType === "exact_phrase"
                          ? "정확 일치"
                          : "부분 일치"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {booksByTestament.map((book) => (
            <button
              key={book.id}
              type="button"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                activeBookId === book.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => {
                setActiveBookId(book.id);
                setActiveChapter(book.chapters[0].chapter);
                setPageIndex(0);
              }}
            >
              {book.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            className="btn btn-soft btn-xs"
            onClick={() => moveChapter("prev")}
          >
            이전 장
          </button>
          <p className="text-sm font-semibold text-slate-800">
            {activeBook.name} {activeChapterData.chapter}장
          </p>
          <button
            type="button"
            className="btn btn-soft btn-xs"
            onClick={() => moveChapter("next")}
          >
            다음 장
          </button>
        </div>
      </section>

      <section
        className="card relative mt-3 overflow-hidden border border-base-300 bg-base-100 p-5 shadow-sm"
        style={{ height: "calc(100vh - 360px)", minHeight: 260, maxHeight: 620 }}
      >
        <button
          type="button"
          aria-label="이전 페이지"
          className="absolute left-0 top-0 h-full w-1/3"
          onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
        />
        <button
          type="button"
          aria-label="다음 페이지"
          className="absolute right-0 top-0 h-full w-1/3"
          onClick={() => setPageIndex((prev) => Math.min(versePages.length - 1, prev + 1))}
        />

        <div className="relative z-10 h-full">
          <div className="space-y-5">
            {(versePages[pageIndex] ?? []).map((verse) => (
              <p key={verse.verse} className="leading-8 text-slate-900" style={bibleTextStyle}>
                <span className="mr-2 font-semibold text-emerald-700">{verse.verse}</span>
                {verse.text}
              </p>
            ))}
          </div>
          <p className="absolute bottom-0 left-0 text-xs text-slate-500">
            페이지 {pageIndex + 1} / {versePages.length} (좌/우 터치로 이동)
          </p>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-success mt-4 w-full text-base font-semibold"
        onClick={markReadUntilHere}
      >
        여기까지 읽기
      </button>
      <p className="mt-2 text-xs text-slate-500">{KORRV_COPYRIGHT_NOTICE}</p>
      <p className="mt-1 text-xs text-slate-500">
        본문 데이터: {hasFullBibleData ? "전체 66권 로드됨" : "전체 데이터 로딩 필요"}
      </p>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4 pb-24">
      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">설정</h3>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => setShowSettingsPage(false)}
          >
            닫기
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          앱 전체 서체는 Pretendard입니다. 아래는 성경읽기 본문 전용 서체 설정입니다.
        </p>
      </section>

      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">성경 본문 서체</h4>
        <div className="mt-3 space-y-3">
          <button
            type="button"
            className={`w-full rounded-xl border p-3 text-left ${
              readerFont === "pretendard"
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => setReaderFont("pretendard")}
          >
            <p className="font-semibold">Pretendard (기본)</p>
            <p className="text-sm text-slate-600">가독성 중심 산세리프</p>
          </button>
          <button
            type="button"
            className={`w-full rounded-xl border p-3 text-left ${
              readerFont === "nanum-myeongjo"
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
            onClick={() => setReaderFont("nanum-myeongjo")}
          >
            <p className="font-semibold" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              Nanum Myeongjo
            </p>
            <p className="text-sm text-slate-600">명조 계열 본문 서체</p>
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">미리보기</p>
          <p className="mt-2 leading-8 text-slate-900" style={bibleTextStyle}>
            1 태초에 하나님이 천지를 창조하시니라.
          </p>
        </div>
      </section>
    </div>
  );

  const renderMy = () => (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">마이</h2>
        <button
          type="button"
          aria-label="설정"
          className="btn btn-soft btn-circle btn-sm"
          onClick={() => setShowSettingsPage(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.75A3.75 3.75 0 1 0 12 8.25a3.75 3.75 0 0 0 0 7.5Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 12a7.5 7.5 0 0 0-.09-1.12l1.74-1.36-1.5-2.6-2.1.56a7.65 7.65 0 0 0-1.93-1.12l-.31-2.16h-3l-.31 2.16a7.65 7.65 0 0 0-1.93 1.12l-2.1-.56-1.5 2.6 1.74 1.36A7.5 7.5 0 0 0 4.5 12c0 .38.03.75.09 1.12l-1.74 1.36 1.5 2.6 2.1-.56c.58.47 1.23.85 1.93 1.12l.31 2.16h3l.31-2.16a7.65 7.65 0 0 0 1.93-1.12l2.1.56 1.5-2.6-1.74-1.36c.06-.37.09-.74.09-1.12Z"
            />
          </svg>
        </button>
      </div>

      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">내 계정</h3>
        <p className="mt-2 text-sm text-slate-600">
          ID: {CURRENT_MEMBER_ID} / 현재 읽은 위치: {currentBookForProgress.name} {progress.lastChapter}장 {progress.lastVerse}절
        </p>
      </section>

      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">그룹 관리</h3>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <input
            value={inviteId}
            onChange={(event) => setInviteId(event.target.value)}
            placeholder="초대할 사용자 ID"
            className="input input-bordered w-full"
          />
          <input
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            placeholder="초대할 사용자 이름"
            className="input input-bordered w-full"
          />
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={inviteOneTime}
              onChange={(event) => setInviteOneTime(event.target.checked)}
            />
            1회성 초대코드 (해제 시 다회성)
          </label>
          <button
            type="button"
            className="btn btn-neutral"
            onClick={inviteMember}
          >
            초대코드 생성
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-800">초대코드</p>
          <div className="mt-2 flex gap-2">
            <input
              value={inviteCodeInput}
              onChange={(event) => setInviteCodeInput(event.target.value)}
              placeholder="코드 직접 입력 (예: BIB-XXXXXX)"
              className="input input-bordered w-full"
            />
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => acceptInvite(inviteCodeInput)}
            >
              코드 수락
            </button>
          </div>
          {inviteActionMessage ? (
            <p className="mt-2 text-xs text-slate-500">{inviteActionMessage}</p>
          ) : null}
          <ul className="mt-2 space-y-2">
            {inviteRows.length === 0 ? (
              <li className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                생성된 초대코드가 없습니다.
              </li>
            ) : (
              inviteRows.map((invite) => (
                <li key={invite.code} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">
                    {invite.name} ({invite.targetId}) - {invite.code}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    상태: {invite.effectiveStatus} / 생성: {new Date(invite.createdAt).toLocaleString("ko-KR")} /
                    만료: {new Date(invite.expiresAt).toLocaleString("ko-KR")} / 사용: {invite.acceptedCount}/
                    {invite.maxAcceptCount === 9999 ? "∞" : invite.maxAcceptCount}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="btn btn-soft btn-xs"
                      onClick={() => acceptInvite(invite.code)}
                      disabled={!invite.canAccept}
                    >
                      초대 수락 처리
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft btn-xs"
                      onClick={() => reissueInvite(invite.code)}
                      disabled={!invite.canReissue}
                    >
                      코드 재발급
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft btn-error btn-xs"
                      onClick={() => revokeInvite(invite.code)}
                      disabled={!invite.canRevoke}
                    >
                      코드 만료
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">초대 수락 이력</p>
          {inviteAcceptHistoryRows.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">수락 이력이 없습니다.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>대상 ID</th>
                    <th>수락 시각</th>
                    <th>처리자</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteAcceptHistoryRows.map((row) => (
                    <tr key={row.key}>
                      <td className="font-mono">{row.code}</td>
                      <td>{row.targetId}</td>
                      <td>{new Date(row.acceptedAt).toLocaleString("ko-KR")}</td>
                      <td>{row.acceptedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">초대 감사 로그 (취소/재발급 포함)</p>
          {inviteAuditRows.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">감사 로그가 없습니다.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>액션</th>
                    <th>코드</th>
                    <th>대상 ID</th>
                    <th>처리자</th>
                    <th>세션</th>
                    <th>디바이스</th>
                    <th>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteAuditRows.map((row) => (
                    <tr key={row.key}>
                      <td>{new Date(row.at).toLocaleString("ko-KR")}</td>
                      <td>
                        {row.action === "CREATED"
                          ? "생성"
                          : row.action === "ACCEPTED"
                            ? "수락"
                            : row.action === "REVOKED"
                              ? "취소"
                              : "재발급"}
                      </td>
                      <td className="font-mono">{row.code}</td>
                      <td>{row.targetId}</td>
                      <td>{row.actorId}</td>
                      <td className="font-mono">{row.sessionId ? row.sessionId.slice(-8) : "-"}</td>
                      <td>{row.platform ?? "-"}</td>
                      <td>{row.detail ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ul className="mt-4 space-y-2">
          {groupMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"
            >
              <span className="pr-2">
                {member.name}({member.id}) -{" "}
                {books.find((book) => book.id === latestLogByMemberId.get(member.id)?.bookId)?.name ?? member.bookName}{" "}
                {latestLogByMemberId.get(member.id)?.chapter ?? member.chapter}장{" "}
                {latestLogByMemberId.get(member.id)?.verse ?? 1}절 / 최근 7일{" "}
                {getMemberWeeklyRead(member, readingLogs, CURRENT_MEMBER_ID)}장
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="btn btn-soft btn-xs"
                  onClick={() => setHistoryMemberId(member.id)}
                >
                  기록
                </button>
                <button
                  type="button"
                  className="btn btn-soft btn-error btn-xs"
                  onClick={() => removeMember(member.id)}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>

        {historyMember ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 md:items-center"
            onClick={() => setHistoryMemberId(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h4 className="text-base font-semibold text-slate-900">
                  {historyMember.name}({historyMember.id}) 최근 읽기 기록
                </h4>
                <button
                  type="button"
                  className="btn btn-soft btn-xs"
                  onClick={() => setHistoryMemberId(null)}
                >
                  닫기
                </button>
              </div>
              <div className="max-h-[68vh] overflow-y-auto px-4 py-3">
                <p className="text-xs text-slate-500">
                  최신 위치:{" "}
                  {books.find((book) => book.id === latestLogByMemberId.get(historyMember.id)?.bookId)?.name ??
                    historyMember.bookName}{" "}
                  {latestLogByMemberId.get(historyMember.id)?.chapter ?? historyMember.chapter}장{" "}
                  {latestLogByMemberId.get(historyMember.id)?.verse ?? 1}절
                </p>
                {historyTimeline.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">기록이 없습니다.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {historyTimeline.map((log, idx) => (
                      <li key={`${log.readAt}-${idx}`} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        {new Date(log.readAt).toLocaleString("ko-KR")} -{" "}
                        {books.find((book) => book.id === log.bookId)?.name ?? log.bookId.toUpperCase()}{" "}
                        {log.chapter}장 {log.verse}절
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">내 최근 읽기 타임라인</p>
          {myTimeline.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">기록이 없습니다.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {myTimeline.map((log, idx) => (
                <li key={`${log.readAt}-${idx}`}>
                  {new Date(log.readAt).toLocaleString("ko-KR")} -{" "}
                  {books.find((book) => book.id === log.bookId)?.name ?? log.bookId.toUpperCase()} {log.chapter}장 {log.verse}절
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">약관</h3>
        <p className="mt-2 text-sm text-slate-600">서비스 이용약관 / 개인정보 처리방침 / 운영 정책 문서</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/terms" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            이용약관
          </Link>
          <Link href="/privacy" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            개인정보처리방침
          </Link>
          <Link href="/policy" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            정책서
          </Link>
          <Link href="/product-plan" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            제품 기획서
          </Link>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-soft btn-error w-full"
      >
        탈퇴하기
      </button>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-slate-50 px-4 pt-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">KorRV 성경 앱</h1>
        <p className="mt-1 text-sm text-slate-600">실서비스 개발 버전</p>
      </header>
      {!hasFullBibleData ? (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          전체 성경 데이터 파일이 로드되지 않았습니다. `public/data/bible-kor-full.json` 생성 상태를 확인하세요.
        </div>
      ) : null}

      {activeTab === "home" ? renderHome() : null}
      {activeTab === "read" ? renderRead() : null}
      {activeTab === "my" ? (showSettingsPage ? renderSettings() : renderMy()) : null}

      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-xl -translate-x-1/2 border-t border-slate-200 bg-white px-2 py-2">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            activeTab === "home" ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
          }`}
          onClick={() => setActiveTab("home")}
        >
          홈
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            activeTab === "read" ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
          }`}
          onClick={() => setActiveTab("read")}
        >
          성경읽기
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            activeTab === "my" ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
          }`}
          onClick={() => setActiveTab("my")}
        >
          마이
        </button>
      </nav>
    </main>
  );
}
