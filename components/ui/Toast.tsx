"use client";

import { Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={cn(
            "pointer-events-auto toast-in inline-flex items-center gap-2 rounded-full border hairline bg-ink text-paper px-4 py-2 text-sm",
          )}
        >
          {t.tone === "success" ? (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green text-paper">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          ) : null}
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}
