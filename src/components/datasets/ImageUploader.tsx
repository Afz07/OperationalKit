"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orgSlug: string;
  datasetId: string;
}

export default function ImageUploader({ orgSlug, datasetId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploading(true);
    setProgress(`Uploading ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""}…`);

    const BATCH = 10;
    for (let i = 0; i < imageFiles.length; i += BATCH) {
      const batch = imageFiles.slice(i, i + BATCH);
      const form = new FormData();
      batch.forEach((f) => form.append("images", f));
      await fetch(`/api/orgs/${orgSlug}/datasets/${datasetId}/images`, {
        method: "POST",
        body: form,
      });
      setProgress(`Uploaded ${Math.min(i + BATCH, imageFiles.length)} / ${imageFiles.length}`);
    }

    setUploading(false);
    setProgress("");
    router.refresh();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        dragging
          ? "border-indigo-400 bg-indigo-50"
          : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
      } ${uploading ? "cursor-default opacity-70" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      {uploading ? (
        <>
          <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          <p className="text-sm text-zinc-600">{progress}</p>
        </>
      ) : (
        <>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 text-xl">
            +
          </div>
          <p className="text-sm font-medium text-zinc-700">
            Drop images here or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-400">JPEG, PNG, WebP, BMP supported</p>
        </>
      )}
    </div>
  );
}
