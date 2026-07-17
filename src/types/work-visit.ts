import type { TagRecord } from "@src/types/tags";

export type WorkVisitAuthor = {
  name: string;
  url: string | undefined;
};

// Full payload for the server's visit endpoint; local mode only consumes
// workId, currentChapter, and currentlySubscribed from it.
export type WorkVisitPayload = {
  workId: string;
  currentChapter: number | null; // Null if we cannot determine the current chapter (view full work)
  currentlySubscribed?: boolean;
  currentlyMarkedForLater?: boolean;
  work: {
    id: string;
    title: string;
    summary: string | null;
    language: string;
    wordCount: number;
    chapterCount: number;
    isComplete: boolean;
    publishedAt: string;
    kudos: number;
    hits: number;
    bookmarks: number;
    comments: number;
    updatedAt: string;
    authors: WorkVisitAuthor[];
    tags: TagRecord[];
  };
};
