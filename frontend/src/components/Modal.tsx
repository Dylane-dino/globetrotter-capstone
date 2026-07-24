"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-canopy-dark/60 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-ivory rounded-t-2xl sm:rounded-card shadow-lifted p-6 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-canopy">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-canopy/50 hover:bg-canopy/10 hover:text-canopy"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
