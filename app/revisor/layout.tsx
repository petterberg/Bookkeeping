"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/revisor/Sidebar";
import { Logo } from "@/components/ui/Logo";

export default function RevisorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stäng med Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Lås body-scroll medan menyn är öppen (bara mobil-effekt)
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Desktop sidebar – alltid synlig från lg och uppåt */}
      <div className="hidden lg:block">
        <Sidebar onNavigate={() => {}} />
      </div>

      {/* Mobil overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Stäng meny"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Mobil sidebar – slide-in från vänster */}
      <div
        className={`fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col fade-in">
        {/* Mobil topbar med hamburger */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b hairline sticky top-0 z-30 bg-paper/85 backdrop-blur">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hairline bg-paper2 hover:bg-paper3 text-ink2 focus-ring"
            aria-label="Öppna meny"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
          <Logo size="sm" href="/" />
        </div>

        {children}
      </div>
    </div>
  );
}
