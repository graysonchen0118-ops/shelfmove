"use client";

import { useMemo, useState } from "react";
import { CircleAlert, History, PackageCheck, Play, Search, SearchX, Truck } from "lucide-react";
import { useLoaded, useStore } from "@/lib/store";
import { ago, money, plural, when } from "@/lib/format";
import type { Order, OrderWhere } from "@/lib/types";
import { Empty, Modal, Pager, Photo, Skel, Spinner, Switch, Tilt } from "@/components/ui";

const PAGE = 15;

export default function Orders() {
  const s = useStore();
  const ready = useLoaded(700);
  const [tab, setTab] = useState<OrderWhere>("waiting");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [fix, setFix] = useState<Order | null>(null);

  const by = useMemo(
    () => ({
      waiting: s.orders.filter((o) => o.where === "waiting"),
      moved: s.orders.filter((o) => o.where === "moved"),
      held: s.orders.filter((o) => o.where === "held"),
    }),
    [s.orders]
  );

  const list = useMemo(() => {
    const n = q.trim().toLowerCase().replace("#", "");
    return by[tab]
      .filter((o) => {
        if (!n) return true;
        const c = s.customer(o.customerId);
        return `${o.display} ${c?.name} ${c?.email}`.toLowerCase().includes(n);
      })
      .sort((a, b) => b.placedAt - a.placedAt);
  }, [by, tab, q, s]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const safe = Math.min(page, pages);
  const view = list.slice((safe - 1) * PAGE, safe * PAGE);
  const last = s.runs[0];
  const heldNow = [...by.held, ...by.waiting.filter((o) => o.heldReason)];

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">
            <Truck size={14} /> Orders
          </span>
          <h1>The store keeps selling while it moves</h1>
          <p className="lead">The script runs as often as needed and carries only what changed since the last run. Switch day then moves just the newest orders, not the whole history again.</p>
        </div>
      </section>

      <div className="stack">
        <div className="grid-2">
          <Tilt className="card topup">
            <div className="card-head">
              <div>
                <h2>Top-up from 1.0</h2>
                <p>{last ? `Last run: ${last.kind === "full" ? "full copy" : "top-up"} ${last.n}, ${ago(last.at, s.now)}, ${last.seconds} s` : "No run yet"}</p>
              </div>
            </div>
            <div className="topup-big">
              <div>
                <strong className="mono">{by.waiting.length}</strong>
                <span>{by.waiting.length === 1 ? "order placed on 1.0 since then" : "orders placed on 1.0 since then"}</span>
              </div>
              <button className="btn btn-primary" onClick={s.runTopup} disabled={s.toppingUp}>
                {s.toppingUp ? <Spinner /> : <Play size={17} />} {s.toppingUp ? "Moving orders" : "Run top-up"}
              </button>
            </div>
            <div className="live-toggle">
              <Switch on={s.live} onChange={() => s.setLive(!s.live)} label="1.0 checkout open" />
              <span>
                <strong>{s.live ? "1.0 checkout is open" : "1.0 checkout is paused"}</strong>
                <span className="muted small">{s.live ? "New orders arrive every few seconds, like a normal afternoon" : "Nothing new arrives until it reopens"}</span>
              </span>
            </div>
          </Tilt>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>
                  <History size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />
                  Runs
                </h2>
                <p>A full copy once, then short top-ups.</p>
              </div>
            </div>
            <div className="list">
              {s.runs.slice(0, 6).map((r) => (
                <div key={r.id} className="list-row">
                  <span className={`dot ${r.held ? "warn" : "ok"}`} />
                  <div className="grow">
                    <strong>
                      {r.kind === "full" ? "Full copy" : "Top-up"} {r.n}
                    </strong>
                    <span className="sub">
                      {when(r.at)}, {plural(r.moved, "order")} moved{r.held ? `, ${r.held} held` : ""}
                    </span>
                  </div>
                  <span className="badge">{r.seconds >= 60 ? `${Math.floor(r.seconds / 60)} min ${r.seconds % 60} s` : `${r.seconds} s`}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {heldNow.map((o) => (
          <div key={o.id} className="callout red">
            <CircleAlert size={18} />
            <span style={{ flex: 1 }}>
              <strong>Order #{o.display} {o.where === "held" ? "is held" : "will be held at the next top-up"}.</strong> {o.heldReason}
            </span>
            {o.where === "held" && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFix(o)} disabled={s.busy[o.id]}>
                {s.busy[o.id] ? <Spinner size={14} /> : null} Pick a replacement
              </button>
            )}
          </div>
        ))}

        <section className="card">
          <div className="toolbar">
            <div className="chips" role="tablist">
              {(
                [
                  ["waiting", "Waiting on 1.0"],
                  ["moved", "Moved to 2.17"],
                  ["held", "Held"],
                ] as [OrderWhere, string][]
              ).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={`chip ${tab === k ? "on" : ""}`} onClick={() => (setTab(k), setPage(1))}>
                  {l} <em>{by[k].length}</em>
                </button>
              ))}
            </div>
            <div className="search">
              <Search size={16} />
              <input className="input" placeholder="Order number or customer" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} aria-label="Search orders" />
            </div>
          </div>

          {!ready || s.toppingUp ? (
            <div className="table-wrap">
              <table className="tbl">
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td>
                        <Skel w={60} />
                      </td>
                      <td>
                        <Skel w={150} />
                      </td>
                      <td>
                        <Skel w={110} />
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
            <Empty
              icon={tab === "waiting" ? <PackageCheck size={22} /> : <SearchX size={22} />}
              title={tab === "waiting" && !q ? "Nothing waiting on 1.0" : tab === "held" && !q ? "No order is held" : "No orders match"}
              text={tab === "waiting" && !q ? "Every order placed so far is on 2.17. New ones show up here as the live store sells." : tab === "held" && !q ? "Every moved order matches its 1.0 copy." : "Try another order number or name."}
            />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Placed</th>
                    <th className="num">Total</th>
                    <th>Where</th>
                  </tr>
                </thead>
                <tbody>
                  {view.map((o) => {
                    const c = s.customer(o.customerId);
                    const p = s.product(o.lines[0].productId);
                    return (
                      <tr key={o.id} className={o.where === "held" ? "row-held" : ""}>
                        <td>
                          <strong className="mono">#{o.display}</strong>
                        </td>
                        <td>
                          <div className="prod">
                            <span>
                              <strong>{c?.name}</strong>
                              <span>{c?.email}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="prod">
                            <span className="prod-img">{p && <Photo id={p.photo} w={80} h={80} alt={p.title} />}</span>
                            <span>
                              <strong>{p?.title}</strong>
                              <span>{o.lines.length > 1 ? `and ${plural(o.lines.length - 1, "more item")}` : `${o.lines[0].qty} x`}</span>
                            </span>
                          </div>
                        </td>
                        <td className="small">
                          {when(o.placedAt)}
                          <br />
                          <span className="muted">{ago(o.placedAt, s.now)}</span>
                        </td>
                        <td className="num">
                          <strong>{money(o.total, o.currency)}</strong>
                        </td>
                        <td>
                          {o.where === "moved" ? <span className="badge ok">On 2.17</span> : o.where === "held" ? <span className="badge err">Held</span> : <span className="badge amber">Waiting</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={safe} pages={pages} onPage={setPage} total={list.length} label="orders" />
        </section>
      </div>

      <ReplaceModal order={fix} onClose={() => setFix(null)} />
    </div>
  );
}

function ReplaceModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const s = useStore();
  const [pick, setPick] = useState("");
  const [err, setErr] = useState("");
  if (!order) return null;
  const line = order.lines[0];
  const p = s.product(line.productId);
  const options = (p?.variants ?? []).filter((v) => v.id !== line.variantId);
  const go = async () => {
    if (!pick) return setErr("Choose the variant this line should point to");
    setErr("");
    onClose();
    await s.resolveHeld(order.id, pick);
    setPick("");
  };
  return (
    <Modal
      open
      title={`Order #${order.display}`}
      onClose={onClose}
      width={500}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={go}>
            Move the order
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <p className="small">{order.heldReason}</p>
        <div className="field">
          <label htmlFor="rv">Replacement variant on 2.17</label>
          <select id="rv" className="select" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a variant</option>
            {options.map((v) => (
              <option key={v.id} value={v.id}>
                {p?.title}, {v.title}
              </option>
            ))}
          </select>
          {err && <span className="err">{err}</span>}
          <span className="muted small">The order keeps its number, its total and what the buyer paid. Only the line points to a variant that still exists.</span>
        </div>
      </div>
    </Modal>
  );
}
