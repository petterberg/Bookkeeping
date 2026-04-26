import type { Revisor } from "./types";

const BERGSTROM_CSV = `Datum;Beskrivning;Belopp
2026-04-22;Microsoft 365 Sub;-1490
2026-04-18;Restaurang Pelikan;-2850
2026-04-17;Kundbetalning #2401;84500
2026-04-15;ICA Maxi Lindhagen;-540
2026-04-12;Preem Tankning;-1120
2026-04-10;Webhallen AB;-3290
2026-04-05;OKQ8 Hammarby;-640
2026-04-02;Kundbetalning #2398;45000`;

const LINDGREN_CSV = `Datum;Beskrivning;Belopp
2026-04-21;Scandic Anglais;-4200
2026-04-19;DHL Express;-1840
2026-04-16;OKQ8 Solna;-1240
2026-04-12;Faktura #1948;52000
2026-04-08;Slack Subscription;-690
2026-04-04;Webhallen;-2299`;

export const REVISOR: Revisor = {
  id: "rev-1",
  name: "Anna Johansson",
  firm: "Johansson Redovisning AB",
  email: "anna@jredovisning.se",
  clients: [
    {
      id: "c-bergstrom",
      name: "Bergström AB",
      orgNr: "556123-4567",
      contactName: "Erik Bergström",
      email: "erik@bergstrom.se",
      bank: "SEB",
      missingCount: 2,
      lastActive: "2026-03-23",
      fortnoxSynced: true,
      transactions: [
        { id: "t1", date: "2026-03-23", description: "Elgiganten AB", amount: -4890, status: "bokford", receiptType: "foretagskort", posting: { account: "5460", accountName: "Förbrukningsinventarier", vatRate: 25 } },
        { id: "t2", date: "2026-03-20", description: "Restaurang Pelikan", amount: -3240, status: "saknar_underlag" },
        { id: "t3", date: "2026-03-18", description: "Kundbetalning #2381", amount: 128500, status: "ok" },
        { id: "t4", date: "2026-03-15", description: "Preem", amount: -820, status: "saknar_underlag" },
        { id: "t5", date: "2026-03-10", description: "Microsoft 365", amount: -1490, status: "bokford", receiptType: "foretagskort", posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25 } },
        { id: "t6", date: "2026-03-05", description: "Kundbetalning #2340", amount: 45000, status: "ok" },
      ],
      messages: [
        { id: "m1", from: "revisor", text: "Hej Erik! Vi saknar kvitto för Restaurang Pelikan den 20 mars. Kan du ladda upp det?", timestamp: "2026-03-22T09:00:00", read: true },
        { id: "m2", from: "klient", text: "Självklart, jag letar upp det!", timestamp: "2026-03-22T09:45:00", read: true },
        { id: "m3", from: "revisor", text: "Tack! Vi saknar också kvitto för Preem den 15 mars.", timestamp: "2026-03-22T10:00:00", read: false },
      ],
      orphans: [
        { id: "o1", filename: "pelikan-lunch-0408.jpg", ocrMotpart: "Restaurang Pelikan", ocrAmount: 2850, ocrDate: "2026-04-08", receiptType: "foretagskort", note: "Lunch med Tenant Group", uploadedAt: "2026-04-09T08:14:00" },
        { id: "o2", filename: "preem-tankning-0412.jpg", ocrMotpart: "Preem", ocrAmount: 1120, ocrDate: "2026-04-12", receiptType: "privat", uploadedAt: "2026-04-12T17:32:00" },
        { id: "o3", filename: "microsoft-365-faktura.pdf", ocrMotpart: "Microsoft 365", ocrAmount: 1490, ocrDate: "2026-04-22", receiptType: "foretagskort", uploadedAt: "2026-04-22T11:05:00" },
        { id: "o4", filename: "ica-kontorskaffe-0415.jpg", ocrMotpart: "ICA Maxi", ocrAmount: 540, ocrDate: "2026-04-15", receiptType: "foretagskort", note: "Kaffe till kontoret", uploadedAt: "2026-04-15T16:48:00" },
      ],
      learnedRules: [
        { id: "lr1", pattern: "elgiganten", posting: { account: "5460", accountName: "Förbrukningsinventarier", vatRate: 25 }, count: 4, lastUsed: "2026-03-23" },
        { id: "lr2", pattern: "kundbetalning", posting: { account: "3010", accountName: "Försäljning, varor", vatRate: 25 }, count: 12, lastUsed: "2026-03-18" },
        { id: "lr3", pattern: "microsoft", posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25 }, count: 6, lastUsed: "2026-03-10" },
      ],
      sampleCsv: BERGSTROM_CSV,
    },
    {
      id: "c-lindgren",
      name: "Lindgren & Co AB",
      orgNr: "556234-5678",
      contactName: "Sara Lindgren",
      email: "sara@lindgrenco.se",
      bank: "Swedbank",
      missingCount: 3,
      lastActive: "2026-03-19",
      fortnoxSynced: false,
      transactions: [
        { id: "t7", date: "2026-03-22", description: "Preem Tankning", amount: -820, status: "saknar_underlag" },
        { id: "t8", date: "2026-03-18", description: "Scandic Hotels", amount: -8400, status: "inkommen", receiptType: "privat", note: "Övernattning kundmöte Göteborg" },
        { id: "t9", date: "2026-03-15", description: "OKQ8", amount: -1120, status: "saknar_underlag" },
        { id: "t10", date: "2026-03-12", description: "Faktura #1920", amount: 38000, status: "ok" },
        { id: "t11", date: "2026-03-08", description: "ICA Maxi", amount: -2890, status: "saknar_underlag" },
        { id: "t12", date: "2026-03-01", description: "Faktura #1905", amount: 22500, status: "ok" },
      ],
      messages: [
        { id: "m4", from: "revisor", text: "Hej Sara! Du har 3 transaktioner som saknar underlag den här månaden.", timestamp: "2026-03-20T08:00:00", read: true },
        { id: "m5", from: "klient", text: "Oj, förlåt! Jag är på resa men fixar det så fort jag är hemma på fredag.", timestamp: "2026-03-20T11:30:00", read: true },
        { id: "m6", from: "klient", text: "Scandic-kvittot har jag laddat upp nu. De andra tar jag fredag.", timestamp: "2026-03-21T14:00:00", read: false },
      ],
      orphans: [
        { id: "lo1", filename: "scandic-anglais-0421.pdf", ocrMotpart: "Scandic Anglais", ocrAmount: 4200, ocrDate: "2026-04-21", receiptType: "foretagskort", note: "Konferens", uploadedAt: "2026-04-22T07:30:00" },
        { id: "lo2", filename: "dhl-express-0419.pdf", ocrMotpart: "DHL Express", ocrAmount: 1840, ocrDate: "2026-04-19", receiptType: "foretagskort", uploadedAt: "2026-04-20T09:12:00" },
      ],
      learnedRules: [],
      sampleCsv: LINDGREN_CSV,
    },
    {
      id: "c-nordic",
      name: "Nordic Logistics AB",
      orgNr: "556345-6789",
      contactName: "Johan Eriksson",
      email: "johan@nordiclogistics.se",
      bank: "Handelsbanken",
      missingCount: 0,
      lastActive: "2026-03-24",
      fortnoxSynced: true,
      transactions: [
        { id: "t13", date: "2026-03-21", description: "Faktura #2381", amount: 128500, status: "ok", posting: { account: "3010", accountName: "Försäljning, varor", vatRate: 25 } },
        { id: "t14", date: "2026-03-19", description: "DHL Express", amount: -12400, status: "bokford", receiptType: "foretagskort", posting: { account: "5710", accountName: "Frakter och transporter", vatRate: 25 } },
        { id: "t15", date: "2026-03-15", description: "Oracle licens", amount: -24000, status: "bokford", receiptType: "foretagskort", posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25 } },
        { id: "t16", date: "2026-03-10", description: "Faktura #2350", amount: 94000, status: "ok", posting: { account: "3010", accountName: "Försäljning, varor", vatRate: 25 } },
      ],
      messages: [
        { id: "m7", from: "klient", text: "Hej Anna, stämmer det att momsen är inbetald för Q1?", timestamp: "2026-03-24T10:00:00", read: false },
        { id: "m8", from: "revisor", text: "Ja, allt är inbetalt och bokfört. Inget att åtgärda just nu!", timestamp: "2026-03-24T10:30:00", read: true },
      ],
      orphans: [],
      learnedRules: [
        { id: "lr-n1", pattern: "dhl", posting: { account: "5710", accountName: "Frakter och transporter", vatRate: 25 }, count: 18, lastUsed: "2026-03-19" },
        { id: "lr-n2", pattern: "oracle", posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25 }, count: 11, lastUsed: "2026-03-15" },
      ],
    },
    {
      id: "c-svensson",
      name: "Svensson Konsult AB",
      orgNr: "556456-7890",
      contactName: "Mikael Svensson",
      email: "mikael@svenssonconsult.se",
      bank: "Nordea",
      missingCount: 1,
      lastActive: "2026-03-17",
      fortnoxSynced: true,
      transactions: [
        { id: "t17", date: "2026-03-19", description: "Microsoft 365", amount: -1490, status: "bokford", receiptType: "foretagskort", posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25 } },
        { id: "t18", date: "2026-03-14", description: "Flygbiljett ARN-CPH", amount: -3200, status: "saknar_underlag" },
        { id: "t19", date: "2026-03-12", description: "Konsultfaktura #88", amount: 45000, status: "ok", posting: { account: "3041", accountName: "Försäljning av tjänster", vatRate: 25 } },
        { id: "t20", date: "2026-03-05", description: "Konsultfaktura #87", amount: 45000, status: "ok", posting: { account: "3041", accountName: "Försäljning av tjänster", vatRate: 25 } },
      ],
      messages: [
        { id: "m9", from: "revisor", text: "Mikael, saknar kvitto för flygbiljetten den 14 mars.", timestamp: "2026-03-18T09:00:00", read: true },
        { id: "m10", from: "klient", text: "Ska fixa! Var det privat eller företagskort?", timestamp: "2026-03-18T13:00:00", read: true },
        { id: "m11", from: "revisor", text: "Det ser ut som företagskort på kontoutdraget.", timestamp: "2026-03-18T13:15:00", read: false },
      ],
      orphans: [],
      learnedRules: [
        { id: "lr-s1", pattern: "microsoft", posting: { account: "6540", accountName: "IT-tjänster", vatRate: 25 }, count: 9, lastUsed: "2026-03-19" },
      ],
    },
    {
      id: "c-teknik",
      name: "Teknikfirman HB",
      orgNr: "969100-1234",
      contactName: "Lisa Holm",
      email: "lisa@teknikfirman.se",
      bank: "SEB",
      missingCount: 1,
      lastActive: "2026-03-15",
      fortnoxSynced: true,
      transactions: [
        { id: "t21", date: "2026-03-14", description: "ICA Maxi", amount: -2890, status: "inkommen", receiptType: "ovrigt", note: "Kontorsmat" },
        { id: "t22", date: "2026-03-12", description: "Webhallen", amount: -6400, status: "saknar_underlag" },
        { id: "t23", date: "2026-03-08", description: "Betalning från kund", amount: 45000, status: "ok" },
      ],
      messages: [
        { id: "m12", from: "revisor", text: "Hej Lisa! Webhallen den 12 mars saknar underlag.", timestamp: "2026-03-16T08:30:00", read: true },
        { id: "m13", from: "klient", text: "Oj, jag skickar kvittot direkt!", timestamp: "2026-03-16T09:00:00", read: true },
      ],
      orphans: [],
      learnedRules: [],
    },
  ],
};

export const CURRENT_CLIENT_ID = "c-bergstrom";
