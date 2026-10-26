export type Currency = "usd" | "eur" | "vnd";

export type Cat = "ceramics" | "coffee" | "linen" | "wood" | "home";

export interface Variant {
  id: string;
  sku: string;
  title: string;
  /** 1.0 amounts, stored the 1.0 way: cents for usd and eur, whole dong for vnd */
  v1: Record<Currency, number | null>;
  stock: number;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  cat: Cat;
  photo: string;
  collection: string;
  variants: Variant[];
}

export type PriceIssue = "sale" | "missing" | "region";

export interface PriceRow {
  key: string;
  productId: string;
  variantId: string;
  currency: Currency;
  v1: number | null;
  /** what 2.17 holds after the script, in whole units */
  v2: number | null;
  status: "match" | "issue" | "fixed";
  issue?: PriceIssue;
  note?: string;
}

export type PartKind = "plugin" | "service" | "subscriber" | "api" | "model" | "admin" | "storefront" | "job";
export type PartHome = "provider" | "module" | "workflow" | "link" | "subscriber" | "route" | "widget" | "sdk" | "none";
export type PartStatus = "todo" | "mapped" | "building" | "rebuilt" | "tested";

export interface Part {
  id: string;
  name: string;
  kind: PartKind;
  v1: string;
  home: PartHome;
  v2: string;
  effort: "S" | "M" | "L";
  status: PartStatus;
  note: string;
  decision?: boolean;
}

export type Account = "login" | "guest";
export type LoginState = "carried" | "verified" | "none";

export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  currency: Currency;
  account: Account;
  login: LoginState;
  /** 1.0 stored this hash with the light setting, it gets the strong one at the next login */
  weakHash: boolean;
  since: string;
  photo?: string;
}

export interface OrderLine {
  productId: string;
  variantId: string;
  qty: number;
}

export type OrderWhere = "moved" | "waiting" | "held";

export interface Order {
  id: string;
  display: number;
  customerId: string;
  currency: Currency;
  /** total in whole units, as 2.17 shows it */
  total: number;
  lines: OrderLine[];
  placedAt: number;
  status: "paid" | "fulfilled" | "refunded";
  where: OrderWhere;
  heldReason?: string;
}

export interface Run {
  id: string;
  n: number;
  kind: "full" | "topup";
  at: number;
  moved: number;
  held: number;
  seconds: number;
}

export interface Activity {
  id: string;
  at: number;
  tone: "ok" | "warn" | "info" | "err";
  text: string;
}

export interface Toast {
  id: number;
  tone: "ok" | "error" | "info";
  text: string;
}
