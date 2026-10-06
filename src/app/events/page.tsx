"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import eventsData from "../../data/events.json";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserInteracting = useRef(false);

  // Auto-scroll effect
  useEffect(() => {
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
  }, []);

  const filteredEvents = eventsData.filter(event => 
    event.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.stageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.day]) acc[event.day] = [];
    acc[event.day].push(event);
    return acc;
  }, {} as Record<string, typeof eventsData>);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <main className="flex-1 w-full pt-32 md:pt-40 overflow-hidden flex flex-col max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display-md text-display-md text-primary font-bold">Event Schedule</h1>
          <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md">
            {filteredEvents.length} Events
          </span>
        </div>

        <div className="w-full h-full flex flex-col min-h-0">
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-auto scroll-smooth pb-8 pr-2 scrollbar-hide"
            onMouseEnter={() => { isUserInteracting.current = true; }}
            onMouseLeave={() => { isUserInteracting.current = false; }}
            onTouchStart={() => { isUserInteracting.current = true; }}
            onTouchEnd={() => { isUserInteracting.current = false; }}
          >
            {Object.entries(groupedEvents).map(([day, dayEvents]) => (
              <div key={day} className="mb-8 last:mb-0">
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-3 mb-2">
                  <h2 className="font-headline-sm text-headline-sm text-secondary font-bold tracking-tight">
                    {day}
                  </h2>
                </div>
                <div className="w-full flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-xs sm:text-sm uppercase tracking-wider h-10 sm:h-12 border-b border-surface-container">
                        <tr>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 w-12 sm:w-16 text-center">No.</th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4 w-12 sm:w-16 text-center">Cat</th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4">Item</th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4">Stage</th>
                          <th className="py-2 sm:py-3 px-2 sm:px-4">Venue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/60 font-body-md text-sm sm:text-base text-on-surface">
                        {dayEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-surface-container-low/30 transition-colors">
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-on-surface-variant font-bold">{event.id}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                              <span className="w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center rounded-full bg-surface-container text-on-surface text-[10px] sm:text-xs font-bold">
                                {event.cat}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 font-bold">{event.item}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-sm font-bold text-primary">{event.stageName}</span>
                                <span className="text-[10px] sm:text-xs text-on-surface-variant">Stage {event.stageNo}</span>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-on-surface-variant">{event.venue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-surface-container-high/60">
                No events found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
