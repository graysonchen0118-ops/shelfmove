// The page talks to the 3D scene through window events, so the scene never re-renders React.
export type Pulse = "check" | "fix" | "topup" | "order" | "part" | "login" | "switch" | "error";
export type View = "overview" | "parts" | "prices" | "customers" | "orders" | "switch";

export function pulse(kind: Pulse, n = 1) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("shelf:pulse", { detail: { kind, n } }));
}

export function view(v: View) {
  if (typeof window === "undefined") return;
  (window as unknown as { __shelfView?: View }).__shelfView = v;
  window.dispatchEvent(new CustomEvent("shelf:view", { detail: v }));
}

export function currentView(): View {
  if (typeof window === "undefined") return "overview";
  return (window as unknown as { __shelfView?: View }).__shelfView ?? "overview";
}
