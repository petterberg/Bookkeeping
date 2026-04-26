import { fortnoxGet, fortnoxPost } from "./client";
import type { Invoice, InvoiceLine, InvoiceStatus } from "@/lib/types";
import { uid } from "@/lib/utils";

interface FortnoxInvoiceListItem {
  DocumentNumber: string;
  CustomerName: string;
  CustomerNumber: string;
  InvoiceDate: string;
  DueDate: string;
  Total: number;
  TotalVAT: number;
  Balance: number;
  Sent: boolean;
  Cancelled: boolean;
  FinalPayDate?: string;
}

interface FortnoxInvoiceRow {
  Description: string;
  DeliveredQuantity: string | number;
  Price: number;
  VAT: number;
}

interface FortnoxInvoiceDetail extends FortnoxInvoiceListItem {
  InvoiceRows: FortnoxInvoiceRow[];
  PaymentWay: string;
  TermsOfPayment: string;
  EmailInformation?: { EmailAddressTo?: string };
  Address1?: string;
  ZipCode?: string;
  City?: string;
  OrganisationNumber?: string;
}

export async function getInvoices(filter?: string): Promise<FortnoxInvoiceListItem[]> {
  const params = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  const data = await fortnoxGet<{ Invoices: FortnoxInvoiceListItem[] }>(`/invoices${params}`);
  return data.Invoices ?? [];
}

export async function getInvoice(documentNumber: string): Promise<FortnoxInvoiceDetail> {
  const data = await fortnoxGet<{ Invoice: FortnoxInvoiceDetail }>(`/invoices/${documentNumber}`);
  return data.Invoice;
}

export type CreateInvoiceInput = {
  customerName: string;
  customerEmail?: string;
  customerOrgNr?: string;
  lines: InvoiceLine[];
  dueDate: string;
  issueDate?: string;
  termsOfPayment?: number; // antal dagar
  note?: string;
};

export async function createInvoice(input: CreateInvoiceInput): Promise<string> {
  const customerNumber = await ensureCustomer(
    input.customerName,
    input.customerEmail,
    input.customerOrgNr,
  );

  const body = {
    Invoice: {
      CustomerNumber: customerNumber,
      InvoiceDate: input.issueDate ?? new Date().toISOString().slice(0, 10),
      DueDate: input.dueDate,
      TermsOfPayment: input.termsOfPayment ? String(input.termsOfPayment) : "30",
      Remarks: input.note ?? "",
      InvoiceRows: input.lines.map((l) => ({
        Description: l.description,
        DeliveredQuantity: String(l.quantity),
        Price: l.unitPrice,
        VAT: l.vatRate,
      })),
    },
  };

  const data = await fortnoxPost<{ Invoice: { DocumentNumber: string } }>("/invoices", body);
  return data.Invoice.DocumentNumber;
}

async function ensureCustomer(
  name: string,
  email?: string,
  orgNr?: string,
): Promise<string> {
  // Sök på namn först
  try {
    const search = await fortnoxGet<{ Customers: Array<{ CustomerNumber: string; Name: string }> }>(
      `/customers?search=${encodeURIComponent(name)}`,
    );
    const exact = search.Customers?.find((c) => c.Name === name);
    if (exact) return exact.CustomerNumber;
    if (search.Customers?.length) return search.Customers[0].CustomerNumber;
  } catch {
    /* sökning misslyckades — vi skapar ny kund nedan */
  }

  const data = await fortnoxPost<{ Customer: { CustomerNumber: string } }>("/customers", {
    Customer: {
      Name: name,
      Email: email ?? "",
      OrganisationNumber: orgNr ?? "",
      Type: "COMPANY",
    },
  });
  return data.Customer.CustomerNumber;
}

function deriveStatus(fi: FortnoxInvoiceListItem): InvoiceStatus {
  if (fi.Cancelled) return "utkast";
  if (fi.FinalPayDate) return "betald";
  const due = new Date(fi.DueDate);
  if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) return "forfallen";
  if (fi.Sent) return "skickad";
  return "utkast";
}

// Översätt Fortnox-faktura till intern Invoice-typ (utan rader).
export function mapFortnoxInvoice(fi: FortnoxInvoiceListItem): Invoice {
  const total = fi.Total;
  const vat = fi.TotalVAT;
  return {
    id: uid("inv-fx"),
    number: fi.DocumentNumber,
    customerName: fi.CustomerName,
    issueDate: fi.InvoiceDate,
    dueDate: fi.DueDate,
    lines: [],
    net: Math.round(total - vat),
    vat: Math.round(vat),
    total: Math.round(total),
    status: deriveStatus(fi),
    paidAt: fi.FinalPayDate,
  };
}

export function mapFortnoxInvoiceDetail(fi: FortnoxInvoiceDetail): Invoice {
  const base = mapFortnoxInvoice(fi);
  const lines: InvoiceLine[] = (fi.InvoiceRows ?? []).map((r) => ({
    id: uid("il-fx"),
    description: r.Description,
    quantity: Number(r.DeliveredQuantity) || 0,
    unitPrice: Number(r.Price) || 0,
    vatRate: Number(r.VAT) || 0,
  }));
  return {
    ...base,
    customerEmail: fi.EmailInformation?.EmailAddressTo,
    customerOrgNr: fi.OrganisationNumber,
    customerAddress: fi.Address1
      ? `${fi.Address1}, ${fi.ZipCode ?? ""} ${fi.City ?? ""}`.trim()
      : undefined,
    lines,
  };
}
