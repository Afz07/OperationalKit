import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import {
  isGitHubAuthConfigured,
  isGoogleAuthConfigured,
  isDevLoginEnabled,
} from "@/lib/env";

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

// Dev-only password-less login: sign in as any existing user (e.g. the seeded
// demo account) without OAuth. Guarded by NODE_ENV so it can never be registered
// on a real deployment.
if (isDevLoginEnabled()) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" && credentials.email
            ? credentials.email
            : "alice@example.com";
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  // JWT sessions are required for the Credentials (dev login) provider, and work
  // fine with the adapter — users and accounts are still persisted to the DB.
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
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
