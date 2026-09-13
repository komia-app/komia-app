import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import MiaChat from "@/components/MiaChat";

export default function MiaFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with MIA"
          className="pointer-events-auto ml-auto flex items-center gap-2 rounded-full bg-[#EB8317] px-5 py-4 text-white shadow-[0_10px_30px_rgba(235,131,23,.45)]"
        >
          <span className="relative grid h-7 w-7 place-items-center">
            <Sparkles className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-[#F3C623]" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#F3C623]" />
          </span>
          <span className="text-sm font-extrabold tracking-wide">MIA</span>
        </button>
      </div>
      {open && <MiaChat onClose={() => setOpen(false)} />}
    </>
  );
}