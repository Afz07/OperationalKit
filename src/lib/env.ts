import { z } from "zod";

// ─── Required environment variables ───────────────────────────────────────────
// These must be present for the app to boot at all. Everything else is optional
// and the related feature degrades gracefully when its keys are missing.

const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
});

const HINTS: Record<string, string> = {
  DATABASE_URL: "PostgreSQL connection string — see .env.example",
  AUTH_SECRET: "generate with: openssl rand -base64 32",
};

// ─── Optional service detection ───────────────────────────────────────────────
// Used across the app to decide whether a feature is available, so a missing
// key shows a friendly "not configured" state instead of crashing.

export function isGitHubAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function getConfiguredOAuthProviders(): ("github" | "google")[] {
  const providers: ("github" | "google")[] = [];
  if (isGitHubAuthConfigured()) providers.push("github");
  if (isGoogleAuthConfigured()) providers.push("google");
  return providers;
}

// Stripe needs both a secret key and a Pro price ID to be usable.
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Dev-only password-less login is available outside production. This is never
// true on a real deployment, where NODE_ENV is "production".
export function isDevLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

// ─── Startup validation ───────────────────────────────────────────────────────
// Called once from instrumentation.ts when the server boots. Throws with a
// readable message for missing required vars, and warns (non-fatal) for optional
// services so the developer knows which features are turned off.

export function validateEnv(): void {
  const parsed = requiredEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => {
        const key = String(issue.path[0]);
        return `  ❌ ${key} — ${HINTS[key] ?? "required"}`;
      })
      .join("\n");
    throw new Error(
      `\n[env] Missing required environment variables:\n${missing}\n\n` +
        `Copy .env.example to .env and fill these in.\n`
    );
  }

  const warnings: string[] = [];

  if (getConfiguredOAuthProviders().length === 0) {
    warnings.push(
      "No OAuth provider configured (GitHub/Google) — users won't be able to sign in."
    );
  }
  if (!isStripeConfigured()) {
    warnings.push(
      "Stripe not configured — billing is disabled until STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID are set."
    );
  }
  if (!isResendConfigured()) {
    warnings.push(
      "Resend not configured — invitation emails won't be sent; share the invite link manually."
    );
  }
  if (isDevLoginEnabled()) {
    warnings.push(
      "Dev login is ENABLED (non-production) — anyone can sign in as an existing user without a password."
    );
  }

  if (warnings.length > 0) {
    console.warn("\n[env] " + warnings.map((w) => `⚠️  ${w}`).join("\n[env] ") + "\n");
  }
}
