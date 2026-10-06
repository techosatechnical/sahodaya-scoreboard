"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ searchQuery, setSearchQuery }: { searchQuery?: string, setSearchQuery?: (q: string) => void }) {
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high">
        <div className="h-24 md:h-28 w-full px-4 md:px-8 flex items-center justify-between gap-space-md relative">
          <div className="flex items-center justify-between w-full md:w-auto gap-2 z-10 shrink-0">
            <a className="flex items-center gap-space-sm group shrink-0" href="/">
              <img
                alt="Sahodaya Competition Crest Logo"
                className="h-16 sm:h-20 md:h-24 w-auto object-contain shrink-0"
                src="/logo.png"
              />
            </a>
            
            <div className="flex flex-col items-end md:hidden text-right pointer-events-none pr-1">
              <h1 className="text-lg sm:text-2xl font-black tracking-tighter uppercase bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-md leading-tight">
                SAHODAYA
              </h1>
              <h1 className="text-sm sm:text-lg font-black tracking-widest uppercase bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-md leading-none">
                COMPETITION 2026
              </h1>
            </div>
          </div>
          
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 flex-col items-center justify-center text-center w-full max-w-[300px] sm:max-w-3xl pointer-events-none">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-md">
              SAHODAYA COMPETITION 2026
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-space-xs p-space-xs bg-surface-container-low rounded-lg z-10 shrink-0 ml-auto">
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
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around gap-1 p-2 bg-surface-container-highest border-t border-surface-container-high shadow-[0_-4px_16px_rgba(0,0,0,0.1)] z-[100] pb-safe">
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
    </>
  );
}
