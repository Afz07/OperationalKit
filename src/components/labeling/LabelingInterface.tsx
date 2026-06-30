"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface LabelClass {
  id: string;
  name: string;
  color: string;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelClassId: string;
  labelClass: LabelClass;
}

interface Props {
  imageId: string;
  imageData: string;
  mimeType: string;
  initialAnnotations: Annotation[];
  initialLabelClasses: LabelClass[];
  prevImageId?: string;
  nextImageId?: string;
  orgSlug: string;
  datasetId: string;
  filename: string;
}

export default function LabelingInterface({
  imageId,
  imageData,
  mimeType,
  initialAnnotations,
  initialLabelClasses,
  prevImageId,
  nextImageId,
  orgSlug,
  datasetId,
  filename,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLabelClassId, setActiveLabelClassId] = useState<string | null>(
    initialLabelClasses[0]?.id ?? null
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>(initialLabelClasses);
  const [newClassName, setNewClassName] = useState("");
  const [newClassColor, setNewClassColor] = useState("#6366f1");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const ann of annotations) {
      const px = ann.x * canvas.width;
      const py = ann.y * canvas.height;
      const pw = ann.width * canvas.width;
      const ph = ann.height * canvas.height;
      const color = ann.labelClass.color;
      const isSelected = ann.id === selectedId;

      ctx.fillStyle = color + "28";
      ctx.fillRect(px, py, pw, ph);

      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeRect(px, py, pw, ph);

      const label = ann.labelClass.name;
      ctx.font = "bold 11px system-ui, sans-serif";
      const textW = ctx.measureText(label).width + 8;
      ctx.fillStyle = color;
      ctx.fillRect(px, py - 17, textW, 17);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, px + 4, py - 4);
    }

    if (isDrawing && drawStart && drawCurrent) {
      const activeClass = labelClasses.find((c) => c.id === activeLabelClassId);
      const color = activeClass?.color ?? "#6366f1";
      const px = Math.min(drawStart.x, drawCurrent.x);
      const py = Math.min(drawStart.y, drawCurrent.y);
      const pw = Math.abs(drawCurrent.x - drawStart.x);
      const ph = Math.abs(drawCurrent.y - drawStart.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
      ctx.fillStyle = color + "14";
      ctx.fillRect(px, py, pw, ph);
    }
  }, [annotations, isDrawing, drawStart, drawCurrent, activeLabelClassId, labelClasses, selectedId, imgLoaded]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setImgLoaded(true);
    };
    img.src = `data:${mimeType};base64,${imageData}`;
  }, [imageData, mimeType]);

  useEffect(() => {
    draw();
  }, [draw]);

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!activeLabelClassId) return;
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current!;

    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];
      const px = ann.x * canvas.width;
      const py = ann.y * canvas.height;
      const pw = ann.width * canvas.width;
      const ph = ann.height * canvas.height;
      if (pos.x >= px && pos.x <= px + pw && pos.y >= py && pos.y <= py + ph) {
        setSelectedId(ann.id === selectedId ? null : ann.id);
        return;
      }
    }

    setSelectedId(null);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    setDrawCurrent(getCanvasPos(e));
  }

  async function handleMouseUp() {
    if (!isDrawing || !drawStart || !drawCurrent || !activeLabelClassId) {
      setIsDrawing(false);
      return;
    }

    const canvas = canvasRef.current!;
    const rawX = Math.min(drawStart.x, drawCurrent.x);
    const rawY = Math.min(drawStart.y, drawCurrent.y);
    const rawW = Math.abs(drawCurrent.x - drawStart.x);
    const rawH = Math.abs(drawCurrent.y - drawStart.y);

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);

    if (rawW < 5 || rawH < 5) return;

    const x = rawX / canvas.width;
    const y = rawY / canvas.height;
    const width = rawW / canvas.width;
    const height = rawH / canvas.height;

    const res = await fetch(`/api/images/${imageId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelClassId: activeLabelClassId, x, y, width, height }),
    });

    if (res.ok) {
      const ann: Annotation = await res.json();
      setAnnotations((prev) => [...prev, ann]);
    }
  }

  async function deleteAnnotation(id: string) {
    await fetch(`/api/images/${imageId}/annotations/${id}`, { method: "DELETE" });
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function addLabelClass() {
    if (!newClassName.trim()) return;
    const res = await fetch(
      `/api/orgs/${orgSlug}/datasets/${datasetId}/label-classes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName.trim(), color: newClassColor }),
      }
    );
    if (res.ok) {
      const cls: LabelClass = await res.json();
      setLabelClasses((prev) => [...prev, cls]);
      setActiveLabelClassId(cls.id);
      setNewClassName("");
    }
  }

  async function deleteLabelClass(id: string) {
    await fetch(`/api/orgs/${orgSlug}/datasets/${datasetId}/label-classes/${id}`, {
      method: "DELETE",
    });
    setLabelClasses((prev) => prev.filter((c) => c.id !== id));
    setAnnotations((prev) => prev.filter((a) => a.labelClassId !== id));
    if (activeLabelClassId === id) {
      const remaining = labelClasses.filter((c) => c.id !== id);
      setActiveLabelClassId(remaining[0]?.id ?? null);
    }
  }

  async function exportDataset(format: "coco" | "yolo") {
    const res = await fetch(
      `/api/orgs/${orgSlug}/datasets/${datasetId}/export?format=${format}`
    );
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.data ?? data.files, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset-${format}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-zinc-950">
      {/* Canvas area */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 shrink-0">
          <a
            href={`/dashboard/${orgSlug}/datasets/${datasetId}`}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to dataset
          </a>
          <span className="text-xs text-zinc-500 truncate max-w-xs">{filename}</span>
          <div className="flex gap-2 items-center">
            {prevImageId && (
              <a
                href={`/dashboard/${orgSlug}/datasets/${datasetId}/label/${prevImageId}`}
                className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                ← Prev
              </a>
            )}
            {nextImageId && (
              <a
                href={`/dashboard/${orgSlug}/datasets/${datasetId}/label/${nextImageId}`}
                className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden p-6 min-h-0">
          {!imgLoaded ? (
            <div className="text-zinc-600 text-sm">Loading image…</div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  setDrawStart(null);
                  setDrawCurrent(null);
                }
              }}
              className="max-w-full max-h-full cursor-crosshair rounded"
              style={{ objectFit: "contain" }}
            />
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900 overflow-hidden">
        {/* Label Classes */}
        <div className="border-b border-zinc-800 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Label classes
          </h3>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {labelClasses.length === 0 && (
              <p className="text-xs text-zinc-600">No classes yet.</p>
            )}
            {labelClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => setActiveLabelClassId(cls.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  activeLabelClassId === cls.id
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: cls.color }}
                  />
                  <span className="font-medium truncate">{cls.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLabelClass(cls.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all text-xs leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-1.5">
            <input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLabelClass()}
              placeholder="New class name"
              className="flex-1 min-w-0 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <input
              type="color"
              value={newClassColor}
              onChange={(e) => setNewClassColor(e.target.value)}
              className="h-[30px] w-7 cursor-pointer rounded border border-zinc-700 bg-zinc-800 p-0.5"
            />
            <button
              onClick={addLabelClass}
              className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Annotations */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Annotations{" "}
            <span className="font-normal text-zinc-600">({annotations.length})</span>
          </h3>
          {annotations.length === 0 ? (
            <p className="text-xs text-zinc-600 leading-relaxed">
              {labelClasses.length === 0
                ? "Add a label class first, then drag on the image to annotate."
                : activeLabelClassId
                ? "Drag on the image to draw a bounding box."
                : "Select a class above, then drag on the image."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {annotations.map((ann, i) => (
                <li
                  key={ann.id}
                  onClick={() => setSelectedId(ann.id === selectedId ? null : ann.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    selectedId === ann.id
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: ann.labelClass.color }}
                    />
                    <span className="font-medium">{ann.labelClass.name}</span>
                    <span className="text-zinc-600">#{i + 1}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnnotation(ann.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Export */}
        <div className="border-t border-zinc-800 p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
            Export dataset
          </h3>
          <button
            onClick={() => exportDataset("coco")}
            className="w-full rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors text-left"
          >
            COCO JSON
          </button>
          <button
            onClick={() => exportDataset("yolo")}
            className="w-full rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors text-left"
          >
            YOLO format
          </button>
        </div>
      </div>
    </div>
  );
}
