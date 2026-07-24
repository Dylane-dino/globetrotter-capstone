interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function TextField({ label, id, ...props }: TextFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="font-stamp text-[11px] uppercase tracking-wider text-canopy/70"
      >
        {label}
      </label>
      <input
        id={fieldId}
        className="rounded-lg border border-canopy/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/30 focus:border-marigold focus:ring-1 focus:ring-marigold outline-none transition-colors"
        {...props}
      />
    </div>
  );
}
