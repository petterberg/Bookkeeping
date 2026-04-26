"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  Users,
  Settings,
  ArrowUpRight,
  Search,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/store";
import { REVISOR } from "@/lib/mock-data";

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useApp();

  const inkomna = state.revisor.clients.flatMap((c) =>
    c.transactions.filter((t) => t.status === "inkommen").map((t) => ({ ...t, clientId: c.id })),
  ).length;
  const totalMissing = state.revisor.clients.reduce((acc, c) => acc + c.missingCount, 0);

  const orphanCount = state.revisor.clients.reduce((acc, c) => acc + c.orphans.length, 0);

  type NavItem = {
    href: string;
    label: string;
    icon: typeof LayoutGrid;
    badge: number;
    exact?: boolean;
  };

  const items: NavItem[] = [
    { href: "/revisor", label: "Översikt", icon: LayoutGrid, badge: totalMissing, exact: true },
    { href: "/revisor/inkorg", label: "Inkorg", icon: Inbox, badge: inkomna },
    { href: "/revisor/importera", label: "Importera", icon: Upload, badge: orphanCount },
  ];

  const initials = REVISOR.name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <aside className="w-[260px] shrink-0 border-r hairline bg-paper flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Logo size="sm" href="/" />
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.14em] text-ink3 hover:text-ink"
          title="Byt roll"
        >
          Byt
        </Link>
      </div>

      <div className="px-3">
        <div className="rounded-lg bg-paper2 border hairline px-3 py-2 flex items-center gap-2 text-[13px] text-ink3">
          <Search className="h-3.5 w-3.5" strokeWidth={1.7} />
          <span className="flex-1">Sök klient, faktura…</span>
          <kbd className="mono text-[10px] bg-paper px-1.5 py-0.5 rounded border hairline">⌘K</kbd>
        </div>
      </div>

      <nav className="px-2 mt-4 space-y-0.5">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-colors",
                active ? "bg-ink text-paper" : "text-ink2 hover:bg-paper2",
              )}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 1.8 : 1.5} />
              <span className="flex-1">{it.label}</span>
              {it.badge > 0 ? (
                <span
                  className={cn(
                    "mono text-[11px] px-1.5 py-0.5 rounded-full",
                    active ? "bg-paper/15 text-paper" : "bg-paper2 text-ink2 border hairline",
                  )}
                >
                  {it.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 mt-6 mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] text-ink3 inline-flex items-center gap-1.5">
          <Users className="h-3 w-3" strokeWidth={1.8} /> Klienter
        </span>
        <span className="text-[11px] text-ink3 mono">{state.revisor.clients.length}</span>
      </div>

      <div className="px-2 flex-1 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5 pb-4">
          {state.revisor.clients.map((c) => {
            const href = `/revisor/klient/${c.id}`;
            const active = pathname === href;
            const initials = c.name
              .split(" ")
              .filter((w) => /[A-Za-zÅÄÖåäö]/.test(w[0] ?? ""))
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();
            return (
              <li key={c.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors",
                    active ? "bg-paper2 text-ink" : "text-ink2 hover:bg-paper2",
                  )}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-paper border hairline text-[10px] font-medium">
                    {initials}
                  </span>
                  <span className="truncate flex-1">{c.name}</span>
                  {c.missingCount > 0 ? (
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t hairline p-3 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper text-[12px] font-medium">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] truncate">{REVISOR.name}</p>
          <p className="text-[11.5px] text-ink3 truncate">{REVISOR.firm}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-paper2 text-ink3 hover:text-ink"
          aria-label="Inställningar"
        >
          <Settings className="h-[15px] w-[15px]" strokeWidth={1.6} />
        </button>
      </div>
    </aside>
  );
}

export function Topbar({
  title,
  subtitle,
  meta,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur border-b hairline">
      <div className="px-8 lg:px-10 py-4 flex items-end justify-between gap-6">
        <div className="min-w-0">
          {subtitle ? (
            <p className="text-[12px] uppercase tracking-[0.14em] text-ink3 mb-1">
              {subtitle}
            </p>
          ) : null}
          <h1 className="display text-[34px] leading-tight tracking-tightish truncate">{title}</h1>
          {meta ? <div className="mt-1 text-[13px] text-ink3">{meta}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Link
            href="/klient"
            className="inline-flex items-center gap-1.5 text-[12px] text-ink3 hover:text-ink"
          >
            Förhandsgranska klient-vy
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
          </Link>
        </div>
      </div>
    </header>
  );
}
