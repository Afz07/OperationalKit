"use client";

export default function UpgradeButton({ orgSlug }: { orgSlug: string }) {
  async function handleClick() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgSlug, plan: "PRO" }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <button
      onClick={handleClick}
      className="bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
    >
      Upgrade to Pro →
    </button>
  );
}
