import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BrandMark from "@/components/BrandMark";
import ChipSelect from "@/components/onboarding/ChipSelect";
import RankSelect from "@/components/onboarding/RankSelect";
import ScaleSelect from "@/components/onboarding/ScaleSelect";

const CUISINES = ["Italian", "Japanese", "Mexican", "Colombian", "Peruvian", "Korean", "Chinese", "Mediterranean", "Indian", "French", "American", "Arabic", "Vegetarian", "Vegan", "Fusion", "Street Food", "Other"];
const EXPERIENCES = ["Casual & Relaxed", "Fine Dining", "Date / Romantic", "With Friends", "Family", "Brunch", "Café", "Bar", "Street Food", "Something Different", "Celebration"];
const PRICES = [
  { value: "$", label: "$ — Budget Friendly", sublabel: "Affordable, everyday eats" },
  { value: "$$", label: "$$ — Mid Range", sublabel: "Comfortable, balanced" },
  { value: "$$$", label: "$$$ — Special Occasion", sublabel: "Premium dining" },
  { value: "$$$$", label: "$$$$ — High End", sublabel: "Luxury experiences" },
  { value: "depends", label: "It depends on the occasion", sublabel: "Flexible based on context" },
];
const ADVENTURE = [
  { value: 1, label: "1 — I prefer to stick to what I know" },
  { value: 2, label: "2 — I sometimes try something new" },
  { value: 3, label: "3 — I'm open to experimenting" },
  { value: 4, label: "4 — I love discovering new places" },
  { value: 5, label: "5 — I always want to try something different" },
];
const FLAVORS = ["Sweet", "Salty", "Spicy", "Sour", "Umami", "Smoky", "Spiced", "Creamy", "Fresh", "Light", "Intense"];
const PRIORITIES = ["Food Quality", "Taste", "Price", "Atmosphere", "Service", "Location", "Originality", "Presentation", "Portion Size", "Reputation", "Overall Experience"];
const AVOID = ["Very Spicy Food", "Very Sweet Food", "Very Greasy Food", "Seafood", "Fish", "Meat", "Dairy", "Gluten", "Specific Ingredients", "Very Expensive Restaurants", "Very Loud Places", "Very Formal Restaurants", "Restaurant Chains", "Other"];

const TITLES = [
  { emoji: "🍜", q: "What types of food do you enjoy the most?", hint: "Select up to 5." },
  { emoji: "🍽️", q: "When you go out to eat, what kind of experience are you looking for?", hint: "Select multiple." },
  { emoji: "💰", q: "How much do you usually like to spend at a restaurant?", hint: "Pick one." },
  { emoji: "🌎", q: "How adventurous are you with food?", hint: "Rate from 1 to 5." },
  { emoji: "🌶️", q: "What flavors do you enjoy the most?", hint: "Select the ones you like most." },
  { emoji: "⭐", q: "What matters most to you when choosing a restaurant?", hint: "Rank your top 5." },
  { emoji: "🚫", q: "What things do you NOT like or want to avoid?", hint: "Select everything that applies." },
];

const EMPTY = {
  cuisines: [], other_cuisines: "",
  experiences: [],
  price: null,
  adventurousness: null,
  flavors: [], disliked_flavors: "",
  priorities: [],
  avoid: [], avoid_notes: "",
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const total = 7;

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const canContinue = () => {
    switch (step) {
      case 0: return data.cuisines.length >= 1;
      case 1: return data.experiences.length >= 1;
      case 2: return !!data.price;
      case 3: return data.adventurousness != null;
      case 4: return data.flavors.length >= 1;
      case 5: return data.priorities.length === 5;
      case 6: return true;
      default: return true;
    }
  };

  const next = async () => {
    if (step < total - 1) { setStep(step + 1); return; }
    setSubmitting(true);
    try {
      await base44.auth.updateMe({ taste_profile: data, onboarding_completed: true });
      window.location.href = "/";
    } catch {
      setSubmitting(false);
      alert("Something went wrong saving your profile. Please try again.");
    }
  };

  const back = () => { if (step > 0) setStep(step - 1); };
  const t = TITLES[step];

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="px-5 pt-6"><BrandMark /></header>

        <div className="px-5 pt-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#F3C623]" : "bg-slate-200"}`} />
            ))}
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Step {step + 1} of {total}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">{t.emoji}</span>
            <div>
              <h1 className="text-xl font-black leading-tight text-[#10375C]">{t.q}</h1>
              <p className="mt-1 text-sm text-slate-500">{t.hint}</p>
            </div>
          </div>

          <div className="mt-6">
            {step === 0 && (
              <>
                <ChipSelect options={CUISINES} value={data.cuisines} onChange={(v) => set("cuisines", v)} max={5} />
                {data.cuisines.includes("Other") && (
                  <input
                    value={data.other_cuisines}
                    onChange={(e) => set("other_cuisines", e.target.value)}
                    placeholder="Other cuisines you enjoy"
                    className="mt-3 w-full rounded-xl border border-[#10375C]/15 bg-white px-4 py-3 text-sm outline-none"
                  />
                )}
              </>
            )}
            {step === 1 && <ChipSelect options={EXPERIENCES} value={data.experiences} onChange={(v) => set("experiences", v)} />}
            {step === 2 && <ScaleSelect options={PRICES} value={data.price} onChange={(v) => set("price", v)} />}
            {step === 3 && <ScaleSelect options={ADVENTURE} value={data.adventurousness} onChange={(v) => set("adventurousness", v)} />}
            {step === 4 && (
              <>
                <ChipSelect options={FLAVORS} value={data.flavors} onChange={(v) => set("flavors", v)} />
                <p className="mt-5 text-sm font-bold text-[#10375C]">Are there any flavors you dislike?</p>
                <input
                  value={data.disliked_flavors}
                  onChange={(e) => set("disliked_flavors", e.target.value)}
                  placeholder="e.g. bitter, overly sweet..."
                  className="mt-2 w-full rounded-xl border border-[#10375C]/15 bg-white px-4 py-3 text-sm outline-none"
                />
              </>
            )}
            {step === 5 && <RankSelect options={PRIORITIES} value={data.priorities} onChange={(v) => set("priorities", v)} max={5} />}
            {step === 6 && (
              <>
                <ChipSelect options={AVOID} value={data.avoid} onChange={(v) => set("avoid", v)} />
                {(data.avoid.includes("Specific Ingredients") || data.avoid.includes("Other")) && (
                  <input
                    value={data.avoid_notes}
                    onChange={(e) => set("avoid_notes", e.target.value)}
                    placeholder="Tell us more"
                    className="mt-3 w-full rounded-xl border border-[#10375C]/15 bg-white px-4 py-3 text-sm outline-none"
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-[#f8fafb] px-5 py-4">
          <button
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-xl border border-[#10375C]/15 px-4 py-3 text-sm font-bold text-[#10375C] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />Back
          </button>
          <button
            onClick={next}
            disabled={!canContinue() || submitting}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#10375C] py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {step === total - 1 ? (
              <><Sparkles className="h-4 w-4" />{submitting ? "Saving..." : "Build my profile"}</>
            ) : (
              <>Continue <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}