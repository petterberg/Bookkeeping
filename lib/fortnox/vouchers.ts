import { fortnoxGet } from "./client";

export interface FortnoxVoucherRow {
  Account: number;
  Debit: number;
  Credit: number;
  Description: string;
}

export interface FortnoxVoucher {
  VoucherNumber: number;
  VoucherSeries: string;
  TransactionDate: string;
  Description: string;
  VoucherRows: FortnoxVoucherRow[];
}

// Hämta verifikationer för en period.
export async function getVouchers(fromDate: string, toDate: string): Promise<FortnoxVoucher[]> {
  // Säkerställ att räkenskapsår täcker datumet — annars blir Fortnox-svaret tomt eller fel.
  await ensureFinancialYear(fromDate);

  const data = await fortnoxGet<{ Vouchers: FortnoxVoucher[] }>(
    `/vouchers?fromdate=${fromDate}&todate=${toDate}`,
  );
  return data.Vouchers ?? [];
}

interface FinancialYear {
  Id: number;
  FromDate: string;
  ToDate: string;
}

async function ensureFinancialYear(date: string): Promise<void> {
  const data = await fortnoxGet<{ FinancialYears: FinancialYear[] }>(
    `/financialyears?date=${date}`,
  );
  if (!data.FinancialYears?.length) {
    throw new Error(`Inget öppet räkenskapsår för datumet ${date}. Justera Fortnox-inställningarna.`);
  }
}

export interface VoucherSummary {
  intakter: number;
  kostnader: number;
  resultat: number;
  moms: number;
  kassaflode: number;
}

// Summera intäkter/kostnader/moms från verifikationer.
// Konto 3xxx = intäkter, 4xxx-7xxx = kostnader, 26xx-utgående/2640-2645-ingående = moms.
export function summarizeVouchers(vouchers: FortnoxVoucher[]): VoucherSummary {
  let intakter = 0;
  let kostnader = 0;
  let momsUtgaende = 0;
  let momsIngaende = 0;

  for (const voucher of vouchers) {
    for (const row of voucher.VoucherRows) {
      const account = row.Account;
      const amount = row.Credit - row.Debit;
      if (account >= 3000 && account < 4000) intakter += Math.abs(amount);
      if (account >= 4000 && account < 8000) kostnader += Math.abs(amount);
      if (account === 2610 || account === 2620 || account === 2630) momsUtgaende += row.Credit;
      if (account === 2640 || account === 2641 || account === 2645) momsIngaende += row.Debit;
    }
  }

  return {
    intakter,
    kostnader,
    resultat: intakter - kostnader,
    moms: momsUtgaende - momsIngaende,
    kassaflode: intakter - kostnader,
  };
}
