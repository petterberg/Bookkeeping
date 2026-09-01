import type {
  Client,
  Invoice,
  LearnedRule,
  Message,
  MonthlyFlow,
  OrphanReceipt,
  Revisor,
  SalaryRequest,
  Transaction,
} from "@/lib/types";

// ─── DB row shapes (snake_case, mirrors schema.sql) ────────────────

export type ClientRow = {
  id: string;
  workspace_id: string;
  name: string;
  org_nr: string | null;
  contact_name: string | null;
  email: string | null;
  bank: string | null;
  last_active: string | null;
  fortnox_synced: boolean;
  default_gross_salary: number | null;
  sample_csv: string | null;
  sort_order: number;
};

export type TransactionRow = {
  id: string;
  client_id: string;
  date: string;
  description: string;
  amount: number;
  status: Transaction["status"];
  receipt_url: string | null;
  receipt_type: Transaction["receiptType"] | null;
  note: string | null;
  posting: Transaction["posting"] | null;
  orphan_id: string | null;
  fortnox_file_id: string | null;
};

export type OrphanRow = {
  id: string;
  client_id: string;
  filename: string;
  ocr_motpart: string | null;
  ocr_amount: number | null;
  ocr_date: string | null;
  receipt_type: OrphanReceipt["receiptType"] | null;
  note: string | null;
  uploaded_at: string;
};

export type LearnedRuleRow = {
  id: string;
  client_id: string;
  pattern: string;
  posting: LearnedRule["posting"];
  count: number;
  last_used: string | null;
};

export type InvoiceRow = {
  id: string;
  client_id: string;
  number: string;
  customer_name: string;
  customer_org_nr: string | null;
  customer_email: string | null;
  customer_address: string | null;
  issue_date: string;
  due_date: string;
  lines: Invoice["lines"];
  net: number;
  vat: number;
  total: number;
  status: Invoice["status"];
  paid_at: string | null;
  note: string | null;
  fortnox_synced: boolean | null;
};

export type MessageRow = {
  id: string;
  client_id: string;
  from_role: Message["from"];
  text: string;
  timestamp: string;
  read: boolean;
};

export type SalaryRow = {
  id: string;
  client_id: string;
  month: string;
  gross_amount: number;
  benefits: number | null;
  expense_claims: number | null;
  estimated_net: number;
  estimated_tax: number;
  estimated_employer_fees: number;
  status: SalaryRequest["status"];
  requested_at: string;
  decided_at: string | null;
  paid_at: string | null;
  note: string | null;
  decision_note: string | null;
};

export type CashflowRow = {
  client_id: string;
  month: string;
  income: number;
  expenses: number;
  saldo: number;
};

export type RevisorInfoRow = {
  workspace_id: string;
  id: string;
  name: string;
  firm: string | null;
  email: string | null;
};

// ─── DB → domain ────────────────────────────────────────────────────

export function toTransaction(r: TransactionRow): Transaction {
  const t: Transaction = {
    id: r.id,
    date: r.date,
    description: r.description,
    amount: Number(r.amount),
    status: r.status,
  };
  if (r.receipt_url) t.receiptUrl = r.receipt_url;
  if (r.receipt_type) t.receiptType = r.receipt_type;
  if (r.note) t.note = r.note;
  if (r.posting) t.posting = r.posting;
  if (r.orphan_id) t.orphanId = r.orphan_id;
  if (r.fortnox_file_id) t.fortnoxFileId = r.fortnox_file_id;
  return t;
}

export function toOrphan(r: OrphanRow): OrphanReceipt {
  return {
    id: r.id,
    filename: r.filename,
    ocrMotpart: r.ocr_motpart ?? "",
    ocrAmount: Number(r.ocr_amount ?? 0),
    ocrDate: r.ocr_date ?? "",
    receiptType: (r.receipt_type ?? "ovrigt") as OrphanReceipt["receiptType"],
    note: r.note ?? undefined,
    uploadedAt: r.uploaded_at,
  };
}

export function toLearnedRule(r: LearnedRuleRow): LearnedRule {
  return {
    id: r.id,
    pattern: r.pattern,
    posting: r.posting,
    count: r.count,
    lastUsed: r.last_used ?? "",
  };
}

export function toInvoice(r: InvoiceRow): Invoice {
  const inv: Invoice = {
    id: r.id,
    number: r.number,
    customerName: r.customer_name,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    lines: r.lines ?? [],
    net: Number(r.net),
    vat: Number(r.vat),
    total: Number(r.total),
    status: r.status,
  };
  if (r.customer_org_nr) inv.customerOrgNr = r.customer_org_nr;
  if (r.customer_email) inv.customerEmail = r.customer_email;
  if (r.customer_address) inv.customerAddress = r.customer_address;
  if (r.paid_at) inv.paidAt = r.paid_at;
  if (r.note) inv.note = r.note;
  if (r.fortnox_synced != null) inv.fortnoxSynced = r.fortnox_synced;
  return inv;
}

export function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    from: r.from_role,
    text: r.text,
    timestamp: r.timestamp,
    read: r.read,
  };
}

export function toSalary(r: SalaryRow): SalaryRequest {
  const s: SalaryRequest = {
    id: r.id,
    month: r.month,
    grossAmount: Number(r.gross_amount),
    estimatedNet: Number(r.estimated_net),
    estimatedTax: Number(r.estimated_tax),
    estimatedEmployerFees: Number(r.estimated_employer_fees),
    status: r.status,
    requestedAt: r.requested_at,
  };
  if (r.benefits != null) s.benefits = Number(r.benefits);
  if (r.expense_claims != null) s.expenseClaims = Number(r.expense_claims);
  if (r.decided_at) s.decidedAt = r.decided_at;
  if (r.paid_at) s.paidAt = r.paid_at;
  if (r.note) s.note = r.note;
  if (r.decision_note) s.decisionNote = r.decision_note;
  return s;
}

export function toCashflow(r: CashflowRow): MonthlyFlow {
  return {
    month: r.month,
    income: Number(r.income),
    expenses: Number(r.expenses),
    saldo: Number(r.saldo),
  };
}

export function toRevisor(r: RevisorInfoRow, clients: Client[]): Revisor {
  return {
    id: r.id,
    name: r.name,
    firm: r.firm ?? "",
    email: r.email ?? "",
    clients,
  };
}

// ─── Domain → DB ────────────────────────────────────────────────────

export function fromClient(c: Client, workspaceId: string, order: number): ClientRow {
  return {
    id: c.id,
    workspace_id: workspaceId,
    name: c.name,
    org_nr: c.orgNr ?? null,
    contact_name: c.contactName ?? null,
    email: c.email ?? null,
    bank: c.bank ?? null,
    last_active: c.lastActive ?? null,
    fortnox_synced: c.fortnoxSynced,
    default_gross_salary: c.defaultGrossSalary ?? null,
    sample_csv: c.sampleCsv ?? null,
    sort_order: order,
  };
}

export function fromTransaction(t: Transaction, clientId: string): TransactionRow {
  return {
    id: t.id,
    client_id: clientId,
    date: t.date,
    description: t.description,
    amount: t.amount,
    status: t.status,
    receipt_url: t.receiptUrl ?? null,
    receipt_type: t.receiptType ?? null,
    note: t.note ?? null,
    posting: t.posting ?? null,
    orphan_id: t.orphanId ?? null,
    fortnox_file_id: t.fortnoxFileId ?? null,
  };
}

export function fromOrphan(o: OrphanReceipt, clientId: string): OrphanRow {
  return {
    id: o.id,
    client_id: clientId,
    filename: o.filename,
    ocr_motpart: o.ocrMotpart,
    ocr_amount: o.ocrAmount,
    ocr_date: o.ocrDate,
    receipt_type: o.receiptType,
    note: o.note ?? null,
    uploaded_at: o.uploadedAt,
  };
}

export function fromLearnedRule(r: LearnedRule, clientId: string): LearnedRuleRow {
  return {
    id: r.id,
    client_id: clientId,
    pattern: r.pattern,
    posting: r.posting,
    count: r.count,
    last_used: r.lastUsed || null,
  };
}

export function fromInvoice(i: Invoice, clientId: string): InvoiceRow {
  return {
    id: i.id,
    client_id: clientId,
    number: i.number,
    customer_name: i.customerName,
    customer_org_nr: i.customerOrgNr ?? null,
    customer_email: i.customerEmail ?? null,
    customer_address: i.customerAddress ?? null,
    issue_date: i.issueDate,
    due_date: i.dueDate,
    lines: i.lines,
    net: i.net,
    vat: i.vat,
    total: i.total,
    status: i.status,
    paid_at: i.paidAt ?? null,
    note: i.note ?? null,
    fortnox_synced: i.fortnoxSynced ?? false,
  };
}

export function fromMessage(m: Message, clientId: string): MessageRow {
  return {
    id: m.id,
    client_id: clientId,
    from_role: m.from,
    text: m.text,
    timestamp: m.timestamp,
    read: m.read,
  };
}

export function fromSalary(s: SalaryRequest, clientId: string): SalaryRow {
  return {
    id: s.id,
    client_id: clientId,
    month: s.month,
    gross_amount: s.grossAmount,
    benefits: s.benefits ?? null,
    expense_claims: s.expenseClaims ?? null,
    estimated_net: s.estimatedNet,
    estimated_tax: s.estimatedTax,
    estimated_employer_fees: s.estimatedEmployerFees,
    status: s.status,
    requested_at: s.requestedAt,
    decided_at: s.decidedAt ?? null,
    paid_at: s.paidAt ?? null,
    note: s.note ?? null,
    decision_note: s.decisionNote ?? null,
  };
}

export function fromCashflow(f: MonthlyFlow, clientId: string): CashflowRow {
  return {
    client_id: clientId,
    month: f.month,
    income: f.income,
    expenses: f.expenses,
    saldo: f.saldo,
  };
}
