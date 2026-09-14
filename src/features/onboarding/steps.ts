import type { TasteProfile } from "@/types/entities";

export const CUISINES = ["Italian", "Japanese", "Mexican", "Colombian", "Peruvian", "Korean", "Chinese", "Mediterranean", "Indian", "French", "American", "Arabic", "Vegetarian", "Vegan", "Fusion", "Street Food", "Other"];
export const EXPERIENCES = ["Casual and relaxed", "Fine dining", "Date", "With friends", "Family", "Brunch", "Cafe", "Bar", "Street food", "Something different", "Celebration"];
export const PRICES: { value: string; label: string; sublabel: string }[] = [
  { value: "$", label: "$ Budget friendly", sublabel: "Affordable, everyday eats" },
  { value: "$$", label: "$$ Mid range", sublabel: "Comfortable, balanced" },
  { value: "$$$", label: "$$$ Special occasion", sublabel: "Premium dining" },
  { value: "$$$$", label: "$$$$ High end", sublabel: "Luxury experiences" },
  { value: "depends", label: "It depends on the occasion", sublabel: "Flexible based on context" },
];
export const ADVENTURE: { value: number; label: string }[] = [
  { value: 1, label: "1. I prefer to stick to what I know" },
  { value: 2, label: "2. I sometimes try something new" },
  { value: 3, label: "3. I am open to experimenting" },
  { value: 4, label: "4. I love discovering new places" },
  { value: 5, label: "5. I always want to try something different" },
];
export const FLAVORS = ["Sweet", "Salty", "Spicy", "Sour", "Umami", "Smoky", "Spiced", "Creamy", "Fresh", "Light", "Intense"];
export const PRIORITIES = ["Food quality", "Taste", "Price", "Atmosphere", "Service", "Location", "Originality", "Presentation", "Portion size", "Reputation", "Overall experience"];
export const AVOID = ["Very spicy food", "Very sweet food", "Very greasy food", "Seafood", "Fish", "Meat", "Dairy", "Gluten", "Specific ingredients", "Very expensive restaurants", "Very loud places", "Very formal restaurants", "Restaurant chains", "Other"];

export interface StepInfo {
  question: string;
  hint: string;
}

export const STEPS: StepInfo[] = [
  { question: "What types of food do you enjoy the most?", hint: "Select up to 5." },
  { question: "When you go out to eat, what kind of experience are you looking for?", hint: "Select as many as you like." },
  { question: "How much do you usually like to spend at a restaurant?", hint: "Pick one." },
  { question: "How adventurous are you with food?", hint: "Rate from 1 to 5." },
  { question: "What flavors do you enjoy the most?", hint: "Select the ones you like most." },
  { question: "What matters most to you when choosing a restaurant?", hint: "Rank your top 5." },
  { question: "What do you not like or want to avoid?", hint: "Select everything that applies." },
];

export const EMPTY_PROFILE: TasteProfile = {
  cuisines: [],
  other_cuisines: "",
  experiences: [],
  price: null,
  adventurousness: null,
  flavors: [],
  disliked_flavors: "",
  priorities: [],
  avoid: [],
  avoid_notes: "",
};

export function canContinue(step: number, data: TasteProfile): boolean {
  switch (step) {
    case 0: return data.cuisines.length >= 1;
    case 1: return data.experiences.length >= 1;
    case 2: return data.price !== null;
    case 3: return data.adventurousness !== null;
    case 4: return data.flavors.length >= 1;
    case 5: return data.priorities.length === 5;
    default: return true;
  }
}
