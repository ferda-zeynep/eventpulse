"use client";

import { useEffect, useState } from "react";

interface Job {
  id: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  bullJobId: string | null;
  createdAt: string;
}

interface EventItem {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
  jobs: Job[];
}

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventName, setEventName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName,
          payload: {
            timestamp: new Date().toISOString(),
            source: "dashboard_ui",
          },
        }),
      });

      if (res.ok) {
        setEventName("");
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to trigger event", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8 font-sans">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          EventPulse Telemetry
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Real-time background event pipeline dashboard
        </p>
      </header>

      <section className="bg-gray-50 p-6 rounded-lg border mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Dispatch Test Event
        </h2>
        <form onSubmit={handleCreateEvent} className="flex gap-4">
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. USER_REGISTERED"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Queuing..." : "Dispatch Event"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Recent Streamed Events
        </h2>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-400 italic">No events registered yet.</p>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-sm font-bold text-gray-900">
                    {evt.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">ID: {evt.id}</div>
                </div>
                <div>
                  {evt.jobs.map((job) => (
                    <span
                      key={job.id}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(job.status)}`}
                    >
                      {job.status}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
