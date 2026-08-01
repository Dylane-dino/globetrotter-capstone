"use client";

import { useEffect, useMemo, useState } from "react";
import { Bus, CloudSun, Footprints, LocateFixed, Train, Bike, CarTaxiFront } from "lucide-react";
import type { Destination } from "@/lib/types";

type Position = { lat: number; lng: number };
type Weather = { temperature: number; apparentTemperature: number; code: number; rainChance?: number };

const YAOUNDE_CENTRE: Position = { lat: 3.8667, lng: 11.5167 };

function distanceKm(from: Position, to: Position) {
  const rad = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function weatherLabel(code: number) {
  if ([0].includes(code)) return "Clear skies";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Misty";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorms nearby";
  return "Variable conditions";
}

export default function TravelPlanner({ destination }: { destination: Destination }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [locationMessage, setLocationMessage] = useState("Estimates currently start from central Yaoundé.");
  const [weather, setWeather] = useState<Weather | null>(null);
  const origin = position || YAOUNDE_CENTRE;
  const km = useMemo(() => distanceKm(origin, { lat: destination.lat, lng: destination.lng }), [origin, destination.lat, destination.lng]);

  useEffect(() => {
    let active = true;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${destination.lat}&longitude=${destination.lng}&current=temperature_2m,apparent_temperature,weather_code&hourly=precipitation_probability&forecast_days=1&timezone=Africa%2FDouala`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (!active) return;
        const hourlyIndex = data.hourly?.time?.indexOf(data.current?.time);
        setWeather({ temperature: data.current.temperature_2m, apparentTemperature: data.current.apparent_temperature, code: data.current.weather_code, rainChance: hourlyIndex >= 0 ? data.hourly.precipitation_probability[hourlyIndex] : undefined });
      })
      .catch(() => { /* Conditions remain optional if the weather service is unavailable. */ });
    return () => { active = false; };
  }, [destination.lat, destination.lng]);

  function useMyLocation() {
    if (!navigator.geolocation) { setLocationMessage("This browser does not support location services."); return; }
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPosition({ lat: coords.latitude, lng: coords.longitude }); setLocationMessage("Estimates now use your current location."); },
      () => setLocationMessage("Location permission was not granted. Estimates use central Yaoundé instead."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  const transport = [
    { label: "Shared taxi / bus", icon: Bus, minutes: Math.max(12, Math.round(km / 16 * 60 + 8)), price: Math.max(300, Math.ceil((250 + km * 115) / 50) * 50), note: "Allow extra time at peak traffic." },
    { label: "Private taxi", icon: CarTaxiFront, minutes: Math.max(8, Math.round(km / 25 * 60 + 5)), price: Math.max(1000, Math.ceil((700 + km * 350) / 100) * 100), note: "Agree the fare before leaving." },
    { label: "Motorbike taxi", icon: Bike, minutes: Math.max(7, Math.round(km / 30 * 60 + 4)), price: Math.max(500, Math.ceil((350 + km * 180) / 50) * 50), note: "Use a helmet; avoid in heavy rain." },
    { label: "Walk", icon: Footprints, minutes: Math.max(10, Math.round(km / 4.5 * 60)), price: 0, note: "Best for short daytime distances." },
    { label: "Train / urban transit", icon: Train, minutes: 0, price: 0, note: "No practical urban rail route within Yaoundé." },
  ];

  return <section className="mt-10 grid gap-6 lg:grid-cols-5">
    <div className="lg:col-span-3 rounded-card bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl text-canopy">Getting there</h2><p className="mt-1 text-sm text-ink/60">Approximate door-to-door time and fare for {destination.name}.</p></div><button onClick={useMyLocation} className="inline-flex items-center gap-2 rounded-full border border-canopy/25 px-4 py-2 text-sm font-semibold text-canopy hover:bg-canopy/5"><LocateFixed size={16} /> Use my location</button></div>
      <p className="mt-3 text-xs text-ink/55">{locationMessage} Distance: about {km.toFixed(km < 10 ? 1 : 0)} km. Fares are planning estimates; confirm locally.</p>
      <div className="mt-4 divide-y divide-canopy/10">{transport.map(({ label, icon: Icon, minutes, price, note }) => <div key={label} className="flex gap-3 py-3"><Icon size={20} className="mt-0.5 shrink-0 text-laterite" /><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-x-3"><h3 className="font-semibold text-ink">{label}</h3><span className="font-semibold text-canopy">{minutes ? `~${minutes} min` : "Not available"}{minutes ? ` · ${price.toLocaleString()} FCFA` : ""}</span></div><p className="mt-0.5 text-xs text-ink/60">{note}</p></div></div>)}</div>
    </div>
    <div className="lg:col-span-2 rounded-card bg-sky-50 p-5 shadow-card"><div className="flex items-center gap-2 text-canopy"><CloudSun size={22} /><h2 className="font-display text-2xl">Conditions at the destination</h2></div>{weather ? <><p className="mt-4 text-2xl font-semibold text-ink">{Math.round(weather.temperature)}°C <span className="text-base font-normal text-ink/60">feels like {Math.round(weather.apparentTemperature)}°C</span></p><p className="mt-1 text-sm text-ink/75">{weatherLabel(weather.code)}{weather.rainChance !== undefined ? ` · ${weather.rainChance}% chance of rain` : ""}</p><p className="mt-4 text-sm text-ink/65">Live conditions help you choose your time. Bring light rain protection when showers are likely, especially for outdoor stops.</p></> : <p className="mt-4 text-sm text-ink/65">Live weather could not be loaded right now. For outdoor visits, mornings are usually cooler and rain protection is sensible in Yaoundé.</p>}</div>
  </section>;
}
