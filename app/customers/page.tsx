"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, KeyRound, LogIn, Search, SearchX, ShieldCheck, ShoppingBag, UserRound, Users } from "lucide-react";
import { useLoaded, useStore } from "@/lib/store";
import { COUNTRY } from "@/lib/mock/customers";
import { day, money, plural } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { Avatar, Drawer, Empty, Pager, Photo, Skel, Spinner, Tilt } from "@/components/ui";

const PAGE = 14;
type F = "all" | "login" | "verified" | "guest";
type Sort = "name" | "orders" | "spent";

export default function Customers() {
  const s = useStore();
  const ready = useLoaded(700);
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  const [sort, setSort] = useState<Sort>("orders");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const m = new Map<string, { n: number; spent: number }>();
    for (const o of s.orders) {
      const x = m.get(o.customerId) ?? { n: 0, spent: 0 };
      x.n++;
      x.spent += o.currency === "usd" ? o.total : o.currency === "eur" ? o.total * 1.08 : o.total / 25400;
      m.set(o.customerId, x);
    }
    return m;
  }, [s.orders]);

  const counts = {
    all: s.customers.length,
    login: s.customers.filter((c) => c.account === "login").length,
    verified: s.customers.filter((c) => c.login === "verified").length,
    guest: s.customers.filter((c) => c.account === "guest").length,
  };

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return s.customers
      .filter((c) => {
        if (f === "login" && c.account !== "login") return false;
        if (f === "verified" && c.login !== "verified") return false;
        if (f === "guest" && c.account !== "guest") return false;
        return !n || `${c.name} ${c.email} ${COUNTRY[c.country]}`.toLowerCase().includes(n);
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        const A = stats.get(a.id) ?? { n: 0, spent: 0 };
        const B = stats.get(b.id) ?? { n: 0, spent: 0 };
        return sort === "orders" ? B.n - A.n || B.spent - A.spent : B.spent - A.spent;
      });
  }, [s.customers, q, f, sort, stats]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const safe = Math.min(page, pages);
  const view = list.slice((safe - 1) * PAGE, safe * PAGE);
  const sample = s.customers.filter((c) => c.photo && c.account === "login").slice(0, 8);
  const current = openId ? s.customer(openId) : undefined;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">
            <Users size={14} /> Customers
          </span>
          <h1>Regular buyers come back to the same account</h1>
          <p className="lead">Customers move with their order history and their logins. Real old accounts are tested here before switch day, with the password they already use.</p>
        </div>
      </section>

      <div className="stack">
        <div className="kpis stagger">
          <Tilt className="card kpi">
            <span className="kpi-top">
              <span className="kpi-ic">
                <Users size={17} />
              </span>
              Customers on 2.17
            </span>
            <strong>{counts.all}</strong>
            <span className="sub">Each with their order history</span>
          </Tilt>
          <Tilt className="card kpi">
            <span className="kpi-top">
              <span className="kpi-ic green">
                <KeyRound size={17} />
              </span>
              Logins carried
            </span>
            <strong>{counts.login}</strong>
            <span className="sub">Old password works, no reset email</span>
          </Tilt>
          <Tilt className="card kpi">
            <span className="kpi-top">
              <span className="kpi-ic">
                <ShieldCheck size={17} />
              </span>
              Tested on 2.17
            </span>
            <strong>
              {Math.min(counts.verified, 8)}/8
            </strong>
            <span className="sub">Real accounts signed in</span>
            <div className="bar">
              <i style={{ width: `${Math.min(100, (counts.verified / 8) * 100)}%` }} />
            </div>
          </Tilt>
          <Tilt className="card kpi">
            <span className="kpi-top">
              <span className="kpi-ic amber">
                <UserRound size={17} />
              </span>
              Guest checkouts
            </span>
            <strong>{counts.guest}</strong>
            <span className="sub">Orders kept, no login to carry</span>
          </Tilt>
        </div>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Test with a real old account</h2>
              <p>Each test signs in on 2.17 with the password the customer already uses on 1.0.</p>
            </div>
          </div>
          <div className="sample-grid">
            {sample.map((c) => (
              <div key={c.id} className={`sample ${c.login === "verified" ? "ok" : ""}`}>
                {c.photo && <Avatar id={c.photo} name={c.name} size={42} />}
                <div className="grow">
                  <strong>{c.name}</strong>
                  <span>{c.email}</span>
                </div>
                {c.login === "verified" ? (
                  <span className="badge ok">Signed in</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => s.testLogin(c.id)} disabled={s.busy[c.id]}>
                    {s.busy[c.id] ? <Spinner size={14} /> : <LogIn size={15} />} Test
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Every customer</h2>
              <p>{plural(list.length, "customer")} in this view.</p>
            </div>
          </div>
          <div className="toolbar">
            <div className="search">
              <Search size={16} />
              <input className="input" placeholder="Search name, email or country" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} aria-label="Search customers" />
            </div>
            <div className="chips">
              {(
                [
                  ["all", "All"],
                  ["login", "With a login"],
                  ["verified", "Tested"],
                  ["guest", "Guests"],
                ] as [F, string][]
              ).map(([k, l]) => (
                <button key={k} className={`chip ${f === k ? "on" : ""}`} onClick={() => (setF(k), setPage(1))}>
                  {l} <em>{counts[k]}</em>
                </button>
              ))}
            </div>
            <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <ArrowDownUp size={15} />
              <select className="select" style={{ width: "auto", minHeight: 36 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
                <option value="orders">Most orders</option>
                <option value="spent">Highest spend</option>
                <option value="name">Name A to Z</option>
              </select>
            </label>
          </div>

          {!ready ? (
            <div className="table-wrap">
              <table className="tbl">
                <tbody>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      <td>
                        <Skel w={180} />
                      </td>
                      <td>
                        <Skel w={90} />
                      </td>
                      <td>
                        <Skel w={40} />
                      </td>
                      <td>
                        <Skel w={110} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view.length === 0 ? (
            <Empty icon={<SearchX size={22} />} title="No customers match" text="Nobody fits this search. Clear it to see all customers again." action={<button className="btn btn-ghost btn-sm" onClick={() => (setQ(""), setF("all"))}>Clear filters</button>} />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Country</th>
                    <th className="num">Orders</th>
                    <th>Account on 2.17</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {view.map((c) => {
                    const st = stats.get(c.id) ?? { n: 0, spent: 0 };
                    return (
                      <tr key={c.id}>
                        <td>
                          <button className="cust-link" onClick={() => setOpenId(c.id)}>
                            <strong>{c.name}</strong>
                            <span>{c.email}</span>
                          </button>
                        </td>
                        <td>
                          {COUNTRY[c.country]} <span className="muted small">{c.currency.toUpperCase()}</span>
                        </td>
                        <td className="num">{st.n}</td>
                        <td>
                          <AccountBadge c={c} />
                        </td>
                        <td className="num">
                          <button className="btn btn-ghost btn-sm" onClick={() => s.testLogin(c.id)} disabled={s.busy[c.id] || c.login === "verified"}>
                            {s.busy[c.id] ? <Spinner size={14} /> : <LogIn size={15} />} {c.login === "verified" ? "Tested" : "Test login"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={safe} pages={pages} onPage={setPage} total={list.length} label="customers" />
        </section>
      </div>

      <Drawer open={!!current} title={current?.name ?? "Customer"} onClose={() => setOpenId(null)}>
        {current && <CustomerDetail c={current} />}
      </Drawer>
    </div>
  );
}

function AccountBadge({ c }: { c: Customer }) {
  if (c.account === "guest") return <span className="badge">Guest checkout</span>;
  if (c.login === "verified") return <span className="badge ok">Signed in on 2.17</span>;
  return <span className="badge info">Login carried</span>;
}

function CustomerDetail({ c }: { c: Customer }) {
  const s = useStore();
  const orders = s.orders.filter((o) => o.customerId === c.id).sort((a, b) => b.placedAt - a.placedAt);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="prod">
        {c.photo && <Avatar id={c.photo} name={c.name} size={56} />}
        <span>
          <strong style={{ fontSize: 16 }}>{c.name}</strong>
          <span>{c.email}</span>
          <span>
            {COUNTRY[c.country]}, buying since {c.since}
          </span>
        </span>
      </div>
      <div className={`callout ${c.account === "guest" ? "" : "blue"}`}>
        <KeyRound size={18} />
        <span>
          {c.account === "guest"
            ? "Checked out as a guest on 1.0. The orders come across, there is no password to carry."
            : c.login === "verified"
              ? "Signed in on 2.17 with the password from 1.0. Nothing to reset."
              : "Login carried from 1.0. Not tested on 2.17 yet."}
        </span>
      </div>
      {c.account === "login" && c.login !== "verified" && (
        <button className="btn btn-primary" onClick={() => s.testLogin(c.id)} disabled={s.busy[c.id]}>
          {s.busy[c.id] ? <Spinner /> : <LogIn size={17} />} Test this login on 2.17
        </button>
      )}
      <div>
        <h3 style={{ fontSize: 14.5, marginBottom: 8 }}>
          <ShoppingBag size={15} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />
          Orders, same numbers on both stores
        </h3>
        {orders.length === 0 ? (
          <p className="muted small">No orders yet.</p>
        ) : (
          <div className="list">
            {orders.slice(0, 8).map((o) => {
              const p = s.product(o.lines[0].productId);
              return (
                <div key={o.id} className="list-row">
                  <span style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", flex: "none" }}>{p && <Photo id={p.photo} w={76} h={76} alt={p.title} />}</span>
                  <div className="grow">
                    <strong>#{o.display}</strong>
                    <span className="sub">
                      {day(o.placedAt)}, {p?.title}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong className="mono">{money(o.total, o.currency)}</strong>
                    <span className="sub">{o.where === "moved" ? "On 2.17" : o.where === "held" ? "Held" : "Waiting on 1.0"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
