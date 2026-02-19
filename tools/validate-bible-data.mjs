import fs from "node:fs";
import path from "node:path";

const file = path.resolve("public/data/bible-kor-full.json");
if (!fs.existsSync(file)) {
  throw new Error(`Missing data file: ${file}`);
}

const payload = JSON.parse(fs.readFileSync(file, "utf8"));
const books = payload.books ?? [];

if (books.length !== 66) {
  throw new Error(`Invalid books count: ${books.length} (expected 66)`);
}

for (const book of books) {
  if (!book.code) {
    throw new Error(`Unknown book code: ${book.code ?? "(missing)"}`);
  }
  if (!Array.isArray(book.chapters) || book.chapters.length === 0) {
    throw new Error(`Book has no chapter data: ${book.code}`);
  }
  let previousChapter = 0;
  for (const chapter of book.chapters) {
    if (typeof chapter.chapter !== "number" || chapter.chapter <= 0) {
      throw new Error(`Invalid chapter number in ${book.code}: ${chapter.chapter}`);
    }
    if (chapter.chapter <= previousChapter) {
      throw new Error(`Non-increasing chapter order in ${book.code}: ${chapter.chapter}`);
    }
    previousChapter = chapter.chapter;
    if (!chapter.verses || chapter.verses.length === 0) {
      throw new Error(`Empty chapter: ${book.code} ${chapter.chapter}`);
    }
  }
}

const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
const totalVerses = books.reduce(
  (sum, book) => sum + book.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.verses.length, 0),
  0,
);

if (totalChapters < 1100 || totalChapters > 1300) {
  throw new Error(`Invalid total chapters range: ${totalChapters}`);
}
if (totalVerses < 30000) {
  throw new Error(`Total verses look suspicious: ${totalVerses}`);
}

console.log(`Bible data validation passed: 66 books, ${totalChapters} chapters, ${totalVerses} verses`);
