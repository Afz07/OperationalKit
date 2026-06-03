import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-bold mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
