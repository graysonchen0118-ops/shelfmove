"use client";

import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Boxes, CircleAlert, Gift, PackageCheck, ShieldCheck, Truck, Users } from "lucide-react";
import { useLoaded, useStore } from "@/lib/store";
import { ago, money, plural, raw } from "@/lib/format";
import { Photo, Skel, Tilt } from "@/components/ui";
import { useGates } from "@/components/gates";
import { TRAP_PRODUCT } from "@/lib/mock/catalog";
import { WIDE } from "@/lib/photos";

export default function Overview() {
  const s = useStore();
  const ready = useLoaded(700);
  const gates = useGates();

  const open = s.prices.filter((p) => p.status === "issue");
  const tested = s.parts.filter((p) => p.status === "tested").length;
  const rebuiltOrBetter = s.parts.filter((p) => p.status === "rebuilt" || p.status === "tested").length;
  const withLogin = s.customers.filter((c) => c.account === "login").length;
  const moved = s.orders.filter((o) => o.where === "moved").length;
  const waiting = s.orders.filter((o) => o.where !== "moved");
  const held = s.orders.filter((o) => o.heldReason);
  const decisions = s.parts.filter((p) => p.decision && p.status !== "tested");

  const trap = s.product(TRAP_PRODUCT);
  const trapV = trap?.variants[0];
  const stored = trapV?.v1.usd ?? 2500;

  const steps = [
    { n: 1, title: "Read the 1.0 store", text: `${s.parts.length} plugins and custom files listed, each with a home`, state: "Done", tone: "ok" },
    { n: 2, title: "2.17 built alongside", text: "Runs on a copy of the data, the live store untouched", state: "Done", tone: "ok" },
    { n: 3, title: "Move and check the data", text: open.length ? `${plural(open.length, "price")} still ${open.length === 1 ? "needs" : "need"} a decision` : "Every price matches 1.0", state: open.length ? "In progress" : "Done", tone: open.length ? "warn" : "ok", hard: true },
    { n: 4, title: "Rebuild the custom work", text: `${rebuiltOrBetter} of ${s.parts.length} rebuilt, ${tested} tested`, state: tested === s.parts.length ? "Done" : "In progress", tone: tested === s.parts.length ? "ok" : "info" },
    { n: 5, title: "Top up, then switch", text: `${gates.passed} of ${gates.total} switch gates passed`, state: gates.passed === gates.total ? "Ready" : "Not yet", tone: gates.passed === gates.total ? "ok" : "" },
  ];

  return (
    <div className="page">
      <section className="hero hero-tall">
        <div className="hero-inner">
          <span className="eyebrow">
            <PackageCheck size={14} /> Store move, 1.0 to 2.17
          </span>
          <h1>Hearth &amp; Grain keeps selling while it moves</h1>
          <p className="lead">2.17 is built beside the live store on a copy of the data. Every price, customer and order is checked against 1.0 before a single buyer lands on the new store.</p>
          <div className="hero-actions">
            <Link href="/prices" className="btn btn-primary">
              <BadgeDollarSign size={18} /> Open the price check
            </Link>
            <Link href="/switch" className="btn btn-ghost">
              Switch day <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="stack">
        <div className="kpis kpis-6 stagger">
          <Kpi ready={ready} icon={<BadgeDollarSign size={17} />} label="Prices checked" value={s.prices.length.toLocaleString("en-US")} sub={open.length ? `${open.length} open, the rest match 1.0` : "All match 1.0"} tone={open.length ? "amber" : "green"} bar={(s.prices.length - open.length) / s.prices.length} />
          <Kpi ready={ready} icon={<Boxes size={17} />} label="Parts tested" value={`${tested}/${s.parts.length}`} sub={`${rebuiltOrBetter} rebuilt on 2.17`} bar={tested / s.parts.length} />
          <Kpi ready={ready} icon={<Users size={17} />} label="Customers carried" value={String(s.customers.length)} sub={`${withLogin} with a login, ${s.customers.length - withLogin} guests`} tone="green" />
          <Kpi ready={ready} icon={<PackageCheck size={17} />} label="Orders on 2.17" value={moved.toLocaleString("en-US")} sub="Same order numbers as 1.0" tone="green" />
          <Kpi ready={ready} icon={<Truck size={17} />} label="Waiting on 1.0" value={String(waiting.length)} sub={s.live ? "New orders keep arriving" : "Checkout paused"} tone="amber" />
          <Kpi ready={ready} icon={<ShieldCheck size={17} />} label="Switch gates" value={`${gates.passed}/${gates.total}`} sub="Needed before switch day" bar={gates.passed / gates.total} />
        </div>

        <Tilt className="card store-card">
          <div className="store-img">
            <Photo id={WIDE.shop} w={760} h={460} alt="Hearth & Grain shop shelves with bowls, plates and teapots" />
          </div>
          <div className="store-body">
            <span className="badge amber">The store on the move</span>
            <h2>Hearth &amp; Grain, home and kitchen goods</h2>
            <p>Sells to buyers in Vietnam, the United States and Europe, in VND, USD and EUR. The 1.0 store stays open the whole time, and buyers only meet 2.17 once every gate on switch day is green.</p>
            <div className="store-facts">
              <span>
                <strong>{s.products.length}</strong> products
              </span>
              <span>
                <strong>{s.products.reduce((n, p) => n + p.variants.length, 0)}</strong> variants
              </span>
              <span>
                <strong>3</strong> currencies
              </span>
              <span>
                <strong>{s.orders.length}</strong> orders
              </span>
            </div>
          </div>
        </Tilt>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>The move in five steps</h2>
              <p>Step 3 decides the project. It is where a price can grow a hundred times without one error on screen.</p>
            </div>
          </div>
          <div className="steps stagger">
            {steps.map((st) => (
              <div key={st.n} className={`step ${st.hard ? "hard" : ""}`}>
                <span className="step-n">{st.hard ? `STEP ${st.n}, THE ONE THAT DECIDES IT` : `STEP ${st.n}`}</span>
                <strong>{st.title}</strong>
                <p>{st.text}</p>
                <span className={`badge ${st.tone}`} style={{ alignSelf: "flex-start" }}>
                  {st.state}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid-2">
          <Tilt className="card">
            <div className="card-head">
              <div>
                <h2>The price trap, caught</h2>
                <p>1.0 stores cents. 2.17 stores whole units.</p>
              </div>
              <div className="right">
                <Link href="/prices" className="btn btn-ghost btn-sm">
                  Price check <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            {trap && trapV ? (
              <div className="trap">
                <div className="trap-img">
                  <Photo id={trap.photo} w={360} h={360} alt={trap.title} />
                </div>
                <div className="trap-rows">
                  <div>
                    <span className="muted small">{trap.title}, as 1.0 stores it</span>
                    <strong>
                      <span className="rawnum">{raw(stored)}</span>
                    </strong>
                  </div>
                  <div>
                    <span className="muted small">Copied into 2.17 as it is</span>
                    <strong className="wrong">{money(stored, "usd")}</strong>
                  </div>
                  <div>
                    <span className="muted small">Converted by the script, then checked</span>
                    <strong className="right-ok">{money(stored / 100, "usd")}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </Tilt>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Needs a decision</h2>
                <p>Nothing here blocks the build, all of it blocks the switch.</p>
              </div>
            </div>
            <div className="list">
              {!ready ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="list-row">
                    <Skel h={36} w={36} r={10} />
                    <div className="grow">
                      <Skel w="70%" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {decisions.map((p) => (
                    <Link key={p.id} href="/parts" className="list-row">
                      <span className="kpi-ic amber" style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--support-soft)", color: "var(--support-2)" }}>
                        <Gift size={17} />
                      </span>
                      <div className="grow">
                        <strong>{p.name}: no self-hosted 2.x home</strong>
                        <span className="sub">{p.note}</span>
                      </div>
                      <ArrowRight size={16} className="muted" />
                    </Link>
                  ))}
                  {open.slice(0, 3).map((r) => {
                    const p = s.product(r.productId);
                    return (
                      <Link key={r.key} href="/prices" className="list-row">
                        <span style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", flex: "none" }}>{p && <Photo id={p.photo} w={68} h={68} alt={p.title} />}</span>
                        <div className="grow">
                          <strong>
                            {p?.title}, {r.currency.toUpperCase()}
                          </strong>
                          <span className="sub">{r.issue === "sale" ? "Sale price in a 1.0 price list" : r.issue === "missing" ? "No price on 1.0" : "Price for one region only"}</span>
                        </div>
                        <ArrowRight size={16} className="muted" />
                      </Link>
                    );
                  })}
                  {open.length > 3 && <span className="muted small" style={{ paddingTop: 10 }}>and {plural(open.length - 3, "more price")} on the price check</span>}
                  {held.length > 0 && (
                    <Link href="/orders" className="list-row">
                      <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--err-soft)", color: "var(--err)", flex: "none" }}>
                        <CircleAlert size={17} />
                      </span>
                      <div className="grow">
                        <strong>Order #{held[0].display} waits for a replacement variant</strong>
                        <span className="sub">Its variant was deleted on 1.0 after the order was placed</span>
                      </div>
                      <ArrowRight size={16} className="muted" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <div className="grid-2">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Arriving on 1.0 right now</h2>
                <p>Placed since the last run, moved by the next top-up.</p>
              </div>
              <div className="right">
                <Link href="/orders" className="btn btn-ghost btn-sm">
                  Orders <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="list">
              {waiting
                .slice()
                .sort((a, b) => b.placedAt - a.placedAt)
                .slice(0, 6)
                .map((o) => {
                  const c = s.customer(o.customerId);
                  const p = s.product(o.lines[0].productId);
                  return (
                    <div key={o.id} className="list-row live-row">
                      <span style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", flex: "none" }}>{p && <Photo id={p.photo} w={76} h={76} alt={p.title} />}</span>
                      <div className="grow">
                        <strong>
                          #{o.display} {c?.name}
                        </strong>
                        <span className="sub">
                          {p?.title}
                          {o.lines.length > 1 ? ` and ${plural(o.lines.length - 1, "more item")}` : ""}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong className="mono">{money(o.total, o.currency)}</strong>
                        <span className="sub">{ago(o.placedAt, s.now)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Activity</h2>
                <p>What changed on the move, newest first.</p>
              </div>
            </div>
            <div className="list">
              {s.activity.slice(0, 7).map((a) => (
                <div key={a.id} className="list-row">
                  <span className={`dot ${a.tone}`} />
                  <div className="grow">
                    <strong style={{ fontWeight: 500 }}>{a.text}</strong>
                    <span className="sub">{ago(a.at, s.now)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ ready, icon, label, value, sub, tone, bar }: { ready: boolean; icon: React.ReactNode; label: string; value: string; sub: string; tone?: "amber" | "green" | "red"; bar?: number }) {
  return (
    <Tilt className="card kpi">
      <span className="kpi-top">
        <span className={`kpi-ic ${tone ?? ""}`}>{icon}</span>
        {label}
      </span>
      {ready ? <strong>{value}</strong> : <Skel h={30} w={90} />}
      <span className="sub">{ready ? sub : <Skel w="80%" h={12} />}</span>
      {bar !== undefined && (
        <div className={`bar ${tone === "green" ? "green" : tone === "amber" ? "amber" : ""}`}>
          <i style={{ width: `${Math.round((ready ? bar : 0) * 100)}%` }} />
        </div>
      )}
    </Tilt>
  );
}
