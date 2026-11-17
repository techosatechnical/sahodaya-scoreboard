"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";

export default function ResultsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // For Header, not strictly used here

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsSnap, eventsSnap, schoolsSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "schools"))
        ]);

        setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSchools(schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching base data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Listen to points in real-time
    const unsubPoints = onSnapshot(collection(db, "points"), (snap) => {
      setPoints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubPoints();
  }, []);

  // Get winners for the selected event
  const getWinnersForEvent = () => {
    if (!selectedEvent) return { podium: [], aGrades: [], isGroup: false };
    
    // Filter points for this event
    const eventPoints = points.filter(p => p.eventId === selectedEvent);
    const getSchool = (schoolId: string) => schools.find(s => s.id === schoolId) || { name: "Unknown School", zone: "" };
    
    const eventObj = events.find(e => e.id === selectedEvent);
    const isGroup = eventObj?.eventType === "group" || /action\s*song|western\s*dance/i.test(eventObj?.item || "");
    
    const firstPts = isGroup ? 10 : 5;
    const secondPts = isGroup ? 7 : 3;
    const thirdPts = isGroup ? 5 : 2;
    const aGradePts = isGroup ? 3 : 1;

    const firstPlace = eventPoints.find(p => p.position === "1st Place" || p.points === firstPts);
    const secondPlace = eventPoints.find(p => p.position === "2nd Place" || p.points === secondPts);
    const thirdPlace = eventPoints.find(p => p.position === "3rd Place" || p.points === thirdPts);
    
    const podium = [];
    if (firstPlace) podium.push({ ...firstPlace, school: getSchool(firstPlace.schoolId), rank: 1, label: "1st Prize", theme: "amber", icon: "emoji_events", pts: firstPlace.points || firstPts });
    if (secondPlace) podium.push({ ...secondPlace, school: getSchool(secondPlace.schoolId), rank: 2, label: "2nd Prize", theme: "slate", icon: "military_tech", pts: secondPlace.points || secondPts });
    if (thirdPlace) podium.push({ ...thirdPlace, school: getSchool(thirdPlace.schoolId), rank: 3, label: "3rd Prize", theme: "orange", icon: "workspace_premium", pts: thirdPlace.points || thirdPts });

    const aGrades = eventPoints
      .filter(p => p.position === "A Grade" || (p.points === aGradePts && p.id !== firstPlace?.id && p.id !== secondPlace?.id && p.id !== thirdPlace?.id))
      .map(p => ({
        ...p,
        school: getSchool(p.schoolId),
        label: "A Grade",
        pts: p.points || aGradePts
      }));

    return { podium, aGrades, isGroup };
  };

  const { podium, aGrades, isGroup } = getWinnersForEvent();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <main className="flex-1 w-full pt-32 md:pt-40 pb-24 md:pb-12 px-4 md:px-8 max-w-5xl mx-auto flex flex-col">
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl text-primary font-extrabold tracking-tight">Event Results</h1>
          <p className="text-on-surface-variant mt-4 text-xl">Select a category and event to view the winners.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-on-surface-variant font-bold text-2xl">
            Loading results...
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Filters */}
            <div className="bg-surface-container rounded-3xl p-8 shadow-sm border border-surface-container-high flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold text-on-surface text-lg">Category</label>
                <select 
                  className="h-14 px-4 rounded-xl bg-surface-container-lowest border text-on-surface text-lg" 
                  value={selectedCategory} 
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedEvent("");
                  }} 
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold text-on-surface text-lg">Event</label>
                <select 
                  className="h-14 px-4 rounded-xl bg-surface-container-lowest border text-on-surface text-lg disabled:opacity-50" 
                  value={selectedEvent} 
                  onChange={(e) => setSelectedEvent(e.target.value)} 
                  disabled={!selectedCategory}
                >
                  <option value="">-- Choose Event --</option>
                  {events
                    .filter(ev => {
                      const evCat = String(ev.cat).trim();
                      const selCat = String(selectedCategory).trim();
                      return evCat === selCat || `Category ${evCat}` === selCat || evCat === selCat.replace(/Category\s+/i, '').trim();
                    })
                    .map(ev => <option key={ev.id} value={ev.id}>{ev.item}</option>)
                  }
                </select>
              </div>
            </div>

            {/* Results Podium */}
            {selectedEvent ? (
              <div className="bg-surface-container rounded-3xl p-6 md:p-8 shadow-lg border border-surface-container-high mt-8 flex flex-col gap-6">
                {/* Event Type Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xl md:text-2xl text-on-surface">
                      {events.find(e => e.id === selectedEvent)?.item}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${isGroup ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"}`}>
                      {isGroup ? "Group Event" : "Single Event"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-on-surface-variant font-semibold">
                    {isGroup ? "1st: 10 pts • 2nd: 7 pts • 3rd: 5 pts • A Grade: 3 pts" : "1st: 5 pts • 2nd: 3 pts • 3rd: 2 pts • A Grade: 1 pt"}
                  </span>
                </div>

                {podium.length > 0 || aGrades.length > 0 ? (
                  <div className="flex flex-col gap-8">
                    {/* Podium (1st, 2nd, 3rd) */}
                    {podium.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Prize Winners</h4>
                        <div className="flex flex-col gap-4">
                          {podium.map((winner) => (
                            <div key={winner.id} className="flex items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high">
                              <div className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center rounded-2xl text-white ${winner.theme === 'amber' ? 'bg-amber-500' : winner.theme === 'slate' ? 'bg-slate-500' : 'bg-orange-500'}`}>
                                <span className="material-symbols-outlined text-[32px] sm:text-[36px]">{winner.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className={`text-lg sm:text-xl font-extrabold ${winner.theme === 'amber' ? 'text-amber-500' : winner.theme === 'slate' ? 'text-slate-500' : 'text-orange-500'}`}>
                                    {winner.label}
                                  </h3>
                                  <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                                    +{winner.pts} pts
                                  </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-on-surface mt-1 truncate">{winner.school.name}</h2>
                                {winner.school.zone && <p className="text-on-surface-variant text-sm mt-0.5">{winner.school.zone}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* A Grade Section */}
                    {aGrades.length > 0 && (
                      <div className="flex flex-col gap-4 pt-4 border-t border-surface-container-high/60">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                            A Grade Recipients (80% and above)
                          </h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            +{isGroup ? 3 : 1} pts each
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {aGrades.map((grade) => (
                            <div key={grade.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                                A
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-on-surface truncate">{grade.school.name}</h3>
                                {grade.school.zone && <p className="text-xs text-on-surface-variant truncate">{grade.school.zone}</p>}
                              </div>
                              <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface-container text-on-surface shrink-0">
                                +{grade.pts} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">history_edu</span>
                    <h3 className="text-2xl font-bold text-on-surface">No results yet</h3>
                    <p className="mt-2 text-lg">Points have not been awarded for this event.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 opacity-50">
                <span className="material-symbols-outlined text-[80px] text-on-surface-variant">emoji_events</span>
                <p className="mt-4 text-2xl font-bold text-on-surface-variant">Select an event to view winners</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
