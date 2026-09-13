import React from "react";
import { X } from "lucide-react";

export default function RankSelect({ options, value, onChange, max = 5 }) {
  const available = options.filter((o) => !value.includes(o));
  const add = (opt) => {
    if (value.length >= max) return;
    onChange([...value, opt]);
  };
  const remove = (opt) => onChange(value.filter((v) => v !== opt));

  return (
    <div>
      <div className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Your top {max}</p>
        <div className="space-y-2">
          {value.map((opt, i) => (
            <div key={opt} className="flex items-center gap-3 rounded-2xl bg-[#10375C] px-4 py-3 text-white">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F3C623] text-sm font-black text-[#10375C]">{i + 1}</span>
              <span className="flex-1 text-sm font-bold">{opt}</span>
              <button type="button" onClick={() => remove(opt)} aria-label="Remove">
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          ))}
          {!value.length && (
            <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-slate-400">
              Tap options below to rank them in order.
            </p>
          )}
        </div>
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Options</p>
      <div className="flex flex-wrap gap-2">
        {available.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => add(opt)}
            disabled={value.length >= max}
            className="rounded-full border border-[#10375C]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#10375C] disabled:opacity-40"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}