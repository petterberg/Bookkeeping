import { ReactNode } from "react";
import { BottomNav } from "@/components/klient/BottomNav";

export default function KlientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex justify-center">
      <div className="relative w-full max-w-md min-h-screen flex flex-col">
        <main className="flex-1 pb-[88px] pt-2 fade-in">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
