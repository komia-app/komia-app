import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap } from "react-leaflet";
import { Link, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Navigation, Star, MapPin, Bookmark, Plus, X, ArrowRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { saveRestaurant, logVisit } from "@/lib/restaurantActions";
import LogVisitDialog from "@/components/LogVisitDialog";
import MiaChat from "@/components/MiaChat";

const BOGOTA = [4.6517, -74.0627];

const CUTLERY = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10375C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2V2"/><path d="M5 11v11"/><path d="M19 2v20"/><path d="M19 2c-2 0-3 2-3 5s1 5 3 5"/></svg>`;

const restaurantIcon = L.divIcon({
  className: "komia-pin",
  html: `<div style="position:relative;width:34px;height:44px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3));"><div style="position:absolute;top:0;left:0;width:34px;height:34px;border-radius:50%;background:#F3C623;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">${CUTLERY}</div><div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:11px solid #F3C623;"></div></div>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

function matchQuery(r, q) {
  const hay = [r.name, r.neighborhood, r.city, ...(r.cuisines || []), ...(r.tags || [])].join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

function Recenter({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 14, { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [recenterTo, setRecenterTo] = useState(null);
  const [logging, setLogging] = useState(null);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [miaOpen, setMiaOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Restaurant.list().then(setRestaurants);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setRecenterTo(p);
      },
      () => {
        setUserPos(BOGOTA);
        setRecenterTo(BOGOTA);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  const matches = useMemo(() => {
    if (!query.trim()) return restaurants;
    return restaurants.filter((r) => matchQuery(r, query.trim()));
  }, [restaurants, query]);

  const pick = (r) => {
    setSelected(r);
    if (r.latitude && r.longitude) setRecenterTo([r.latitude, r.longitude]);
    setQuery("");
    setDropdownOpen(false);
  };

  const handleLog = async ({ rating, review }) => {
    await logVisit(logging, { rating, review });
    setLogging(null);
  };

  return (
    <div className="relative h-[calc(100vh-9rem)] overflow-hidden">
      <MapContainer center={BOGOTA} zoom={13} className="h-full w-full" zoomControl={false} attributionControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {matches.filter((r) => r.latitude && r.longitude).map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={restaurantIcon}
            eventHandlers={{ click: () => setSelected(r) }}
          />
        ))}
        {userPos && (
          <CircleMarker
            center={userPos}
            radius={9}
            pathOptions={{ color: "#7c3aed", fillColor: "#a78bfa", fillOpacity: 0.7, weight: 3 }}
          />
        )}
        <Recenter target={recenterTo} />
      </MapContainer>

      <div className="absolute left-4 right-4 top-4 z-[1000] flex items-start gap-2">
        <div className="relative flex-1">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Restaurants, cuisines, neighborhoods..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => { setQuery(""); setDropdownOpen(false); }} aria-label="Clear">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
          {dropdownOpen && query.trim() && (
            <>
              <button className="fixed inset-0 z-[999]" onClick={() => setDropdownOpen(false)} aria-hidden tabIndex={-1} />
              <div className="relative z-[1000] mt-2 max-h-64 overflow-auto rounded-2xl bg-white shadow-xl">
                {matches.length === 0 && <p className="p-4 text-sm text-slate-400">No restaurants found.</p>}
                {matches.slice(0, 8).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => pick(r)}
                    className="flex w-full items-center justify-between gap-2 border-b border-slate-50 p-3 text-left last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.cuisines?.join(" • ")} · {r.neighborhood || r.city}</p>
                    </div>
                    <Star className="h-4 w-4 shrink-0 fill-[#F3C623] text-[#F3C623]" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => setMiaOpen(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-[#EB8317] px-4 py-3 text-white shadow-lg"
          aria-label="Chat with MIA"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-extrabold">MIA</span>
        </button>
      </div>

      <button
        onClick={() => setRecenterTo(userPos || BOGOTA)}
        className="absolute bottom-7 right-4 z-[1000] rounded-full bg-[#10375C] p-4 text-white shadow-xl"
        aria-label="Center on me"
      >
        <Navigation className="h-5 w-5" />
      </button>

      {selected && (
        <div className="absolute bottom-7 left-4 right-4 z-[1000]">
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative">
              <Image src={selected.image_url} className="h-28 w-full" />
              <button
                onClick={() => setSelected(null)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold">{selected.price_level}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/restaurant/${selected.id}`} className="text-lg font-extrabold leading-tight hover:underline">{selected.name}</Link>
                  <p className="mt-1 text-xs text-slate-500">{selected.cuisines?.join(" • ")}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[#fff8dc] px-2 py-1 text-sm font-bold">
                  <Star className="h-4 w-4 fill-[#F3C623] text-[#F3C623]" />{selected.average_rating}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />{selected.neighborhood} · {selected.address}
              </p>
              <button
                onClick={() => navigate(`/restaurant/${selected.id}`)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10375C] py-2.5 text-sm font-bold text-white"
              >
                Visit <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => saveRestaurant(selected)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#10375C]/15 py-2.5 text-sm font-bold"
                >
                  <Bookmark className="h-4 w-4" />Save
                </button>
                <button
                  onClick={() => setLogging(selected)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F3C623] py-2.5 text-sm font-bold"
                >
                  <Plus className="h-4 w-4" />Log visit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LogVisitDialog restaurant={logging} onClose={() => setLogging(null)} onSubmit={handleLog} />
      {miaOpen && <MiaChat onClose={() => setMiaOpen(false)} />}
    </div>
  );
}