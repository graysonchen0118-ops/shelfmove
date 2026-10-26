"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeftRight, BadgeDollarSign, Boxes, LayoutDashboard, Menu, PackageCheck, Truck, Users, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { view, type View } from "@/lib/bus";
import { Toasts } from "./ui";
import { useGates } from "./gates";

const Backdrop = dynamic(() => import("./three/Backdrop"), {
  ssr: false,
  loading: () => <div className="backdrop-ph" aria-hidden="true" />,
});

const NAV: { href: string; label: string; v: View; icon: React.ReactNode }[] = [
  { href: "/", label: "Overview", v: "overview", icon: <LayoutDashboard size={19} /> },
  { href: "/parts", label: "Parts list", v: "parts", icon: <Boxes size={19} /> },
  { href: "/prices", label: "Price check", v: "prices", icon: <BadgeDollarSign size={19} /> },
  { href: "/customers", label: "Customers", v: "customers", icon: <Users size={19} /> },
  { href: "/orders", label: "Orders", v: "orders", icon: <Truck size={19} /> },
  { href: "/switch", label: "Switch day", v: "switch", icon: <ArrowLeftRight size={19} /> },
];

const TITLES: Record<View, string> = {
  overview: "Overview",
  parts: "Parts list",
  prices: "Price check",
  customers: "Customers",
  orders: "Orders",
  switch: "Switch day",
};

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { parts, prices, orders, live } = useStore();
  const gates = useGates();
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo<View>(() => NAV.find((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)))?.v ?? "overview", [path]);

  useEffect(() => {
    view(current);
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [current]);

  // the hero text drifts slower than the page, a layer of its own
  useEffect(() => {
    const on = () => document.documentElement.style.setProperty("--scroll", String(Math.round(window.scrollY)));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const counts: Partial<Record<View, number>> = {
    parts: parts.filter((p) => p.status !== "tested").length,
    prices: prices.filter((p) => p.status === "issue").length,
    orders: orders.filter((o) => o.where !== "moved").length,
  };

  return (
    <div className="app">
      <Backdrop />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main">
        <div className="brand">
          <span className="brand-mark">
            <PackageCheck size={20} strokeWidth={2.4} />
          </span>
          <span>
            <strong>Shelfmove</strong>
            <em>Hearth &amp; Grain store</em>
          </span>
          <button className="icon-btn only-mobile" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="move-tag">
          <span className="ver ver-old">1.0</span>
          <span className="move-line" aria-hidden="true" />
          <span className="ver ver-new">2.17</span>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`nav-item ${current === n.v ? "active" : ""}`} aria-current={current === n.v ? "page" : undefined}>
              {n.icon}
              <span>{n.label}</span>
              {n.v === "switch" ? (
                <em className={`nav-n ${gates.passed === gates.total ? "nav-ok" : ""}`}>
                  {gates.passed}/{gates.total}
                </em>
              ) : counts[n.v] ? (
                <em className={`nav-n ${n.v === "prices" ? "nav-warn" : ""}`}>{counts[n.v]}</em>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className={`live-card ${live ? "" : "paused"}`}>
            <span className="live-dot" />
            <div>
              <strong>{live ? "1.0 is live and selling" : "1.0 checkout paused"}</strong>
              <span>2.17 runs beside it on a copy of the data</span>
            </div>
          </div>
        </div>
      </aside>
      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <div className="main" ref={mainRef}>
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="top-title">
            <span className="crumb">Hearth &amp; Grain</span>
            <strong>{TITLES[current]}</strong>
          </div>
          <div className="top-pills">
            <span className={`pill pill-live ${live ? "" : "off"}`}>
              <span className="live-dot" /> 1.0 live
            </span>
            <span className="pill pill-stage">2.17 staging</span>
            <Link href="/orders" className="pill pill-wait" title="Orders placed on 1.0 since the last run">
              <Truck size={14} /> {counts.orders ?? 0} waiting
            </Link>
          </div>
        </header>
        <div className="content">{children}</div>
        <footer className="foot">
          <span>
            <strong>Shelfmove</strong> for Hearth &amp; Grain, 1.0 to 2.17
          </span>
          <span>© 2026 Shelfmove. Product photos from Unsplash.</span>
        </footer>
      </div>
      <Toasts />
    </div>
  );
}
