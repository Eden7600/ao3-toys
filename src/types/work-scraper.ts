import type { TagRecord } from "@src/types/tags";

export type WorkData = {
  id: string;
  title: string;
  summary: string | null;
  language: string;
  wordCount: number;
  chapterCount: number;
  isComplete: boolean;
  publishedAt: Date;
  updatedAt: Date;
  kudos: number | null;
  hits: number | null;
  bookmarks: number | null;
  comments: number | null;
  authors: Array<{
    name: string;
    url?: string;
  }>;
  tags: TagRecord[];
};
