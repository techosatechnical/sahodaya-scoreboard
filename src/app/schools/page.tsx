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
  const isUserInteracting = useRef(false);

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
      
      // If the user is hovering/touching, don't auto-scroll, just loop
      if (!isPaused && !isUserInteracting.current) {
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
      
      <main className="flex-1 w-full pt-32 md:pt-40 pb-24 md:pb-12 px-4 md:px-8 mx-auto flex flex-col">
        <div className="mb-8 flex justify-center">
          <h1 className="text-3xl md:text-4xl text-primary font-extrabold tracking-tight text-center">Participating Schools</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant font-bold text-xl sm:text-3xl">
            Loading schools...
          </div>
        ) : (
          <div className="flex-1 bg-surface-container rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-lg border border-surface-container-high max-h-[75vh]">
            <div 
              ref={scrollRef} 
              className="overflow-x-auto overflow-y-auto flex-1 scrollbar-hide"
              onMouseEnter={() => { isUserInteracting.current = true; }}
              onMouseLeave={() => { isUserInteracting.current = false; }}
              onTouchStart={() => { isUserInteracting.current = true; }}
              onTouchEnd={() => { isUserInteracting.current = false; }}
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high sticky top-0 z-10">
                  <tr className="border-b border-surface-container text-on-surface-variant font-bold uppercase tracking-wider text-xs sm:text-sm 2xl:text-2xl h-10 sm:h-12 2xl:h-20">
                    <th className="px-4 sm:px-8 py-2 sm:py-6 w-16 sm:w-24 2xl:w-40 text-center">#</th>
                    <th className="px-4 sm:px-8 py-2 sm:py-6">School Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high bg-surface-container">
                  {filteredSchools.length > 0 ? (
                    filteredSchools.map((school, idx) => (
                      <tr key={school.id || idx} className="hover:bg-surface-container-high/50 transition-colors group">
                        <td className="px-4 sm:px-8 py-4 sm:py-8 2xl:py-12 text-center">
                          <span className="text-base sm:text-2xl 2xl:text-4xl font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-8 2xl:py-12">
                          <div className="flex items-center gap-3 sm:gap-6 2xl:gap-10">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 2xl:w-24 2xl:h-24 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 group-hover:bg-primary-container transition-colors shadow-sm">
                              <span className="material-symbols-outlined text-[20px] sm:text-[32px] 2xl:text-[48px] text-secondary group-hover:text-primary transition-colors">school</span>
                            </div>
                            <div className="flex flex-col justify-center">
                              <span className="text-sm sm:text-3xl 2xl:text-5xl font-extrabold text-on-surface tracking-tight">{school.name}</span>
                              <span className="text-xs sm:text-lg 2xl:text-3xl text-on-surface-variant font-medium mt-1">{school.zone}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-8 py-16 text-center text-on-surface-variant text-lg sm:text-2xl">
                        <span className="material-symbols-outlined text-[48px] opacity-50 mb-4">search_off</span>
                        <p>No schools found matching your search.</p>
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
