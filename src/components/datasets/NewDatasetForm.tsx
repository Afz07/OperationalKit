"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orgSlug: string;
}

export default function NewDatasetForm({ orgSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orgs/${orgSlug}/datasets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
    });

    setLoading(false);
    if (res.ok) {
      const dataset = await res.json();
      router.push(`/dashboard/${orgSlug}/datasets/${dataset.id}`);
    } else {
      setError("Failed to create dataset. Please try again.");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        New dataset
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">New dataset</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Traffic detection v1"
              className="input"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Description <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What images does this dataset contain?"
              rows={3}
              className="input resize-none"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary">
              {loading ? "Creating…" : "Create dataset"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setName("");
                setDescription("");
                setError("");
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
