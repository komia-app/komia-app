import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Settings, LogOut, Pencil, Utensils, MessageSquare,
  Bookmark, List as ListIcon, Sparkles, ChefHat, Wallet, MapPin,
} from "lucide-react";
import { computeTasteProfile } from "@/lib/tasteProfile";
import EditProfileDialog from "@/components/EditProfileDialog";
import { toast } from "@/components/ui/use-toast";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-black text-[#10375C]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function SectionCard({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#10375C]/5 text-[#10375C]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}

function TasteGroup({ icon: Icon, label, items }) {
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />{label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? items.map((t) => (
          <span key={t} className="rounded-full bg-[#10375C]/5 px-3 py-1.5 text-xs font-semibold text-[#10375C]">{t}</span>
        )) : <span className="text-xs text-slate-400">—</span>}
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left">
      <Icon className="h-5 w-5 text-slate-500" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [restaurantMap, setRestaurantMap] = useState({});
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const userLogs = await base44.entities.RestaurantLog.filter({ user_id: u.id });
    setLogs(userLogs);
    const restaurants = await base44.entities.Restaurant.list();
    const map = {};
    restaurants.forEach((r) => { map[r.id] = r; });
    setRestaurantMap(map);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const reviews = logs.filter((l) => l.review).length;
    const avg = logs.length ? logs.reduce((s, l) => s + (l.overall_rating || 0), 0) / logs.length : 0;
    return { logged: logs.length, reviews, avg: avg.toFixed(1) };
  }, [logs]);

  const taste = useMemo(() => computeTasteProfile(logs, restaurantMap, user), [logs, restaurantMap, user]);
  const username = user?.email ? "@" + user.email.split("@")[0] : "";

  return (
    <div className="p-5 pb-10">
      <p className="text-xs font-bold uppercase tracking-widest text-[#EB8317]">Profile</p>

      <div className="mt-5 flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#F3C623] text-2xl font-black text-[#10375C]">
          {(user?.full_name || user?.email || "K")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black">{user?.full_name || "Food explorer"}</h1>
          <p className="mt-1 text-sm text-slate-500">{username}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Logged" value={stats.logged} />
        <Stat label="Reviews" value={stats.reviews} />
        <Stat label="Avg rating" value={stats.avg} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <SectionCard to="/lists" icon={Bookmark} label="My Favorites" />
        <SectionCard to="/lists" icon={ListIcon} label="My logs" />
        <SectionCard to="/lists" icon={MessageSquare} label="My Reviews" />
        <a href="#taste" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EB8317]/10 text-[#EB8317]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold">Taste Profile</span>
        </a>
      </div>

      <section id="taste" className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#EB8317]" />
          <h2 className="font-extrabold">MIA Taste Profile</h2>
        </div>
        <TasteGroup icon={Utensils} label="Favorite cuisines" items={taste.favorite_cuisines} />
        <TasteGroup icon={Wallet} label="Preferred price range" items={taste.preferred_price} />
        <TasteGroup icon={ChefHat} label="Favorite restaurant types" items={taste.favorite_types} />
        <TasteGroup icon={MapPin} label="Preferred locations" items={taste.preferred_locations} />
        {!logs.length && <p className="mt-4 text-sm text-slate-400">Log restaurants to unlock your taste profile.</p>}
      </section>

      <div className="mt-6 divide-y divide-[#10375C]/10 overflow-hidden rounded-3xl bg-white shadow-sm">
        <ActionRow icon={Pencil} label="Edit profile" onClick={() => setEditOpen(true)} />
        <ActionRow icon={Settings} label="Settings" onClick={() => toast({ title: "Coming soon" })} />
        <ActionRow icon={LogOut} label="Log out" onClick={() => base44.auth.logout("/login")} />
      </div>

      <EditProfileDialog user={user} open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} />
    </div>
  );
}