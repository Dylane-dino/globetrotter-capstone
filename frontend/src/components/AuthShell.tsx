import Image from "next/image";
import Logo from "./Logo";

export default function AuthShell({
  heroImage,
  heroAlt,
  tagline,
  children,
}: {
  heroImage: string;
  heroAlt: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ivory">
      {/* Hero side */}
      <div className="relative h-[38vh] md:h-auto md:w-1/2 overflow-hidden bg-canopy">
        <Image
          src={heroImage}
          alt={heroAlt}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canopy-dark via-canopy/40 to-transparent" />
        <div className="grain-overlay" />

        <div className="absolute top-6 left-6 md:top-8 md:left-8">
          <Logo variant="light" size="sm" />
        </div>

        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex items-end gap-4">
          <div className="stamp-badge text-ivory">
            <span className="text-[11px] leading-tight">Yaoundé</span>
            <span className="text-[9px] leading-tight opacity-80">CMR</span>
            <span className="text-[9px] leading-tight opacity-80 mt-1">
              3.87°N 11.52°E
            </span>
          </div>
          <p className="hidden md:block font-display text-ivory text-xl max-w-[220px] leading-snug pb-2">
            {tagline}
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
