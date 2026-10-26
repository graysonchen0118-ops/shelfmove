"use client";

import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Check, CircleDashed, Lock, PauseCircle, Play, RotateCcw, ShoppingCart, Signpost, Truck, Undo2 } from "lucide-react";
import { useStore, type RehearsalStep } from "@/lib/store";
import { money, when } from "@/lib/format";
import { useGates } from "@/components/gates";
import { Photo, Spinner, Switch, Tilt } from "@/components/ui";
import { TRAP_PRODUCT } from "@/lib/mock/catalog";

const STEPS: { k: RehearsalStep; title: string; text: string; icon: React.ReactNode }[] = [
  { k: "pause", title: "Pause checkout on 1.0", text: "Browsing stays open, only paying waits", icon: <PauseCircle size={17} /> },
  { k: "topup", title: "Final top-up", text: "Only the orders placed since the last run", icon: <Truck size={17} /> },
  { k: "point", title: "Point the storefront at 2.17", text: "Same address, new store behind it", icon: <Signpost size={17} /> },
  { k: "reopen", title: "Reopen checkout on 2.17", text: "First real order watched end to end", icon: <ShoppingCart size={17} /> },
];
const ORDER: RehearsalStep[] = ["idle", "pause", "topup", "point", "reopen", "done"];

export default function SwitchDay() {
  const s = useStore();
  const gates = useGates();
  const r = s.rehearsal;
  const running = r.step !== "idle" && r.step !== "done";
  const at = ORDER.indexOf(r.step);

  const p = s.product(TRAP_PRODUCT) ?? s.products[0];
  const v = p.variants[0];
  const sub = (v.v1.usd ?? 0) / 100;
  const ship = 6.5;
  const tax = Math.round(sub * 0.08 * 100) / 100;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">
            <ArrowLeftRight size={14} /> Switch day
          </span>
          <h1>Rehearsed on a copy until it is boring</h1>
          <p className="lead">Final top-up, storefront pointed at 2.17, checkout reopened. Each rehearsal runs on a copy, so the live store never notices, and the closed window shrinks every time.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={s.rehearse} disabled={running}>
              {running ? <Spinner /> : <Play size={17} />} {running ? "Rehearsing" : r.runs.length ? "Rehearse again" : "Rehearse on a copy"}
            </button>
            <span className={`pill ${gates.passed === gates.total ? "pill-stage" : ""}`}>
              {gates.passed} of {gates.total} gates passed
            </span>
          </div>
        </div>
      </section>

      <div className="stack">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Before the real switch</h2>
              <p>Every gate has to be green. Each one links to the place that turns it green.</p>
            </div>
          </div>
          <div className="grid-3 stagger">
            {gates.list.map((g) => (
              <Link key={g.id} href={g.href} className={`gate ${g.ok ? "ok" : ""}`}>
                <span className="gate-ic">{g.ok ? <Check size={18} /> : <CircleDashed size={18} />}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>{g.title}</strong>
                  <span>{g.detail}</span>
                  <span className={`bar ${g.ok ? "green" : "amber"}`}>
                    <i style={{ width: `${Math.round(g.progress * 100)}%` }} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid-2">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Rehearsal</h2>
                <p>{r.runs.length ? `Last one ${when(r.runs[0].at)}, checkout closed ${fmtSec(r.runs[0].closedSeconds)}` : "Not rehearsed yet"}</p>
              </div>
            </div>
            <div className="timeline">
              {STEPS.map((st) => {
                const i = ORDER.indexOf(st.k);
                const state = r.step === "done" || at > i ? "done" : at === i ? "now" : "";
                return (
                  <div key={st.k} className={`tl ${state}`}>
                    <span className="tl-ic">{state === "done" ? <Check size={16} /> : state === "now" ? <Spinner size={14} /> : st.icon}</span>
                    <span>
                      <strong>{st.title}</strong>
                      <span>{st.text}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            {r.step === "done" && (
              <div className="callout blue" style={{ marginTop: 14 }}>
                <Lock size={18} />
                <span>
                  Checkout was closed for <strong>{fmtSec(r.closedSeconds)}</strong> in this rehearsal, with {r.movedAtSwitch} {r.movedAtSwitch === 1 ? "order" : "orders"} in the final top-up. The live store was never touched.
                </span>
              </div>
            )}
          </section>

          <div className="stack">
            <Tilt className="card">
              <div className="card-head">
                <div>
                  <h2>Same cart, both stores</h2>
                  <p>One test order on each, totals compared line by line.</p>
                </div>
              </div>
              <div className="cart-cmp">
                <div className="cart-item">
                  <span className="prod-img" style={{ width: 52, height: 52 }}>
                    <Photo id={p.photo} w={104} h={104} alt={p.title} />
                  </span>
                  <span>
                    <strong>{p.title}</strong>
                    <span className="muted small">{v.title}, shipped to Austin, Texas</span>
                  </span>
                </div>
                <table className="tbl cmp">
                  <thead>
                    <tr>
                      <th />
                      <th className="num">1.0</th>
                      <th className="num">2.17</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Item", sub],
                      ["Shipping", ship],
                      ["Tax", tax],
                      ["Total", sub + ship + tax],
                    ].map(([k, n]) => (
                      <tr key={k as string}>
                        <td>{k}</td>
                        <td className="num">{money(n as number, "usd")}</td>
                        <td className="num">{s.testOrder === "passed" ? <span className="right-ok">{money(n as number, "usd")}</span> : <span className="muted">{s.testOrder === "running" ? "..." : "not run"}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={s.placeTestOrder} disabled={s.testOrder === "running"}>
                {s.testOrder === "running" ? <Spinner /> : s.testOrder === "passed" ? <RotateCcw size={16} /> : <ShoppingCart size={16} />} {s.testOrder === "passed" ? "Place it again" : "Place the test order"}
              </button>
            </Tilt>

            <section className="card">
              <div className="card-head">
                <div>
                  <h2>
                    <Undo2 size={16} style={{ display: "inline", verticalAlign: -2, marginRight: 6 }} />A way back
                  </h2>
                  <p>If something unexpected shows up on the first day, the old store can take traffic again.</p>
                </div>
                <div className="right">
                  <Switch on={s.wayBack} onChange={() => s.setWayBack(!s.wayBack)} label="Keep a way back" />
                </div>
              </div>
              <p className="small" style={{ color: "var(--ink-2)" }}>
                The 1.0 database snapshot is kept untouched and the old store stays deployed, so pointing the address back takes one change, not a rebuild. Orders taken on 2.17 in the meantime are listed for a manual carry back.
              </p>
            </section>
          </div>
        </div>

        {r.runs.length > 1 && (
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Every rehearsal</h2>
                <p>The closed window from each run.</p>
              </div>
            </div>
            <div className="list">
              {r.runs.map((x, i) => (
                <div key={i} className="list-row">
                  <span className="dot ok" />
                  <div className="grow">
                    <strong>Rehearsal {r.runs.length - i}</strong>
                    <span className="sub">{when(x.at)}</span>
                  </div>
                  <span className="badge">{fmtSec(x.closedSeconds)} closed</span>
                  <span className="badge info">{x.moved} in final top-up</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link href="/orders" className="callout blue" style={{ alignItems: "center" }}>
          <Truck size={18} />
          <span style={{ flex: 1 }}>The fewer orders waiting on 1.0, the shorter the closed window. A top-up just before switch day keeps the final one small.</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function fmtSec(n: number) {
  const m = Math.floor(n / 60);
  const s = n % 60;
  return m ? `${m} min ${s} s` : `${s} s`;
}
