"use client";

import { useEffect, useRef } from "react";

export type ScoreboardCategory = {
  id: string;
  name: string;
  shortLabel: string;
};

export type ScoreboardEventGroup = {
  key: string;
  name: string;
  eventIds: string[];
};

export type ScoreboardSchool = {
  id: string;
  name: string;
  zone: string;
  entryCount: number;
  /** Keyed by `${eventGroupKey}__${categoryId}` */
  cellPoints: Record<string, number>;
  /** Keyed by `categoryId` */
  categoryTotals: Record<string, number>;
};

export default function ScoreboardTable({
  schools,
  eventGroups,
  categories,
  liveEventGroupKey,
  liveCategoryId,
}: {
  schools: ScoreboardSchool[];
  eventGroups: ScoreboardEventGroup[];
  categories: ScoreboardCategory[];
  liveEventGroupKey: string | null;
  liveCategoryId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserInteracting = useRef(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) return;

    let isPaused = true;
    let animationFrameId: number;

    const initialTimeout = setTimeout(() => {
      isPaused = false;
    }, 3000);

    const autoScroll = () => {
      if (!scrollContainer) return;

      if (!isPaused && !isUserInteracting.current) {
        scrollContainer.scrollTop += 1;

        if (
          Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >=
          scrollContainer.scrollHeight
        ) {
          isPaused = true;
          setTimeout(() => {
            if (scrollContainer) {
              scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
            }
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
  }, [schools]);

  const catCount = Math.max(categories.length, 1);
  const totalCols = eventGroups.length * catCount + catCount + 1;

  return (
    <main
      className="w-full flex-1 mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-0"
      data-purpose="scoreboard-grid"
    >
      <div
        ref={scrollRef}
        className="w-full h-full overflow-auto scroll-smooth"
        onMouseEnter={() => {
          isUserInteracting.current = true;
        }}
        onMouseLeave={() => {
          isUserInteracting.current = false;
        }}
        onTouchStart={() => {
          isUserInteracting.current = true;
        }}
        onTouchEnd={() => {
          isUserInteracting.current = false;
        }}
      >
        <table className="w-full h-full table-fixed border-collapse text-left min-w-275">
          <colgroup>
            <col className="w-[19%]" />
            {eventGroups.map((eg) =>
              categories.map((cat) => (
                <col key={`${eg.key}-${cat.id}`} />
              ))
            )}
            {categories.map((cat) => (
              <col key={`total-col-${cat.id}`} className="w-[5.5%]" />
            ))}
          </colgroup>

          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-900 text-white text-xs sm:text-sm uppercase tracking-wider font-extrabold border-b border-slate-800">
              <th className="px-3.5 py-3.5 text-slate-300 font-display sticky left-0 z-30 bg-slate-900 align-middle">
                <span className="flex items-center gap-2 text-blue-400 font-extrabold tracking-widest text-xs sm:text-sm">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  PARTICIPATING INSTITUTION
                </span>
              </th>

              {eventGroups.map((eg) => {
                const isLive = eg.key === liveEventGroupKey;

                return (
                  <th
                    key={eg.key}
                    colSpan={catCount}
                    className={`text-center py-3.5 px-2.5 border-l border-slate-800 font-display text-xs sm:text-sm lg:text-base font-extrabold tracking-wide align-middle whitespace-normal wrap-break-word leading-snug ${
                      isLive
                        ? "bg-slate-900/90 text-amber-300"
                        : "bg-slate-900/95 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isLive && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      )}
                      <span className="whitespace-normal wrap-break-word leading-snug">
                        {eg.name}
                      </span>
                    </div>
                  </th>
                );
              })}

              <th
                colSpan={catCount}
                className="text-center py-3.5 px-2 border-l border-slate-700 bg-slate-950 text-amber-400 font-display tracking-widest text-xs sm:text-sm align-middle"
              >
                CATEGORY TOTALS
              </th>
            </tr>

            <tr className="bg-slate-100 text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b-2 border-slate-300">
              <th className="px-3.5 py-3 text-slate-900 font-extrabold sticky left-0 z-30 bg-slate-100 align-middle">
                School • Entries
              </th>

              {eventGroups.map((eg) =>
                categories.map((cat, catIdx) => {
                  const isLiveGroup = eg.key === liveEventGroupKey;
                  const isLiveCell = isLiveGroup && cat.id === liveCategoryId;
                  return (
                    <th
                      key={`${eg.key}-${cat.id}`}
                      className={`text-center py-3 px-1.5 border-l ${
                        catIdx === 0 ? "border-slate-300" : "border-slate-200"
                      } align-middle font-extrabold ${
                        isLiveCell || isLiveGroup
                          ? "bg-amber-100/90 text-slate-950"
                          : "bg-slate-100 text-slate-900"
                      }`}
                      title={cat.name}
                    >
                      {cat.shortLabel}
                    </th>
                  );
                })
              )}

              {categories.map((cat, catIdx) => (
                <th
                  key={`total-hdr-${cat.id}`}
                  className={`text-center py-3 px-1.5 border-l ${
                    catIdx === 0 ? "border-slate-300" : "border-amber-200/70"
                  } bg-amber-100 text-slate-950 font-extrabold align-middle`}
                  title={`${cat.name} Total`}
                >
                  {cat.shortLabel}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-sans">
            {schools.length === 0 ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="py-16 text-center text-slate-400 font-semibold text-sm"
                >
                  No participating schools found.
                </td>
              </tr>
            ) : (
              schools.map((school, rowIndex) => {
                const isAlt = rowIndex % 2 === 1;
                const rowBg = isAlt
                  ? "bg-slate-50/60 hover:bg-slate-100/70"
                  : "bg-white hover:bg-slate-50";
                const stickyCellBg = isAlt ? "bg-slate-50" : "bg-white";

                return (
                  <tr
                    key={school.id}
                    className={`${rowBg} transition-colors duration-150`}
                  >
                    <td
                      className={`px-3.5 py-2.5 border-r border-slate-200 sticky left-0 z-10 ${stickyCellBg}`}
                    >
                      <div className="min-w-0">
                        <div
                          className="text-xs lg:text-sm font-bold text-slate-900 tracking-tight truncate"
                          title={school.name}
                        >
                          {school.name}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 truncate">
                          {school.entryCount}{" "}
                          {school.entryCount === 1 ? "Entry" : "Entries"}
                        </div>
                      </div>
                    </td>

                    {eventGroups.map((eg) =>
                      categories.map((cat, catIdx) => {
                        const cellKey = `${eg.key}__${cat.id}`;
                        const pts = school.cellPoints[cellKey] || 0;
                        const isLiveCell =
                          eg.key === liveEventGroupKey && cat.id === liveCategoryId;
                        const isLastCat = catIdx === categories.length - 1;

                        return (
                          <td
                            key={cellKey}
                            className={`text-center py-2.5 px-1 font-mono-numbers text-base sm:text-lg lg:text-xl font-extrabold border-r ${
                              isLastCat ? "border-slate-200" : "border-slate-100"
                            } ${
                              isLiveCell
                                ? "text-emerald-700 bg-emerald-50/40"
                                : pts > 0
                                  ? "text-slate-900"
                                  : "text-slate-300"
                            }`}
                          >
                            {pts > 0 ? (
                              isLiveCell ? (
                                <span className="inline-flex items-center justify-center">
                                  {pts}
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 ml-0.5" />
                                </span>
                              ) : (
                                pts
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })
                    )}

                    {categories.map((cat, catIdx) => {
                      const catTotal = school.categoryTotals[cat.id] || 0;
                      const hasPoints = catTotal > 0;
                      return (
                        <td
                          key={`total-cell-${school.id}-${cat.id}`}
                          className={`text-center py-1.5 px-1.5 border-l ${
                            catIdx === 0 ? "border-slate-300" : "border-slate-200"
                          } ${isAlt ? "bg-slate-100/80" : "bg-slate-50/80"}`}
                        >
                          <div
                            className={`py-1 px-1.5 rounded-lg font-mono-numbers text-sm sm:text-base lg:text-lg tracking-tight ${
                              hasPoints
                                ? "bg-linear-to-br from-indigo-600 to-blue-700 text-white font-black shadow-sm ring-1 ring-indigo-500/30"
                                : "bg-slate-100 text-slate-400 font-bold border border-slate-200"
                            }`}
                          >
                            {catTotal}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
