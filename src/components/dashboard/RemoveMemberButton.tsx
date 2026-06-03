"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  membershipId: string;
  orgSlug: string;
}

export default function RemoveMemberButton({ membershipId, orgSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this member from the workspace?")) return;
    setLoading(true);

    await fetch(`/api/orgs/${orgSlug}/members/${membershipId}`, {
      method: "DELETE",
    });

    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Remove"}
    </button>
  );
}
