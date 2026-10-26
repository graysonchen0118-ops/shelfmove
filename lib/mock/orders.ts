import type { Customer, Order, OrderLine, Product, Run } from "../types";
import { BASE_NOW, DAY, HOUR, MIN, seeded } from "../rand";
import { minor } from "../format";

const SHIP = { usd: 6.5, eur: 5.9, vnd: 35000 } as const;

export function lineTotal(products: Product[], o: Pick<Order, "lines" | "currency">) {
  let sum = 0;
  for (const l of o.lines) {
    const p = products.find((x) => x.id === l.productId);
    const v = p?.variants.find((x) => x.id === l.variantId);
    const a = v?.v1[o.currency];
    if (a != null) sum += (a / minor(o.currency)) * l.qty;
  }
  return Math.round((sum + SHIP[o.currency]) * 100) / 100;
}

/** run 1 was the full copy, run 2 a top-up; everything after run 2 is still waiting on 1.0 */
export const RUN1_AT = BASE_NOW - 4 * DAY - 3 * HOUR;
export const RUN2_AT = BASE_NOW - 2 * DAY - 5 * HOUR;

export function buildOrders(products: Product[], customers: Customer[]) {
  const r = seeded(42);
  const orders: Order[] = [];
  const total = 152;
  const start = BASE_NOW - 60 * DAY;
  let t = start;
  for (let i = 0; i < total; i++) {
    const remaining = total - i;
    // the last eight orders were placed today, after the last run
    if (remaining <= 8) t = BASE_NOW - remaining * 41 * MIN - Math.floor(r() * 20) * MIN;
    else t += Math.floor((DAY * 59) / (total - 8) + (r() - 0.5) * 6 * HOUR);
    const c = customers[Math.floor(r() * customers.length)];
    const nLines = 1 + Math.floor(r() * 3);
    const lines: OrderLine[] = [];
    for (let k = 0; k < nLines; k++) {
      const p = products[Math.floor(r() * products.length)];
      const v = p.variants[Math.floor(r() * p.variants.length)];
      if (v.v1[c.currency] == null) continue;
      if (lines.some((l) => l.variantId === v.id)) continue;
      lines.push({ productId: p.id, variantId: v.id, qty: 1 + (r() < 0.25 ? 1 : 0) });
    }
    if (!lines.length) {
      const p = products[0];
      lines.push({ productId: p.id, variantId: p.variants[0].id, qty: 1 });
    }
    const where = t > RUN2_AT ? "waiting" : "moved";
    const o: Order = {
      id: `order_${(5000 + i).toString(36)}`,
      display: 1001 + i,
      customerId: c.id,
      currency: c.currency,
      total: 0,
      lines,
      placedAt: t,
      status: t < BASE_NOW - 6 * DAY ? (r() < 0.06 ? "refunded" : "fulfilled") : "paid",
      where,
    };
    o.total = lineTotal(products, o);
    orders.push(o);
  }
  // one waiting order points at a variant that was deleted on 1.0 after it was bought
  const held = orders[orders.length - 5];
  const napkins = products.find((p) => p.id === "p_napkins");
  const rust = napkins?.variants.find((v) => v.id === "p_napkins_rust");
  if (napkins && rust) {
    held.lines = [{ productId: napkins.id, variantId: rust.id, qty: 1 }];
    held.total = lineTotal(products, held);
  }
  held.heldReason = "Its variant, Linen napkins set of 6 in Rust, was deleted on 1.0 after the order. The line needs a replacement variant before it can move.";
  return orders;
}

export function buildRuns(orders: Order[]): Run[] {
  const first = orders.filter((o) => o.placedAt <= RUN1_AT).length;
  const second = orders.filter((o) => o.placedAt > RUN1_AT && o.placedAt <= RUN2_AT).length;
  return [
    { id: "run_2", n: 2, kind: "topup", at: RUN2_AT, moved: second, held: 0, seconds: 19 },
    { id: "run_1", n: 1, kind: "full", at: RUN1_AT, moved: first, held: 0, seconds: 412 },
  ];
}

const LIVE_NAMES = [0, 2, 5, 7, 11, 14, 19, 20, 26, 31, 33, 40, 45, 51, 57, 61];

/** a new order arriving on the live 1.0 store while 2.17 is being built */
export function liveOrder(products: Product[], customers: Customer[], seq: number, at: number): Order {
  const r = seeded(900 + seq);
  const c = customers[LIVE_NAMES[seq % LIVE_NAMES.length] % customers.length];
  const p = products[Math.floor(r() * products.length)];
  const v = p.variants[Math.floor(r() * p.variants.length)];
  const lines = [{ productId: p.id, variantId: v.id, qty: 1 }];
  if (v.v1[c.currency] == null) lines[0] = { productId: products[1].id, variantId: products[1].variants[0].id, qty: 1 };
  const o: Order = {
    id: `order_live_${seq}`,
    display: 1153 + seq,
    customerId: c.id,
    currency: c.currency,
    total: 0,
    lines,
    placedAt: at,
    status: "paid",
    where: "waiting",
  };
  o.total = lineTotal(products, o);
  return o;
}
