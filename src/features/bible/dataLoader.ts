import type { Book } from "./types";

type BiblePayload = {
  version: string;
  generatedAt: string;
  source: string;
  totalBooks: number;
  totalChapters: number;
  totalVerses: number;
  books: Book[];
};

export async function loadBibleFromPublic(): Promise<BiblePayload> {
  const response = await fetch("/data/bible-kor-full.json", { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load bible data: ${response.status}`);
  }
  return (await response.json()) as BiblePayload;
}
