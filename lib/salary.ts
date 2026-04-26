// Förenklad löneberäkning för demo. Verklig skatt beror på skattetabell,
// kommun, ålder, jobbskatteavdrag etc. Dessa siffror är "ungefärligt rätt"
// för en löntagare i Stockholm 2026 utan jobbskatteavdragsfinjustering.

const PROVISORISK_SKATT = 0.31; // ~31 % preliminärskatt
const ARBGIV = 0.3142; // arbetsgivaravgift 31.42 %

export type SalaryEstimate = {
  net: number;
  tax: number;
  employerFees: number;
  totalCost: number;
};

export function estimateSalary(gross: number, benefits = 0): SalaryEstimate {
  const tax = Math.round((gross + benefits) * PROVISORISK_SKATT);
  const net = Math.round(gross - tax);
  const employerFees = Math.round((gross + benefits) * ARBGIV);
  const totalCost = gross + benefits + employerFees;
  return { net, tax, employerFees, totalCost };
}
