"use client";

import Link from "next/link";
import { ArrowRight, Smartphone, Monitor } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useApp } from "@/lib/store";
import { REVISOR, CURRENT_CLIENT_ID } from "@/lib/mock-data";

export default function RolePickerPage() {
  const { state, dispatch } = useApp();
  const me = state.revisor.clients.find((c) => c.id === CURRENT_CLIENT_ID) ?? REVISOR.clients[0];

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        <Logo size="md" />
        <span className="hidden sm:inline-flex text-[12px] uppercase tracking-[0.18em] text-ink3">
          demo · v0.1
        </span>
      </header>

      <section className="flex-1 px-5 sm:px-10 flex items-center justify-center py-10 sm:py-16">
        <div className="w-full max-w-[920px] fade-in">
          <div className="max-w-[560px] mb-10 sm:mb-14">
            <p className="display-italic text-ink3 text-lg sm:text-xl mb-3">En lugnare bokföring.</p>
            <h1 className="display text-[44px] sm:text-[64px] leading-[0.98] tracking-tightish">
              Välkommen tillbaka.
              <br />
              <span className="display-italic text-ink2">Vem är du idag?</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Link
              href="/klient"
              onClick={() => dispatch({ type: "set_role", role: "klient" })}
              className="group relative rounded-xl border hairline bg-paper2 hover:bg-paper3 transition-colors p-6 sm:p-7 flex flex-col gap-7 min-h-[260px] focus-ring"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-paper border hairline">
                  <Smartphone className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-ink3">Mobil</span>
              </div>
              <div>
                <p className="text-sm text-ink3 mb-1">Jag är</p>
                <h2 className="display text-[34px] sm:text-[40px] leading-[1.02]">företagare</h2>
                <p className="text-sm text-ink2 mt-3 max-w-[28ch]">
                  Ladda upp kvitton, se status på din bokföring och chatta med din revisor.
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-[13px] text-ink3">
                  Logga in som <span className="text-ink">{me.contactName}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-ink group-hover:translate-x-0.5 transition-transform">
                  Fortsätt <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </div>
            </Link>

            <Link
              href="/revisor"
              onClick={() => dispatch({ type: "set_role", role: "revisor" })}
              className="group relative rounded-xl border hairline bg-ink text-paper hover:bg-ink2 transition-colors p-6 sm:p-7 flex flex-col gap-7 min-h-[260px] focus-ring"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-paper/10 border border-paper/15">
                  <Monitor className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-paper/60">Desktop</span>
              </div>
              <div>
                <p className="text-sm text-paper/60 mb-1">Jag är</p>
                <h2 className="display text-[34px] sm:text-[40px] leading-[1.02]">revisor</h2>
                <p className="text-sm text-paper/75 mt-3 max-w-[28ch]">
                  Översikt över alla klienter, inkorg med inkomna underlag och färdig bokföring.
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-[13px] text-paper/60">
                  Logga in som <span className="text-paper">{REVISOR.name}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-paper group-hover:translate-x-0.5 transition-transform">
                  Fortsätt <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </div>
            </Link>
          </div>

          <p className="mt-8 text-[13px] text-ink3">
            Detta är en demo. All data är påhittad och sparas bara lokalt i din webbläsare.
          </p>
        </div>
      </section>

      <footer className="px-6 sm:px-10 pb-6 sm:pb-8 flex items-center justify-between text-[12px] text-ink3">
        <span>© Räkna 2026</span>
        <span className="hidden sm:inline-flex gap-5">
          <span>bokföring</span>
          <span>·</span>
          <span>moms</span>
          <span>·</span>
          <span>årsredovisning</span>
        </span>
      </footer>
    </main>
  );
}
