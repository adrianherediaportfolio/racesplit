"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore, useState } from "react";

function useLocalStorageToken() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }, []);

  const getSnapshot = useCallback(() => {
    return localStorage.getItem("racesplit_token");
  }, []);

  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function Navbar() {
  const pathname = usePathname();
  const token = useLocalStorageToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("racesplit_token");
    localStorage.removeItem("racesplit_user");
    forceUpdate((n) => n + 1);
    window.location.href = "/";
  };

  return (
    <nav className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--accent)]">
          RaceSplit
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`hover:text-[var(--accent)] transition ${
              pathname === "/" ? "text-[var(--accent)]" : ""
            }`}
          >
            Search
          </Link>
          {token && (
            <Link
              href="/dashboard"
              className={`hover:text-[var(--accent)] transition ${
                pathname === "/dashboard" ? "text-[var(--accent)]" : ""
              }`}
            >
              Dashboard
            </Link>
          )}
          {token ? (
            <button
              onClick={handleLogout}
              className="bg-[var(--card-border)] hover:bg-[var(--danger)] px-4 py-1.5 rounded text-sm transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black px-4 py-1.5 rounded text-sm font-medium transition"
            >
              Login
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[var(--foreground)]"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-2 flex flex-col gap-2 px-2 pb-2">
          <Link href="/" className="hover:text-[var(--accent)] py-1">
            Search
          </Link>
          {token && (
            <Link href="/dashboard" className="hover:text-[var(--accent)] py-1">
              Dashboard
            </Link>
          )}
          {token ? (
            <button
              onClick={handleLogout}
              className="text-left hover:text-[var(--danger)] py-1"
            >
              Logout
            </button>
          ) : (
            <Link href="/auth/login" className="hover:text-[var(--accent)] py-1">
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
