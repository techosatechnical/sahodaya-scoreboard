"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import eventsData from "@/data/events.json";

// ==========================================
// ADMIN CONFIGURATION
// You can change this password to whatever you want
// ==========================================
const ADMIN_PASSWORD = "rangolsav2026";

type TabKey = "points" | "schools" | "categories" | "events";

type SchoolItem = { id: string; name: string; zone?: string };
type CategoryItem = { id: string; name: string };
type EventItem = {
  id: string;
  item: string;
  cat: string;
  eventType?: "single" | "group";
};
type PointItem = {
  id: string;
  schoolId: string;
  eventId: string;
  points: number;
  position?: string;
  eventType?: string;
  timestamp?: any;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("points");

  // Password Protection States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Data States
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [pointsList, setPointsList] = useState<PointItem[]>([]);

  // Status Banner
  const [status, setStatus] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Points Form & Search
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [selectedCategoryForPoints, setSelectedCategoryForPoints] =
    useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [points, setPoints] = useState("");
  const [pointsSearch, setPointsSearch] = useState("");

  // Schools Form & Search
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolZone, setSchoolZone] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");

  // Categories Form
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [categoryName, setCategoryName] = useState("");

  // Events Form & Search
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventType, setEventType] = useState<"single" | "group">("single");
  const [eventSearch, setEventSearch] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("admin_authenticated") === "true") {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      sessionStorage.setItem("admin_authenticated", "true");
    } else {
      setAuthError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput("");
    sessionStorage.removeItem("admin_authenticated");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubSchools = onSnapshot(
      collection(db, "schools"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          name: String(d.data().name || ""),
          zone: d.data().zone ? String(d.data().zone) : "",
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setSchools(list);
      },
      (err) => console.error("Schools listener error:", err)
    );

    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          name: String(d.data().name || ""),
        }));
        list.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true })
        );
        setCategories(list);
      },
      (err) => console.error("Categories listener error:", err)
    );

    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          item: String(d.data().item || ""),
          cat: String(d.data().cat || ""),
          eventType: d.data().eventType as "single" | "group" | undefined,
        }));
        list.sort((a, b) => a.item.localeCompare(b.item));
        setEvents(list);
      },
      (err) => console.error("Events listener error:", err)
    );

    const unsubPoints = onSnapshot(
      collection(db, "points"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          schoolId: String(d.data().schoolId || ""),
          eventId: String(d.data().eventId || ""),
          points: Number(d.data().points) || 0,
          position: d.data().position ? String(d.data().position) : "",
          eventType: d.data().eventType ? String(d.data().eventType) : "",
          timestamp: d.data().timestamp,
        }));
        list.sort((a, b) => {
          const ta =
            a.timestamp?.toMillis?.() ??
            (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0);
          const tb =
            b.timestamp?.toMillis?.() ??
            (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0);
          return tb - ta;
        });
        setPointsList(list);
      },
      (err) => console.error("Points listener error:", err)
    );

    return () => {
      unsubSchools();
      unsubCategories();
      unsubEvents();
      unsubPoints();
    };
  }, [isAuthenticated]);

  const showStatus = (
    text: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 3500);
  };

  // Lookup maps
  const schoolMap = useMemo(() => {
    const m: Record<string, SchoolItem> = {};
    schools.forEach((s) => (m[s.id] = s));
    return m;
  }, [schools]);

  const eventMap = useMemo(() => {
    const m: Record<string, EventItem> = {};
    events.forEach((e) => (m[e.id] = e));
    return m;
  }, [events]);

  // Helper to resolve position label
  const getPositionLabel = (ptsStr: string, isGroup: boolean) => {
    if (isGroup) {
      if (ptsStr === "10") return "1st Place";
      if (ptsStr === "7") return "2nd Place";
      if (ptsStr === "5") return "3rd Place";
      if (ptsStr === "3") return "A Grade";
    } else {
      if (ptsStr === "5") return "1st Place";
      if (ptsStr === "3") return "2nd Place";
      if (ptsStr === "2") return "3rd Place";
      if (ptsStr === "1") return "A Grade";
    }
    return "";
  };

  // ==================== POINTS CRUD ====================
  const resetPointsForm = () => {
    setEditingPointId(null);
    setSelectedCategoryForPoints("");
    setSelectedEvent("");
    setSelectedSchool("");
    setPoints("");
  };

  const handleSavePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !selectedEvent || !points) return;

    try {
      const currentEv = events.find((ev) => ev.id === selectedEvent);
      const isGroup = currentEv
        ? currentEv.eventType === "group" ||
          /action\s*song|western\s*dance/i.test(currentEv.item || "")
        : false;
      const positionLabel = getPositionLabel(points, isGroup);

      if (editingPointId) {
        await updateDoc(doc(db, "points", editingPointId), {
          schoolId: selectedSchool,
          eventId: selectedEvent,
          points: parseInt(points),
          position: positionLabel,
          eventType: isGroup ? "group" : "single",
        });
        showStatus("Score updated successfully!");
      } else {
        await addDoc(collection(db, "points"), {
          schoolId: selectedSchool,
          eventId: selectedEvent,
          points: parseInt(points),
          position: positionLabel,
          eventType: isGroup ? "group" : "single",
          timestamp: new Date(),
        });
        showStatus("Points awarded successfully!");
      }
      resetPointsForm();
    } catch (err) {
      console.error(err);
      showStatus("Error saving points.", "error");
    }
  };

  const handleEditPoint = (p: PointItem) => {
    const ev = eventMap[p.eventId];
    let matchedCat = "";
    if (ev) {
      const evCat = String(ev.cat).trim();
      const found = categories.find(
        (c) =>
          c.name.trim() === evCat ||
          c.name.trim() === `Category ${evCat}` ||
          c.name.replace(/Category\s+/i, "").trim() === evCat
      );
      matchedCat = found ? found.name : evCat;
    }
    setEditingPointId(p.id);
    setSelectedCategoryForPoints(matchedCat);
    setSelectedEvent(p.eventId);
    setSelectedSchool(p.schoolId);
    setPoints(String(p.points));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePoint = async (id: string) => {
    if (!window.confirm("Delete this awarded score entry?")) return;
    try {
      await deleteDoc(doc(db, "points", id));
      if (editingPointId === id) resetPointsForm();
      showStatus("Score entry deleted.");
    } catch (err) {
      console.error(err);
      showStatus("Error deleting score entry.", "error");
    }
  };

  // ==================== SCHOOLS CRUD ====================
  const resetSchoolForm = () => {
    setEditingSchoolId(null);
    setSchoolName("");
    setSchoolZone("");
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;
    try {
      const payload = {
        name: schoolName.trim(),
        zone: schoolZone.trim() || "Sahodaya Complex",
      };
      if (editingSchoolId) {
        await updateDoc(doc(db, "schools", editingSchoolId), payload);
        showStatus("School updated successfully!");
      } else {
        await addDoc(collection(db, "schools"), payload);
        showStatus("School added successfully!");
      }
      resetSchoolForm();
    } catch (err) {
      console.error(err);
      showStatus("Error saving school.", "error");
    }
  };

  const handleEditSchool = (s: SchoolItem) => {
    setEditingSchoolId(s.id);
    setSchoolName(s.name);
    setSchoolZone(s.zone || "");
  };

  const handleDeleteSchool = async (id: string) => {
    if (!window.confirm("Delete this school? Existing point records will remain."))
      return;
    try {
      await deleteDoc(doc(db, "schools", id));
      if (editingSchoolId === id) resetSchoolForm();
      showStatus("School deleted.");
    } catch (err) {
      console.error(err);
      showStatus("Error deleting school.", "error");
    }
  };

  const handleBulkAddSchools = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length > 0 && lines[0].toLowerCase().includes("school")) {
        lines.shift();
      }

      if (lines.length === 0) {
        showStatus("File is empty or invalid.", "error");
        return;
      }

      showStatus(`Uploading ${lines.length} schools...`, "info");

      try {
        await Promise.all(
          lines.map((name) => addDoc(collection(db, "schools"), { name }))
        );
        showStatus(`Successfully added ${lines.length} schools!`);
      } catch (err) {
        console.error("Bulk add error:", err);
        showStatus("Error uploading some schools.", "error");
      }

      e.target.value = "";
    };

    reader.readAsText(file);
  };

  // ==================== CATEGORIES CRUD ====================
  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      if (editingCategoryId) {
        await updateDoc(doc(db, "categories", editingCategoryId), {
          name: categoryName.trim(),
        });
        showStatus("Category updated successfully!");
      } else {
        await addDoc(collection(db, "categories"), {
          name: categoryName.trim(),
        });
        showStatus("Category added successfully!");
      }
      resetCategoryForm();
    } catch (err) {
      console.error(err);
      showStatus("Error saving category.", "error");
    }
  };

  const handleEditCategory = (c: CategoryItem) => {
    setEditingCategoryId(c.id);
    setCategoryName(c.name);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      if (editingCategoryId === id) resetCategoryForm();
      showStatus("Category deleted.");
    } catch (err) {
      console.error(err);
      showStatus("Error deleting category.", "error");
    }
  };

  // ==================== EVENTS CRUD ====================
  const resetEventForm = () => {
    setEditingEventId(null);
    setEventName("");
    setEventCategory("");
    setEventType("single");
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventCategory) return;
    try {
      const payload = {
        item: eventName.trim(),
        cat: eventCategory,
        eventType:
          eventType ||
          (/action\s*song|western\s*dance/i.test(eventName)
            ? "group"
            : "single"),
      };
      if (editingEventId) {
        await updateDoc(doc(db, "events", editingEventId), payload);
        showStatus("Event updated successfully!");
      } else {
        await addDoc(collection(db, "events"), payload);
        showStatus("Event added successfully!");
      }
      resetEventForm();
    } catch (err) {
      console.error(err);
      showStatus("Error saving event.", "error");
    }
  };

  const handleEditEvent = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setEventName(ev.item);
    setEventCategory(ev.cat);
    setEventType(
      ev.eventType === "group" || /action\s*song|western\s*dance/i.test(ev.item)
        ? "group"
        : "single"
    );
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      if (editingEventId === id) resetEventForm();
      showStatus("Event deleted.");
    } catch (err) {
      console.error(err);
      showStatus("Error deleting event.", "error");
    }
  };

  const handleSyncDefaultEvents = async () => {
    try {
      showStatus("Syncing events from schedule...", "info");
      const existingSnap = await getDocs(collection(db, "events"));
      const existingNames = new Set(
        existingSnap.docs.map((d) =>
          (d.data().item || "").toLowerCase().trim()
        )
      );

      let addedCount = 0;
      for (const ev of eventsData) {
        if (!existingNames.has(ev.item.toLowerCase().trim())) {
          await addDoc(collection(db, "events"), {
            item: ev.item,
            cat: String(ev.cat),
            eventType:
              ev.eventType ||
              (/action\s*song|western\s*dance/i.test(ev.item)
                ? "group"
                : "single"),
          });
          addedCount++;
        }
      }
      showStatus(
        addedCount > 0
          ? `Successfully synced ${addedCount} events!`
          : "All schedule events are already synced."
      );
    } catch (err) {
      console.error("Sync error:", err);
      showStatus("Error syncing events.", "error");
    }
  };

  const handleBulkAddEvents = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        let eventsToAdd: { item: string; cat: string }[] = [];

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            eventsToAdd = parsed
              .map((p) => ({
                item: p.item || p.name || "",
                cat: String(p.cat || p.category || ""),
              }))
              .filter((ev) => ev.item && ev.cat);
          }
        } else {
          const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          if (lines.length > 0 && lines[0].toLowerCase().includes("event")) {
            lines.shift();
          }

          eventsToAdd = lines
            .map((line) => {
              const parts = line.split(",");
              if (parts.length >= 2) {
                return { item: parts[0].trim(), cat: parts[1].trim() };
              }
              return null;
            })
            .filter(Boolean) as { item: string; cat: string }[];
        }

        if (eventsToAdd.length === 0) {
          showStatus("File is empty or invalid format.", "error");
          return;
        }

        showStatus(`Uploading ${eventsToAdd.length} events...`, "info");
        await Promise.all(
          eventsToAdd.map((ev) => addDoc(collection(db, "events"), ev))
        );
        showStatus(`Successfully added ${eventsToAdd.length} events!`);
      } catch (err) {
        console.error("Bulk add error:", err);
        showStatus("Error uploading some events.", "error");
      }

      e.target.value = "";
    };

    reader.readAsText(file);
  };

  // Filtered lists
  const filteredPoints = useMemo(() => {
    const q = pointsSearch.toLowerCase().trim();
    if (!q) return pointsList;
    return pointsList.filter((p) => {
      const sName = (schoolMap[p.schoolId]?.name || "").toLowerCase();
      const eName = (eventMap[p.eventId]?.item || "").toLowerCase();
      const eCat = (eventMap[p.eventId]?.cat || "").toLowerCase();
      const pos = (p.position || "").toLowerCase();
      return (
        sName.includes(q) ||
        eName.includes(q) ||
        eCat.includes(q) ||
        pos.includes(q)
      );
    });
  }, [pointsList, pointsSearch, schoolMap, eventMap]);

  const filteredSchools = useMemo(() => {
    const q = schoolSearch.toLowerCase().trim();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.zone || "").toLowerCase().includes(q)
    );
  }, [schools, schoolSearch]);

  const filteredEvents = useMemo(() => {
    const q = eventSearch.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (ev) =>
        ev.item.toLowerCase().includes(q) || ev.cat.toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  // ==================== AUTH SCREENS ====================
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-700 font-display font-bold text-lg">
        Checking access...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-700 via-blue-600 to-indigo-900 text-white flex items-center justify-center mb-5 shadow-md shadow-indigo-200">
            <span className="material-symbols-outlined text-[30px]">lock</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest mb-2">
            RANGOTSAV 2026
          </span>
          <h1 className="text-2xl font-black font-display text-slate-900 tracking-tight">
            Admin Authentication
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 mb-6">
            Enter the admin password to manage scores, schools, categories, and
            events.
          </p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <input
              type="password"
              placeholder="Enter Admin Password"
              className="h-12 px-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setAuthError("");
              }}
              autoFocus
              required
            />

            {authError && (
              <div className="text-sm font-semibold text-red-700 text-left bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="h-12 w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
            >
              Unlock Admin Dashboard
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 w-full">
            <Link
              href="/"
              className="text-sm font-bold text-slate-500 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
            >
              ← Return to Live Scoreboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD ====================
  const currentEventForPoints = events.find((ev) => ev.id === selectedEvent);
  const isGroupForPoints = currentEventForPoints
    ? currentEventForPoints.eventType === "group" ||
      /action\s*song|western\s*dance/i.test(currentEventForPoints.item || "")
    : false;

  const filteredEventsForPoints = events.filter((ev) => {
    if (!selectedCategoryForPoints) return false;
    const evCat = String(ev.cat).trim();
    const selCat = String(selectedCategoryForPoints).trim();
    return (
      evCat === selCat ||
      `Category ${evCat}` === selCat ||
      evCat === selCat.replace(/Category\s+/i, "").trim()
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-900 flex items-center justify-center text-white font-display font-extrabold text-xl shadow-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-display text-slate-900 tracking-tight">
                  RANGOTSAV{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    2026
                  </span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Live Scoreboard Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">
                leaderboard
              </span>
              <span className="hidden sm:inline">Live Scoreboard</span>
              <span className="sm:hidden">Board</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Lock Admin Panel"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              key: "points" as TabKey,
              label: "Scores Awarded",
              count: pointsList.length,
              icon: "emoji_events",
              accent: "text-amber-600 bg-amber-50 border-amber-200",
            },
            {
              key: "schools" as TabKey,
              label: "Schools",
              count: schools.length,
              icon: "school",
              accent: "text-blue-600 bg-blue-50 border-blue-200",
            },
            {
              key: "categories" as TabKey,
              label: "Categories",
              count: categories.length,
              icon: "category",
              accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
            },
            {
              key: "events" as TabKey,
              label: "Events",
              count: events.length,
              icon: "event_note",
              accent: "text-indigo-600 bg-indigo-50 border-indigo-200",
            },
          ].map((stat) => {
            const isActive = activeTab === stat.key;
            return (
              <button
                key={stat.key}
                onClick={() => setActiveTab(stat.key)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-slate-900 mt-1">
                    {stat.count}
                  </div>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${stat.accent}`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {stat.icon}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          {(
            [
              { key: "points", label: "Manage Points", icon: "emoji_events" },
              { key: "schools", label: "Schools", icon: "school" },
              { key: "categories", label: "Categories", icon: "category" },
              { key: "events", label: "Events", icon: "event_note" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status Banner */}
        {status && (
          <div
            className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-between border shadow-xs ${
              status.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : status.type === "info"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <span>{status.text}</span>
            <button
              onClick={() => setStatus(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================== TAB 1: MANAGE POINTS ==================== */}
        {activeTab === "points" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Award / Edit Score Form */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {editingPointId ? "Edit Awarded Score" : "Award Points"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingPointId
                      ? "Modify the selected score entry below"
                      : "Assign a prize or grade to a school"}
                  </p>
                </div>
                {editingPointId && (
                  <button
                    type="button"
                    onClick={resetPointsForm}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSavePoints} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Category
                  </label>
                  <select
                    className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-600"
                    value={selectedCategoryForPoints}
                    onChange={(e) => {
                      setSelectedCategoryForPoints(e.target.value);
                      setSelectedEvent("");
                      setPoints("");
                    }}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Event
                  </label>
                  <select
                    className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      setPoints("");
                    }}
                    required
                    disabled={!selectedCategoryForPoints}
                  >
                    <option value="">-- Choose Event --</option>
                    {filteredEventsForPoints.map((ev) => {
                      const isGrp =
                        ev.eventType === "group" ||
                        /action\s*song|western\s*dance/i.test(ev.item || "");
                      return (
                        <option key={ev.id} value={ev.id}>
                          {ev.item} ({isGrp ? "Group" : "Single"})
                        </option>
                      );
                    })}
                  </select>
                  {selectedEvent && (
                    <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-between border border-indigo-100">
                      <span>
                        {isGroupForPoints ? "Group Event" : "Single Event"}
                      </span>
                      <span className="font-mono-numbers font-bold">
                        {isGroupForPoints
                          ? "10 / 7 / 5 / 3 pts"
                          : "5 / 3 / 2 / 1 pts"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    School
                  </label>
                  <select
                    className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-600"
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    required
                  >
                    <option value="">-- Choose School --</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Position / Grade
                  </label>
                  <select
                    className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    required
                    disabled={!selectedEvent}
                  >
                    <option value="">-- Choose Position / Grade --</option>
                    {isGroupForPoints ? (
                      <>
                        <option value="10">1st Prize (10 points)</option>
                        <option value="7">2nd Prize (7 points)</option>
                        <option value="5">3rd Prize (5 points)</option>
                        <option value="3">A Grade (3 points)</option>
                      </>
                    ) : (
                      <>
                        <option value="5">1st Prize (5 points)</option>
                        <option value="3">2nd Prize (3 points)</option>
                        <option value="2">3rd Prize (2 points)</option>
                        <option value="1">A Grade (1 point)</option>
                      </>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  className={`h-11 rounded-xl font-bold text-white transition-opacity hover:opacity-95 cursor-pointer shadow-sm mt-1 ${
                    editingPointId
                      ? "bg-amber-600"
                      : "bg-gradient-to-r from-indigo-600 to-blue-600"
                  }`}
                >
                  {editingPointId ? "Update Score" : "Award Position / Grade"}
                </button>
              </form>
            </div>

            {/* Awarded Scores Ledger */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Awarded Scores ({filteredPoints.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Edit or delete any previously submitted score in real time
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Search school, event, category..."
                  className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 w-full sm:w-64"
                  value={pointsSearch}
                  onChange={(e) => setPointsSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[540px] overflow-auto">
                {filteredPoints.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm font-medium">
                    No score entries found.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4">School</th>
                        <th className="py-3 px-4">Event &amp; Category</th>
                        <th className="py-3 px-4 text-center">Points</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredPoints.map((p) => {
                        const sc = schoolMap[p.schoolId];
                        const ev = eventMap[p.eventId];
                        const isEditing = editingPointId === p.id;
                        return (
                          <tr
                            key={p.id}
                            className={`${
                              isEditing
                                ? "bg-amber-50/70"
                                : "hover:bg-slate-50/80"
                            } transition-colors`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {sc?.name || "Unknown School"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">
                                {ev?.item || "Unknown Event"}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{ev?.cat || "—"}</span>
                                {p.position && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                    {p.position}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono-numbers font-black text-sm border border-indigo-200">
                                +{p.points}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleEditPoint(p)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 mr-1.5 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePoint(p.id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MANAGE SCHOOLS ==================== */}
        {activeTab === "schools" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {editingSchoolId ? "Edit School" : "Add New School"}
                  </h2>
                  {editingSchoolId && (
                    <button
                      type="button"
                      onClick={resetSchoolForm}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <form onSubmit={handleSaveSchool} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      School Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. St. Joseph Academy"
                      className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Zone / Sub-label (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sahodaya Complex"
                      className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                      value={schoolZone}
                      onChange={(e) => setSchoolZone(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`h-11 rounded-xl font-bold text-white cursor-pointer ${
                      editingSchoolId
                        ? "bg-amber-600"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600"
                    }`}
                  >
                    {editingSchoolId ? "Update School" : "Add School"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Bulk Add Schools
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Upload a CSV or TXT file with one school name per line.
                </p>
                <input
                  type="file"
                  accept=".csv, .txt"
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  onChange={handleBulkAddSchools}
                />
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Existing Schools ({filteredSchools.length})
                </h2>
                <input
                  type="text"
                  placeholder="Search schools..."
                  className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 w-full sm:w-64"
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[540px] overflow-auto divide-y divide-slate-100">
                {filteredSchools.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm font-medium">
                    No schools found.
                  </div>
                ) : (
                  filteredSchools.map((s) => (
                    <div
                      key={s.id}
                      className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                        editingSchoolId === s.id
                          ? "bg-amber-50/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {s.zone || "Sahodaya Complex"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditSchool(s)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchool(s.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: MANAGE CATEGORIES ==================== */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingCategoryId ? "Edit Category" : "Add New Category"}
                </h2>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Category 1"
                    className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`h-11 rounded-xl font-bold text-white cursor-pointer ${
                    editingCategoryId
                      ? "bg-amber-600"
                      : "bg-gradient-to-r from-indigo-600 to-blue-600"
                  }`}
                >
                  {editingCategoryId ? "Update Category" : "Add Category"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Existing Categories ({categories.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm font-medium">
                    No categories found.
                  </div>
                ) : (
                  categories.map((c) => (
                    <div
                      key={c.id}
                      className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                        editingCategoryId === c.id
                          ? "bg-amber-50/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold text-slate-900 text-sm">
                        {c.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditCategory(c)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: MANAGE EVENTS ==================== */}
        {activeTab === "events" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {editingEventId ? "Edit Event" : "Add New Event"}
                  </h2>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={resetEventForm}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Event Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Story Telling"
                      className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Category
                    </label>
                    <select
                      className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Event Type
                    </label>
                    <select
                      className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                      value={eventType}
                      onChange={(e) =>
                        setEventType(e.target.value as "single" | "group")
                      }
                    >
                      <option value="single">
                        Single Event (5 / 3 / 2 / 1)
                      </option>
                      <option value="group">
                        Group Event (10 / 7 / 5 / 3)
                      </option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className={`h-11 rounded-xl font-bold text-white cursor-pointer ${
                      editingEventId
                        ? "bg-amber-600"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600"
                    }`}
                  >
                    {editingEventId ? "Update Event" : "Add Event"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Quick Sync &amp; Bulk Import
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sync default schedule events or upload a CSV / JSON file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncDefaultEvents}
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:opacity-90 cursor-pointer"
                >
                  Sync Schedule Events
                </button>
                <input
                  type="file"
                  accept=".csv, .txt, .json"
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  onChange={handleBulkAddEvents}
                />
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Existing Events ({filteredEvents.length})
                </h2>
                <input
                  type="text"
                  placeholder="Search events or categories..."
                  className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 w-full sm:w-64"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[580px] overflow-auto divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm font-medium">
                    No events found.
                  </div>
                ) : (
                  filteredEvents.map((ev) => {
                    const isGrp =
                      ev.eventType === "group" ||
                      /action\s*song|western\s*dance/i.test(ev.item || "");
                    return (
                      <div
                        key={ev.id}
                        className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                          editingEventId === ev.id
                            ? "bg-amber-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">
                            {ev.item}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                              {ev.cat}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              {isGrp ? "Group" : "Single"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditEvent(ev)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
