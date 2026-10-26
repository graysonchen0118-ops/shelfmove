import type { Currency, PriceIssue, PriceRow, Product } from "../types";
import { minor } from "../format";

export const ISSUE_LABEL: Record<PriceIssue, string> = {
  sale: "Sale price in a 1.0 price list",
  missing: "No price on 1.0",
  region: "Price set for one region only",
};

const NOTES: Record<PriceIssue, string> = {
  sale: "On 1.0 this variant sits in the Autumn sale price list, 20% off until 31 Oct. Recreate the list in 2.17 so the sale price does not become the normal price.",
  missing: "1.0 has no EUR price for this variant, so buyers in Europe saw it as unavailable. Set one now, or keep it hidden in Europe on purpose.",
  region: "On 1.0 this VND price applies only to the Vietnam region. In 2.17 it becomes a price with a region rule, not a plain currency price.",
};

/** variants that carry an issue, picked by position so the server and the browser agree */
const ISSUES: { at: number; currency: Currency; issue: PriceIssue }[] = [
  { at: 3, currency: "usd", issue: "sale" },
  { at: 17, currency: "eur", issue: "sale" },
  { at: 30, currency: "eur", issue: "missing" },
  { at: 52, currency: "eur", issue: "missing" },
  { at: 66, currency: "vnd", issue: "region" },
];

export function buildPrices(products: Product[]): PriceRow[] {
  const rows: PriceRow[] = [];
  let n = 0;
  for (const p of products) {
    for (const v of p.variants) {
      const hit = ISSUES.filter((x) => x.at === n);
      for (const c of ["usd", "eur", "vnd"] as Currency[]) {
        const issue = hit.find((h) => h.currency === c)?.issue;
        let amount = v.v1[c];
        if (issue === "missing") amount = null;
        rows.push({
          key: `${v.id}_${c}`,
          productId: p.id,
          variantId: v.id,
          currency: c,
          v1: amount,
          v2: amount == null ? null : amount / minor(c),
          status: issue ? "issue" : "match",
          issue,
          note: issue ? NOTES[issue] : undefined,
        });
      }
      n++;
    }
  }
  return rows;
}
