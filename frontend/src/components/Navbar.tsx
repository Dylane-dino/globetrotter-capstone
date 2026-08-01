"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Map } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-semibold transition-colors ${
        pathname === href
          ? "text-laterite"
          : "text-canopy/60 hover:text-canopy"
      }`}
    >
      {label}
    </Link>
  );

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-ivory/95 backdrop-blur border-b border-canopy/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/home">
          <Logo size="sm" />
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {navLink("/home", "Home")}
          {navLink("/community", "Community")}
          {navLink("/itineraries", "My Trips")}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/itineraries"
            className="sm:hidden p-2 rounded-full text-canopy/70 hover:bg-canopy/5"
            aria-label="My trips"
          >
            <Map size={20} />
          </Link>
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-canopy/70">
                <div className="w-8 h-8 rounded-full bg-canopy text-ivory flex items-center justify-center font-display font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{user.name.split(" ")[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-canopy/60 hover:bg-canopy/5 hover:text-laterite transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="text-sm font-semibold text-laterite hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
