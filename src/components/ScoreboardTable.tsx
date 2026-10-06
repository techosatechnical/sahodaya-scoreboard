"use client";

import { useEffect, useRef } from "react";

type School = {
  id: number;
  rank: number;
  name: string;
  zone: string;
  points: number;
  margin: string;
  medal: string;
  icon: string;
  theme: string;
};

export default function ScoreboardTable({
  filteredSchools,
  totalSchoolsCount,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType
}: {
  filteredSchools: School[];
  totalSchoolsCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string;
  setFilterType: (f: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserInteracting = useRef(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Do not scroll if content fits entirely within the container
    if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) return;

    let isPaused = true;
    let animationFrameId: number;

    // Initial pause before scrolling starts
    const initialTimeout = setTimeout(() => {
      isPaused = false;
    }, 3000);

    const autoScroll = () => {
      if (!scrollContainer) return;

      if (!isPaused && !isUserInteracting.current) {
        scrollContainer.scrollTop += 1;

        // Reset when reaching bottom
        if (Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight) {
          isPaused = true;
          setTimeout(() => {
            if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: "smooth" });

            // Pause at the top after looping back
            setTimeout(() => {
              isPaused = false;
            }, 1500);
          }, 3000);
        }
      }

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      clearTimeout(initialTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [filteredSchools]);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col flex-1 min-h-0">
      <div className="w-full h-full flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 overflow-hidden">
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-x-auto overflow-y-auto scroll-smooth scrollbar-hide"
          onMouseEnter={() => { isUserInteracting.current = true; }}
          onMouseLeave={() => { isUserInteracting.current = false; }}
          onTouchStart={() => { isUserInteracting.current = true; }}
          onTouchEnd={() => { isUserInteracting.current = false; }}
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container-low text-on-surface-variant font-bold text-xs sm:text-sm 2xl:text-2xl uppercase tracking-wider h-10 sm:h-12 2xl:h-20 border-b border-surface-container">
                <th className="py-2 sm:py-3.5 px-3 sm:px-6 w-16 sm:w-24 2xl:w-40 text-center">Rank</th>
                <th className="py-2 sm:py-3.5 px-3 sm:px-6">School Institution</th>
                <th className="py-2 sm:py-3.5 px-4 sm:px-8 text-right w-32 sm:w-56 2xl:w-80">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {filteredSchools.map((school) => (
                <tr
                  key={school.id}
                  className="hover:bg-surface-container-low/60 transition-colors group"
                >
                  <td className="py-3 sm:py-4 2xl:py-8 px-3 sm:px-6 text-center">
                    <div
                      className={`inline-flex items-center justify-center ${school.theme === "amber"
                          ? "w-8 h-8 sm:w-9 sm:h-9 2xl:w-16 2xl:h-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-primary-container text-sm sm:text-base 2xl:text-3xl font-extrabold shadow-sm ring-2 ring-amber-300/40"
                          : school.theme === "slate"
                            ? "w-8 h-8 sm:w-9 sm:h-9 2xl:w-16 2xl:h-16 rounded-full bg-slate-200 text-slate-800 text-sm sm:text-base 2xl:text-3xl font-extrabold shadow-sm ring-2 ring-slate-300/60"
                            : school.theme === "orange"
                              ? "w-8 h-8 sm:w-9 sm:h-9 2xl:w-16 2xl:h-16 rounded-full bg-orange-100 text-orange-950 text-sm sm:text-base 2xl:text-3xl font-extrabold shadow-sm ring-2 ring-orange-200"
                              : "w-7 h-7 sm:w-8 sm:h-8 2xl:w-14 2xl:h-14 rounded-full bg-surface-container text-on-surface-variant text-xs sm:text-sm 2xl:text-2xl font-bold"
                        }`}
                    >
                      {school.rank}
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 2xl:py-8 px-3 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4 2xl:gap-8">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 2xl:w-20 2xl:h-20 rounded-lg sm:rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${school.theme === "amber"
                            ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200"
                            : school.theme === "slate"
                              ? "bg-surface-container text-primary shadow-inner"
                              : school.theme === "orange"
                                ? "bg-orange-50 text-orange-700 shadow-sm"
                                : "bg-surface-container text-secondary"
                          }`}
                      >
                        <span className="material-symbols-outlined text-[20px] sm:text-[24px] lg:text-[26px] 2xl:text-[40px]">
                          {school.icon}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm sm:text-base md:text-lg 2xl:text-4xl text-primary font-bold flex flex-wrap items-center gap-2">
                          {school.name}
                          {school.medal && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 2xl:px-4 2xl:py-1 rounded-full text-[10px] sm:text-xs 2xl:text-2xl font-bold ${school.theme === "amber"
                                  ? "bg-amber-100 text-amber-900"
                                  : school.theme === "slate"
                                    ? "bg-slate-100 text-slate-700"
                                    : school.theme === "orange"
                                      ? "bg-orange-100 text-orange-900"
                                      : ""
                                }`}
                            >
                              {school.theme === "amber" && (
                                <span className="material-symbols-outlined text-[11px] sm:text-[13px] 2xl:text-[24px] text-amber-700">
                                  stars
                                </span>
                              )}
                              {school.medal}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm 2xl:text-2xl text-on-surface-variant mt-0.5 2xl:mt-2">
                          {school.zone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 2xl:py-8 px-4 sm:px-8 text-right">
                    <div
                      className={
                        school.theme !== "default"
                          ? "inline-flex flex-col items-end"
                          : "inline-flex items-baseline gap-1.5 2xl:gap-3"
                      }
                    >
                      <div className="flex items-baseline gap-1.5 2xl:gap-3">
                        <span className="text-xl sm:text-2xl lg:text-3xl 2xl:text-6xl text-primary font-black tracking-tight">
                          {school.points}
                        </span>
                        <span className="text-[10px] sm:text-xs 2xl:text-2xl text-on-surface-variant font-bold uppercase">
                          pts
                        </span>
                      </div>
                      {school.margin && (
                        <span
                          className={`text-[10px] sm:text-xs 2xl:text-xl font-semibold mt-0.5 2xl:mt-2 ${school.theme === "amber"
                              ? "text-emerald-700 flex items-center gap-0.5 2xl:gap-1"
                              : school.theme === "slate"
                                ? "text-secondary"
                                : "text-on-surface-variant"
                            }`}
                        >
                          {school.theme === "amber" && (
                            <span className="material-symbols-outlined text-[12px] sm:text-[14px] 2xl:text-[24px]">
                              trending_up
                            </span>
                          )}
                          {school.margin}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
      <div className="mt-4 flex items-center justify-center w-full">
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium tracking-wide">
          Powered by <span className="font-bold text-blue-800">Techosa</span>
        </span>
      </div>
    </section>
  );
}
