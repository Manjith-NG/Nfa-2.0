export const ALL_SCOPE = "__ALL__";

export function ScopeChipPicker({
  label,
  allLabel,
  value,
  options,
  onChange,
  showAllOption = true,
  className = "",
}: {
  label: string;
  allLabel?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  showAllOption?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label className="nfa-label">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {showAllOption && allLabel && (
          <button
            type="button"
            onClick={() => onChange(ALL_SCOPE)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              value === ALL_SCOPE
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-nfa-border text-slate-600 hover:bg-slate-50"
            }`}
          >
            {allLabel}
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              value === opt.value
                ? "border-nfa-primary bg-nfa-primary/10 text-nfa-primary"
                : "border-nfa-border text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {options.length === 0 && (
        <p className="text-sm text-amber-700">Loading club sections…</p>
      )}
      {showAllOption && allLabel && (
        <p className="text-xs text-slate-500">
          Select one only, or {allLabel.toLowerCase()} as the fallback when no specific flow exists.
        </p>
      )}
    </div>
  );
}
