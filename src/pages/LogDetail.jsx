import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft, Star, Calendar, Utensils, DollarSign, Heart,
  Eye, Check, X as XIcon, Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const SUB_RATINGS = [
  { key: "food_rating", label: "Food" },
  { key: "service_rating", label: "Service" },
  { key: "ambiance_rating", label: "Ambiance" },
  { key: "value_rating", label: "Value" },
];

function RatingRow({ label, value }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="flex items-center gap-1 text-sm font-bold">
        <Star className="h-3.5 w-3.5 fill-[#F3C623] text-[#F3C623]" />{Number(value).toFixed(1)}
      </span>
    </div>
  );
}

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const l = await base44.entities.RestaurantLog.get(id);
        setLog(l);
        if (l.restaurant_id) {
          try {
            const r = await base44.entities.Restaurant.get(l.restaurant_id);
            setRestaurant(r);
          } catch { /* restaurant may be unavailable */ }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-9rem)] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#10375C]" />
      </div>
    );
  }
  if (!log) return <div className="p-8 text-center text-slate-500">Log not found.</div>;

  const visitDate = log.visited_at ? format(parseISO(log.visited_at), "EEEE, MMMM d, yyyy") : "—";

  return (
    <div className="pb-10">
      <div className="relative">
        <Image src={restaurant?.image_url} className="h-48 w-full" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="p-5">
        <Link to={`/restaurant/${log.restaurant_id}`} className="text-2xl font-black hover:underline">
          {restaurant?.name || "Restaurant"}
        </Link>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />{visitDate}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-[#fff8dc] px-3 py-1.5 text-base font-bold">
            <Star className="h-4 w-4 fill-[#F3C623] text-[#F3C623]" />{Number(log.overall_rating).toFixed(1)}
          </span>
          <span className="text-sm text-slate-500">Overall rating</span>
        </div>

        <div className="mt-4 divide-y divide-slate-100 rounded-3xl bg-white p-4 shadow-sm">
          {SUB_RATINGS.map((s) => (
            <RatingRow key={s.key} label={s.label} value={log[s.key]} />
          ))}
        </div>

        {log.review && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Review</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{log.review}</p>
          </div>
        )}

        {log.dishes?.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <Utensils className="h-3.5 w-3.5" />Dishes
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {log.dishes.map((d) => (
                <span key={d} className="rounded-full bg-[#10375C]/5 px-3 py-1.5 text-xs font-semibold text-[#10375C]">{d}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          {log.price_paid != null && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400"><DollarSign className="h-3.5 w-3.5" />Price paid</p>
              <p className="mt-1 font-bold">${log.price_paid}</p>
            </div>
          )}
          {log.occasion && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Sparkles className="h-3.5 w-3.5" />Occasion</p>
              <p className="mt-1 font-bold">{log.occasion}</p>
            </div>
          )}
          {log.visibility && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Eye className="h-3.5 w-3.5" />Visibility</p>
              <p className="mt-1 font-bold capitalize">{log.visibility}</p>
            </div>
          )}
          {log.likes_count != null && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400"><Heart className="h-3.5 w-3.5" />Likes</p>
              <p className="mt-1 font-bold">{log.likes_count}</p>
            </div>
          )}
        </div>

        {log.would_return != null && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <span className={`grid h-8 w-8 place-items-center rounded-full ${log.would_return ? "bg-[#F3C623]/20 text-[#10375C]" : "bg-slate-100 text-slate-400"}`}>
              {log.would_return ? <Check className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
            </span>
            <p className="text-sm font-bold">{log.would_return ? "Would return" : "Would not return"}</p>
          </div>
        )}

        {log.photos?.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Photos</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {log.photos.map((p, i) => (
                <Image key={i} src={p} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}