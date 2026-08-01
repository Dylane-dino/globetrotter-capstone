import Image from "next/image";
import Logo from "./Logo";

export default function AuthShell({
  heroImage,
  heroAlt,
  eyebrow,
  headline,
  tagline,
  supporting,
  children,
}: {
  heroImage: string;
  heroAlt: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  supporting: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-canopy-dark">
      {/* Full-bleed photo background */}
      <Image
        src={heroImage}
        alt={heroAlt}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      {/* Uniform dark tint so both the headline and the glass card stay
          legible regardless of how bright the underlying photo is */}
      <div className="absolute inset-0 bg-canopy-dark/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-canopy-dark/80 via-canopy-dark/20 to-canopy-dark/40 md:bg-gradient-to-r md:from-canopy-dark/70 md:via-canopy-dark/25 md:to-canopy-dark/55" />
      <div className="grain-overlay" />

      {/* Logo, top-left */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 z-10">
        <Logo onPhoto size="sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row md:items-center">
        {/* Headline block */}
        <div className="order-2 flex flex-col justify-end px-6 pt-4 pb-10 md:order-1 md:justify-center md:px-16 md:py-10 md:flex-1 md:max-w-xl">
          <span className="font-stamp text-xs uppercase tracking-[0.2em] text-marigold mb-3">
            {eyebrow}
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] text-ivory drop-shadow-lg">
            {headline}
          </h1>
          <p className="mt-5 text-lg sm:text-xl font-semibold text-ivory/95 max-w-md">
            {tagline}
          </p>
          <p className="mt-3 text-sm sm:text-base text-ivory/75 max-w-sm leading-relaxed">
            {supporting}
          </p>
        </div>

        {/* Glass card */}
        <div className="order-1 px-6 pt-24 pb-6 md:order-2 md:pt-0 md:pb-0 md:px-16 md:flex-shrink-0 md:w-[420px]">
          <div className="w-full rounded-2xl border border-white/25 bg-white/15 backdrop-blur-2xl shadow-lifted p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
