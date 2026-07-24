import { Compass } from "lucide-react";

export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-canopy/60">
      <Compass size={28} className="animate-spin" />
      {label && <p className="font-stamp text-xs uppercase tracking-wider">{label}</p>}
    </div>
  );
}
