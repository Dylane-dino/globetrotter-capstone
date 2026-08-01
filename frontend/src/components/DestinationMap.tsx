"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { Car, Footprints, LocateFixed, Navigation, Train } from "lucide-react";
import Button from "@/components/Button";

declare global { interface Window { google?: any; } }

type Mode = "DRIVING" | "TRANSIT" | "WALKING";
const MODES: { id: Mode; label: string; icon: typeof Car }[] = [
  { id: "DRIVING", label: "Taxi / car", icon: Car },
  { id: "TRANSIT", label: "Bus / transit", icon: Train },
  { id: "WALKING", label: "Walk", icon: Footprints },
];

function loadMaps(key: string): Promise<any> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google?.maps), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.onload = () => resolve(window.google?.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function DestinationMap({ name, latitude, longitude }: { name: string; latitude: number; longitude: number }) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const renderer = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const location = useRef<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<Mode>("DRIVING");
  const [mapsReady, setMapsReady] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!key || !node.current) return;
    let cancelled = false;
    loadMaps(key).then((maps) => {
      if (cancelled || !maps || !node.current) return;
      const destination = { lat: latitude, lng: longitude };
      map.current = new maps.Map(node.current, { center: destination, zoom: 15, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
      new maps.Marker({ map: map.current, position: destination, title: name });
      renderer.current = new maps.DirectionsRenderer({ map: map.current, suppressMarkers: false, polylineOptions: { strokeColor: "#c65336", strokeWeight: 5 } });
      setMapsReady(true);
    }).catch(() => setMessage("Google Maps could not load. Confirm the browser key has Maps JavaScript and Directions APIs enabled."));
    return () => { cancelled = true; };
  }, [key, latitude, longitude, name]);

  function locate(onSuccess?: () => void) {
    if (!navigator.geolocation) { setMessage("Your browser does not support location services."); return; }
    setMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude };
      location.current = position;
      if (window.google?.maps && map.current) {
  if (userMarker.current) userMarker.current.setMap(null);
  
  userMarker.current = new window.google.maps.Marker({ 
    map: map.current, 
    position, 
    title: "Your location", 
    icon: { 
      path: window.google.maps.SymbolPath.CIRCLE, 
      scale: 7, 
      fillColor: "#2563eb", 
      fillOpacity: 1, 
      strokeColor: "#ffffff", 
      strokeWeight: 2 
    } 
  });

  // Pan the camera directly to your location and zoom in
  map.current.panTo(position);
  map.current.setZoom(15);
}
      setMessage("Your location is shown in blue.");
      onSuccess?.();
    }, () => setMessage("Location permission is needed to show your position and directions."), { enableHighAccuracy: true, timeout: 10000, maximumAge:0 });
  }

  function showRoute() {
    if (!mapsReady || !renderer.current) { setMessage("The map is still loading. Please try again in a moment."); return; }
    const requestRoute = () => {
      if (!location.current) return;
      setMessage("Calculating your route…");
      const request: any = { origin: location.current, destination: { lat: latitude, lng: longitude }, travelMode: window.google.maps.TravelMode[mode] };
      if (mode === "DRIVING") request.drivingOptions = { departureTime: new Date(), trafficModel: "bestguess" };
      new window.google.maps.DirectionsService().route(request, (result: any, status: string) => {
        if (status === "OK") {
          renderer.current.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          setMessage(`${mode === "DRIVING" ? "Taxi / car" : mode === "TRANSIT" ? "Transit" : "Walking"} route shown${leg?.duration_in_traffic?.text ? ` · current traffic: ${leg.duration_in_traffic.text}` : leg?.duration?.text ? ` · about ${leg.duration.text}` : ""}.`);
        } else setMessage(mode === "TRANSIT" ? "No public-transit route was returned for this journey. Try taxi/car or walking." : "A route could not be calculated. Check your connection and try again.");
      });
    };
    if (location.current) {
      requestRoute();
    } else {
      locate(requestRoute);
    }
  }

  if (!key) return <section className="mt-10 rounded-card bg-marigold/15 p-5 text-sm text-ink/70"><h2 className="font-display text-2xl text-canopy">Directions</h2><p className="mt-2">Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>, with Maps JavaScript API and Directions API enabled, to show your location and routes in the app.</p></section>;

  return <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3 mb-4"><div><h2 className="font-display text-2xl text-canopy">Live map & directions</h2><p className="mt-1 text-sm text-ink/60">Show your position, select a travel mode, and see the route to {name}.</p></div><button onClick={() => locate()} className="inline-flex items-center gap-2 rounded-full border border-canopy/25 px-4 py-2 text-sm font-semibold text-canopy hover:bg-canopy/5"><LocateFixed size={16} /> Show my position</button></div><div ref={node} className="h-80 w-full overflow-hidden rounded-card bg-canopy/10" aria-label={`Map of ${name}`} />{message && <p className="mt-3 text-sm text-ink/65" role="status">{message}</p>}<div className="mt-4 flex flex-wrap gap-2">{MODES.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setMode(id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${mode === id ? "bg-canopy text-ivory" : "border border-canopy/25 text-canopy hover:bg-canopy/5"}`}><Icon size={16} />{label}</button>)}<Button onClick={showRoute}><Navigation size={16} /> Show route</Button><a href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${mode.toLowerCase()}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-canopy/25 px-5 py-2.5 text-sm font-semibold text-canopy hover:bg-canopy/5">Open turn-by-turn</a></div></section>;
}
