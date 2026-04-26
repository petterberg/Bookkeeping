import type { OrphanReceipt } from "./types";

export type ParsedRow = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
};

const months: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  maj: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  okt: "10",
  nov: "11",
  dec: "12",
};

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  // 2026-03-22
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // 2026/03/22
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) return s.replace(/\//g, "-");
  // 22 mar 2026
  const m = s.match(/^(\d{1,2})\s+([a-zA-ZåäöÅÄÖ]{3})\s+(\d{4})$/);
  if (m) {
    const month = months[m[2].toLowerCase().slice(0, 3)];
    if (!month) return null;
    return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
  }
  // 22/03/2026 eller 22-03-2026
  const m2 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/kr$/i, "")
    .replace(/ /g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (ch === delim && !inQuote) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCsv(input: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: ["Tomt kontoutdrag"] };

  // Detektera delimiter
  const sample = lines[0];
  const delim = sample.includes(";") ? ";" : ",";

  // Hitta header
  const header = splitCsvLine(lines[0], delim).map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => /datum|date|bokf/.test(h));
  const descIdx = header.findIndex((h) => /beskriv|description|motpart|text|notering/.test(h));
  const amountIdx = header.findIndex((h) => /belopp|amount|summa/.test(h));

  const start =
    dateIdx >= 0 && descIdx >= 0 && amountIdx >= 0 ? 1 : 0;
  const di = start === 1 ? dateIdx : 0;
  const xi = start === 1 ? descIdx : 1;
  const ai = start === 1 ? amountIdx : 2;

  const rows: ParsedRow[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim);
    if (cells.length < 3) {
      errors.push(`Rad ${i + 1}: för få kolumner`);
      continue;
    }
    const date = normalizeDate(cells[di] ?? "");
    const desc = (cells[xi] ?? "").replace(/^"|"$/g, "");
    const amount = parseAmount(cells[ai] ?? "");
    if (!date || amount === null) {
      errors.push(`Rad ${i + 1}: ogiltigt datum eller belopp (${cells.join(" | ")})`);
      continue;
    }
    rows.push({ date, description: desc, amount });
  }
  return { rows, errors };
}

export type Match = {
  row: ParsedRow;
  orphan?: OrphanReceipt;
  matchScore: number; // 0–100
  matchReason?: string;
};

// Para ihop bankrad med uppladdat underlag på datum (±3 dagar) + belopp + namn-lik
export function matchOrphans(rows: ParsedRow[], orphans: OrphanReceipt[]): Match[] {
  const remaining = [...orphans];
  return rows.map((row) => {
    if (row.amount >= 0) {
      return { row, matchScore: 0 };
    }
    const target = Math.abs(row.amount);
    let best: { idx: number; score: number; reason: string } | null = null;

    for (let i = 0; i < remaining.length; i++) {
      const o = remaining[i];
      if (o.ocrAmount !== target) continue;
      const days = Math.abs(daysBetween(o.ocrDate, row.date));
      if (days > 3) continue;
      const nameScore = nameSimilarity(o.ocrMotpart, row.description);
      const score =
        70 +
        Math.max(0, 15 - days * 4) +
        Math.round(nameScore * 15);
      const reason =
        nameScore > 0.5
          ? `Match på belopp + namn (${o.ocrMotpart})`
          : `Match på belopp och datum`;
      if (!best || score > best.score) best = { idx: i, score, reason };
    }
    if (best) {
      const [picked] = remaining.splice(best.idx, 1);
      return { row, orphan: picked, matchScore: best.score, matchReason: best.reason };
    }
    return { row, matchScore: 0 };
  });
}

function daysBetween(a: string, b: string): number {
  const ad = new Date(a).getTime();
  const bd = new Date(b).getTime();
  return Math.round((bd - ad) / (1000 * 60 * 60 * 24));
}

function nameSimilarity(a: string, b: string): number {
  const A = a.toLowerCase().replace(/[^a-zåäö0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const B = b.toLowerCase().replace(/[^a-zåäö0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (A.length === 0 || B.length === 0) return 0;
  const setB = new Set(B);
  const hit = A.filter((t) => setB.has(t)).length;
  return hit / Math.max(A.length, B.length);
}
