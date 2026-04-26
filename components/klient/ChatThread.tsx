"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { cn, formatRelative, uid } from "@/lib/utils";
import { useApp } from "@/lib/store";
import type { Client, Role } from "@/lib/types";

export function ChatThread({
  client,
  perspective,
  emptyHint,
}: {
  client: Client;
  perspective: Role;
  emptyHint?: string;
}) {
  const { dispatch } = useApp();
  const [text, setText] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const sorted = [...client.messages].sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    );
    const out: { day: string; items: typeof sorted }[] = [];
    sorted.forEach((m) => {
      const day = formatRelative(m.timestamp).split(" ")[0];
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    });
    return out;
  }, [client.messages]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [client.messages.length]);

  useEffect(() => {
    dispatch({ type: "mark_messages_read", clientId: client.id, reader: perspective });
  }, [client.id, perspective, dispatch]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({
      type: "add_message",
      clientId: client.id,
      message: {
        id: uid("m"),
        from: perspective,
        text: trimmed,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
    setText("");
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-5">
        {groups.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[13px] text-ink3 max-w-[28ch] text-center">
              {emptyHint ?? "Inga meddelanden ännu. Skriv något så hör vi av oss."}
            </p>
          </div>
        ) : (
          groups.map((g, gi) => (
            <div key={gi} className="space-y-2">
              <div className="flex items-center justify-center">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink3 bg-paper px-2">
                  {g.day}
                </span>
              </div>
              {g.items.map((m) => {
                const mine = m.from === perspective;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2 text-[14.5px] leading-snug",
                        mine
                          ? "bg-ink text-paper rounded-br-md"
                          : "bg-paper2 text-ink border hairline rounded-bl-md",
                      )}
                    >
                      <p>{m.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10.5px]",
                          mine ? "text-paper/60" : "text-ink3",
                        )}
                      >
                        {formatRelative(m.timestamp).split(" ").slice(-1)[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t hairline bg-paper p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Skriv ett meddelande…"
            className="flex-1 resize-none rounded-2xl border hairline bg-paper2 px-4 py-2.5 text-[14.5px] text-ink placeholder:text-ink4 focus-ring max-h-32"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-30 focus-ring"
            aria-label="Skicka"
          >
            <Send className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        </div>
      </form>
    </div>
  );
}
