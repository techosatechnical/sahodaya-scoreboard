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

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const scrollStep = 1; // pixels
    const intervalTime = 30; // ms
    let isPaused = true;

    // Initial pause before scrolling starts
    const initialTimeout = setTimeout(() => {
      isPaused = false;
    }, 3000);

    const scrollInterval = setInterval(() => {
      if (scrollContainer && !isPaused) {
        // Do not scroll if content fits entirely within the container
        if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) return;

        scrollAmount += scrollStep;
        scrollContainer.scrollTop = scrollAmount;

        // Reset when reaching bottom
        if (Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight) {
          isPaused = true;
          setTimeout(() => {
            scrollAmount = 0;
            if (scrollContainer) scrollContainer.scrollTop = 0;

            // Pause at the top after looping back
            setTimeout(() => {
              isPaused = false;
            }, 3000);
          }, 3000);
        }
      }
    }, intervalTime);

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(initialTimeout);
    };
  }, [filteredSchools]);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col flex-1 min-h-0">
      <div className="w-full h-full flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto scroll-smooth">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-12 border-b border-surface-container">
                <th className="py-3.5 px-6 w-24 text-center">Rank</th>
                <th className="py-3.5 px-6">School Institution</th>
                <th className="py-3.5 px-8 text-right w-56">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60 font-body-md text-body-md text-on-surface">
              {filteredSchools.map((school) => (
                <tr
                  key={school.id}
                  className="hover:bg-surface-container-low/60 transition-colors group"
                >
                  <td className="py-4 px-6 text-center">
                    <div
                      className={`inline-flex items-center justify-center ${school.theme === "amber"
                          ? "w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-primary-container font-headline-sm text-headline-sm font-extrabold shadow-sm ring-2 ring-amber-300/40"
                          : school.theme === "slate"
                            ? "w-9 h-9 rounded-full bg-slate-200 text-slate-800 font-headline-sm text-headline-sm font-extrabold shadow-sm ring-2 ring-slate-300/60"
                            : school.theme === "orange"
                              ? "w-9 h-9 rounded-full bg-orange-100 text-orange-950 font-headline-sm text-headline-sm font-extrabold shadow-sm ring-2 ring-orange-200"
                              : "w-8 h-8 rounded-full bg-surface-container text-on-surface-variant font-title-md text-title-md font-bold"
                        }`}
                    >
                      {school.rank}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${school.theme === "amber"
                            ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200"
                            : school.theme === "slate"
                              ? "bg-surface-container text-primary shadow-inner"
                              : school.theme === "orange"
                                ? "bg-orange-50 text-orange-700 shadow-sm"
                                : "bg-surface-container text-secondary"
                          }`}
                      >
                        <span className="material-symbols-outlined text-[24px] lg:text-[26px]">
                          {school.icon}
                        </span>
                      </div>
                      <div>
                        <div className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                          {school.name}
                          {school.medal && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${school.theme === "amber"
                                  ? "bg-amber-100 text-amber-900"
                                  : school.theme === "slate"
                                    ? "bg-slate-100 text-slate-700"
                                    : school.theme === "orange"
                                      ? "bg-orange-100 text-orange-900"
                                      : ""
                                }`}
                            >
                              {school.theme === "amber" && (
                                <span className="material-symbols-outlined text-[13px] text-amber-700">
                                  stars
                                </span>
                              )}
                              {school.medal}
                            </span>
                          )}
                        </div>
                        <div className="font-label-md text-label-md text-on-surface-variant mt-0.5">
                          {school.zone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-8 text-right">
                    <div
                      className={
                        school.theme !== "default"
                          ? "inline-flex flex-col items-end"
                          : "inline-flex items-baseline gap-1.5"
                      }
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-score-display text-score-display text-primary font-black tracking-tight">
                          {school.points}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant font-bold uppercase">
                          pts
                        </span>
                      </div>
                      {school.margin && (
                        <span
                          className={`font-label-sm text-label-sm font-semibold ${school.theme === "amber"
                              ? "text-emerald-700 flex items-center gap-0.5"
                              : school.theme === "slate"
                                ? "text-secondary"
                                : "text-on-surface-variant"
                            }`}
                        >
                          {school.theme === "amber" && (
                            <span className="material-symbols-outlined text-[14px]">
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
