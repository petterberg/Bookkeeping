import { fortnoxFetch, fortnoxPost } from "./client";

// Ladda upp fil till Fortnox Arkiv.
// Max 5 MB per fil, PDF/PNG/JPG stöds.
export async function uploadToArchive(file: File, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, filename);

  const response = await fortnoxFetch("/archive", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Filuppladdning misslyckades (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { File: { Id: string; Name: string } };
  return data.File.Id;
}

// Koppla en uppladdad fil till ett verifikat (kräver scope "connectfile" + "archive").
export async function connectFileToVoucher(
  fileId: string,
  voucherSeries: string,
  voucherNumber: number,
): Promise<void> {
  await fortnoxPost("/voucherfileconnections", {
    VoucherFileConnection: {
      FileId: fileId,
      VoucherSeries: voucherSeries,
      VoucherNumber: String(voucherNumber),
    },
  });
}

// Koppla en fil till en faktura.
export async function connectFileToInvoice(
  fileId: string,
  invoiceNumber: string,
): Promise<void> {
  await fortnoxPost("/invoicefileconnections", {
    InvoiceFileConnection: {
      FileId: fileId,
      EntityId: invoiceNumber,
      EntityType: "invoice",
      IncludeOnSend: false,
    },
  });
}
