import type {
  BookkeepingPosting,
  BookkeepingSuggestion,
  LearnedRule,
} from "./types";

type Rule = {
  id: string;
  patterns: string[]; // lowercase substring
  posting: BookkeepingPosting;
  confidence: number;
};

// Pragmatisk start. Täcker de leverantörer som syns i mock-datan plus
// de vanligaste svenska transaktionsmönstren.
export const RULES: Rule[] = [
  {
    id: "drivmedel",
    patterns: ["preem", "okq8", "circle k", "shell", "ingo", "st1"],
    posting: { account: "5611", accountName: "Drivmedel", vatRate: 25, category: "Bilkostnad" },
    confidence: 92,
  },
  {
    id: "saas",
    patterns: ["microsoft", "office 365", "microsoft 365", "google", "adobe", "slack", "github", "notion", "figma", "oracle"],
    posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25, category: "Programvara" },
    confidence: 90,
  },
  {
    id: "hotell",
    patterns: ["scandic", "elite hotels", "clarion", "radisson", "first hotel", "hotell"],
    posting: { account: "5811", accountName: "Hotell och logi", vatRate: 12, category: "Resor" },
    confidence: 88,
  },
  {
    id: "flyg",
    patterns: ["sas ", "flygbiljett", "norwegian", "lufthansa", "klm", "arn-"],
    posting: { account: "5810", accountName: "Resor inrikes/utrikes", vatRate: 6, category: "Resor" },
    confidence: 85,
  },
  {
    id: "frakt",
    patterns: ["dhl", "postnord", "schenker", "bring", "ups"],
    posting: { account: "5710", accountName: "Frakter och transporter", vatRate: 25, category: "Transport" },
    confidence: 90,
  },
  {
    id: "elektronik",
    patterns: ["elgiganten", "webhallen", "netonnet", "kjell", "mediamarkt", "dustin"],
    posting: { account: "5460", accountName: "Förbrukningsinventarier", vatRate: 25, category: "Inventarier" },
    confidence: 78,
  },
  {
    id: "restaurang",
    patterns: ["restaurang", "pelikan", "sturehof", "lilla ego", "ramen"],
    posting: { account: "6072", accountName: "Personalrepresentation", vatRate: 12, category: "Representation" },
    confidence: 70,
  },
  {
    id: "livs",
    patterns: ["ica", "coop", "hemköp", "willys", "city gross"],
    posting: { account: "6072", accountName: "Personalrepresentation", vatRate: 12, category: "Förbrukning kontor" },
    confidence: 60,
  },
  {
    id: "telekom",
    patterns: ["telia", "tele2", "tre ", "telenor", "comhem"],
    posting: { account: "6212", accountName: "Mobiltelefon", vatRate: 25, category: "Tele" },
    confidence: 86,
  },
  {
    id: "kund-intakt",
    patterns: ["kundbetalning", "faktura #", "betalning från kund", "invoice "],
    posting: { account: "3010", accountName: "Försäljning, varor", vatRate: 25, category: "Intäkt" },
    confidence: 80,
  },
];

const norm = (s: string) => s.toLowerCase().trim();

export function suggest(
  description: string,
  amount: number,
  learnedRules: LearnedRule[] = [],
): BookkeepingSuggestion | null {
  const text = norm(description);

  // Lärda regler för den här klienten trumfar globala regler.
  const learned = learnedRules
    .filter((r) => text.includes(r.pattern))
    .sort((a, b) => b.count - a.count)[0];
  if (learned) {
    return {
      posting: learned.posting,
      confidence: Math.min(99, 70 + learned.count * 6),
      source: {
        kind: "history",
        label: `Lärt från denna klient`,
        count: learned.count,
      },
    };
  }

  for (const rule of RULES) {
    if (rule.patterns.some((p) => text.includes(p))) {
      // Justera intäkter: om det är ett positivt belopp men regeln pekar på utgiftskonto, hoppa.
      if (amount > 0 && rule.posting.account.startsWith("3") === false) continue;
      if (amount < 0 && rule.posting.account.startsWith("3")) continue;
      return {
        posting: rule.posting,
        confidence: rule.confidence,
        source: { kind: "rule", label: "Standardregel" },
      };
    }
  }
  return null;
}

export function patternFromDescription(description: string): string {
  // Plocka det ord som mest sannolikt är leverantörsnamn — första ordet i lowercase
  // som inte är ett rent siffer-/kort-ord.
  const tokens = description
    .toLowerCase()
    .split(/[\s,_·-]+/)
    .filter((t) => t.length > 2 && !/^\d+$/.test(t));
  return tokens[0] ?? norm(description);
}
