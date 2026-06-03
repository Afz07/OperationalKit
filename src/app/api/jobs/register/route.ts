import { NextResponse } from "next/server";
import { registerJob, JOB_NAMES } from "@/lib/jobs";
import { sendEmail, invitationEmailHtml } from "@/lib/email";
import { db } from "@/lib/db";

interface InvitationJobData {
  invitationId: string;
  email: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}

// Call once on startup to register all background job handlers.
export async function GET() {
  await registerJob<InvitationJobData>(
    JOB_NAMES.SEND_INVITATION,
    async (jobs) => {
      for (const job of jobs) {
        const { invitationId, email, organizationName, inviterName, inviteUrl } =
          job.data;

        await sendEmail({
          to: email,
          subject: `You've been invited to join ${organizationName}`,
          html: invitationEmailHtml({ organizationName, inviterName, inviteUrl }),
        });

        await db.jobLog.create({
          data: {
            jobName: JOB_NAMES.SEND_INVITATION,
            jobId: job.id ?? invitationId,
            status: "completed",
            payload: job.data as unknown as Record<string, string>,
            completedAt: new Date(),
          },
        });
      }
    }
  );

  return NextResponse.json({ status: "handlers registered" });
}
