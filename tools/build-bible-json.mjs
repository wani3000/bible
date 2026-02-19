import fs from 'node:fs';
import path from 'node:path';

const SOURCE_DIR = path.resolve('tmp/kor_usfm');
const OUTPUT_DIR = path.resolve('public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'bible-kor-full.json');

const OT_CODES = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
];
const NT_CODES = [
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV',
];
const CANON = [...OT_CODES, ...NT_CODES];

function cleanVerseText(input) {
  return input
    .replace(/\\f\*?/g, ' ')
    .replace(/\\x\*?/g, ' ')
    .replace(/\\[a-z0-9]+\s?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseUsfm(content) {
  const lines = content.split(/\r?\n/);
  let code = '';
  let title = '';
  let currentChapter = 0;
  let chapters = [];
  let chapterMap = new Map();
  let currentVerse = null;

  const ensureChapter = (chapterNum) => {
    if (!chapterMap.has(chapterNum)) {
      const chapter = { chapter: chapterNum, verses: [] };
      chapterMap.set(chapterNum, chapter);
      chapters.push(chapter);
    }
    return chapterMap.get(chapterNum);
  };

  const flushVerse = () => {
    if (!currentVerse || currentChapter === 0) return;
    const chapter = ensureChapter(currentChapter);
    const cleaned = cleanVerseText(currentVerse.text);
    if (cleaned) {
      chapter.verses.push({ verse: currentVerse.verse, text: cleaned });
    }
    currentVerse = null;
  };

  for (const line of lines) {
    if (line.startsWith('\\id ')) {
      code = line.replace('\\id ', '').trim().split(' ')[0].toUpperCase();
      continue;
    }
    if (line.startsWith('\\toc2 ') || line.startsWith('\\h ')) {
      if (!title) {
        title = line.replace(/^\\toc2\s|^\\h\s/, '').trim();
      }
      continue;
    }

    if (line.startsWith('\\c ')) {
      flushVerse();
      const chap = Number(line.replace('\\c ', '').trim());
      if (Number.isFinite(chap)) {
        currentChapter = chap;
      }
      continue;
    }

    if (line.startsWith('\\v ')) {
      flushVerse();
      const m = line.match(/^\\v\s+(\d+)(.*)$/);
      if (m) {
        currentVerse = { verse: Number(m[1]), text: (m[2] || '').trim() };
      }
      continue;
    }

    if (currentVerse && !line.startsWith('\\')) {
      currentVerse.text += ` ${line.trim()}`;
    }
  }

  flushVerse();

  chapters = chapters
    .sort((a, b) => a.chapter - b.chapter)
    .map((chapter) => ({
      chapter: chapter.chapter,
      verses: chapter.verses.sort((a, b) => a.verse - b.verse),
    }));

  return { code, title: title || code, chapters };
}

const files = fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith('.usfm'));
const parsedByCode = new Map();

for (const file of files) {
  const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');
  const parsed = parseUsfm(content);
  if (!parsed.code) continue;
  parsedByCode.set(parsed.code, parsed);
}

const books = CANON.map((code) => {
  const parsed = parsedByCode.get(code);
  if (!parsed) {
    throw new Error(`Missing book code: ${code}`);
  }

  return {
    id: code.toLowerCase(),
    code,
    testament: OT_CODES.includes(code) ? 'OT' : 'NT',
    name: parsed.title,
    chapters: parsed.chapters,
  };
});

const totalChapters = books.reduce((sum, b) => sum + b.chapters.length, 0);
const totalVerses = books.reduce(
  (sum, b) => sum + b.chapters.reduce((s, c) => s + c.verses.length, 0),
  0,
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    {
      version: 'kor-usfm-full-v1',
      generatedAt: new Date().toISOString(),
      source: 'https://ebible.org/Scriptures/kor_usfm.zip',
      totalBooks: books.length,
      totalChapters,
      totalVerses,
      books,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`Saved: ${OUTPUT_FILE}`);
console.log(`Books: ${books.length}, Chapters: ${totalChapters}, Verses: ${totalVerses}`);
