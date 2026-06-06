"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        typeof data?.error === "string"
          ? data.error
          : "Failed to create workspace. Please try again."
      );
      setLoading(false);
      return;
    }

    const org = await res.json();
    router.push(`/dashboard/${org.slug}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="card w-full max-w-sm p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">
          Create your workspace
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          This is where your team collaborates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              className="input"
              required
              minLength={2}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Creating…" : "Create workspace →"}
          </button>
        </form>
      </div>
    </div>
  );
}
