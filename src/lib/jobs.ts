import { PgBoss } from "pg-boss";
import type { Job, SendOptions } from "pg-boss";

let boss: PgBoss | null = null;

export async function getJobQueue(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss(process.env.DATABASE_URL!);
    await boss.start();

    boss.on("error", (error: unknown) => {
      console.error("[jobs] pg-boss error:", error);
    });
  }
  return boss;
}

// Register a job handler — pg-boss v10 handler receives Job<T>[]
export async function registerJob<T extends object>(
  jobName: string,
  handler: (jobs: Job<T>[]) => Promise<void>
) {
  const queue = await getJobQueue();
  await queue.work<T>(jobName, handler);
}

// Enqueue a job
export async function enqueueJob<T extends object>(
  jobName: string,
  data: T,
  options?: SendOptions
): Promise<string | null> {
  const queue = await getJobQueue();
  return queue.send(jobName, data, options ?? {});
}

// ─── Built-in job definitions ─────────────────────────────────────────────────

export const JOB_NAMES = {
  SEND_EMAIL: "send-email",
  SEND_INVITATION: "send-invitation",
  STRIPE_SYNC: "stripe-sync",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
