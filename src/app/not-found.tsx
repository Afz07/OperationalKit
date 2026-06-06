import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <p className="mb-4 text-7xl font-bold text-zinc-200">404</p>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">
          Page not found
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className="btn-primary">
          Go home
        </Link>
      </div>
    </div>
  );
}
