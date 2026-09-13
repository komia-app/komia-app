import React from "react";
import { cn } from "@/lib/utils";

export default function ScaleSelect({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
              active ? "border-[#F3C623] bg-[#F3C623]/10" : "border-[#10375C]/15 bg-white"
            )}
          >
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", active ? "border-[#F3C623] bg-[#F3C623]" : "border-slate-300")}>
              {active && <span className="h-2.5 w-2.5 rounded-full bg-[#10375C]" />}
            </span>
            <span>
              <span className="block text-sm font-bold text-[#10375C]">{opt.label}</span>
              {opt.sublabel && <span className="block text-xs text-slate-500">{opt.sublabel}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}