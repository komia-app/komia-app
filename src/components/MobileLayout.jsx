import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Map, Search, ListChecks, UserRound } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import MiaFab from "@/components/MiaFab";

const tabs = [["/", "Map", Map], ["/search", "Search", Search], ["/lists", "My logs", ListChecks], ["/profile", "Profile", UserRound]];
export default function MobileLayout() {
  return <div className="min-h-screen bg-[#eef2f5] text-[#10375C]"><div className="mx-auto min-h-screen max-w-md bg-[#f8fafb] shadow-2xl">
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#10375C] px-5"><BrandMark /><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F3C623] hidden">MIA</span></header>
    <main className="min-h-[calc(100vh-8rem)] pb-24"><Outlet /></main>
    <MiaFab />
    <nav className="fixed bottom-0 left-1/2 z-40 flex h-20 w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-white/10 bg-[#10375C] px-2 pb-2">
      {tabs.map(([to, label, Icon]) => <NavLink key={label} to={to} end={to === "/"} className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition ${isActive ? "bg-[#F3C623]/15 text-[#F3C623]" : "text-white/70"}`}><Icon className="h-6 w-6" /><span>{label}</span></NavLink>)}
    </nav>
  </div></div>;
}