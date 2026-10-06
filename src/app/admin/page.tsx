"use client";

import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"points" | "schools" | "events" | "categories">("points");
  
  const [schools, setSchools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // States for forms
  const [status, setStatus] = useState("");
  
  // Points Form
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedCategoryForPoints, setSelectedCategoryForPoints] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [points, setPoints] = useState("");

  // School Form
  const [schoolName, setSchoolName] = useState("");

  // Category Form
  const [categoryName, setCategoryName] = useState("");

  // Event Form
  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  
  // Delete Event
  const [deleteEventId, setDeleteEventId] = useState("");

  const fetchData = async () => {
    try {
      const sSnap = await getDocs(collection(db, "schools"));
      setSchools(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const cSnap = await getDocs(collection(db, "categories"));
      setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const eSnap = await getDocs(collection(db, "events"));
      setEvents(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching from Firebase:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "schools"), { name: schoolName });
      setSchoolName("");
      showStatus("School added successfully!");
      fetchData();
    } catch (err) {
      showStatus("Error adding school.");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "categories"), { name: categoryName });
      setCategoryName("");
      showStatus("Category added successfully!");
      fetchData();
    } catch (err) {
      showStatus("Error adding category.");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "events"), { item: eventName, cat: eventCategory });
      setEventName("");
      setEventCategory("");
      showStatus("Event added successfully!");
      fetchData();
    } catch (err) {
      showStatus("Error adding event.");
    }
  };

  const handleDeleteEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteEventId) return;
    try {
      await deleteDoc(doc(db, "events", deleteEventId));
      setDeleteEventId("");
      showStatus("Event deleted successfully!");
      fetchData();
    } catch (err) {
      showStatus("Error deleting event.");
    }
  };

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !selectedEvent || !points) return;
    
    try {
      let positionLabel = "";
      if (points === "5") positionLabel = "1st Place";
      else if (points === "3") positionLabel = "2nd Place";
      else if (points === "1") positionLabel = "3rd Place";

      await addDoc(collection(db, "points"), {
        schoolId: selectedSchool,
        eventId: selectedEvent,
        points: parseInt(points),
        position: positionLabel,
        timestamp: new Date()
      });
      setSelectedSchool("");
      setSelectedEvent("");
      setSelectedCategoryForPoints("");
      setPoints("");
      showStatus("Points updated successfully!");
    } catch (err) {
      showStatus("Error updating points.");
    }
  };

  const handleBulkAddSchools = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      let lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      
      // Skip the first row if it looks like a header (e.g., "School Name", "Schools")
      if (lines.length > 0 && lines[0].toLowerCase().includes('school')) {
        lines.shift();
      }

      if (lines.length === 0) {
        showStatus("File is empty or invalid.");
        return;
      }
      
      showStatus(`Uploading ${lines.length} schools...`);
      
      try {
        const promises = lines.map(name => addDoc(collection(db, "schools"), { name }));
        await Promise.all(promises);
        
        showStatus(`Successfully added ${lines.length} schools!`);
        fetchData();
      } catch (err) {
        console.error("Bulk add error:", err);
        showStatus("Error uploading some schools.");
      }
      
      // Reset input
      e.target.value = '';
    };
    
    reader.readAsText(file);
  };

  const handleBulkAddEvents = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      try {
        let eventsToAdd: {item: string, cat: string}[] = [];
        
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            eventsToAdd = parsed.map(p => ({
              item: p.item || p.name || "",
              cat: String(p.cat || p.category || "")
            })).filter(e => e.item && e.cat);
          }
        } else {
          // CSV processing
          let lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
          
          // Skip the first row if it looks like a header (e.g., "Event Name, Category")
          if (lines.length > 0 && lines[0].toLowerCase().includes('event')) {
            lines.shift();
          }

          eventsToAdd = lines.map(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
              return { item: parts[0].trim(), cat: parts[1].trim() };
            }
            return null;
          }).filter(Boolean) as {item: string, cat: string}[];
        }

        if (eventsToAdd.length === 0) {
          showStatus("File is empty or invalid format.");
          return;
        }
        
        showStatus(`Uploading ${eventsToAdd.length} events...`);
        const promises = eventsToAdd.map(ev => addDoc(collection(db, "events"), ev));
        await Promise.all(promises);
        
        showStatus(`Successfully added ${eventsToAdd.length} events!`);
        fetchData();
      } catch (err) {
        console.error("Bulk add error:", err);
        showStatus("Error uploading some events.");
      }
      
      e.target.value = '';
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-auto pt-28 pb-8 px-gutter flex justify-center items-start">
        <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/60 p-8">
          <h1 className="font-headline-md text-headline-md text-primary mb-6">Admin Control Panel</h1>
          
          <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
            {["points", "schools", "categories", "events"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-full font-label-lg font-bold capitalize transition-colors ${
                  activeTab === tab 
                    ? "bg-primary text-on-primary" 
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                Manage {tab}
              </button>
            ))}
          </div>

          {status && (
            <div className="mb-6 p-4 rounded-lg bg-primary-container text-on-primary-container text-center font-medium">
              {status}
            </div>
          )}

          {activeTab === "points" && (
            <form onSubmit={handleUpdatePoints} className="flex flex-col gap-6 max-w-md mx-auto">
              <h2 className="text-title-lg font-bold">Award / Update Points</h2>
              <div className="flex flex-col gap-2">
                <label className="font-label-md font-bold">Category</label>
                <select 
                  className="h-12 px-4 rounded-lg bg-surface-container-low border text-on-surface" 
                  value={selectedCategoryForPoints} 
                  onChange={(e) => {
                    setSelectedCategoryForPoints(e.target.value);
                    setSelectedEvent(""); // Reset event when category changes
                  }} 
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md font-bold">Event</label>
                <select 
                  className="h-12 px-4 rounded-lg bg-surface-container-low border text-on-surface disabled:opacity-50" 
                  value={selectedEvent} 
                  onChange={(e) => setSelectedEvent(e.target.value)} 
                  required
                  disabled={!selectedCategoryForPoints}
                >
                  <option value="">-- Choose Event --</option>
                  {events
                    .filter(ev => {
                      const evCat = String(ev.cat).trim();
                      const selCat = String(selectedCategoryForPoints).trim();
                      return evCat === selCat || 
                             `Category ${evCat}` === selCat || 
                             evCat === selCat.replace(/Category\s+/i, '').trim();
                    })
                    .map(ev => <option key={ev.id} value={ev.id}>{ev.item}</option>)
                  }
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md font-bold">School</label>
                <select className="h-12 px-4 rounded-lg bg-surface-container-low border text-on-surface" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} required>
                  <option value="">-- Choose School --</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md font-bold">Position</label>
                <select 
                  className="h-12 px-4 rounded-lg bg-surface-container-low border text-on-surface" 
                  value={points} 
                  onChange={(e) => setPoints(e.target.value)} 
                  required
                >
                  <option value="">-- Choose Position --</option>
                  <option value="5">1st Place (5 points)</option>
                  <option value="3">2nd Place (3 points)</option>
                  <option value="1">3rd Place (1 point)</option>
                </select>
              </div>
              <button type="submit" className="h-12 bg-primary text-on-primary rounded-lg font-bold">Award Position</button>
            </form>
          )}

          {activeTab === "schools" && (
            <div className="grid md:grid-cols-2 gap-12">
              <div className="flex flex-col gap-8">
                <form onSubmit={handleAddSchool} className="flex flex-col gap-6">
                  <h2 className="text-title-lg font-bold">Add New School</h2>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-bold">School Name</label>
                    <input type="text" className="h-12 px-4 rounded-lg bg-surface-container-low border" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
                  </div>
                  <button type="submit" className="h-12 bg-primary text-on-primary rounded-lg font-bold">Add School</button>
                </form>
                
                <div className="border-t pt-8 flex flex-col gap-6">
                  <h2 className="text-title-lg font-bold">Bulk Add Schools</h2>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-bold">Upload CSV or TXT file</label>
                    <p className="text-sm text-on-surface-variant mb-2">Each line should contain one school name.</p>
                    <input type="file" accept=".csv, .txt" className="h-12 px-4 py-2 rounded-lg bg-surface-container-low border" onChange={handleBulkAddSchools} />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-title-lg font-bold mb-4">Existing Schools</h2>
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {schools.map(s => <li key={s.id} className="p-3 bg-surface-container rounded-lg">{s.name}</li>)}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="grid md:grid-cols-2 gap-12">
              <form onSubmit={handleAddCategory} className="flex flex-col gap-6">
                <h2 className="text-title-lg font-bold">Add New Category</h2>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md font-bold">Category Name</label>
                  <input type="text" className="h-12 px-4 rounded-lg bg-surface-container-low border" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                </div>
                <button type="submit" className="h-12 bg-primary text-on-primary rounded-lg font-bold">Add Category</button>
              </form>
              <div>
                <h2 className="text-title-lg font-bold mb-4">Existing Categories</h2>
                <ul className="space-y-2">
                  {categories.map(c => <li key={c.id} className="p-3 bg-surface-container rounded-lg">{c.name}</li>)}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="grid md:grid-cols-2 gap-12">
              <div className="flex flex-col gap-8">
                <form onSubmit={handleAddEvent} className="flex flex-col gap-6">
                  <h2 className="text-title-lg font-bold">Add New Event</h2>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-bold">Event Name</label>
                    <input type="text" className="h-12 px-4 rounded-lg bg-surface-container-low border" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-bold">Category</label>
                    <select className="h-12 px-4 rounded-lg bg-surface-container-low border" value={eventCategory} onChange={(e) => setEventCategory(e.target.value)} required>
                      <option value="">-- Choose Category --</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="h-12 bg-primary text-on-primary rounded-lg font-bold">Add Event</button>
                </form>

                <div className="border-t pt-8 flex flex-col gap-6">
                  <h2 className="text-title-lg font-bold">Bulk Add Events</h2>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-bold">Upload JSON or CSV</label>
                    <p className="text-sm text-on-surface-variant mb-2">CSV format: <code>Event Name, Category</code>. JSON format from parse_events is also supported.</p>
                    <input type="file" accept=".csv, .txt, .json" className="h-12 px-4 py-2 rounded-lg bg-surface-container-low border" onChange={handleBulkAddEvents} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <form onSubmit={handleDeleteEvent} className="flex flex-col gap-6">
                  <h2 className="text-title-lg font-bold text-error">Delete Event</h2>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-bold">Select Event to Delete</label>
                    <select className="h-12 px-4 rounded-lg bg-surface-container-low border" value={deleteEventId} onChange={(e) => setDeleteEventId(e.target.value)} required>
                      <option value="">-- Choose Event --</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.item} ({ev.cat})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="h-12 bg-error text-on-error rounded-lg font-bold">Delete Event</button>
                </form>

                <div className="border-t pt-8">
                  <h2 className="text-title-lg font-bold mb-4">Existing Events ({events.length})</h2>
                  <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {events.map(e => <li key={e.id} className="p-3 bg-surface-container rounded-lg flex justify-between"><span>{e.item}</span> <span className="font-bold text-primary text-sm">{e.cat}</span></li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
