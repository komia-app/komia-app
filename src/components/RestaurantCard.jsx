import React from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Bookmark, Plus } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function RestaurantCard({ restaurant, onSave, onLog }) {
  return <article className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_25px_rgba(16,55,92,.09)]">
    <div className="relative"><Image src={restaurant.image_url} alt={restaurant.name} className="h-40 w-full"/><span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold">{restaurant.price_level}</span></div>
    <div className="p-4"><div className="flex items-start justify-between gap-2"><div><Link to={`/restaurant/${restaurant.id}`} className="text-lg font-extrabold hover:underline">{restaurant.name}</Link><p className="mt-1 text-xs text-slate-500">{restaurant.cuisines?.join(" • ")}</p></div><span className="flex items-center gap-1 rounded-full bg-[#fff8dc] px-2 py-1 text-sm font-bold"><Star className="h-4 w-4 fill-[#F3C623] text-[#F3C623]"/>{restaurant.average_rating}</span></div>
    <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5"/>{restaurant.neighborhood} · {restaurant.address}</p>
    <div className="mt-4 flex gap-2"><button onClick={() => onSave(restaurant)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#10375C]/15 py-2.5 text-sm font-bold"><Bookmark className="h-4 w-4"/>Save</button><button onClick={() => onLog(restaurant)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F3C623] py-2.5 text-sm font-bold"><Plus className="h-4 w-4"/>Log visit</button></div></div>
  </article>;
}