import type { Book, ReadingProgress } from "@/features/bible/types";
import { normalizeBookId } from "@/features/bible/navigation";

export function calcOverallChapterProgress(books: Book[], progress: ReadingProgress) {
  const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
  if (totalChapters === 0) return 0;

  const normalizedBookId = normalizeBookId(progress.lastBookId, books);
  let completedChapters = 0;

  for (const book of books) {
    if (book.id === normalizedBookId) {
      const currentBookChapterCount = book.chapters.length;
      const withinBook = Math.max(0, Math.min(progress.lastChapter, currentBookChapterCount));
      completedChapters += withinBook;
      break;
    }
    completedChapters += book.chapters.length;
  }

  return Math.min(100, Math.round((completedChapters / totalChapters) * 100));
}
