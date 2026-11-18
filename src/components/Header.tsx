"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ 
  searchQuery, 
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  hideNav
}: { 
  searchQuery?: string, 
  setSearchQuery?: (q: string) => void,
  categories?: any[],
  selectedCategory?: string,
  setSelectedCategory?: (c: string) => void,
  hideNav?: boolean
}) {
  const pathname = usePathname();
  const isAdmin = hideNav || pathname?.startsWith("/admin");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high">
        <div className="h-24 md:h-28 w-full px-4 md:px-8 flex items-center justify-between gap-space-md relative">
          <div className="flex items-center justify-between w-full md:w-auto gap-4 z-10 shrink-0">
            <Link className="flex items-center group" href="/">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight uppercase bg-linear-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-md leading-tight">
                RANGOTSAV 2026
              </h1>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4 z-10 shrink-0 ml-auto">
            {categories && setSelectedCategory && (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="hover:bg-surface-container-highest focus:bg-surface-container-highest transition-colors rounded-lg px-3 py-1.5 pr-8 outline-none text-on-surface font-semibold text-sm border focus:border-primary shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">
                  expand_more
                </span>
              </div>
            )}
            
            {!isAdmin ? (
              <nav className="flex items-center gap-space-xs p-space-xs bg-surface-container-low rounded-lg shrink-0">
                <Link
                  aria-current={pathname === "/" ? "page" : undefined}
                  className={`px-space-md py-space-xs transition-colors rounded-lg ${pathname === "/" ? "bg-primary-container text-on-primary font-bold shadow-sm" : "text-on-surface-variant font-label-md text-label-md hover:text-on-surface"}`}
                  href="/"
                >
                  Scoreboard
                </Link>
                <Link
                  aria-current={pathname === "/schools" ? "page" : undefined}
                  className={`px-space-md py-space-xs transition-colors rounded-lg ${pathname === "/schools" ? "bg-primary-container text-on-primary font-bold shadow-sm" : "text-on-surface-variant font-label-md text-label-md hover:text-on-surface"}`}
                  href="/schools"
                >
                  Schools
                </Link>
                <Link
                  aria-current={pathname === "/results" ? "page" : undefined}
                  className={`px-space-md py-space-xs transition-colors rounded-lg ${pathname === "/results" ? "bg-primary-container text-on-primary font-bold shadow-sm" : "text-on-surface-variant font-label-md text-label-md hover:text-on-surface"}`}
                  href="/results"
                >
                  Results
                </Link>
                <Link
                  aria-current={pathname === "/events" ? "page" : undefined}
                  className={`px-space-md py-space-xs transition-colors rounded-lg ${pathname === "/events" ? "bg-primary-container text-on-primary font-bold shadow-sm" : "text-on-surface-variant font-label-md text-label-md hover:text-on-surface"}`}
                  href="/events"
                >
                  Events
                </Link>
              </nav>
            ) : (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider border border-primary/20">
                  Admin Panel
                </span>
                <Link
                  href="/"
                  className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                >
                  View Public Scoreboard →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {!isAdmin && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around gap-1 p-2 bg-surface-container-highest border-t border-surface-container-high shadow-[0_-4px_16px_rgba(0,0,0,0.1)] z-100 pb-safe">
          <Link
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 px-2 py-2 transition-colors rounded-xl ${pathname === "/" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
            href="/"
          >
            <span className={`material-symbols-outlined text-[24px] mb-1 ${pathname === "/" ? "text-primary" : ""}`}>leaderboard</span>
            <span className="text-[11px] tracking-wide">Scoreboard</span>
          </Link>
          <Link
            aria-current={pathname === "/schools" ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 px-2 py-2 transition-colors rounded-xl ${pathname === "/schools" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
            href="/schools"
          >
            <span className={`material-symbols-outlined text-[24px] mb-1 ${pathname === "/schools" ? "text-primary" : ""}`}>school</span>
            <span className="text-[11px] tracking-wide">Schools</span>
          </Link>
          <Link
            aria-current={pathname === "/results" ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 px-2 py-2 transition-colors rounded-xl ${pathname === "/results" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
            href="/results"
          >
            <span className={`material-symbols-outlined text-[24px] mb-1 ${pathname === "/results" ? "text-primary" : ""}`}>emoji_events</span>
            <span className="text-[11px] tracking-wide">Results</span>
          </Link>
          <Link
            aria-current={pathname === "/events" ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 px-2 py-2 transition-colors rounded-xl ${pathname === "/events" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
            href="/events"
          >
            <span className={`material-symbols-outlined text-[24px] mb-1 ${pathname === "/events" ? "text-primary" : ""}`}>event_note</span>
            <span className="text-[11px] tracking-wide">Events</span>
          </Link>
        </nav>
      )}
    </>
  );
}
