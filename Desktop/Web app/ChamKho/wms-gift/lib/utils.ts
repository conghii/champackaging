import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// Currency Formatting
// ============================================================

export function formatCurrency(
  amount: number | string,
  currency: string = "USD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";

  if (currency === "VND") {
    return (
      num.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " ₫"
    );
  }

  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

// ============================================================
// Date Formatting
// ============================================================

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

// ============================================================
// Inventory Calculations
// ============================================================

export function calcDaysOfSupply(
  stock: number,
  dailyVelocity: number
): number {
  if (dailyVelocity <= 0) return 999;
  return Math.round(stock / dailyVelocity);
}

export type StockAlertLevel = "out" | "critical" | "warning" | "normal";

export function getStockAlertLevel(days: number): StockAlertLevel {
  if (days <= 0) return "out";
  if (days < 14) return "critical";
  if (days < 30) return "warning";
  return "normal";
}

// ============================================================
// Code Generators
// ============================================================

export function generateWONumber(count: number): string {
  const year = new Date().getFullYear();
  return `WO-${year}-${String(count + 1).padStart(3, "0")}`;
}

export function generatePONumber(count: number): string {
  const year = new Date().getFullYear();
  return `PO-${year}-${String(count + 1).padStart(3, "0")}`;
}
