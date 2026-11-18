"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  rank: number;
  name: string;
  zone: string;
  points: number;
  entryCount: number;
  /** Keyed by `${eventGroupKey}__${categoryId}` */
  cellPoints: Record<string, number>;
  theme: "amber" | "slate" | "orange" | "default";
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
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const prevTopsRef = useRef<Record<string, number>>({});
  const prevRanksRef = useRef<Record<string, number>>({});
  const [rankUpDeltas, setRankUpDeltas] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    const nextTops: Record<string, number> = {};
    const movedUp: Record<string, number> = {};

    for (const school of schools) {
      const el = rowRefs.current[school.id];
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      nextTops[school.id] = rect.top;

      const prevTop = prevTopsRef.current[school.id];
      const prevRank = prevRanksRef.current[school.id];

      if (prevTop !== undefined) {
        const deltaY = prevTop - rect.top;
        if (Math.abs(deltaY) > 1) {
          const isMovingUp = prevRank !== undefined && school.rank < prevRank;
          if (isMovingUp) {
            movedUp[school.id] = prevRank - school.rank;
          }

          el.style.transition = "none";
          el.style.transform = `translateY(${deltaY}px)`;
          el.style.position = "relative";
          el.style.zIndex = isMovingUp ? "20" : "1";

          // Force reflow before playing the transition
          el.getBoundingClientRect();

          el.style.transition = "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)";
          el.style.transform = "translateY(0)";

          const clearZ = () => {
            el.style.zIndex = "";
            el.style.position = "";
            el.removeEventListener("transitionend", clearZ);
          };
          el.addEventListener("transitionend", clearZ);
        }
      }

      prevRanksRef.current[school.id] = school.rank;
    }

    prevTopsRef.current = nextTops;

    if (Object.keys(movedUp).length > 0) {
      setRankUpDeltas(movedUp);
      const timer = setTimeout(() => {
        setRankUpDeltas({});
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [schools]);

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

  const totalSubCols = eventGroups.length * Math.max(categories.length, 1);

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
        <table className="w-full h-full table-fixed border-collapse text-left min-w-[1050px]">
          <colgroup>
            <col className="w-[20%]" />
            {eventGroups.map((eg) =>
              categories.map((cat) => (
                <col key={`${eg.key}-${cat.id}`} />
              ))
            )}
            <col className="w-[10%]" />
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
                    colSpan={Math.max(categories.length, 1)}
                    className={`text-center py-3.5 px-2.5 border-l border-slate-800 font-display text-xs sm:text-sm lg:text-base font-extrabold tracking-wide align-middle whitespace-normal break-words leading-snug ${
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

              <th className="text-center py-3.5 px-2 border-l border-slate-800 bg-slate-950 text-amber-400 font-display tracking-widest text-xs sm:text-sm sticky right-0 z-30 align-middle">
                ★ TOTAL SCORE
              </th>
            </tr>

            <tr className="bg-slate-100 text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b-2 border-slate-300">
              <th className="px-3.5 py-3 text-slate-900 font-extrabold sticky left-0 z-30 bg-slate-100 align-middle">
                Rank • Zone &amp; Entries
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

              <th className="text-center py-3 px-2 border-l border-slate-300 bg-amber-100 text-slate-950 font-extrabold sticky right-0 z-30 align-middle">
                PTS
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-sans">
            {schools.length === 0 ? (
              <tr>
                <td
                  colSpan={totalSubCols + 2}
                  className="py-16 text-center text-slate-400 font-semibold text-sm"
                >
                  No participating schools found.
                </td>
              </tr>
            ) : (
              schools.map((school, rowIndex) => {
                const isLeader = school.rank === 1 && school.points > 0;
                const isSilver = school.rank === 2 && school.points > 0;
                const isBronze = school.rank === 3 && school.points > 0;

                const rowBg = isLeader
                  ? "gold-shimmer hover:bg-amber-100/60"
                  : rowIndex % 2 === 1
                    ? "bg-slate-50/60 hover:bg-slate-100/70"
                    : "bg-white hover:bg-slate-50";

                const stickyCellBg = isLeader
                  ? "bg-amber-50/95"
                  : rowIndex % 2 === 1
                    ? "bg-slate-50"
                    : "bg-white";

                const borderColor = isLeader ? "border-amber-200/60" : "border-slate-200";
                const cellBorderColor = isLeader ? "border-amber-200/40" : "border-slate-100";

                const rankDelta = rankUpDeltas[school.id];

                return (
                  <tr
                    key={school.id}
                    ref={(el) => {
                      rowRefs.current[school.id] = el;
                    }}
                    className={`${rowBg} transition-colors duration-300 ${
                      rankDelta ? "ring-2 ring-inset ring-emerald-400/70" : ""
                    }`}
                  >
                    <td
                      className={`px-3 py-2 border-r ${borderColor} sticky left-0 z-10 ${stickyCellBg}`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-6 h-6 rounded font-display font-black text-xs flex items-center justify-center shrink-0 ${
                            isLeader
                              ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-300"
                              : isSilver
                                ? "bg-slate-300 text-slate-800 ring-1 ring-slate-400"
                                : isBronze
                                  ? "bg-orange-700 text-orange-50 ring-1 ring-orange-800"
                                  : "bg-slate-100 text-slate-700 border border-slate-300 font-bold"
                          }`}
                        >
                          {school.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs lg:text-sm tracking-tight truncate ${
                                isLeader
                                  ? "font-extrabold text-slate-900"
                                  : "font-bold text-slate-800"
                              }`}
                              title={school.name}
                            >
                              {school.name}
                            </span>
                            {rankDelta && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-white shrink-0 animate-pulse">
                                ▲ {rankDelta}
                              </span>
                            )}
                            {isLeader && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-amber-950 shrink-0">
                                LEAD
                              </span>
                            )}
                            {isSilver && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-300 shrink-0">
                                SLVR
                              </span>
                            )}
                            {isBronze && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200 shrink-0">
                                BRNZ
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] font-semibold truncate ${
                              isLeader ? "text-amber-800" : "text-slate-500"
                            }`}
                          >
                            {school.zone} • {school.entryCount}{" "}
                            {school.entryCount === 1 ? "Entry" : "Entries"}
                          </div>
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
                            className={`text-center py-2 px-1 font-mono-numbers text-xs lg:text-sm font-bold border-r ${
                              isLastCat ? borderColor : cellBorderColor
                            } ${
                              isLiveCell
                                ? "text-emerald-700 bg-emerald-50/40"
                                : pts > 0
                                  ? "text-slate-800"
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

                    <td
                      className={`text-center py-1.5 px-2 sticky right-0 z-10 border-l ${borderColor} ${
                        isLeader
                          ? "bg-amber-100/95"
                          : rowIndex % 2 === 1
                            ? "bg-slate-100"
                            : "bg-slate-50/95"
                      }`}
                    >
                      <div
                        className={`py-1 px-2 rounded-lg font-mono-numbers font-black text-base lg:text-xl shadow-sm tracking-tight ${
                          isLeader
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                            : "bg-slate-800 text-cyan-300"
                        }`}
                      >
                        {school.points.toLocaleString()}
                      </div>
                    </td>
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
