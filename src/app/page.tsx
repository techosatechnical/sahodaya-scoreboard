"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ScoreboardTable from "../components/ScoreboardTable";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    // We need events to map point's eventId to category
    let eventsMap: Record<string, any> = {};
    const unsubEvents = onSnapshot(collection(db, "events"), (eventsSnap) => {
      const newEventsMap: Record<string, any> = {};
      eventsSnap.forEach((doc) => {
        newEventsMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      eventsMap = newEventsMap;
    });

    const unsubCategories = onSnapshot(collection(db, "categories"), (catSnap) => {
      const cats: any[] = [];
      catSnap.forEach((doc) => cats.push({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    });

    const unsubSchools = onSnapshot(collection(db, "schools"), (schoolsSnap) => {
      const schoolsData: Record<string, any> = {};
      schoolsSnap.forEach((doc) => {
        schoolsData[doc.id] = { id: doc.id, name: doc.data().name, points: 0, zone: doc.data().zone || "Unspecified Zone" };
      });

      const unsubPoints = onSnapshot(collection(db, "points"), (pointsSnap) => {
        const currentSchoolsData = JSON.parse(JSON.stringify(schoolsData));
        
        pointsSnap.forEach((doc) => {
          const data = doc.data();
          // Filter points by category if selectedCategory is not "all"
          if (selectedCategory !== "all") {
            const eventInfo = eventsMap[data.eventId];
            if (!eventInfo || eventInfo.cat !== selectedCategory) {
              return; // skip points not in this category
            }
          }
          
          if (data.schoolId && currentSchoolsData[data.schoolId]) {
            currentSchoolsData[data.schoolId].points += (data.points || 0);
          }
        });

        let processedSchools: any[] = Object.values(currentSchoolsData).sort((a: any, b: any) => b.points - a.points);
        
        processedSchools = processedSchools.map((school: any, index: number) => {
          const rank = index + 1;
          let theme = "default";
          let medal = "";
          let icon = "local_library";
          let margin = "";

          if (rank === 1 && school.points > 0) {
            theme = "amber";
            medal = "Champion Leader";
            icon = "emoji_events";
          } else if (rank === 2 && school.points > 0) {
            theme = "slate";
            medal = "2nd Place";
            icon = "military_tech";
          } else if (rank === 3 && school.points > 0) {
            theme = "orange";
            medal = "3rd Place";
            icon = "workspace_premium";
          }

          if (index > 0 && school.points > 0) {
            const pointDiff = (processedSchools[index - 1] as any).points - school.points;
            margin = `-${pointDiff} pts to next`;
          } else if (school.points > 0) {
            margin = "Leading";
          }

          return { ...school, rank, theme, medal, icon, margin };
        });

        setSchools(processedSchools);
        setLoading(false);
      }, (error) => console.error("Error listening to points:", error));
      
      return () => unsubPoints();
    }, (error) => console.error("Error listening to schools:", error));

    return () => {
      unsubSchools();
      unsubEvents();
      unsubCategories();
    };
  }, [selectedCategory]);

  const filteredSchools = schools.filter((school, index) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.zone.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === "top10") matchesFilter = index < 10;
    else if (filterType === "top25") matchesFilter = index < 25;
    else if (filterType === "zoneNorth")
      matchesFilter = school.zone.includes("North");

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-on-background font-bold text-xl">
        Loading scoreboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <main className="flex-1 w-full pt-28 md:pt-32 pb-16 md:pb-0 overflow-hidden flex flex-col">
        <div className="relative flex flex-col flex-1 w-full overflow-hidden">
          <Hero />
          <ScoreboardTable 
            filteredSchools={filteredSchools} 
            totalSchoolsCount={schools.length}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>
      </main>
    </div>
  );
}
