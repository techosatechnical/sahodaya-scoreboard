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
    if (!selectedEvent) return [];
    
    // Filter points for this event
    const eventPoints = points.filter(p => p.eventId === selectedEvent);
    
    // Group by position
    const winners = [];
    
    const getSchool = (schoolId: string) => schools.find(s => s.id === schoolId) || { name: "Unknown School", zone: "" };
    
    const firstPlace = eventPoints.find(p => p.position === "1st Place" || p.points === 5);
    if (firstPlace) winners.push({ ...firstPlace, school: getSchool(firstPlace.schoolId), rank: 1, label: "1st Place", theme: "amber", icon: "emoji_events" });
    
    const secondPlace = eventPoints.find(p => p.position === "2nd Place" || p.points === 3);
    if (secondPlace) winners.push({ ...secondPlace, school: getSchool(secondPlace.schoolId), rank: 2, label: "2nd Place", theme: "slate", icon: "military_tech" });
    
    const thirdPlace = eventPoints.find(p => p.position === "3rd Place" || p.points === 1);
    if (thirdPlace) winners.push({ ...thirdPlace, school: getSchool(thirdPlace.schoolId), rank: 3, label: "3rd Place", theme: "orange", icon: "workspace_premium" });
    
    return winners;
  };

  const winners = getWinnersForEvent();

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
              <div className="bg-surface-container rounded-3xl p-8 shadow-lg border border-surface-container-high mt-8">
                {winners.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {winners.map((winner) => (
                      <div key={winner.id} className="flex items-center gap-6 p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high">
                        <div className={`w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-full text-white ${winner.theme === 'amber' ? 'bg-amber-500' : winner.theme === 'slate' ? 'bg-slate-500' : 'bg-orange-500'}`}>
                          <span className="material-symbols-outlined text-[40px]">{winner.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-2xl font-extrabold ${winner.theme === 'amber' ? 'text-amber-500' : winner.theme === 'slate' ? 'text-slate-500' : 'text-orange-500'}`}>
                            {winner.label}
                          </h3>
                          <h2 className="text-3xl font-bold text-on-surface mt-1">{winner.school.name}</h2>
                          <p className="text-on-surface-variant mt-1 text-lg">{winner.school.zone}</p>
                        </div>
                      </div>
                    ))}
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
