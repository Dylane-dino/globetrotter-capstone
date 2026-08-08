"use client";

import { Bell, Globe2, ImageIcon, LogOut, Moon, Save, Settings2, Sun, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Theme, usePreferences } from "@/context/PreferencesContext";
import * as api from "@/lib/api";

const preferenceKey = "globetrotter_settings";

function SettingsContent() {
  const { user, token, updateUser, logout } = useAuth();
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [unit, setUnit] = useState<"km" | "mi">("km");
  const [notifications, setNotifications] = useState({ email: true, marketing: false, community: true });
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(preferenceKey) || "{}");
      if (saved.unit === "km" || saved.unit === "mi") setUnit(saved.unit);
      if (saved.notifications && typeof saved.notifications === "object") setNotifications((current) => ({ ...current, ...saved.notifications }));
    } catch { /* Ignore malformed local preferences. */ }
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !token || !name.trim()) return;
    try {
      const updated = await api.updateProfile({ name: name.trim(), bio: user.bio, avatar_url: avatar || null, preferred_tags: user.preferred_tags }, token);
      updateUser(updated); setMessage("Profile saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your profile."); }
  }
  function savePreferences(nextUnit = unit, nextNotifications = notifications) {
    window.localStorage.setItem(preferenceKey, JSON.stringify({ unit: nextUnit, notifications: nextNotifications }));
  }
  function updateNotifications(key: keyof typeof notifications) {
    const next = { ...notifications, [key]: !notifications[key] }; setNotifications(next); savePreferences(unit, next);
  }
  function clearCache() {
    Object.keys(window.localStorage).filter((key) => key.startsWith("globetrotter_") && key !== "globetrotter_session").forEach((key) => window.localStorage.removeItem(key));
    setUnit("km"); setNotifications({ email: true, marketing: false, community: true });
    setMessage("Saved app cache cleared. Your signed-in session was kept.");
  }
  function signOut() { logout(); router.push("/"); }
  const card = "rounded-card bg-white p-6 shadow-card dark:bg-[#1b2d22] dark:text-ivory";

  return <div className="min-h-screen bg-ivory transition-colors dark:bg-[#101a14]"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><div className="mb-8"><p className="font-stamp text-xs uppercase tracking-wider text-laterite">GlobeTrotter</p><h1 className="mt-2 font-display text-4xl text-canopy dark:text-ivory">{t("settingsHeading")}</h1><p className="mt-2 text-ink/60 dark:text-ivory/65">Manage your profile, language and travel preferences.</p></div><div className="space-y-6"><section className={card}><div className="mb-5 flex items-center gap-3"><UserRound className="text-laterite" /><h2 className="font-display text-2xl text-canopy dark:text-ivory">Profile</h2></div><form onSubmit={saveProfile}><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-canopy text-3xl text-ivory">{avatar ? <img src={avatar} alt="Profile avatar" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}</div><div className="flex-1"><label className="text-sm font-semibold">Display name</label><input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-canopy/20 bg-white px-3 py-2 text-ink dark:bg-[#132018] dark:text-ivory" /><p className="mt-2 text-sm text-ink/60 dark:text-ivory/65">{user?.email || "No email available"} · GlobeTrotter member</p></div></div><label className="mt-5 block text-sm font-semibold"><ImageIcon className="mr-1 inline" size={15} /> Profile picture URL</label><input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://…" className="mt-1 w-full rounded-lg border border-canopy/20 bg-white px-3 py-2 text-ink dark:bg-[#132018] dark:text-ivory" /><div className="mt-5 flex flex-wrap items-center gap-3"><button className="inline-flex items-center gap-2 rounded-full bg-laterite px-5 py-2.5 text-sm font-semibold text-white"><Save size={16} /> Edit profile</button><button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-laterite/30 px-5 py-2.5 text-sm font-semibold text-laterite hover:bg-laterite/5"><LogOut size={16} /> Sign out</button></div>{message && <p className="mt-3 text-sm text-canopy dark:text-ivory" role="status">{message}</p>}</form></section><section className={card}><div className="mb-4 flex items-center gap-3"><Globe2 className="text-laterite" /><h2 className="font-display text-2xl text-canopy dark:text-ivory">Language</h2></div><div className="flex gap-3">{(["en", "fr"] as const).map((option) => <label key={option} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${language === option ? "border-canopy bg-canopy text-white" : "border-canopy/20"}`}><input className="sr-only" type="radio" checked={language === option} onChange={() => setLanguage(option)} />{option === "en" ? "English (EN)" : "Français (FR)"}</label>)}</div></section><section className={card}><div className="mb-4 flex items-center gap-3"><Sun className="text-laterite" /><h2 className="font-display text-2xl text-canopy dark:text-ivory">Appearance</h2></div><div className="flex flex-wrap gap-3">{([{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Settings2 }] as { value: Theme; label: string; icon: typeof Sun }[]).map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setTheme(value)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${theme === value ? "border-canopy bg-canopy text-white" : "border-canopy/20"}`}><Icon size={16} /> {label}</button>)}</div></section><section className={card}><div className="mb-4 flex items-center gap-3"><Bell className="text-laterite" /><h2 className="font-display text-2xl text-canopy dark:text-ivory">Preferences</h2></div><p className="text-sm font-semibold">Distance units</p><div className="mt-2 flex gap-3">{(["km", "mi"] as const).map((value) => <button key={value} onClick={() => { setUnit(value); savePreferences(value); }} className={`rounded-full border px-4 py-2 text-sm font-semibold ${unit === value ? "border-canopy bg-canopy text-white" : "border-canopy/20"}`}>{value === "km" ? "Kilometers (km)" : "Miles (mi)"}</button>)}</div><div className="mt-5 space-y-3">{([{ key: "email", label: "Email updates" }, { key: "marketing", label: "Marketing" }, { key: "community", label: "Community alerts" }] as const).map(({ key, label }) => <label key={key} className="flex items-center justify-between rounded-lg bg-canopy/5 px-4 py-3"><span className="text-sm font-medium">{label}</span><input type="checkbox" checked={notifications[key]} onChange={() => updateNotifications(key)} className="h-4 w-4 accent-laterite" /></label>)}</div></section><section className={card}><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-2xl text-canopy dark:text-ivory">Account & storage</h2><p className="mt-1 text-sm text-ink/60 dark:text-ivory/65">App build v1.2.0-Yaounde</p></div><button onClick={clearCache} className="inline-flex items-center gap-2 rounded-full border border-laterite/30 px-4 py-2 text-sm font-semibold text-laterite hover:bg-laterite/5"><Trash2 size={16} /> Clear Saved Cache</button></div></section></div></main></div>;
}

export default function SettingsPage() { return <ProtectedRoute><SettingsContent /></ProtectedRoute>; }
