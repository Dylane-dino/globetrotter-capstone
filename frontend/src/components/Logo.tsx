import Image from "next/image";

export default function Logo({
  onPhoto = false,
  size = "md",
}: {
  /** true when placed directly over a photo (adds a drop-shadow for legibility) */
  onPhoto?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const heights = { sm: 28, md: 36, lg: 52 };
  const height = heights[size];
  // Source lockup is 624x253
  const width = Math.round(height * (624 / 253));

  return (
    <Image
      src="/logo.png"
      alt="GlobeTrotter Travel Assistant"
      width={width}
      height={height}
      priority
      className={onPhoto ? "drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]" : ""}
      style={{ height: `${height}px`, width: "auto" }}
    />
  );
}
