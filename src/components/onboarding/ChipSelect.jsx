import React from "react";
import { cn } from "@/lib/utils";

export default function ChipSelect({ options, value, onChange, max }) {
  const toggle = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "rounded-full border px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "border-[#F3C623] bg-[#F3C623] text-[#10375C]"
                : "border-[#10375C]/15 bg-white text-[#10375C] hover:border-[#10375C]/30"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}