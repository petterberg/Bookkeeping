import { fortnoxGet } from "./client";

export interface FortnoxCompanyInfo {
  Name: string;
  OrganizationNumber: string;
  DatabaseNumber: string;
  Address: string;
  ZipCode: string;
  City: string;
  CountryCode: string;
}

export async function getCompanyInfo(): Promise<FortnoxCompanyInfo> {
  const data = await fortnoxGet<{ CompanyInformation: FortnoxCompanyInfo }>(
    "/companyinformation",
  );
  return data.CompanyInformation;
}
