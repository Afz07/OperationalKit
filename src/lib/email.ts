import { Resend } from "resend";
import { isResendConfigured } from "@/lib/env";

export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "noreply@operationalkit.dev";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Graceful degradation: when Resend isn't configured, skip sending instead of
  // throwing. Invitations still create a shareable link the admin can copy.
  if (!isResendConfigured()) {
    console.warn(
      `[email] Resend not configured — skipping email to ${to} ("${subject}")`
    );
    return null;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function invitationEmailHtml(opts: {
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to join ${opts.organizationName}</h2>
      <p>${opts.inviterName} has invited you to join their workspace on OperationalKit.</p>
      <a href="${opts.inviteUrl}"
         style="display:inline-block;padding:12px 24px;background:#000;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0;">
        Accept Invitation
      </a>
      <p style="color:#666;font-size:14px;">This invitation expires in 7 days.</p>
    </div>
  `;
}

export function welcomeEmailHtml(opts: { name: string; dashboardUrl: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to OperationalKit, ${opts.name}!</h2>
      <p>Your account is ready. Start building your SaaS today.</p>
      <a href="${opts.dashboardUrl}"
         style="display:inline-block;padding:12px 24px;background:#000;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0;">
        Go to Dashboard
      </a>
    </div>
  `;
}
