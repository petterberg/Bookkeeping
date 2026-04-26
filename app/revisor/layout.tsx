import { ReactNode } from "react";
import { Sidebar } from "@/components/revisor/Sidebar";

export default function RevisorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col fade-in">{children}</div>
    </div>
  );
}
