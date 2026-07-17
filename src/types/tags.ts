export type TagRecord = {
  name: string;
  type: TagType;
  typeConfidence: number; // Confidence in the tag type, 0-10
  url?: string; // URL of the tag page, should not include the base URL / protocol
};

export enum TagType {
  WARNING = "WARNING", // "Creator Chose Not To Use Archive Warnings", "No Archive Warnings Apply", "Major Character Death", etc.
  RATING = "RATING", // "General Audiences", "Teen and Up Audiences", "Mature", "Explicit", etc.
  CATEGORY = "CATEGORY", // "Gen", "M/M", "F/F", "F/M", "Multi", "Other", etc.
  FANDOM = "FANDOM", // "Harry Potter", "Supernatural", "The Big Bang Theory", etc.
  CHARACTER = "CHARACTER", // "Harry Potter", "Hermione Granger", "Ron Weasley", etc.
  RELATIONSHIP = "RELATIONSHIP", // "Harry Potter & Hermione Granger", "Ron Weasley / Hermione Granger", etc.
  FREEFORM = "FREEFORM", // "Fluff", "Angst", "Hurt/Comfort", etc.
  MEDIA = "MEDIA", // Media tags like "Movie", "Book", "Game", etc.
  UNKNOWN = "UNKNOWN", // Sometimes we are unable to infer the tag type, so we set it to UNKNOWN
}

export enum TagAliasStatus {
  UNKNOWN = "UNKNOWN", // Initial state before checking
  CANONICAL = "CANONICAL", // This is the main canonical tag that others redirect to
  ALIAS = "ALIAS", // This tag redirects to a canonical tag
  ORPHANED = "ORPHANED", // Tag is neither canonical nor an alias
}

export enum TagAliasCheckStatus {
  WAITING = "WAITING", // Initial state, tag needs to be checked
  IN_PROGRESS = "IN_PROGRESS", // Currently being checked
  COMPLETED = "COMPLETED", // Check finished successfully
  FAILED = "FAILED", // Check failed, should retry later
}
