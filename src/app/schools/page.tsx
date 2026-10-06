"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsSnap = await getDocs(collection(db, "schools"));
        const schoolsData = schoolsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort alphabetically by name
        schoolsData.sort((a: any, b: any) => {
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB);
        });

        setSchools(schoolsData);
      } catch (error) {
        console.error("Error fetching schools:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (loading || schools.length === 0) return;
    
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Don't auto-scroll if the content fits within the container
    if (scrollContainer.scrollHeight <= scrollContainer.clientHeight) return;

    let isPaused = false;
    let animationFrameId: number;

    const autoScroll = () => {
      if (!scrollContainer) return;
      
      if (!isPaused) {
        scrollContainer.scrollTop += 1;
        
        // Check if we hit the bottom
        if (Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight) {
          isPaused = true;
          
          // Pause at the bottom
          setTimeout(() => {
            if (scrollContainer) {
              scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
              
              // Wait for smooth scroll to top to finish before resuming
              setTimeout(() => {
                isPaused = false;
              }, 1500);
            }
          }, 3000);
        }
      }
      
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, schools]);

  const filteredSchools = schools.filter(school => {
    if (!searchQuery) return true;
    return school.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           school.zone?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <main className="flex-1 w-full pt-28 pb-12 px-4 md:px-8 mx-auto flex flex-col">
        <div className="mb-8 flex justify-center">
          <h1 className="text-3xl md:text-4xl text-primary font-extrabold tracking-tight text-center">Participating Schools</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant font-bold text-3xl">
            Loading schools...
          </div>
        ) : (
          <div className="flex-1 bg-surface-container rounded-3xl overflow-hidden flex flex-col shadow-lg border border-surface-container-high max-h-[75vh]">
            <div ref={scrollRef} className="overflow-x-auto overflow-y-auto flex-1 scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high sticky top-0 z-10">
                  <tr>
                    <th className="px-8 py-6 text-2xl font-bold text-on-surface w-24">#</th>
                    <th className="px-8 py-6 text-2xl font-bold text-on-surface">School Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high bg-surface-container">
                  {filteredSchools.length > 0 ? (
                    filteredSchools.map((school, idx) => (
                      <tr key={school.id || idx} className="hover:bg-surface-container-high/50 transition-colors">
                        <td className="px-8 py-8 text-2xl font-medium text-on-surface-variant">{idx + 1}</td>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-6">
                            <span className="material-symbols-outlined text-[40px] text-primary">school</span>
                            <span className="text-3xl font-bold text-on-surface tracking-tight">{school.name}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-8 py-16 text-center text-on-surface-variant text-2xl">
                        No schools found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
