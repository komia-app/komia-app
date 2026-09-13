import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Star, MapPin, Phone, Globe, Clock, Trophy,
  Bookmark, Plus, Utensils, Wallet, ChefHat, Check, Tag,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { saveRestaurant, logVisit } from "@/lib/restaurantActions";
import LogVisitDialog from "@/components/LogVisitDialog";

const ATTRIBUTES = [
  { key: "vegetarian_friendly", label: "Vegetarian Friendly" },
  { key: "vegan_friendly", label: "Vegan Friendly" },
  { key: "outdoor_seating", label: "Outdoor Seating" },
  { key: "fine_dining", label: "Fine Dining" },
  { key: "casual", label: "Casual" },
  { key: "romantic", label: "Romantic" },
  { key: "family_friendly", label: "Family Friendly" },
];

function InfoRow({ icon: Icon, label, children }) {
  if (!children && children !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-[#10375C]">{children}</p>
      </div>
    </div>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.Restaurant.get(id)
      .then((r) => setRestaurant(r))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-9rem)] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#10375C]" />
      </div>
    );
  }
  if (!restaurant) return <div className="p-8 text-center text-slate-500">Restaurant not found.</div>;

  const handleLog = async ({ rating, review }) => {
    await logVisit(restaurant, { rating, review });
    setLogging(false);
  };

  return (
    <div className="pb-10">
      <div className="relative">
        <Image src={restaurant.image_url} className="h-56 w-full" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="absolute right-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-sm font-bold">{restaurant.price_level}</span>
      </div>

      <div className="p-5">
        <h1 className="text-2xl font-black">{restaurant.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-[#fff8dc] px-2.5 py-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-[#F3C623] text-[#F3C623]" />
            {restaurant.average_rating?.toFixed(1) || "—"}
          </span>
          <span className="text-sm text-slate-500">{restaurant.rating_count || 0} reviews</span>
        </div>

        {restaurant.description && <p className="mt-4 text-sm text-slate-600">{restaurant.description}</p>}

        {restaurant.awards?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {restaurant.awards.map((a) => (
              <span key={a} className="flex items-center gap-1 rounded-full bg-[#EB8317]/10 px-3 py-1.5 text-xs font-bold text-[#EB8317]">
                <Trophy className="h-3.5 w-3.5" />{a}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 divide-y divide-slate-100 rounded-3xl bg-white p-4 shadow-sm">
          <InfoRow icon={Utensils} label="Cuisine">{restaurant.cuisines?.join(", ")}</InfoRow>
          <InfoRow icon={ChefHat} label="Secondary cuisines">{restaurant.secondary_cuisines?.join(", ")}</InfoRow>
          <InfoRow icon={Wallet} label="Price range">{restaurant.price_level}</InfoRow>
          <InfoRow icon={Star} label="Average rating">{restaurant.average_rating?.toFixed(1)}</InfoRow>
          <InfoRow icon={Star} label="Review count">{restaurant.rating_count}</InfoRow>
          <InfoRow icon={MapPin} label="Address">{restaurant.address}</InfoRow>
          <InfoRow icon={MapPin} label="City">{restaurant.city}</InfoRow>
          <InfoRow icon={MapPin} label="Neighborhood">{restaurant.neighborhood}</InfoRow>
          <InfoRow icon={Phone} label="Phone">{restaurant.phone}</InfoRow>
          <InfoRow icon={Globe} label="Website">
            {restaurant.website ? (
              <a href={restaurant.website} target="_blank" rel="noreferrer" className="text-[#10375C] underline">{restaurant.website}</a>
            ) : null}
          </InfoRow>
          <InfoRow icon={Clock} label="Opening hours">{restaurant.opening_hours}</InfoRow>
          <InfoRow icon={Tag} label="Restaurant type">{restaurant.restaurant_type}</InfoRow>
        </div>

        {restaurant.tags?.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {restaurant.tags.map((t) => (
                <span key={t} className="rounded-full bg-[#10375C]/5 px-3 py-1.5 text-xs font-semibold text-[#10375C]">{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Attributes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ATTRIBUTES.filter((a) => restaurant[a.key]).map((a) => (
              <span key={a.key} className="flex items-center gap-1 rounded-full bg-[#F3C623]/20 px-3 py-1.5 text-xs font-bold text-[#10375C]">
                <Check className="h-3.5 w-3.5" />{a.label}
              </span>
            ))}
            {!ATTRIBUTES.some((a) => restaurant[a.key]) && <span className="text-xs text-slate-400">No attributes listed.</span>}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => saveRestaurant(restaurant)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#10375C]/15 py-3 text-sm font-bold"
          >
            <Bookmark className="h-4 w-4" />Save
          </button>
          <button
            onClick={() => setLogging(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F3C623] py-3 text-sm font-bold"
          >
            <Plus className="h-4 w-4" />Log visit
          </button>
        </div>
      </div>

      <LogVisitDialog restaurant={logging ? restaurant : null} onClose={() => setLogging(false)} onSubmit={handleLog} />
    </div>
  );
}