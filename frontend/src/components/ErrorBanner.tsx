import { AlertCircle } from "lucide-react";

export default function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-laterite/10 border border-laterite/30 px-3 py-2.5 text-sm text-laterite-dark">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
