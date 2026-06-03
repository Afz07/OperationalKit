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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">✕</span>
        </div>
        <h1 className="text-lg font-bold mb-2">Authentication error</h1>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-block bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
