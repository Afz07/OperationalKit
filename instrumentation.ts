// Vercel serverless not supported for background jobs. Use Railway or self-hosted.
//
// This file uses the Next.js instrumentation API (stable in Next.js 15+) to
// auto-register all pg-boss job handlers once on server startup. Without this,
// handlers had to be registered manually via a GET /api/jobs/register request,
// which never happens automatically on any deployment.
//
// On Railway / self-hosted: this runs once when the Node.js server starts.
// On Vercel: this runs per-serverless-function cold-start and the pg-boss
// worker process terminates when the request ends — jobs will be enqueued
// but never processed. Use Railway or a dedicated worker process instead.

export async function register() {
  // Only run in the Node.js runtime, not during Edge or build phases.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Fail fast with a readable message if required env vars are missing, and warn
  // about any optional services (Stripe, Resend, OAuth) that are turned off.
  const { validateEnv } = await import("@/lib/env");
  validateEnv();

  try {
    const { registerJob, JOB_NAMES } = await import("@/lib/jobs");
    const { sendEmail, invitationEmailHtml } = await import("@/lib/email");
    const { db } = await import("@/lib/db");

    interface InvitationJobData {
      invitationId: string;
      organizationId: string;
      email: string;
      organizationName: string;
      inviterName: string;
      inviteUrl: string;
    }

    await registerJob<InvitationJobData>(
      JOB_NAMES.SEND_INVITATION,
      async (jobs) => {
        for (const job of jobs) {
          const { invitationId, organizationId, email, organizationName, inviterName, inviteUrl } =
            job.data;

          try {
            await sendEmail({
              to: email,
              subject: `You've been invited to join ${organizationName}`,
              html: invitationEmailHtml({ organizationName, inviterName, inviteUrl }),
            });

            await db.jobLog.create({
              data: {
                jobName: JOB_NAMES.SEND_INVITATION,
                jobId: job.id ?? invitationId,
                organizationId,
                status: "completed",
                payload: job.data as unknown as Record<string, string>,
                completedAt: new Date(),
              },
            });
          } catch (err) {
            await db.jobLog.create({
              data: {
                jobName: JOB_NAMES.SEND_INVITATION,
                jobId: job.id ?? invitationId,
                organizationId,
                status: "failed",
                payload: job.data as unknown as Record<string, string>,
                error: err instanceof Error ? err.message : String(err),
              },
            });
            // Re-throw so pg-boss marks the job as failed and can retry it.
            throw err;
          }
        }
      }
    );

    // Generic email job — used for welcome emails and any other one-off mail.
    interface SendEmailJobData {
      to: string;
      subject: string;
      html: string;
      organizationId?: string;
    }

    await registerJob<SendEmailJobData>(JOB_NAMES.SEND_EMAIL, async (jobs) => {
      for (const job of jobs) {
        const { to, subject, html, organizationId } = job.data;

        try {
          await sendEmail({ to, subject, html });

          await db.jobLog.create({
            data: {
              jobName: JOB_NAMES.SEND_EMAIL,
              jobId: job.id ?? to,
              organizationId: organizationId ?? null,
              status: "completed",
              payload: { to, subject },
              completedAt: new Date(),
            },
          });
        } catch (err) {
          await db.jobLog.create({
            data: {
              jobName: JOB_NAMES.SEND_EMAIL,
              jobId: job.id ?? to,
              organizationId: organizationId ?? null,
              status: "failed",
              payload: { to, subject },
              error: err instanceof Error ? err.message : String(err),
            },
          });
          // Re-throw so pg-boss marks the job as failed and can retry it.
          throw err;
        }
      }
    });

    console.log("[instrumentation] pg-boss job handlers registered");
  } catch (err) {
    console.error("[instrumentation] failed to register job handlers:", err);
  }
}
