import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Bookmark, Star, Utensils } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ListsPage() {
  const [data, setData] = useState({ saved: [], logs: [], restaurants: [] });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      const [saved, logs, restaurants] = await Promise.all([
        base44.entities.ListItem.filter({ user_id: u.id }),
        base44.entities.RestaurantLog.filter({ user_id: u.id }, "-visited_at"),
        base44.entities.Restaurant.list(),
      ]);
      setData({ saved, logs, restaurants });
    })();
  }, []);

  const name = (id) => data.restaurants.find((r) => r.id === id)?.name || "Restaurant";

  const groups = {};
  data.logs.forEach((l) => {
    if (!l.visited_at) return;
    const d = parseISO(l.visited_at);
    const key = format(d, "yyyy-MM");
    if (!groups[key]) groups[key] = { label: format(d, "MMMM yyyy").toUpperCase(), items: [] };
    groups[key].items.push({ ...l, day: format(d, "d"), date: d });
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  sortedKeys.forEach((k) => groups[k].items.sort((a, b) => b.date - a.date));

  return (
    <div className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[#EB8317]">Your food life</p>
      <h1 className="text-3xl font-black">My logs</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-[#10375C] p-5 text-white">
          <Bookmark className="text-[#F3C623]" />
          <p className="mt-5 text-3xl font-black">{data.saved.length}</p>
          <p className="text-sm text-white/70">Want to try</p>
        </div>
        <div className="rounded-3xl bg-[#F3C623] p-5">
          <Utensils />
          <p className="mt-5 text-3xl font-black">{data.logs.length}</p>
          <p className="text-sm text-[#10375C]/70">Places logged</p>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-extrabold">History</h2>

      {sortedKeys.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-400">Your restaurant history starts with your first log.</p>
      )}

      <div className="space-y-6">
        {sortedKeys.map((k) => (
          <div key={k}>
            <p className="mb-2 text-sm font-black uppercase tracking-widest text-[#10375C]">{groups[k].label}</p>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {groups[k].items.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/log/${l.id}`)}
                  className={`flex w-full items-center gap-4 p-4 text-left ${i ? "border-t border-slate-100" : ""}`}
                >
                  <span className="w-8 text-2xl font-black text-[#10375C]">{l.day}</span>
                  <div className="flex-1">
                    <p className="font-bold">{name(l.restaurant_id)}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-[#F3C623] text-[#F3C623]" />
                      {l.overall_rating?.toFixed(1)} · {format(parseISO(l.visited_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}