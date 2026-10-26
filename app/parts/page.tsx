"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight, Boxes, CircleAlert, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { useLoaded, useStore } from "@/lib/store";
import type { Part, PartHome, PartKind, PartStatus } from "@/lib/types";
import { HOME_LABEL, KIND_LABEL, STATUS_LABEL, STATUS_ORDER } from "@/lib/mock/parts";
import { Empty, Modal, Skel, Spinner, Tilt } from "@/components/ui";

type Sort = "status" | "effort" | "name";
const TONE: Record<PartStatus, string> = { todo: "err", mapped: "warn", building: "info", rebuilt: "amber", tested: "ok" };
const EFFORT = { S: "Small", M: "Medium", L: "Large" } as const;

export default function Parts() {
  const s = useStore();
  const ready = useLoaded(700);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | PartKind>("all");
  const [st, setSt] = useState<"all" | PartStatus>("all");
  const [sort, setSort] = useState<Sort>("status");
  const [edit, setEdit] = useState<Part | null>(null);
  const [del, setDel] = useState<Part | null>(null);

  const byStatus = useMemo(() => {
    const m: Record<PartStatus, number> = { todo: 0, mapped: 0, building: 0, rebuilt: 0, tested: 0 };
    s.parts.forEach((p) => m[p.status]++);
    return m;
  }, [s.parts]);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return s.parts
      .filter((p) => (kind === "all" || p.kind === kind) && (st === "all" || p.status === st) && (!n || `${p.name} ${p.v1} ${p.v2} ${p.note}`.toLowerCase().includes(n)))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "effort") return "LMS".indexOf(a.effort) - "LMS".indexOf(b.effort) || a.name.localeCompare(b.name);
        return Number(!!b.decision) - Number(!!a.decision) || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.name.localeCompare(b.name);
      });
  }, [s.parts, q, kind, st, sort]);

  const decision = s.parts.find((p) => p.decision && p.status !== "tested");

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">
            <Boxes size={14} /> Parts list
          </span>
          <h1>Every plugin and custom file, with its new home</h1>
          <p className="lead">1.0 plugins do not run on 2.x, and custom services have to live inside modules. Nothing moves until each piece below has a place in 2.17.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setEdit(blank())}>
              <Plus size={18} /> Add a part
            </button>
          </div>
        </div>
      </section>

      <div className="stack">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Where the list stands</h2>
              <p>{s.parts.length} pieces found in the 1.0 store.</p>
            </div>
          </div>
          <div className="segbar" aria-hidden="true">
            {STATUS_ORDER.map((k) => (byStatus[k] ? <i key={k} className={`seg seg-${k}`} style={{ flex: byStatus[k] }} /> : null))}
          </div>
          <div className="chips" style={{ marginTop: 12 }}>
            {STATUS_ORDER.map((k) => (
              <button key={k} className={`chip ${st === k ? "on" : ""}`} onClick={() => setSt(st === k ? "all" : k)}>
                <span className={`dot ${TONE[k]}`} style={{ background: `var(--seg-${k})` }} /> {STATUS_LABEL[k]} <em>{byStatus[k]}</em>
              </button>
            ))}
          </div>
          {decision && (
            <div className="callout" style={{ marginTop: 14 }}>
              <CircleAlert size={18} />
              <span>
                <strong>{decision.name}</strong> have no self-hosted 2.x home. Open balances are money buyers already paid, so they need a place before the switch, store credit or Medusa Cloud.
              </span>
            </div>
          )}
        </section>

        <section>
          <div className="toolbar">
            <div className="search">
              <Search size={16} />
              <input className="input" placeholder="Search name, file or note" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parts" />
            </div>
            <select className="select" style={{ width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value as "all" | PartKind)} aria-label="Kind">
              <option value="all">Every kind</option>
              {(Object.keys(KIND_LABEL) as PartKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <ArrowDownUp size={15} />
              <select className="select" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
                <option value="status">Least done first</option>
                <option value="effort">Largest first</option>
                <option value="name">Name A to Z</option>
              </select>
            </label>
          </div>

          {!ready ? (
            <div className="parts-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card part">
                  <Skel w={90} h={20} r={99} />
                  <Skel w="70%" h={18} />
                  <Skel w="100%" h={44} />
                  <Skel w="60%" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="card">
              <Empty icon={<SearchX size={22} />} title="No parts match" text="Try another word, or clear the kind and status filters." action={<button className="btn btn-ghost btn-sm" onClick={() => (setQ(""), setKind("all"), setSt("all"))}>Clear filters</button>} />
            </div>
          ) : (
            <div className="parts-grid stagger">
              {list.map((p) => (
                <PartCard key={p.id} p={p} onEdit={() => setEdit(p)} onDelete={() => setDel(p)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <EditModal part={edit} onClose={() => setEdit(null)} />
      <Modal
        open={!!del}
        title="Remove this part?"
        onClose={() => setDel(null)}
        width={440}
        foot={
          <>
            <button className="btn btn-ghost" onClick={() => setDel(null)}>
              Keep it
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (del) s.deletePart(del.id);
                setDel(null);
              }}
            >
              Remove
            </button>
          </>
        }
      >
        <p>
          <strong>{del?.name}</strong> leaves the parts list. Do this only when the piece is no longer used on 1.0, otherwise it would be missing after the switch.
        </p>
      </Modal>
    </div>
  );
}

function PartCard({ p, onEdit, onDelete }: { p: Part; onEdit: () => void; onDelete: () => void }) {
  const s = useStore();
  const i = STATUS_ORDER.indexOf(p.status);
  const next = STATUS_ORDER[i + 1];
  return (
    <Tilt className={`card part ${p.decision && p.status !== "tested" ? "part-decision" : ""}`}>
      <div className="part-top">
        <span className="badge">{KIND_LABEL[p.kind]}</span>
        <span className={`badge ${TONE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
        <span className="part-tools">
          <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${p.name}`}>
            <Pencil size={16} />
          </button>
          <button className="icon-btn danger" onClick={onDelete} aria-label={`Remove ${p.name}`}>
            <Trash2 size={16} />
          </button>
        </span>
      </div>
      <h3>{p.name}</h3>
      <div className="part-move">
        <code>{p.v1}</code>
        <ArrowRight size={15} />
        <span className={`home ${p.home === "none" ? "home-none" : ""}`}>{HOME_LABEL[p.home]}</span>
      </div>
      <p className="part-v2">{p.v2}</p>
      <p className="part-note">{p.note}</p>
      <div className="part-foot">
        <span className="muted small">{EFFORT[p.effort]} job</span>
        <select className="select select-sm" value={p.status} onChange={(e) => s.setPartStatus(p.id, e.target.value as PartStatus)} aria-label={`Status of ${p.name}`} disabled={s.busy[p.id]}>
          {STATUS_ORDER.map((k) => (
            <option key={k} value={k}>
              {STATUS_LABEL[k]}
            </option>
          ))}
        </select>
        {next && (
          <button className="btn btn-ghost btn-sm" onClick={() => s.setPartStatus(p.id, next)} disabled={s.busy[p.id]}>
            {s.busy[p.id] ? <Spinner size={14} /> : null} Mark {STATUS_LABEL[next].toLowerCase()}
          </button>
        )}
      </div>
    </Tilt>
  );
}

function blank(): Part {
  return { id: "", name: "", kind: "plugin", v1: "", home: "module", v2: "", effort: "M", status: "todo", note: "" };
}

function EditModal({ part, onClose }: { part: Part | null; onClose: () => void }) {
  if (!part) return null;
  return <EditForm key={part.id || "new"} part={part} onClose={onClose} />;
}

function EditForm({ part, onClose }: { part: Part; onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState<Part>(part);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const isNew = !part.id;
  const set = <K extends keyof Part>(k: K, v: Part[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = "Give it a name of at least 3 letters";
    if (!f.v1.trim()) e.v1 = "Where it lives on 1.0, a package name or a file path";
    if (f.home !== "none" && !f.v2.trim()) e.v2 = "Describe its place in 2.17";
    setErrs(e);
    if (Object.keys(e).length) return;
    await s.savePart({ ...f, id: f.id || `pt_${Date.now().toString(36)}`, name: f.name.trim(), v1: f.v1.trim(), v2: f.v2.trim(), note: f.note.trim() });
    onClose();
  };

  return (
    <Modal
      open
      title={isNew ? "Add a part" : `Edit ${part.name}`}
      onClose={onClose}
      width={620}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={s.busy["part-save"]}>
            {s.busy["part-save"] ? <Spinner size={14} /> : null} {isNew ? "Add to the list" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field wide">
          <label htmlFor="pn">Name</label>
          <input id="pn" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Reviews on product pages" />
          {errs.name && <span className="err">{errs.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="pk">Kind</label>
          <select id="pk" className="select" value={f.kind} onChange={(e) => set("kind", e.target.value as PartKind)}>
            {(Object.keys(KIND_LABEL) as PartKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pe">Size of the job</label>
          <select id="pe" className="select" value={f.effort} onChange={(e) => set("effort", e.target.value as Part["effort"])}>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
        </div>
        <div className="field wide">
          <label htmlFor="p1">On 1.0</label>
          <input id="p1" className="input" value={f.v1} onChange={(e) => set("v1", e.target.value)} placeholder="src/services/reviews.ts" />
          {errs.v1 && <span className="err">{errs.v1}</span>}
        </div>
        <div className="field">
          <label htmlFor="ph">Home in 2.17</label>
          <select id="ph" className="select" value={f.home} onChange={(e) => set("home", e.target.value as PartHome)}>
            {(Object.keys(HOME_LABEL) as PartHome[]).map((k) => (
              <option key={k} value={k}>
                {HOME_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ps">Status</label>
          <select id="ps" className="select" value={f.status} onChange={(e) => set("status", e.target.value as PartStatus)}>
            {STATUS_ORDER.map((k) => (
              <option key={k} value={k}>
                {STATUS_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="field wide">
          <label htmlFor="p2">What it becomes</label>
          <input id="p2" className="input" value={f.v2} onChange={(e) => set("v2", e.target.value)} placeholder="Reviews module linked to product" />
          {errs.v2 && <span className="err">{errs.v2}</span>}
        </div>
        <div className="field wide">
          <label htmlFor="pnote">Note</label>
          <textarea id="pnote" className="textarea" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Anything that changes on the way" />
        </div>
      </div>
    </Modal>
  );
}
