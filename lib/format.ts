import type { Currency } from "./types";

const CODES: Record<Currency, string> = { usd: "USD", eur: "EUR", vnd: "VND" };

const fmts = new Map<string, Intl.NumberFormat>();
function nf(currency: Currency) {
  let f = fmts.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: CODES[currency],
      minimumFractionDigits: currency === "vnd" ? 0 : 2,
      maximumFractionDigits: currency === "vnd" ? 0 : 2,
    });
    fmts.set(currency, f);
  }
  return f;
}

/** an amount in whole units, the 2.17 way */
export const money = (amount: number, currency: Currency) => nf(currency).format(amount);

/** how many minor units a currency has: cents for usd and eur, none for the dong */
export const minor = (c: Currency) => (c === "vnd" ? 1 : 100);

/** the 1.0 stored number, shown as the raw integer it is in the database */
export const raw = (n: number) => n.toLocaleString("en-US");

export const CUR_LABEL: Record<Currency, string> = { usd: "USD", eur: "EUR", vnd: "VND" };

const dt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const d = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "short", year: "numeric" });
const t = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export const when = (ms: number) => dt.format(ms);
export const day = (ms: number) => d.format(ms);
export const clock = (ms: number) => t.format(ms);

export function ago(ms: number, now: number) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 50) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const dd = Math.round(h / 24);
  return dd === 1 ? "yesterday" : `${dd} days ago`;
}

export const plural = (n: number, one: string, many?: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many ?? one + "s"}`;
