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
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          required
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Creating…" : "Send invite"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {inviteLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-green-700">
            Invitation created. We&apos;ll email it if Resend is configured —
            otherwise share this link directly:
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
              className="flex-1 border rounded-lg px-3 py-2 text-xs font-mono bg-white"
            />
            <button
              type="button"
              onClick={copyLink}
              className="border border-gray-300 text-sm px-3 py-2 rounded-lg hover:bg-white transition-colors whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
