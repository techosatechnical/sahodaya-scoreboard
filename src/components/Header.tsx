"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ searchQuery, setSearchQuery }: { searchQuery?: string, setSearchQuery?: (q: string) => void }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high">
      <div className="h-20 w-full px-4 md:px-8 flex items-center justify-between gap-space-md relative">
        <div className="flex items-center gap-space-md z-10 shrink-0">
          <a className="flex items-center gap-space-sm group" href="#">
            <img
              alt="Sahodaya Competition Crest Logo"
              className="h-16 w-auto object-contain"
              src="/logo.png"
            />
          </a>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center w-full max-w-[300px] sm:max-w-3xl pointer-events-none">
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
  );
}
