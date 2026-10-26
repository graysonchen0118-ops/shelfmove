"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Activity, Currency, Customer, Order, Part, PartStatus, PriceRow, Product, Run, Toast } from "./types";
import { buildCatalog } from "./mock/catalog";
import { buildCustomers } from "./mock/customers";
import { buildOrders, buildRuns, liveOrder } from "./mock/orders";
import { buildPrices } from "./mock/prices";
import { PARTS, STATUS_LABEL } from "./mock/parts";
import { BASE_NOW, DAY, HOUR, MIN } from "./rand";
import { minor, money, plural } from "./format";
import { pulse } from "./bus";

export type RehearsalStep = "idle" | "pause" | "topup" | "point" | "reopen" | "done";

interface Rehearsal {
  step: RehearsalStep;
  startedAt: number;
  closedSeconds: number;
  movedAtSwitch: number;
  runs: { at: number; closedSeconds: number; moved: number }[];
}

interface State {
  products: Product[];
  prices: PriceRow[];
  parts: Part[];
  customers: Customer[];
  orders: Order[];
  runs: Run[];
  activity: Activity[];
  toasts: Toast[];
  now: number;
  live: boolean;
  checking: boolean;
  lastCheckAt: number;
  toppingUp: boolean;
  testOrder: "none" | "running" | "passed";
  wayBack: boolean;
  rehearsal: Rehearsal;
  busy: Record<string, boolean>;
}

interface Api extends State {
  toast: (text: string, tone?: Toast["tone"]) => void;
  setLive: (on: boolean) => void;
  runPriceCheck: () => Promise<void>;
  fixPrice: (key: string, amount?: number) => Promise<void>;
  setPartStatus: (id: string, status: PartStatus) => Promise<void>;
  savePart: (part: Part) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  testLogin: (id: string) => Promise<boolean>;
  runTopup: () => Promise<void>;
  resolveHeld: (id: string, variantId: string) => Promise<void>;
  placeTestOrder: () => Promise<void>;
  setWayBack: (on: boolean) => void;
  rehearse: () => Promise<void>;
  product: (id: string) => Product | undefined;
  customer: (id: string) => Customer | undefined;
}

const Ctx = createContext<Api | null>(null);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function seedActivity(): Activity[] {
  return [
    { id: "a5", at: BASE_NOW - 38 * MIN, tone: "info", text: "Care instructions rebuilt as their own data model, linked to product" },
    { id: "a4", at: BASE_NOW - 3 * HOUR, tone: "ok", text: "Price check finished: 5 rows need a decision, the rest match 1.0" },
    { id: "a3", at: BASE_NOW - 2 * DAY - 5 * HOUR, tone: "ok", text: "Top-up 2 moved the orders placed since the full copy, in 19 seconds" },
    { id: "a2", at: BASE_NOW - 4 * DAY - 3 * HOUR, tone: "ok", text: "Full copy 1: catalog, prices, customers and orders carried to 2.17" },
    { id: "a1", at: BASE_NOW - 5 * DAY, tone: "info", text: "Parts list started: 24 plugins and custom files found in the 1.0 store" },
  ];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => {
    const products = buildCatalog();
    const customers = buildCustomers();
    const orders = buildOrders(products, customers);
    return { products, customers, orders, runs: buildRuns(orders), prices: buildPrices(products) };
  }, []);

  const [products] = useState<Product[]>(initial.products);
  const [prices, setPrices] = useState<PriceRow[]>(initial.prices);
  const [parts, setParts] = useState<Part[]>(PARTS);
  const [customers, setCustomers] = useState<Customer[]>(initial.customers);
  const [orders, setOrders] = useState<Order[]>(initial.orders);
  const [runs, setRuns] = useState<Run[]>(initial.runs);
  const [activity, setActivity] = useState<Activity[]>(seedActivity);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(BASE_NOW);
  const [live, setLiveState] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheckAt, setLastCheckAt] = useState(BASE_NOW - 3 * HOUR);
  const [toppingUp, setToppingUp] = useState(false);
  const [testOrder, setTestOrder] = useState<State["testOrder"]>("none");
  const [wayBack, setWayBackState] = useState(true);
  const [rehearsal, setRehearsal] = useState<Rehearsal>({ step: "idle", startedAt: 0, closedSeconds: 0, movedAtSwitch: 0, runs: [] });
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const nowRef = useRef(BASE_NOW);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const partsRef = useRef(parts);
  partsRef.current = parts;
  const seq = useRef(0);
  const toastId = useRef(1);

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-2), { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const log = useCallback((text: string, tone: Activity["tone"] = "ok") => {
    setActivity((a) => [{ id: `a${Date.now()}${Math.random()}`, at: nowRef.current, tone, text }, ...a].slice(0, 40));
  }, []);

  const mark = (k: string, on: boolean) => setBusy((b) => ({ ...b, [k]: on }));

  // the store clock moves with real time from the fixed starting point
  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => {
      const n = BASE_NOW + (performance.now() - t0);
      nowRef.current = n;
      setNow(n);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // the live 1.0 store keeps selling while 2.17 is being built
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (seq.current >= 40) return;
      const o = liveOrder(products, customers, seq.current++, nowRef.current);
      setOrders((list) => [...list, o]);
      pulse("order");
    }, 11000);
    return () => clearInterval(id);
  }, [live, products, customers]);

  const setLive = useCallback(
    (on: boolean) => {
      setLiveState(on);
      log(on ? "Checkout on 1.0 reopened, new orders arrive again" : "Checkout on 1.0 paused", on ? "ok" : "warn");
    },
    [log]
  );

  const runPriceCheck = useCallback(async () => {
    setChecking(true);
    pulse("check");
    await wait(1700);
    setPrices((rows) => rows.map((r) => (r.status === "fixed" ? r : { ...r, v2: r.v1 == null ? null : r.v1 / minor(r.currency) })));
    setLastCheckAt(nowRef.current);
    setChecking(false);
    const open = prices.filter((r) => r.status === "issue").length;
    log(open ? `Price check finished: ${plural(open, "row")} still ${open === 1 ? "needs" : "need"} a decision` : "Price check finished: every price matches 1.0", open ? "warn" : "ok");
    toast(open ? `Checked ${plural(prices.length, "price")}. ${plural(open, "row")} still open.` : `All ${prices.length} prices match 1.0.`, open ? "info" : "ok");
  }, [prices, log, toast]);

  const fixPrice = useCallback(
    async (key: string, amount?: number) => {
      mark(key, true);
      await wait(750);
      setPrices((rows) =>
        rows.map((r) => {
          if (r.key !== key) return r;
          if (r.issue === "missing" && amount != null) return { ...r, status: "fixed", v2: amount, v1: Math.round(amount * minor(r.currency)) };
          return { ...r, status: "fixed" };
        })
      );
      mark(key, false);
      pulse("fix");
      const row = prices.find((r) => r.key === key);
      const p = products.find((x) => x.id === row?.productId);
      const what = row?.issue === "sale" ? "sale price list recreated" : row?.issue === "missing" ? `EUR price set to ${money(amount ?? 0, "eur")}` : "kept as a Vietnam region price";
      log(`${p?.title ?? "Variant"}: ${what}`);
      toast(`${p?.title ?? "Variant"}: ${what}`);
    },
    [prices, products, log, toast]
  );

  const setPartStatus = useCallback(
    async (id: string, status: PartStatus) => {
      mark(id, true);
      await wait(520);
      const name = partsRef.current.find((p) => p.id === id)?.name ?? "";
      setParts((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p)));
      mark(id, false);
      pulse("part");
      const label = STATUS_LABEL[status].toLowerCase();
      log(`${name || "Part"} marked ${label}`, status === "tested" ? "ok" : "info");
      toast(`${name || "Part"} is now ${label}`);
    },
    [log, toast]
  );

  const savePart = useCallback(
    async (part: Part) => {
      mark("part-save", true);
      await wait(650);
      const added = !partsRef.current.some((p) => p.id === part.id);
      setParts((ps) => (ps.some((p) => p.id === part.id) ? ps.map((p) => (p.id === part.id ? part : p)) : [part, ...ps]));
      mark("part-save", false);
      pulse("part");
      log(added ? `${part.name} added to the parts list` : `${part.name} updated`, "info");
      toast(added ? `${part.name} added to the list` : `${part.name} saved`);
    },
    [log, toast]
  );

  const deletePart = useCallback(
    async (id: string) => {
      mark(id, true);
      await wait(480);
      const p = parts.find((x) => x.id === id);
      setParts((ps) => ps.filter((x) => x.id !== id));
      mark(id, false);
      log(`${p?.name ?? "Part"} removed from the parts list`, "warn");
      toast(`${p?.name ?? "Part"} removed`, "info");
    },
    [parts, log, toast]
  );

  const testLogin = useCallback(
    async (id: string) => {
      mark(id, true);
      await wait(1150);
      const c = customers.find((x) => x.id === id);
      mark(id, false);
      if (!c) return false;
      if (c.account === "guest") {
        pulse("error");
        toast(`${c.name} checked out as a guest on 1.0. There is no password to carry.`, "error");
        return false;
      }
      setCustomers((cs) => cs.map((x) => (x.id === id ? { ...x, login: "verified" } : x)));
      pulse("login");
      log(`${c.name} signed in on 2.17 with the password from 1.0`);
      toast(`${c.name} signed in on 2.17 with their old password`);
      return true;
    },
    [customers, log, toast]
  );

  const runTopup = useCallback(async () => {
    const waiting = ordersRef.current.filter((o) => o.where === "waiting");
    setToppingUp(true);
    pulse("topup", Math.max(1, waiting.length));
    await wait(900 + Math.min(waiting.length, 30) * 110);
    const ids = new Set(waiting.map((o) => o.id));
    const held = waiting.filter((o) => o.heldReason).length;
    const moved = waiting.length - held;
    setOrders((list) => list.map((o) => (!ids.has(o.id) ? o : { ...o, where: o.heldReason ? "held" : "moved" })));
    const seconds = 6 + Math.round(waiting.length * 1.4);
    setRuns((rs) => [{ id: `run_${rs.length + 1}`, n: rs.length + 1, kind: "topup", at: nowRef.current, moved, held, seconds }, ...rs]);
    setToppingUp(false);
    if (!waiting.length) {
      toast("Nothing new on 1.0 since the last run", "info");
      return;
    }
    log(`Top-up moved ${plural(moved, "order")}${held ? `, ${held} held for a decision` : ""}`, held ? "warn" : "ok");
    toast(held ? `Moved ${plural(moved, "order")}. ${held} held, it needs a replacement variant.` : `Moved ${plural(moved, "order")} in ${seconds} s`, held ? "info" : "ok");
  }, [log, toast]);

  const resolveHeld = useCallback(
    async (id: string, variantId: string) => {
      mark(id, true);
      await wait(850);
      const o = ordersRef.current.find((x) => x.id === id);
      setOrders((list) =>
        list.map((x) => (x.id === id ? { ...x, where: "moved", heldReason: undefined, lines: x.lines.map((l, i) => (i === 0 ? { ...l, variantId } : l)) } : x))
      );
      mark(id, false);
      pulse("topup", 1);
      log(`Order #${o?.display} moved with its line mapped to a replacement variant`);
      toast(`Order #${o?.display} moved to 2.17`);
    },
    [log, toast]
  );

  const placeTestOrder = useCallback(async () => {
    setTestOrder("running");
    await wait(1900);
    setTestOrder("passed");
    pulse("order");
    log("Test order paid on 2.17: cart, shipping, tax and payment match the same cart on 1.0");
    toast("Test order on 2.17 matched 1.0 to the cent");
  }, [log, toast]);

  const setWayBack = useCallback(
    (on: boolean) => {
      setWayBackState(on);
      log(on ? "Way back on: 1.0 database snapshot kept and the old store ready to take traffic again" : "Way back switched off", on ? "ok" : "warn");
    },
    [log]
  );

  const rehearse = useCallback(async () => {
    const startedAt = nowRef.current;
    setRehearsal((r) => ({ ...r, step: "pause", startedAt }));
    pulse("switch");
    await wait(1400);
    setRehearsal((r) => ({ ...r, step: "topup" }));
    const waiting = ordersRef.current.filter((o) => o.where === "waiting" && !o.heldReason).length;
    pulse("topup", Math.max(1, waiting));
    await wait(1800);
    setRehearsal((r) => ({ ...r, step: "point" }));
    await wait(1300);
    setRehearsal((r) => ({ ...r, step: "reopen" }));
    await wait(1000);
    const closedSeconds = 95 + waiting * 2;
    setRehearsal((r) => ({ step: "done", startedAt, closedSeconds, movedAtSwitch: waiting, runs: [{ at: nowRef.current, closedSeconds, moved: waiting }, ...r.runs] }));
    pulse("switch");
    log(`Switch rehearsal on a copy: checkout closed ${Math.floor(closedSeconds / 60)} min ${closedSeconds % 60} s, ${plural(waiting, "order")} in the final top-up`);
    toast("Rehearsal finished, the live store was never touched");
  }, [log, toast]);

  const product = useCallback((id: string) => products.find((p) => p.id === id), [products]);
  const customer = useCallback((id: string) => customers.find((c) => c.id === id), [customers]);

  const api: Api = {
    products,
    prices,
    parts,
    customers,
    orders,
    runs,
    activity,
    toasts,
    now,
    live,
    checking,
    lastCheckAt,
    toppingUp,
    testOrder,
    wayBack,
    rehearsal,
    busy,
    toast,
    setLive,
    runPriceCheck,
    fixPrice,
    setPartStatus,
    savePart,
    deletePart,
    testLogin,
    runTopup,
    resolveHeld,
    placeTestOrder,
    setWayBack,
    rehearse,
    product,
    customer,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}

/** first visit to a screen waits like a real request would */
export function useLoaded(ms = 650) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOk(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ok;
}

export const currencyOf = (c: Currency) => c;
