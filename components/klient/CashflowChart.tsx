"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyFlow } from "@/lib/types";
import { formatAmount } from "@/lib/utils";

const MONTHS_SV = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function fmtMonth(m: string): string {
  const parts = m.split("-");
  if (parts.length !== 2) return m;
  const idx = Number(parts[1]) - 1;
  return MONTHS_SV[idx] ?? m;
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mkr`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)} tkr`;
  return String(n);
}

export function CashflowSaldoChart({ data }: { data: MonthlyFlow[] }) {
  const series = data.map((d) => ({ ...d, m: fmtMonth(d.month) }));
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1814" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#1a1814" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(26,24,20,0.06)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="m"
            tick={{ fill: "#7a756e", fontSize: 11 }}
            axisLine={{ stroke: "rgba(26,24,20,0.12)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7a756e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtCompact}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: "rgba(26,24,20,0.16)", strokeWidth: 1 }}
            contentStyle={{
              background: "#fff",
              border: "1px solid rgba(26,24,20,0.12)",
              borderRadius: 12,
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{ color: "#7a756e", fontSize: 11, marginBottom: 2 }}
            formatter={(v) => [formatAmount(Number(v) || 0), "Saldo"]}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="#1a1814"
            strokeWidth={1.6}
            fill="url(#saldoFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InOutBarChart({ data }: { data: MonthlyFlow[] }) {
  const series = data.map((d) => ({
    ...d,
    m: fmtMonth(d.month),
    expensesNeg: -d.expenses,
  }));
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="rgba(26,24,20,0.06)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="m"
            tick={{ fill: "#7a756e", fontSize: 11 }}
            axisLine={{ stroke: "rgba(26,24,20,0.12)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7a756e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtCompact}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(26,24,20,0.04)" }}
            contentStyle={{
              background: "#fff",
              border: "1px solid rgba(26,24,20,0.12)",
              borderRadius: 12,
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{ color: "#7a756e", fontSize: 11, marginBottom: 2 }}
            formatter={(v, name) => [
              formatAmount(Math.abs(Number(v) || 0)),
              String(name) === "income" ? "Intäkter" : "Utgifter",
            ]}
          />
          <Bar dataKey="income" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expensesNeg" fill="#9b2c2c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
