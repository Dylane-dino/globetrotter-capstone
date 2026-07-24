import { Compass } from "lucide-react";

export default function Logo({
  variant = "dark",
  size = "md",
}: {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const textColor = variant === "light" ? "text-ivory" : "text-canopy";
  const sizes = {
    sm: "text-lg gap-1.5",
    md: "text-2xl gap-2",
    lg: "text-4xl gap-3",
  };
  const iconSizes = { sm: 18, md: 24, lg: 32 };

  return (
    <div className={`flex items-center ${sizes[size]} ${textColor}`}>
      <Compass size={iconSizes[size]} strokeWidth={2} className="text-laterite shrink-0" />
      <span className="font-display font-semibold tracking-tight">
        GlobeTrotter
      </span>
    </div>
  );
}
