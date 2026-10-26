"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, BadgeDollarSign, CircleAlert, Eye, EyeOff, RefreshCw, Search, SearchX, Store } from "lucide-react";
import { useLoaded, useStore } from "@/lib/store";
import { ago, CUR_LABEL, minor, money, plural, raw } from "@/lib/format";
import type { Currency, PriceRow } from "@/lib/types";
import { ISSUE_LABEL } from "@/lib/mock/prices";
import { TRAP_PRODUCT } from "@/lib/mock/catalog";
import { Empty, Modal, Pager, Photo, Skel, Spinner, Switch, Tilt } from "@/components/ui";

const PAGE = 18;
type StatusF = "all" | "issue" | "fixed" | "match";
type Sort = "product" | "amount" | "open";

export default function Prices() {
  const s = useStore();
  const ready = useLoaded(750);
  const [showRaw, setShowRaw] = useState(true);
  const [q, setQ] = useState("");
  const [cur, setCur] = useState<"all" | Currency>("all");
  const [st, setSt] = useState<StatusF>("all");
  const [sort, setSort] = useState<Sort>("open");
  const [page, setPage] = useState(1);
  const [fixing, setFixing] = useState<PriceRow | null>(null);

  const [previewId, setPreviewId] = useState(TRAP_PRODUCT);
  const [previewCur, setPreviewCur] = useState<Currency>("usd");

  const counts = useMemo(
    () => ({
      all: s.prices.length,
      issue: s.prices.filter((r) => r.status === "issue").length,
      fixed: s.prices.filter((r) => r.status === "fixed").length,
      match: s.prices.filter((r) => r.status === "match").length,
    }),
    [s.prices]
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = s.prices.filter((r) => {
      if (cur !== "all" && r.currency !== cur) return false;
      if (st !== "all" && r.status !== st) return false;
      if (!needle) return true;
      const p = s.product(r.productId);
      const v = p?.variants.find((x) => x.id === r.variantId);
      return `${p?.title} ${v?.title} ${v?.sku}`.toLowerCase().includes(needle);
    });
    const name = (r: PriceRow) => s.product(r.productId)?.title ?? "";
    list = list.slice().sort((a, b) => {
      if (sort === "open") {
        const w = (r: PriceRow) => (r.status === "issue" ? 0 : r.status === "fixed" ? 1 : 2);
        return w(a) - w(b) || name(a).localeCompare(name(b));
      }
      if (sort === "amount") {
        const usd = (r: PriceRow) => (r.v2 == null ? -1 : r.currency === "usd" ? r.v2 : r.currency === "eur" ? r.v2 * 1.08 : r.v2 / 25400);
        return usd(b) - usd(a);
      }
      return name(a).localeCompare(name(b));
    });
    return list;
  }, [s, q, cur, st, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pages);
  const view = rows.slice((safePage - 1) * PAGE, safePage * PAGE);

  const preview = s.product(previewId) ?? s.products[0];
  const pv = preview.variants[0];
  const stored = pv.v1[previewCur];

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">
            <BadgeDollarSign size={14} /> Price check
          </span>
          <h1>Every price, old against new</h1>
          <p className="lead">1.0 keeps money in cents and 2.17 keeps it in whole units. The script converts each price, and this page proves it, row by row, before any buyer sees 2.17.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={s.runPriceCheck} disabled={s.checking}>
              {s.checking ? <Spinner /> : <RefreshCw size={17} />} {s.checking ? "Checking every price" : "Run the check again"}
            </button>
            <span className="pill">Last check {ago(s.lastCheckAt, s.now)}</span>
          </div>
        </div>
      </section>

      <div className="stack">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Same product, three shop windows</h2>
              <p>What a buyer would see on the product page, depending on how the prices were moved.</p>
            </div>
            <div className="right">
              <select className="select" style={{ width: "auto", minHeight: 36 }} value={preview.id} onChange={(e) => setPreviewId(e.target.value)} aria-label="Product">
                {s.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <div className="chips" role="group" aria-label="Currency">
                {(["usd", "eur", "vnd"] as Currency[]).map((c) => (
                  <button key={c} className={`chip ${previewCur === c ? "on" : ""}`} onClick={() => setPreviewCur(c)}>
                    {CUR_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {stored == null ? (
            <div className="callout">
              <CircleAlert size={18} />
              <span>This variant has no {CUR_LABEL[previewCur]} price on 1.0. It is one of the rows waiting for a decision below.</span>
            </div>
          ) : (
            <div className="shelf-cards" key={`${preview.id}-${previewCur}`}>
              <ShopCard tag="1.0 storefront today" title={preview.title} photo={preview.photo} price={money(stored / minor(previewCur), previewCur)} note={<>Database holds <span className="rawnum">{raw(stored)}</span></>} />
              <ShopCard
                tag="2.17, copied as it is"
                title={preview.title}
                photo={preview.photo}
                price={money(stored, previewCur)}
                tone={previewCur === "vnd" ? "good" : "bad"}
                note={previewCur === "vnd" ? "The dong has no cents, so both versions store the same number" : `The same ${raw(stored)} read as whole ${CUR_LABEL[previewCur]}, ${minor(previewCur)} times the price`}
              />
              <ShopCard tag="2.17, converted by the script" title={preview.title} photo={preview.photo} price={money(stored / minor(previewCur), previewCur)} tone="good" note={<>Stored as <span className="rawnum">{raw(stored / minor(previewCur))}</span>, checked against 1.0</>} />
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>All prices</h2>
              <p>
                {plural(counts.all, "price")} across USD, EUR and VND. {counts.issue ? `${plural(counts.issue, "row")} ${counts.issue === 1 ? "needs" : "need"} a decision.` : "None open."}
              </p>
            </div>
            <div className="right">
              <label className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                {showRaw ? <Eye size={16} /> : <EyeOff size={16} />} Show a raw copy
                <Switch on={showRaw} onChange={() => setShowRaw((v) => !v)} label="Show what a raw copy would charge" />
              </label>
            </div>
          </div>

          <div className="toolbar">
            <div className="search">
              <Search size={16} />
              <input className="input" placeholder="Search product, variant or SKU" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} aria-label="Search prices" />
            </div>
            <div className="chips" role="group" aria-label="Currency filter">
              {(["all", "usd", "eur", "vnd"] as const).map((c) => (
                <button key={c} className={`chip ${cur === c ? "on" : ""}`} onClick={() => (setCur(c), setPage(1))}>
                  {c === "all" ? "All currencies" : CUR_LABEL[c]}
                </button>
              ))}
            </div>
            <div className="chips" role="group" aria-label="Status filter">
              {(
                [
                  ["all", "All"],
                  ["issue", "Open"],
                  ["fixed", "Resolved"],
                  ["match", "Match"],
                ] as [StatusF, string][]
              ).map(([k, l]) => (
                <button key={k} className={`chip ${st === k ? "on" : ""}`} onClick={() => (setSt(k), setPage(1))}>
                  {l} <em>{counts[k]}</em>
                </button>
              ))}
            </div>
            <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <ArrowDownUp size={15} />
              <select className="select" style={{ width: "auto", minHeight: 36 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
                <option value="open">Open first</option>
                <option value="product">Product A to Z</option>
                <option value="amount">Highest price</option>
              </select>
            </label>
          </div>

          {!ready || s.checking ? (
            <div className="table-wrap">
              <table className="tbl">
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td>
                        <div className="prod">
                          <Skel h={40} w={40} r={10} />
                          <Skel w={160} />
                        </div>
                      </td>
                      <td>
                        <Skel w={50} />
                      </td>
                      <td>
                        <Skel w={70} />
                      </td>
                      <td>
                        <Skel w={80} />
                      </td>
                      <td>
                        <Skel w={70} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view.length === 0 ? (
            <Empty icon={<SearchX size={22} />} title="No prices match" text="Nothing fits this search and filter. Clear them to see every row again." action={<button className="btn btn-ghost btn-sm" onClick={() => (setQ(""), setCur("all"), setSt("all"))}>Clear filters</button>} />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Currency</th>
                    <th className="num">Stored on 1.0</th>
                    {showRaw && <th className="num">If copied as is</th>}
                    <th className="num">On 2.17</th>
                    <th>Check</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {view.map((r) => {
                    const p = s.product(r.productId);
                    const v = p?.variants.find((x) => x.id === r.variantId);
                    const same = r.currency === "vnd";
                    return (
                      <tr key={r.key} className={r.status === "issue" ? "row-issue" : ""}>
                        <td>
                          <div className="prod">
                            <span className="prod-img">{p && <Photo id={p.photo} w={80} h={80} alt={p.title} />}</span>
                            <span>
                              <strong>{p?.title}</strong>
                              <span>
                                {v?.title} · {v?.sku}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge">{CUR_LABEL[r.currency]}</span>
                        </td>
                        <td className="num">{r.v1 == null ? <span className="muted">none</span> : <span className="rawnum">{raw(r.v1)}</span>}</td>
                        {showRaw && <td className="num">{r.v1 == null ? <span className="muted">none</span> : same ? <span className="muted">{money(r.v1, r.currency)}</span> : <span className="wrong">{money(r.v1, r.currency)}</span>}</td>}
                        <td className="num">{r.v2 == null ? <span className="muted">not set</span> : <strong>{money(r.v2, r.currency)}</strong>}</td>
                        <td>
                          {r.status === "match" ? <span className="badge ok">Matches 1.0</span> : r.status === "fixed" ? <span className="badge info">Resolved</span> : <span className="badge warn">{r.issue ? ISSUE_LABEL[r.issue] : "Open"}</span>}
                        </td>
                        <td className="num">
                          {r.status === "issue" && (
                            <button className="btn btn-support btn-sm" onClick={() => setFixing(r)} disabled={s.busy[r.key]}>
                              {s.busy[r.key] ? <Spinner size={14} /> : null} Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={safePage} pages={pages} onPage={setPage} total={rows.length} label="prices" />
        </section>
      </div>

      <FixModal row={fixing} onClose={() => setFixing(null)} />
    </div>
  );
}

function ShopCard({ tag, title, photo, price, note, tone }: { tag: string; title: string; photo: string; price: string; note: React.ReactNode; tone?: "good" | "bad" }) {
  return (
    <Tilt className={`shop-card flip ${tone ?? ""}`}>
      <div className="shop-img">
        <Photo id={photo} w={480} h={360} alt={title} />
      </div>
      <div className="shop-body">
        <span className="shop-tag">
          <Store size={12} style={{ display: "inline", verticalAlign: -1, marginRight: 4 }} />
          {tag}
        </span>
        <div className="shop-name">{title}</div>
        <div className="shop-price mono">{price}</div>
        <div className="shop-note">{note}</div>
      </div>
    </Tilt>
  );
}

function FixModal({ row, onClose }: { row: PriceRow | null; onClose: () => void }) {
  const s = useStore();
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  if (!row) return null;
  const p = s.product(row.productId);
  const v = p?.variants.find((x) => x.id === row.variantId);
  const usd = v?.v1.usd;
  const suggest = usd ? Math.round((usd / 100) * 0.93 * 2) / 2 : 0;

  const go = async () => {
    if (row.issue === "missing") {
      const n = Number(amount.replace(",", "."));
      if (!amount.trim() || !Number.isFinite(n) || n <= 0) return setErr("Enter a price above zero, in euros, for example 23.50");
      if (n > 5000) return setErr("That looks too high for this item. Check the amount.");
      setErr("");
      onClose();
      await s.fixPrice(row.key, Math.round(n * 100) / 100);
    } else {
      onClose();
      await s.fixPrice(row.key);
    }
    setAmount("");
  };

  const label = row.issue === "sale" ? "Recreate the sale price list" : row.issue === "missing" ? "Set the EUR price" : "Keep it as a Vietnam price";
  return (
    <Modal
      open={!!row}
      title={`${p?.title}, ${v?.title}`}
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={go}>
            {label}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <div className="prod">
          <span className="prod-img" style={{ width: 56, height: 56 }}>
            {p && <Photo id={p.photo} w={112} h={112} alt={p.title} />}
          </span>
          <span>
            <strong>{row.issue ? ISSUE_LABEL[row.issue] : ""}</strong>
            <span>
              {v?.sku} · {CUR_LABEL[row.currency]}
            </span>
          </span>
        </div>
        <div className="callout blue">
          <CircleAlert size={18} />
          <span>{row.note}</span>
        </div>
        {row.issue === "missing" && (
          <div className="field">
            <label htmlFor="eur">EUR price on 2.17</label>
            <input id="eur" className="input" inputMode="decimal" placeholder={suggest ? `Around ${suggest.toFixed(2)}, from the USD price` : "23.50"} value={amount} onChange={(e) => setAmount(e.target.value)} />
            {err && <span className="err">{err}</span>}
            {usd && <span className="muted small">USD price on 1.0 is {money(usd / 100, "usd")}, stored as {raw(usd)}.</span>}
          </div>
        )}
      </div>
    </Modal>
  );
}
