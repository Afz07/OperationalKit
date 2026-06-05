import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { isGitHubAuthConfigured, isGoogleAuthConfigured } from "@/lib/env";

// Only register providers that actually have credentials, so the app boots
// (and the rest of the product stays usable) even with one or no OAuth apps set up.
const providers: Provider[] = [];

if (isGitHubAuthConfigured()) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    })
  );
}

if (isGoogleAuthConfigured()) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    // Fires once when a brand-new account is created. Enqueue a welcome email
    // as a background job (loaded dynamically so pg-boss isn't pulled into the
    // module graph of every page that imports auth).
    async createUser({ user }) {
      if (!user.email) return;
      try {
        const { enqueueJob, JOB_NAMES } = await import("@/lib/jobs");
        const { welcomeEmailHtml } = await import("@/lib/email");
        await enqueueJob(JOB_NAMES.SEND_EMAIL, {
          to: user.email,
          subject: "Welcome to OperationalKit",
          html: welcomeEmailHtml({
            name: user.name ?? "there",
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          }),
        });
      } catch (err) {
        console.error("[auth] failed to enqueue welcome email:", err);
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
