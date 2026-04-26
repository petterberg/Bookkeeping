"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentClient } from "@/lib/store";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const items: NavItem[] = [
  { href: "/klient", label: "Hem", icon: Home, exact: true },
  { href: "/klient/ladda-upp", label: "Ladda upp", icon: Upload },
  { href: "/klient/meddelanden", label: "Meddelanden", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const client = useCurrentClient();

  const unread = client.messages.filter((m) => m.from === "revisor" && !m.read).length;
  const missing = client.transactions.filter((t) => t.status === "saknar_underlag").length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-paper/85 backdrop-blur border-t hairline">
      <div className="mx-auto max-w-md px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        <ul className="grid grid-cols-3">
          {items.map((it) => {
            const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
            const Icon = it.icon;
            const badge =
              it.href === "/klient/meddelanden"
                ? unread
                : it.href === "/klient/ladda-upp"
                ? missing
                : 0;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
                    active ? "text-ink" : "text-ink3 hover:text-ink",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 1.9 : 1.5} />
                    {badge > 0 ? (
                      <span className="absolute -right-1.5 -top-1 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red text-paper text-[10px] px-1 font-medium">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10.5px] tracking-tight">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
