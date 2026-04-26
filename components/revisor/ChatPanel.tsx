"use client";

import { ChatThread } from "@/components/klient/ChatThread";
import type { Client } from "@/lib/types";

export function ChatPanel({ client }: { client: Client }) {
  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="px-5 py-3 border-b hairline flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper text-[12px] font-medium">
            {client.contactName
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </span>
          <div>
            <p className="text-[14px]">{client.contactName}</p>
            <p className="text-[12px] text-ink3">{client.email}</p>
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink3">Direktchatt</span>
      </div>
      <div className="flex-1 min-h-0">
        <ChatThread client={client} perspective="revisor" />
      </div>
    </div>
  );
}
