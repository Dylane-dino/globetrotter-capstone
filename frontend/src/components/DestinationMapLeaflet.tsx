"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { usePreferences } from "@/context/PreferencesContext";

type Coordinates = { lat: number; lng: number };
type Place = Coordinates & { id: string; name: string; category: string; emoji: string };
type Category = "hotels" | "petrol" | "hospitals" | "attractions";
type RouteMode = "driving" | "foot";
type TrafficLevel = "normal" | "peak";
type RouteInfo = { distance: number; duration: number; distanceLabel: string; durationLabel: string; geometry: { coordinates: [number, number][] } };
type RouteResponse = { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> };
type LeafletContainer = HTMLDivElement & { _leaflet_id?: number | null };

const YAOUNDE: Coordinates = { lat: 3.848, lng: 11.5021 };
const OVERPASS_MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const FILTERS: { id: Category; label: string; emoji: string; query: string }[] = [
  { id: "hotels", label: "Hotels", emoji: "🏨", query: '["tourism"="hotel"]' },
  { id: "petrol", label: "Petrol Stations", emoji: "⛽", query: '["amenity"="fuel"]' },
  { id: "hospitals", label: "Hospitals", emoji: "🏥", query: '["amenity"="hospital"]' },
  { id: "attractions", label: "Tourist Attractions", emoji: "🏛️", query: '["tourism"~"attraction|museum|zoo|viewpoint|gallery|theme_park"]' },
];
const userIcon = L.divIcon({ className: "", html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });
const placeIcon = (emoji: string) => L.divIcon({ className: "", html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:9999px;background:white;border:2px solid #2f5b46;box-shadow:0 1px 4px rgba(0,0,0,.35);font-size:16px">${emoji}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] });
const formatDistance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
const formatDuration = (seconds: number): string => seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}min`;

export default function DestinationMapLeaflet({ name, latitude, longitude, destinationId }: { name: string; latitude: number; longitude: number; destinationId?: string }) {
  const { t } = usePreferences();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const nearbyLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const showRouteRef = useRef<(place: Place, mode?: RouteMode) => void>(() => undefined);
  const routeTargetRef = useRef<Place | null>(null);
  const placesCacheRef = useRef<Partial<Record<Category, Place[]>>>({});
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [activeFilter, setActiveFilter] = useState<Category | null>(null);
  const [drivingInfo, setDrivingInfo] = useState<RouteInfo | null>(null);
  const [walkingInfo, setWalkingInfo] = useState<RouteInfo | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("driving");
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>("normal");
  const [message, setMessage] = useState("");
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const destination: Place = { id: destinationId || "destination", name, category: "Destination", lat: latitude, lng: longitude, emoji: "📍" };

  const popupContent = useCallback((place: Place) => {
    const content = document.createElement("div");
    const heading = document.createElement("strong"); heading.textContent = place.name;
    const category = document.createElement("span"); category.textContent = place.category;
    const button = document.createElement("button"); button.type = "button"; button.textContent = t("showRoute");
    button.className = "mt-2 rounded-full bg-canopy px-3 py-1.5 text-xs font-semibold text-white";
    button.addEventListener("click", () => showRouteRef.current(place));
    content.append(heading, document.createElement("br"), category, document.createElement("br"), button);
    return content;
  }, [t]);

  const requestLocation = useCallback(() => new Promise<Coordinates>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Your browser does not support location services.")); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const location = { lat: coords.latitude, lng: coords.longitude };
      setUserLocation(location); setMessage("Your location is shown in blue."); resolve(location);
    }, () => reject(new Error("Location permission is needed to show nearby places and directions.")), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }), []);

  const drawRoute = useCallback((route: RouteInfo) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    routePolylineRef.current?.remove();
    routePolylineRef.current = L.polyline(route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngTuple), { color: "#2563eb", weight: 5, opacity: 0.85 }).addTo(map);
    map.fitBounds(routePolylineRef.current.getBounds(), { padding: [36, 36] });
  }, []);

  const showRoute = useCallback(async (place: Place, selectedMode: RouteMode = routeMode) => {
    let origin = userLocation;
    if (!origin) {
      try { origin = await requestLocation(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not find your location."); return; }
    }
    setMessage("Calculating your route…");
    try {
      const routeUrl = (mode: RouteMode) => `https://router.project-osrm.org/route/v1/${mode}/${origin.lng},${origin.lat};${place.lng},${place.lat}?overview=full&geometries=geojson`;
      const [drivingResponse, walkingResponse] = await Promise.all([fetch(routeUrl("driving")), fetch(routeUrl("foot"))]);
      if (!drivingResponse.ok || !walkingResponse.ok) throw new Error("Routes could not be calculated. Please try again.");
      const [drivingData, walkingData] = await Promise.all([drivingResponse.json() as Promise<RouteResponse>, walkingResponse.json() as Promise<RouteResponse>]);
      const toRouteInfo = (result?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }): RouteInfo | null => result ? { ...result, distanceLabel: formatDistance(result.distance), durationLabel: formatDuration(result.duration) } : null;
      const driving = toRouteInfo(drivingData.routes?.[0]);
      const walking = toRouteInfo(walkingData.routes?.[0]);
      const selectedRoute = selectedMode === "driving" ? driving : walking;
      if (!driving || !walking || !selectedRoute) throw new Error("A driving or walking route was not found for this place.");
      routeTargetRef.current = place;
      setDrivingInfo(driving); setWalkingInfo(walking); setRouteMode(selectedMode);
      drawRoute(selectedRoute);
      setMessage(`Route to ${place.name} shown.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not calculate the route."); }
  }, [drawRoute, requestLocation, routeMode, userLocation]);
  showRouteRef.current = showRoute;

  useEffect(() => {
    const container = mapContainerRef.current as LeafletContainer | null;
    if (!container) return;
    container._leaflet_id = null;
    mapInstanceRef.current?.remove();
    const map = L.map(container, { zoomControl: true }).setView([YAOUNDE.lat, YAOUNDE.lng], 13);
    mapInstanceRef.current = map;
    nearbyLayerRef.current = L.layerGroup().addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    L.marker([latitude, longitude], { icon: placeIcon(destination.emoji) }).bindPopup(() => popupContent(destination)).addTo(map);
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; userMarkerRef.current = null; nearbyLayerRef.current = null; routePolylineRef.current = null; container._leaflet_id = null; };
  }, [destinationId, latitude, longitude, name, popupContent]);

  useEffect(() => { requestLocation().catch((error: Error) => setMessage(error.message)); }, [requestLocation]);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).bindPopup("Your Location").addTo(map);
    map.setView([userLocation.lat, userLocation.lng], 14);
  }, [userLocation]);
  useEffect(() => {
    const layer = nearbyLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    nearbyPlaces.forEach((place) => L.marker([place.lat, place.lng], { icon: placeIcon(place.emoji) }).bindPopup(() => popupContent(place)).addTo(layer));
  }, [nearbyPlaces, popupContent]);
  useEffect(() => { window.setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100); }, [isFullscreen]);

  async function filterPlaces(filter: typeof FILTERS[number]) {
    setActiveFilter(filter.id);
    const cached = placesCacheRef.current[filter.id];
    if (cached) { setNearbyPlaces(cached); setMessage(`${cached.length} cached nearby ${filter.label.toLowerCase()} shown.`); return; }
    let origin = userLocation;
    if (!origin) {
      try { origin = await requestLocation(); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not find your location."); return; }
    }
    setLoadingPlaces(true); setMessage(`Finding ${filter.label.toLowerCase()} within 3 km…`);
    const query = `[out:json][timeout:10];node${filter.query}(around:3000,${origin.lat},${origin.lng});out body 25;`;
    let lastError: unknown;
    try {
      for (const mirror of OVERPASS_MIRRORS) {
        try {
          const response = await fetch(mirror, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: query });
          if (!response.ok) throw new Error(`Nearby places service returned ${response.status}.`);
          const data = await response.json() as { elements?: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }> };
          const places = (data.elements || []).map((item) => ({ id: `${filter.id}-${item.id}`, name: item.tags?.name || filter.label.slice(0, -1), category: filter.label, lat: item.lat, lng: item.lon, emoji: filter.emoji }));
          placesCacheRef.current[filter.id] = places;
          setNearbyPlaces(places); setMessage(places.length ? `${places.length} nearby ${filter.label.toLowerCase()} shown.` : `No ${filter.label.toLowerCase()} were found within 3 km.`);
          return;
        } catch (error) { lastError = error; }
      }
      throw lastError || new Error("Nearby places are temporarily unavailable.");
    } catch (error) { setNearbyPlaces([]); setMessage(error instanceof Error ? error.message : "Could not load nearby places."); }
    finally { setLoadingPlaces(false); }
  }

  function changeRouteMode(mode: RouteMode) { const route = mode === "driving" ? drivingInfo : walkingInfo; setRouteMode(mode); if (route) drawRoute(route); else if (routeTargetRef.current) showRoute(routeTargetRef.current, mode); }
  function clearRoute() { routePolylineRef.current?.remove(); routePolylineRef.current = null; routeTargetRef.current = null; setDrivingInfo(null); setWalkingInfo(null); setMessage("Route cleared."); }

  const selectedRouteInfo = routeMode === "driving" ? drivingInfo : walkingInfo;
  const estimatedDuration = selectedRouteInfo && routeMode === "driving" && trafficLevel === "peak" ? selectedRouteInfo.duration * 1.6 : selectedRouteInfo?.duration;
  const googleTravelMode = routeMode === "foot" ? "walking" : "driving";
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${googleTravelMode}`;

  return <section className="mt-10">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl text-canopy">{t("liveMap")}</h2><p className="mt-1 text-sm text-ink/60">Show your position, explore nearby places, and see the route to {name}.</p></div><button onClick={() => requestLocation().catch((error: Error) => setMessage(error.message))} className="inline-flex items-center gap-2 rounded-full border border-canopy/25 px-4 py-2 text-sm font-semibold text-canopy hover:bg-canopy/5"><LocateFixed size={16} /> Show my position</button></div>
    <div className="mb-3 flex flex-wrap gap-2">{FILTERS.map((filter) => <button key={filter.id} onClick={() => filterPlaces(filter)} disabled={loadingPlaces} className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${activeFilter === filter.id ? "bg-canopy text-ivory" : "border border-canopy/25 text-canopy hover:bg-canopy/5"}`}>{filter.emoji} {filter.id === "hotels" ? t("hotels") : filter.id === "hospitals" ? t("hospitals") : filter.label}</button>)}</div>
    {selectedRouteInfo && <div className="mb-3 flex flex-wrap items-center gap-2"><button onClick={() => changeRouteMode("driving")} className={`rounded-full border px-4 py-2 text-sm font-semibold ${routeMode === "driving" ? "border-canopy bg-canopy text-white" : "border-canopy/20 bg-white text-canopy"}`}>🚗 Driving ({drivingInfo?.durationLabel})</button><button onClick={() => changeRouteMode("foot")} className={`rounded-full border px-4 py-2 text-sm font-semibold ${routeMode === "foot" ? "border-canopy bg-canopy text-white" : "border-canopy/20 bg-white text-canopy"}`}>🚶 Walking ({walkingInfo?.durationLabel})</button><div className="flex overflow-hidden rounded-full border border-canopy/20 text-xs"><button onClick={() => setTrafficLevel("normal")} className={`px-2 py-1 ${trafficLevel === "normal" || routeMode === "foot" ? "bg-canopy text-white" : "bg-white"}`}>🟢 Normal</button><button onClick={() => setTrafficLevel("peak")} disabled={routeMode === "foot"} className={`px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${trafficLevel === "peak" && routeMode === "driving" ? "bg-canopy text-white" : "bg-white"}`}>🔴 Peak Traffic (+60%)</button></div></div>}
    <div ref={mapPanelRef} className={isFullscreen ? "fixed inset-0 z-[70] h-screen w-screen bg-ivory p-4" : "relative h-80 w-full overflow-hidden rounded-card bg-canopy/10"} aria-label={`Map of ${name}`}>{selectedRouteInfo && <div className="absolute left-3 top-3 z-[500] flex items-center gap-3 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-canopy shadow-card"><span>{selectedRouteInfo.distanceLabel} · about {estimatedDuration && formatDuration(estimatedDuration)}{routeMode === "driving" && trafficLevel === "peak" ? " (Rush hour)" : ""}</span><button onClick={clearRoute} className="text-laterite hover:underline">Clear Route</button></div>}<button onClick={() => setIsFullscreen((current) => !current)} className="absolute right-3 top-3 z-[500] rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-canopy shadow-card hover:bg-white">⛶ {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button><div ref={mapContainerRef} className="h-full w-full" /></div>
    <div className="mt-4 flex flex-wrap gap-3"><button onClick={() => showRoute(destination)} className="inline-flex items-center gap-2 rounded-full bg-laterite px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-laterite-dark"><MapPin size={17} /> {t("showRoute")} to {name}</button><a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-canopy/25 px-5 py-2.5 text-sm font-semibold text-canopy hover:bg-canopy/5">📱 Navigate on Phone</a></div>{message && <p className="mt-3 text-sm text-ink/65" role="status">{message}</p>}
  </section>;
}
