"use client";

import { useState } from "react";

export default function InviteForm({ orgSlug }: { orgSlug: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteLink("");
    setCopied(false);

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, orgSlug, role }),
    });

    if (res.ok) {
      const { token } = await res.json();
      setInviteLink(`${window.location.origin}/invite/${token}`);
      setEmail("");
    } else {
      const data = await res.json().catch(() => null);
      setError(
        typeof data?.error === "string"
          ? data.error
          : "Failed to create invitation. Try again."
      );
    }
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          required
          className="input flex-1"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
          className="input sm:w-32"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary whitespace-nowrap"
        >
          {loading ? "Creating…" : "Send invite"}
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {inviteLink && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm text-emerald-700">
            Invitation created. We&apos;ll email it if Resend is configured —
            otherwise share this link directly:
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-700"
            />
            <button
              type="button"
              onClick={copyLink}
              className="btn-secondary whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
