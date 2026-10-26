"use client";

import { useStore } from "@/lib/store";

export interface Gate {
  id: string;
  title: string;
  detail: string;
  ok: boolean;
  href: string;
  progress: number;
}

export function useGates() {
  const { parts, prices, customers, orders, testOrder, wayBack } = useStore();
  const tested = parts.filter((p) => p.status === "tested").length;
  const open = prices.filter((p) => p.status === "issue").length;
  const verified = customers.filter((c) => c.login === "verified").length;
  const held = orders.filter((o) => o.where === "held" || (o.where === "waiting" && o.heldReason)).length;
  const needVerified = 8;

  const list: Gate[] = [
    {
      id: "parts",
      title: "Every part rebuilt and tested",
      detail: `${tested} of ${parts.length} tested on 2.17`,
      ok: parts.length > 0 && tested === parts.length,
      href: "/parts",
      progress: parts.length ? tested / parts.length : 0,
    },
    {
      id: "prices",
      title: "Every price matches 1.0",
      detail: open ? `${open} ${open === 1 ? "row needs" : "rows need"} a decision` : `${prices.length} prices checked, none open`,
      ok: open === 0,
      href: "/prices",
      progress: prices.length ? (prices.length - open) / prices.length : 0,
    },
    {
      id: "logins",
      title: "Old accounts sign in on 2.17",
      detail: `${Math.min(verified, needVerified)} of ${needVerified} real accounts tested`,
      ok: verified >= needVerified,
      href: "/customers",
      progress: Math.min(1, verified / needVerified),
    },
    {
      id: "held",
      title: "No order held back",
      detail: held ? `${held} ${held === 1 ? "order waits" : "orders wait"} for a replacement variant` : "Every moved order matches its 1.0 copy",
      ok: held === 0,
      href: "/orders",
      progress: held ? 0.5 : 1,
    },
    {
      id: "test",
      title: "Test order paid on 2.17",
      detail: testOrder === "passed" ? "Cart, shipping, tax and payment match 1.0" : "Same cart placed on both stores, totals compared",
      ok: testOrder === "passed",
      href: "/switch",
      progress: testOrder === "passed" ? 1 : 0,
    },
    {
      id: "back",
      title: "A way back is ready",
      detail: wayBack ? "1.0 snapshot kept, old store can take traffic again" : "Switched off",
      ok: wayBack,
      href: "/switch",
      progress: wayBack ? 1 : 0,
    },
  ];
  return { list, passed: list.filter((g) => g.ok).length, total: list.length };
}
