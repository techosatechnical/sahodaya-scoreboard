"use client";

import { useState, useEffect } from "react";
import ScoreboardTable, {
  ScoreboardCategory,
  ScoreboardEventGroup,
  ScoreboardSchool,
} from "../components/ScoreboardTable";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

type RawEvent = {
  id: string;
  item: string;
  cat: string;
};

function formatCategoryShortLabel(name: string, index: number): string {
  const match = name.match(/\d+/);
  if (match) return `C ${match[0]}`;
  return `C ${index + 1}`;
}

function normalizeCatToken(val: string): string {
  return val
    .toLowerCase()
    .replace(/category/gi, "")
    .replace(/\bcat\b/gi, "")
    .replace(/\s+/g, "")
    .trim();
}

function matchCategoryId(
  evCat: string,
  categories: ScoreboardCategory[]
): string | null {
  if (categories.length === 0) return null;
  const normEv = normalizeCatToken(evCat);
  if (!normEv) return categories[0].id;

  // Direct match first
  for (const c of categories) {
    const normCat = normalizeCatToken(c.name);
    if (normEv === normCat) return c.id;
  }

  // Combined category like "1 & 2" or "1, 2" -> pick first matching category
  const tokens = normEv.split(/[&,/+]+/).filter(Boolean);
  for (const token of tokens) {
    for (const c of categories) {
      if (normalizeCatToken(c.name) === token) return c.id;
    }
  }

  return categories[0].id;
}

export default function Home() {
  const [schools, setSchools] = useState<ScoreboardSchool[]>([]);
  const [eventGroups, setEventGroups] = useState<ScoreboardEventGroup[]>([]);
  const [categories, setCategories] = useState<ScoreboardCategory[]>([]);
  const [liveEventGroupKey, setLiveEventGroupKey] = useState<string | null>(null);
  const [liveCategoryId, setLiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [clockTime, setClockTime] = useState("--:--:--");
  const [clockDate, setClockDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setClockTime(`${hours}:${minutes}:${seconds}`);
      setClockDate(
        now
          .toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          .toUpperCase()
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let rawEvents: RawEvent[] = [];
    let rawCategories: { id: string; name: string }[] = [];
    let rawSchools: Record<string, { id: string; name: string; zone: string }> =
      {};
    let rawPoints: {
      id: string;
      schoolId?: string;
      eventId?: string;
      points?: number;
      timestamp?: { toMillis?: () => number; seconds?: number };
    }[] = [];

    let hasSchools = false;
    let hasPoints = false;

    const recompute = () => {
      // 1. Build sorted categories list (C 1, C 2, ...)
      const sortedRawCats = [...rawCategories].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );

      let catList: ScoreboardCategory[] = sortedRawCats.map((c, idx) => ({
        id: c.id,
        name: c.name,
        shortLabel: formatCategoryShortLabel(c.name, idx),
      }));

      // Fallback if categories collection is empty
      if (catList.length === 0) {
        catList = [
          { id: "c1", name: "Category 1", shortLabel: "C 1" },
          { id: "c2", name: "Category 2", shortLabel: "C 2" },
          { id: "c3", name: "Category 3", shortLabel: "C 3" },
        ];
      }

      // 2. Group events by normalized item name so all categories appear under one event header
      const groupMap = new Map<string, ScoreboardEventGroup>();
      const eventToGroupAndCat: Record<
        string,
        { groupKey: string; categoryId: string }
      > = {};

      const sortedEvents = [...rawEvents].sort((a, b) =>
        a.item.localeCompare(b.item)
      );

      for (const ev of sortedEvents) {
        const key = ev.item.trim().toLowerCase();
        const existing = groupMap.get(key);
        if (existing) {
          existing.eventIds.push(ev.id);
        } else {
          groupMap.set(key, {
            key,
            name: ev.item.trim(),
            eventIds: [ev.id],
          });
        }
        const matchedCatId = matchCategoryId(ev.cat, catList) || catList[0].id;
        eventToGroupAndCat[ev.id] = {
          groupKey: key,
          categoryId: matchedCatId,
        };
      }

      const groups = Array.from(groupMap.values());

      // 3. Aggregate school scores & per-(eventGroup, category) cell scores
      const currentMap: Record<
        string,
        {
          id: string;
          name: string;
          zone: string;
          points: number;
          entryCount: number;
          cellPoints: Record<string, number>;
        }
      > = {};

      Object.values(rawSchools).forEach((s) => {
        currentMap[s.id] = {
          ...s,
          points: 0,
          entryCount: 0,
          cellPoints: {},
        };
      });

      let latestTimestamp = -1;
      let latestGroupKey: string | null = null;
      let latestCatId: string | null = null;

      for (const data of rawPoints) {
        const pts = Number(data.points) || 0;
        const mapping = data.eventId
          ? eventToGroupAndCat[data.eventId]
          : undefined;

        if (mapping) {
          const ts =
            data.timestamp?.toMillis?.() ??
            (data.timestamp?.seconds ? data.timestamp.seconds * 1000 : 0);
          if (ts >= latestTimestamp) {
            latestTimestamp = ts;
            latestGroupKey = mapping.groupKey;
            latestCatId = mapping.categoryId;
          }
        }

        if (data.schoolId && currentMap[data.schoolId]) {
          currentMap[data.schoolId].points += pts;
          currentMap[data.schoolId].entryCount += 1;
          if (mapping) {
            const cellKey = `${mapping.groupKey}__${mapping.categoryId}`;
            currentMap[data.schoolId].cellPoints[cellKey] =
              (currentMap[data.schoolId].cellPoints[cellKey] || 0) + pts;
          }
        }
      }

      const sortedSchools = Object.values(currentMap).sort(
        (a, b) => b.points - a.points
      );

      const processedSchools: ScoreboardSchool[] = sortedSchools.map(
        (school, index) => {
          const rank = index + 1;
          let theme: ScoreboardSchool["theme"] = "default";
          if (rank === 1 && school.points > 0) theme = "amber";
          else if (rank === 2 && school.points > 0) theme = "slate";
          else if (rank === 3 && school.points > 0) theme = "orange";

          return {
            ...school,
            rank,
            theme,
          };
        }
      );

      setCategories(catList);
      setEventGroups(groups);
      setLiveEventGroupKey(latestGroupKey);
      setLiveCategoryId(latestCatId);
      setSchools(processedSchools);
      if (hasSchools && hasPoints) {
        setLoading(false);
      }
    };

    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (catSnap) => {
        rawCategories = catSnap.docs.map((doc) => ({
          id: doc.id,
          name: String(doc.data().name || doc.id),
        }));
        recompute();
      },
      (error) => console.error("Error listening to categories:", error)
    );

    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (eventsSnap) => {
        rawEvents = eventsSnap.docs.map((doc) => ({
          id: doc.id,
          item: String(doc.data().item || "Untitled Event"),
          cat: doc.data().cat ? String(doc.data().cat) : "",
        }));
        recompute();
      },
      (error) => console.error("Error listening to events:", error)
    );

    const unsubSchools = onSnapshot(
      collection(db, "schools"),
      (schoolsSnap) => {
        const nextSchools: Record<
          string,
          { id: string; name: string; zone: string }
        > = {};
        schoolsSnap.forEach((doc) => {
          nextSchools[doc.id] = {
            id: doc.id,
            name: doc.data().name || "Unnamed School",
            zone: doc.data().zone || "Sahodaya Complex",
          };
        });
        rawSchools = nextSchools;
        hasSchools = true;
        recompute();
      },
      (error) => console.error("Error listening to schools:", error)
    );

    const unsubPoints = onSnapshot(
      collection(db, "points"),
      (pointsSnap) => {
        rawPoints = pointsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        hasPoints = true;
        recompute();
      },
      (error) => console.error("Error listening to points:", error)
    );

    return () => {
      unsubCategories();
      unsubEvents();
      unsubSchools();
      unsubPoints();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-100 text-slate-700 font-display font-bold text-xl">
        Loading Rangolsav 2026 Scoreboard...
      </div>
    );
  }

  return (
    <div className="bg-slate-100 text-slate-800 h-screen w-screen overflow-hidden flex flex-col p-3.5 sm:p-5 lg:p-6 antialiased selection:bg-blue-100">
      {/* Top Scoreboard Header */}
      <header
        className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm px-6 py-3.5 flex flex-wrap items-center justify-between gap-4"
        data-purpose="top-navigation-bar"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-900 flex items-center justify-center shadow-md shadow-indigo-200 text-white font-display font-extrabold text-2xl tracking-tighter shrink-0">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest">
                Live Finals
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black font-display tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
              RANGOLSAV{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                2026
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 lg:space-x-6">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 space-x-3 shadow-inner">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="text-left">
              <div className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-700">
                Live on Stage
              </div>
              <div className="text-xs font-bold text-slate-800">
                {schools.length} Schools Active
              </div>
            </div>
          </div>

          <div className="bg-indigo-950 text-white px-5 py-2 rounded-xl flex items-center space-x-3 shadow-md shadow-indigo-950/10">
            <div className="text-right">
              <div className="font-mono-numbers text-xl lg:text-2xl font-black tracking-tight text-white leading-none">
                {clockTime}
              </div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest mt-0.5">
                {clockDate || "RANGOLSAV 2026"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Scoreboard Grid */}
      <ScoreboardTable
        schools={schools}
        eventGroups={eventGroups}
        categories={categories}
        liveEventGroupKey={liveEventGroupKey}
        liveCategoryId={liveCategoryId}
      />
    </div>
  );
}
