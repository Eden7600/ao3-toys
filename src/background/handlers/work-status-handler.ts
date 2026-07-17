import { db } from "@src/common/db/Database";
import {
  applyHighestChapterReset,
  applyIgnored,
  applyReadingPosition,
  applySubscription,
  applyVisit,
  emptyWorkStatus,
} from "@src/common/local-work-status";
import type { ReadingPosition } from "@src/common/reading-position";
import type { WorkStatus, WorkStatusMap } from "@src/common/work-status";

/**
 * Local-mode work status: load row → pure reducer → persist. Lives in the
 * background so the data lands in the extension's IndexedDB (content-script
 * storage belongs to the page origin) and concurrent ratchets serialize
 * through Dexie transactions.
 */
export class WorkStatusHandler {
  async getStatuses(workIds: string[]): Promise<WorkStatusMap> {
    const rows = await db.workStatus.bulkGet(workIds);
    const statuses: WorkStatusMap = {};

    rows.forEach((row) => {
      if (row) {
        const { workId, ...status } = row;
        statuses[workId] = status;
      }
    });

    return statuses;
  }

  async recordVisit(input: {
    workId: string;
    chapter: number | null;
    subscribed?: boolean;
  }): Promise<WorkStatus> {
    return this.mutate(input.workId, (status) => {
      const visited = applyVisit(
        status,
        input.chapter,
        new Date().toISOString(),
      );

      // The work page tells us the subscribe state as a side effect;
      // undefined means it could not be determined, so keep what we have.
      return input.subscribed === undefined
        ? visited
        : applySubscription(
            visited,
            input.subscribed,
            new Date().toISOString(),
          );
    });
  }

  async setSubscribed(input: {
    workId: string;
    subscribed: boolean;
  }): Promise<WorkStatus> {
    return this.mutate(input.workId, (status) =>
      applySubscription(status, input.subscribed, new Date().toISOString()),
    );
  }

  async setIgnored(input: {
    workId: string;
    ignored: boolean;
  }): Promise<WorkStatus> {
    return this.mutate(input.workId, (status) =>
      applyIgnored(status, input.ignored),
    );
  }

  async resetHighestChapter(input: {
    workId: string;
    chapter: number;
  }): Promise<WorkStatus> {
    return this.mutate(input.workId, (status) =>
      applyHighestChapterReset(status, input.chapter),
    );
  }

  async setReadingPosition(input: {
    workId: string;
    position: ReadingPosition;
  }): Promise<WorkStatus> {
    return this.mutate(input.workId, (status) =>
      applyReadingPosition(status, input.position),
    );
  }

  private async mutate(
    workId: string,
    reduce: (status: WorkStatus) => WorkStatus,
  ): Promise<WorkStatus> {
    return db.transaction("rw", db.workStatus, async () => {
      const row = await db.workStatus.get(workId);
      const next = reduce(row ?? emptyWorkStatus());

      await db.workStatus.put({ ...next, workId });

      return next;
    });
  }
}
