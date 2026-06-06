"use client";

import { useState } from "react";

export default function UpgradeButton({ orgSlug }: { orgSlug: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, plan: "PRO" }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary">
      {loading ? "Redirecting…" : "Upgrade to Pro →"}
    </button>
  );
}
