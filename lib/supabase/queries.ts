import { DEMO_WORKSPACE, supabaseAdmin } from "./client";
import { REVISOR } from "@/lib/mock-data";
import type { Client, Revisor } from "@/lib/types";
import {
  fromCashflow,
  fromClient,
  fromInvoice,
  fromLearnedRule,
  fromMessage,
  fromOrphan,
  fromSalary,
  fromTransaction,
  toCashflow,
  toInvoice,
  toLearnedRule,
  toMessage,
  toOrphan,
  toRevisor,
  toSalary,
  toTransaction,
  type CashflowRow,
  type ClientRow,
  type InvoiceRow,
  type LearnedRuleRow,
  type MessageRow,
  type OrphanRow,
  type RevisorInfoRow,
  type SalaryRow,
  type TransactionRow,
} from "./mappers";

// ─── Load everything for the workspace ───────────────────────────
export async function loadState(workspaceId: string = DEMO_WORKSPACE): Promise<{ revisor: Revisor } | null> {
  const db = supabaseAdmin();

  const [
    { data: revisorRow, error: revErr },
    { data: clientRows, error: cliErr },
  ] = await Promise.all([
    db.from("revisor_info").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    db
      .from("clients")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true }),
  ]);
  if (revErr) throw revErr;
  if (cliErr) throw cliErr;
  if (!revisorRow || !clientRows) return null;

  const clientIds = clientRows.map((c: ClientRow) => c.id);
  if (clientIds.length === 0) {
    return { revisor: toRevisor(revisorRow as RevisorInfoRow, []) };
  }

  const [
    { data: txRows, error: txErr },
    { data: orphanRows, error: orpErr },
    { data: ruleRows, error: ruleErr },
    { data: invRows, error: invErr },
    { data: msgRows, error: msgErr },
    { data: salaryRows, error: salErr },
    { data: cfRows, error: cfErr },
  ] = await Promise.all([
    db.from("transactions").select("*").in("client_id", clientIds),
    db.from("orphans").select("*").in("client_id", clientIds),
    db.from("learned_rules").select("*").in("client_id", clientIds),
    db.from("invoices").select("*").in("client_id", clientIds),
    db.from("messages").select("*").in("client_id", clientIds),
    db.from("salary_requests").select("*").in("client_id", clientIds),
    db.from("cashflow").select("*").in("client_id", clientIds),
  ]);
  if (txErr) throw txErr;
  if (orpErr) throw orpErr;
  if (ruleErr) throw ruleErr;
  if (invErr) throw invErr;
  if (msgErr) throw msgErr;
  if (salErr) throw salErr;
  if (cfErr) throw cfErr;

  const byClient = <T extends { client_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const r of rows) {
      const arr = map.get(r.client_id);
      if (arr) arr.push(r);
      else map.set(r.client_id, [r]);
    }
    return map;
  };
  const tx = byClient((txRows ?? []) as TransactionRow[]);
  const orp = byClient((orphanRows ?? []) as OrphanRow[]);
  const rules = byClient((ruleRows ?? []) as LearnedRuleRow[]);
  const inv = byClient((invRows ?? []) as InvoiceRow[]);
  const msg = byClient((msgRows ?? []) as MessageRow[]);
  const sal = byClient((salaryRows ?? []) as SalaryRow[]);
  const cf = byClient((cfRows ?? []) as CashflowRow[]);

  const clients: Client[] = (clientRows as ClientRow[]).map((c) => {
    const transactions = (tx.get(c.id) ?? []).map(toTransaction);
    return {
      id: c.id,
      name: c.name,
      orgNr: c.org_nr ?? "",
      contactName: c.contact_name ?? "",
      email: c.email ?? "",
      bank: c.bank ?? "",
      missingCount: transactions.filter((t) => t.status === "saknar_underlag").length,
      lastActive: c.last_active ?? "",
      fortnoxSynced: c.fortnox_synced,
      transactions,
      orphans: (orp.get(c.id) ?? []).map(toOrphan),
      learnedRules: (rules.get(c.id) ?? []).map(toLearnedRule),
      invoices: (inv.get(c.id) ?? []).map(toInvoice),
      messages: (msg.get(c.id) ?? []).map(toMessage),
      salaryRequests: (sal.get(c.id) ?? []).map(toSalary),
      cashflow: (cf.get(c.id) ?? [])
        .map(toCashflow)
        .sort((a, b) => (a.month < b.month ? -1 : 1)),
      defaultGrossSalary: c.default_gross_salary ?? undefined,
      sampleCsv: c.sample_csv ?? undefined,
    };
  });

  return { revisor: toRevisor(revisorRow as RevisorInfoRow, clients) };
}

// ─── Seed workspace from mock-data ───────────────────────────────
export async function seedDemoData(workspaceId: string = DEMO_WORKSPACE): Promise<void> {
  const db = supabaseAdmin();

  // Nuke everything for this workspace (cascade delete via clients + revisor_info)
  await db.from("clients").delete().eq("workspace_id", workspaceId);
  await db.from("revisor_info").delete().eq("workspace_id", workspaceId);
  await db.from("workspaces").delete().eq("id", workspaceId);

  // Workspace + revisor
  await db.from("workspaces").insert({ id: workspaceId, name: "Demo" });
  await db.from("revisor_info").insert({
    workspace_id: workspaceId,
    id: REVISOR.id,
    name: REVISOR.name,
    firm: REVISOR.firm,
    email: REVISOR.email,
  });

  // Clients + all children, in order
  const clients = REVISOR.clients;
  await db
    .from("clients")
    .insert(clients.map((c, i) => fromClient(c, workspaceId, i)));

  // Bulk-insert children per collection
  const tx = clients.flatMap((c) => c.transactions.map((t) => fromTransaction(t, c.id)));
  const orp = clients.flatMap((c) => c.orphans.map((o) => fromOrphan(o, c.id)));
  const rules = clients.flatMap((c) => c.learnedRules.map((r) => fromLearnedRule(r, c.id)));
  const inv = clients.flatMap((c) => c.invoices.map((i) => fromInvoice(i, c.id)));
  const msg = clients.flatMap((c) => c.messages.map((m) => fromMessage(m, c.id)));
  const sal = clients.flatMap((c) => c.salaryRequests.map((s) => fromSalary(s, c.id)));
  const cf = clients.flatMap((c) => c.cashflow.map((f) => fromCashflow(f, c.id)));

  await Promise.all([
    tx.length ? db.from("transactions").insert(tx) : Promise.resolve(),
    orp.length ? db.from("orphans").insert(orp) : Promise.resolve(),
    rules.length ? db.from("learned_rules").insert(rules) : Promise.resolve(),
    inv.length ? db.from("invoices").insert(inv) : Promise.resolve(),
    msg.length ? db.from("messages").insert(msg) : Promise.resolve(),
    sal.length ? db.from("salary_requests").insert(sal) : Promise.resolve(),
    cf.length ? db.from("cashflow").insert(cf) : Promise.resolve(),
  ]);
}
