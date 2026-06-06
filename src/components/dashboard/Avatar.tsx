import Image from "next/image";

/**
 * Avatar with a graceful fallback: shows the user's photo when available,
 * otherwise a colored circle with their initials. Keeps team lists looking
 * intentional even before anyone uploads a picture.
 */
export default function Avatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  // Deterministic soft color from the name so each person stays consistent.
  const palettes = [
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  const palette = palettes[Math.abs(hash) % palettes.length];

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${palette}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || "?"}
    </span>
  );
}
