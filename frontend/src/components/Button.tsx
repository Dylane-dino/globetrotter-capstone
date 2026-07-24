import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  isLoading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold text-sm px-6 py-3 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-laterite text-ivory hover:bg-laterite-dark",
    secondary: "bg-canopy text-ivory hover:bg-canopy-light",
    ghost: "bg-transparent text-canopy border border-canopy/30 hover:bg-canopy/5",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
