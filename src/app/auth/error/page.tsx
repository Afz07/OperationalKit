import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or already been used.",
  Default: "An error occurred during sign in. Please try again.",
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? "Default"] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="card w-full max-w-sm p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
          <svg
            className="h-6 w-6 text-rose-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mb-2 text-lg font-semibold text-zinc-900">
          Authentication error
        </h1>
        <p className="mb-6 text-sm text-zinc-500">{message}</p>
        <Link href="/auth/signin" className="btn-primary">
          Try again
        </Link>
      </div>
    </div>
  );
}
