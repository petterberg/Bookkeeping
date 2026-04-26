"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCurrentClient } from "@/lib/store";
import { ChatThread } from "@/components/klient/ChatThread";
import { REVISOR } from "@/lib/mock-data";

export default function MeddelandenPage() {
  const client = useCurrentClient();
  const initials = REVISOR.name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <div className="flex flex-col h-[calc(100dvh-88px)]">
      <header className="px-5 pt-5 pb-3 border-b hairline flex items-center gap-3">
        <Link
          href="/klient"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border hairline bg-paper2 hover:bg-paper3 focus-ring"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Link>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper text-[12px] font-medium">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] truncate">{REVISOR.name}</p>
          <p className="text-[12px] text-ink3 truncate">{REVISOR.firm}</p>
        </div>
      </header>
      <ChatThread client={client} perspective="klient" />
    </div>
  );
}
