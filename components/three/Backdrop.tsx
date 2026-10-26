"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { currentView, type Pulse, type View } from "@/lib/bus";
import { cssVar, damp, labelTexture, mount, softShadow } from "./kit";

// The store on the move: the 1.0 shelf on the left, the 2.17 shelf on the right, and between them a
// conveyor that carries the data through the price check. A box enters with its price as 1.0 stores
// it (2500) and leaves the gate with the price 2.17 must show ($25.00).

type V3 = [number, number, number];
const CAM: Record<View, { p: V3; t: V3; ox: number }> = {
  overview: { p: [5.2, 7.6, 21.5], t: [0.6, 1.2, 0], ox: -0.2 },
  parts: { p: [2.2, 5.4, 13.8], t: [4.6, 1.7, 0], ox: -0.2 },
  prices: { p: [2.6, 4.0, 11.6], t: [0.3, 1.5, 0], ox: -0.22 },
  customers: { p: [8.6, 4.8, 12.6], t: [5.8, 1.8, 0], ox: -0.2 },
  orders: { p: [-3.2, 4.8, 13], t: [-1.8, 1.3, 0], ox: -0.2 },
  switch: { p: [6.4, 10.4, 17.5], t: [2, 0.8, 0], ox: -0.2 },
};

const TAGS: [string, string][] = [
  ["2500", "$25.00"],
  ["4800", "$48.00"],
  ["1290", "€12.90"],
  ["3650", "$36.50"],
];

function boxTexture(base: string, tape: string, label = "#f7f3ea") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  g.fillStyle = tape;
  g.fillRect(54, 0, 20, 128);
  g.fillStyle = label;
  g.fillRect(14, 82, 32, 22);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(18, 88, 22, 3);
  g.fillRect(18, 94, 16, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function Backdrop() {
  const ref = useRef<HTMLDivElement | null>(null);
  const s = useStore();
  const data = useRef({ waiting: 0, built: 0, tested: 0, open: 0 });
  data.current = {
    waiting: s.orders.filter((o) => o.where !== "moved").length,
    built: s.parts.filter((p) => p.status === "rebuilt" || p.status === "tested").length,
    tested: s.parts.filter((p) => p.status === "tested").length,
    open: s.prices.filter((p) => p.status === "issue").length,
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, small, reduce } = st;

    const accent = new THREE.Color(cssVar("--accent", "#3b3fb8"));
    const support = new THREE.Color(cssVar("--support", "#c4823a"));
    const okC = new THREE.Color(cssVar("--ok", "#22946a"));
    const warnC = new THREE.Color(cssVar("--warn", "#c48716"));
    const errC = new THREE.Color(cssVar("--err", "#cf4659"));
    scene.fog = new THREE.Fog(0xf3f2ee, 18, 38);

    const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 90);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0be, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(6, 11, 8);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(accent.clone().lerp(new THREE.Color(0xffffff), 0.5), 0.55);
    rim.position.set(-8, 4, -6);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    // floating slab with a faint grid, the floor of the stockroom
    const gridC = document.createElement("canvas");
    gridC.width = gridC.height = 256;
    const gg = gridC.getContext("2d")!;
    gg.fillStyle = "#fbfaf6";
    gg.fillRect(0, 0, 256, 256);
    gg.strokeStyle = "rgba(59,63,184,0.08)";
    gg.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      gg.beginPath();
      gg.moveTo(i, 0);
      gg.lineTo(i, 256);
      gg.stroke();
      gg.beginPath();
      gg.moveTo(0, i);
      gg.lineTo(256, i);
      gg.stroke();
    }
    const gridT = new THREE.CanvasTexture(gridC);
    gridT.wrapS = gridT.wrapT = THREE.RepeatWrapping;
    gridT.repeat.set(5, 2);
    gridT.colorSpace = THREE.SRGBColorSpace;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(18, 0.36, 7.4), [
      new THREE.MeshLambertMaterial({ color: 0xece9e1 }),
      new THREE.MeshLambertMaterial({ color: 0xece9e1 }),
      new THREE.MeshLambertMaterial({ map: gridT }),
      new THREE.MeshLambertMaterial({ color: 0xe2ded3 }),
      new THREE.MeshLambertMaterial({ color: 0xf2efe8 }),
      new THREE.MeshLambertMaterial({ color: 0xece9e1 }),
    ]);
    slab.position.y = -0.18;
    root.add(slab);
    const under = softShadow(24, 11, 0.3);
    under.position.y = -1.1;
    root.add(under);

    const cardTex = boxTexture("#c89a60", "#b2834a");
    const newTex = boxTexture("#f4f2ff", "#5a5edb", "#ffffff");
    const boxGeo = new THREE.BoxGeometry(0.62, 0.5, 0.6);

    // a shelving unit: posts, three shelves, and an instanced set of boxes on them
    function rack(x: number, frame: THREE.Color, board: number, depth: number) {
      const g = new THREE.Group();
      g.position.x = x;
      const postM = new THREE.MeshLambertMaterial({ color: frame });
      const boardM = new THREE.MeshLambertMaterial({ color: board });
      const postG = new THREE.BoxGeometry(0.1, 3.5, 0.1);
      for (const px of [-1.72, 1.72])
        for (const pz of [-0.72, 0.72]) {
          const p = new THREE.Mesh(postG, postM);
          p.position.set(px, 1.75, pz);
          g.add(p);
        }
      const shelfG = new THREE.BoxGeometry(3.5, 0.08, 1.52);
      const ys = [0.36, 1.48, 2.6];
      ys.forEach((y) => {
        const b = new THREE.Mesh(shelfG, boardM);
        b.position.y = y;
        g.add(b);
      });
      const sh = softShadow(4.6, 2.6, 0.32);
      sh.position.y = 0.01;
      g.add(sh);
      const slots: THREE.Vector3[] = [];
      ys.forEach((y) => {
        for (let j = 0; j < 4; j++)
          for (let d = 0; d < depth; d++) slots.push(new THREE.Vector3(-1.2 + j * 0.8, y + 0.04 + 0.25, depth === 1 ? 0 : -0.36 + d * 0.72));
      });
      root.add(g);
      return { g, slots };
    }

    const left = rack(-6.1, new THREE.Color(0x8a6a48), 0xd9c2a0, 2);
    const right = rack(6.1, accent, 0xf7f6fb, 2);

    function shelfBoxes(slots: THREE.Vector3[], tex: THREE.Texture) {
      const m = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ map: tex }), slots.length);
      m.frustumCulled = false;
      const scales = slots.map(() => 0);
      const color = new THREE.Color();
      slots.forEach((_, i) => m.setColorAt(i, color.setScalar(0.9 + ((i * 37) % 10) / 100)));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      return { m, scales };
    }
    const leftBoxes = shelfBoxes(left.slots, cardTex);
    left.g.add(leftBoxes.m);
    const rightBoxes = shelfBoxes(right.slots, newTex);
    right.g.add(rightBoxes.m);
    const dummy = new THREE.Object3D();

    // signs above the shelves
    function sign(text: string, sub: string, bg: string, fg: string, x: number) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text, { bg, color: fg, w: 256, h: 112, size: 64 }), depthWrite: false }));
      sp.scale.set(1.5, 0.66, 1);
      sp.position.set(x, 4.2, 0);
      const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(sub, { bg: "rgba(255,255,255,0.92)", color: "#434962", w: 320, h: 72, size: 34 }), depthWrite: false }));
      sp2.scale.set(1.9, 0.43, 1);
      sp2.position.set(x, 3.62, 0);
      root.add(sp, sp2);
      return sp;
    }
    const sOld = sign("1.0", "live, selling", "#f8ecdc", "#a96a26", -6.1);
    const sNew = sign("2.17", "built beside it", "#5a5edb", "#ffffff", 6.1);

    // the conveyor
    const beltC = document.createElement("canvas");
    beltC.width = 256;
    beltC.height = 32;
    const bg = beltC.getContext("2d")!;
    bg.fillStyle = "#2b2f46";
    bg.fillRect(0, 0, 256, 32);
    bg.fillStyle = "#3a3f5e";
    for (let i = 0; i < 256; i += 16) bg.fillRect(i, 0, 7, 32);
    const beltT = new THREE.CanvasTexture(beltC);
    beltT.wrapS = THREE.RepeatWrapping;
    beltT.repeat.set(9, 1);
    beltT.colorSpace = THREE.SRGBColorSpace;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 1.1), [
      new THREE.MeshLambertMaterial({ color: 0x2b2f46 }),
      new THREE.MeshLambertMaterial({ color: 0x2b2f46 }),
      new THREE.MeshLambertMaterial({ map: beltT }),
      new THREE.MeshLambertMaterial({ color: 0x2b2f46 }),
      new THREE.MeshLambertMaterial({ color: 0x3a3f5e }),
      new THREE.MeshLambertMaterial({ color: 0x3a3f5e }),
    ]);
    belt.position.set(0, 0.86, 0);
    root.add(belt);
    const railM = new THREE.MeshPhongMaterial({ color: 0xd9dbe6, shininess: 60 });
    for (const z of [-0.62, 0.62]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.1, 0.08), railM);
      rail.position.set(0, 1.0, z);
      root.add(rail);
    }
    const legG = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    for (const x of [-4, -1.4, 1.4, 4])
      for (const z of [-0.5, 0.5]) {
        const l = new THREE.Mesh(legG, railM);
        l.position.set(x, 0.4, z);
        root.add(l);
      }
    const beltSh = softShadow(10, 2.4, 0.26);
    beltSh.position.y = 0.012;
    root.add(beltSh);

    // the price check gate
    const gateM = new THREE.MeshLambertMaterial({ color: accent, emissive: accent.clone().multiplyScalar(0.0) });
    const postG = new THREE.BoxGeometry(0.22, 2.7, 0.22);
    for (const z of [-0.86, 0.86]) {
      const p = new THREE.Mesh(postG, gateM);
      p.position.set(0, 1.35, z);
      root.add(p);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 2.06), gateM);
    beam.position.set(0, 2.72, 0);
    root.add(beam);
    const scanM = new THREE.MeshBasicMaterial({ color: 0x9a9dff, transparent: true, opacity: 0.9 });
    const scan = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.56), scanM);
    scan.position.set(0, 1.6, 0);
    root.add(scan);
    const veilM = new THREE.MeshBasicMaterial({ color: 0x8f93ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 2.4), veilM);
    veil.rotation.y = Math.PI / 2;
    veil.position.set(0, 1.5, 0);
    root.add(veil);
    const lampM = new THREE.MeshBasicMaterial({ color: warnC });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), lampM);
    lamp.position.set(0, 3.0, 0);
    root.add(lamp);
    const gateSign = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture("PRICE CHECK", { bg: "#ffffff", color: "#3b3fb8", w: 360, h: 84, size: 40, border: "#c9cbf5" }), depthWrite: false }));
    gateSign.scale.set(1.9, 0.44, 1);
    gateSign.position.set(0, 3.5, 0);
    root.add(gateSign);

    // rings for feedback
    const rings = Array.from({ length: 5 }, () => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false }));
      m.visible = false;
      root.add(m);
      return { m, life: 0 };
    });
    function ring(x: number, y: number, c: THREE.Color) {
      const r = rings.find((q) => q.life <= 0) ?? rings[0];
      r.m.position.set(x, y, 0);
      (r.m.material as THREE.MeshBasicMaterial).color.copy(c);
      r.life = 1;
      r.m.visible = true;
    }

    // a sweep of light across the floor for switch day
    const sweepC = document.createElement("canvas");
    sweepC.width = 128;
    sweepC.height = 8;
    const sg = sweepC.getContext("2d")!;
    const grad = sg.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, "rgba(90,94,219,0)");
    grad.addColorStop(0.5, "rgba(90,94,219,0.55)");
    grad.addColorStop(1, "rgba(90,94,219,0)");
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 128, 8);
    const sweep = new THREE.Mesh(new THREE.PlaneGeometry(3, 7.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sweepC), transparent: true, depthWrite: false, opacity: 0 }));
    sweep.position.set(-9, 0.02, 0);
    root.add(sweep);
    let sweepT = -1;

    // boxes riding the conveyor, each with its price tag
    const tagTex = TAGS.map(([a, b]) => [labelTexture(a, { bg: "#f8ecdc", color: "#a96a26", border: "#e7c9a0", size: 50 }), labelTexture(b, { bg: "#e0f3ea", color: "#1b7a56", border: "#a9dcc4", size: 50 })]);
    const rideMat = new THREE.MeshLambertMaterial({ map: cardTex });
    const riders = Array.from({ length: small ? 6 : 10 }, (_, i) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.56), rideMat);
      g.add(b);
      const tagM = new THREE.SpriteMaterial({ map: tagTex[0][0], depthWrite: false });
      const tag = new THREE.Sprite(tagM);
      tag.scale.set(0.84, 0.32, 1);
      tag.position.y = 0.62;
      g.add(tag);
      g.visible = false;
      root.add(g);
      return { g, tag, tagM, x: -99, kind: i % TAGS.length, flipped: false, alive: false, s: 0 };
    });
    const Y = 0.92 + 0.23;
    function spawn() {
      const r = riders.find((q) => !q.alive);
      if (!r) return false;
      r.alive = true;
      r.x = -4.3;
      r.s = 0;
      r.flipped = false;
      r.kind = Math.floor(Math.random() * TAGS.length);
      r.tagM.map = tagTex[r.kind][0];
      r.tagM.needsUpdate = true;
      r.g.visible = true;
      r.g.position.set(r.x, Y, 0);
      r.g.scale.setScalar(0.001);
      return true;
    }
    if (reduce) {
      // no motion: three boxes stand still, before, inside and after the gate
      [-2.6, 0.9, 3.0].forEach((x, i) => {
        if (!spawn()) return;
        const r = riders[i];
        r.x = x;
        r.s = 1;
        r.flipped = x > 0;
        r.tagM.map = tagTex[r.kind][r.flipped ? 1 : 0];
        r.g.scale.setScalar(1);
        r.g.position.x = x;
      });
    }

    // events from the page
    let queue = 0;
    let scanBoost = 0;
    let errFlash = 0;
    let glow = 0;
    let bounceOld = 0;
    let bounceNew = 0;
    const onPulse = (e: Event) => {
      const { kind, n } = (e as CustomEvent<{ kind: Pulse; n: number }>).detail;
      if (kind === "topup") queue += Math.min(8, Math.max(1, n));
      if (kind === "check") scanBoost = 2.2;
      if (kind === "fix") {
        ring(0, 0.05, okC);
        glow = 1;
      }
      if (kind === "order") {
        ring(-6.1, 0.05, support);
        bounceOld = 1;
      }
      if (kind === "part") {
        ring(6.1, 0.05, accent);
        bounceNew = 1;
      }
      if (kind === "login") ring(6.1, 0.05, okC);
      if (kind === "error") {
        errFlash = 1.4;
        ring(0, 0.05, errC);
      }
      if (kind === "switch") {
        sweepT = 0;
        bounceNew = 1;
        glow = 1;
      }
    };
    window.addEventListener("shelf:pulse", onPulse);

    let v: View = currentView();
    const onView = (e: Event) => (v = (e as CustomEvent<View>).detail);
    window.addEventListener("shelf:view", onView);

    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const camP = new THREE.Vector3(...CAM[v].p);
    const camT = new THREE.Vector3(...CAM[v].t);
    let ox = CAM[v].ox;
    cam.position.copy(camP);

    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    const { w: w0, h: h0 } = st.size();
    fit(w0, h0);
    st.onResize(fit);

    let spawnT = 0.6;
    let queueT = 0;
    const tmpP = new THREE.Vector3();
    const tmpT = new THREE.Vector3();

    st.loop((dt, t) => {
      const { w, h } = st.size();
      const narrow = w < 900;
      const preset = CAM[v];
      const sy = Math.min(window.scrollY, 1400);
      // phones and tablets see the store from further back, so the gate fits the band above the text
      tmpT.set(...preset.t);
      tmpP.set(...preset.p);
      const dist = tmpP.distanceTo(tmpT);
      const minDist = w < 560 ? 23 : narrow ? 17 : 0;
      if (dist < minDist) tmpP.sub(tmpT).multiplyScalar(minDist / dist).add(tmpT);
      tmpP.x += px * 1.1;
      tmpP.y += -py * 0.6 + sy * 0.0026;
      tmpT.y += sy * 0.0021;
      camP.x = damp(camP.x, tmpP.x, 2.2, dt);
      camP.y = damp(camP.y, tmpP.y, 2.2, dt);
      camP.z = damp(camP.z, tmpP.z, 2.2, dt);
      camT.x = damp(camT.x, tmpT.x, 2.4, dt);
      camT.y = damp(camT.y, tmpT.y, 2.4, dt);
      camT.z = damp(camT.z, tmpT.z, 2.4, dt);
      ox = damp(ox, narrow ? 0 : preset.ox, 2.2, dt);
      cam.position.copy(camP);
      cam.lookAt(camT);
      cam.setViewOffset(w, h, w * ox, h * (narrow ? 0.25 : 0.17), w, h);
      root.rotation.y = reduce ? 0 : Math.sin(t * 0.12) * 0.035;

      // shelves follow the store: waiting orders on the 1.0 top shelf, rebuilt parts on 2.17
      const d = data.current;
      const lStock = 8;
      left.slots.forEach((p, i) => {
        const top = i >= 16;
        const want = top ? (i - 16 < Math.min(8, d.waiting) ? 1 : 0) : i < lStock * 2 ? (i % 2 === 0 || i < 8 ? 1 : 0) : 0;
        leftBoxes.scales[i] = damp(leftBoxes.scales[i], want, 7, dt);
        const sc = leftBoxes.scales[i] * (top ? 1 + bounceOld * 0.15 : 1);
        dummy.position.copy(p);
        dummy.scale.setScalar(Math.max(0.0001, sc));
        dummy.rotation.set(0, ((i * 13) % 7) * 0.03 - 0.09, 0);
        dummy.updateMatrix();
        leftBoxes.m.setMatrixAt(i, dummy.matrix);
      });
      leftBoxes.m.instanceMatrix.needsUpdate = true;
      right.slots.forEach((p, i) => {
        const want = i < d.built ? 1 : 0;
        rightBoxes.scales[i] = damp(rightBoxes.scales[i], want, 6, dt);
        dummy.position.copy(p);
        dummy.scale.setScalar(Math.max(0.0001, rightBoxes.scales[i] * (1 + bounceNew * 0.12)));
        dummy.rotation.set(0, ((i * 11) % 5) * 0.03 - 0.06, 0);
        dummy.updateMatrix();
        rightBoxes.m.setMatrixAt(i, dummy.matrix);
      });
      rightBoxes.m.instanceMatrix.needsUpdate = true;
      bounceOld = Math.max(0, bounceOld - dt * 2);
      bounceNew = Math.max(0, bounceNew - dt * 2);
      sOld.scale.set(1.5 * (1 + bounceOld * 0.08), 0.66 * (1 + bounceOld * 0.08), 1);
      sNew.scale.set(1.5 * (1 + bounceNew * 0.1), 0.66 * (1 + bounceNew * 0.1), 1);

      // conveyor
      if (!reduce) {
        beltT.offset.x -= dt * 0.16;
        spawnT -= dt;
        if (spawnT <= 0) {
          spawn();
          spawnT = 2.4 + Math.random() * 1.2;
        }
        if (queue > 0) {
          queueT -= dt;
          if (queueT <= 0 && spawn()) {
            queue--;
            queueT = 0.42;
          }
        }
        for (const r of riders) {
          if (!r.alive) continue;
          r.x += dt * (queue > 0 ? 1.9 : 1.25);
          r.s = damp(r.s, r.x > 4.1 ? 0 : 1, 8, dt);
          if (!r.flipped && r.x > 0) {
            r.flipped = true;
            r.tagM.map = tagTex[r.kind][1];
            r.tagM.needsUpdate = true;
          }
          const flip = Math.min(1, Math.abs(r.x) / 0.35);
          r.tag.scale.set(0.84 * Math.max(0.06, flip), 0.32, 1);
          r.g.position.set(r.x, Y, 0);
          r.g.scale.setScalar(Math.max(0.001, r.s));
          if (r.x > 4.6) {
            r.alive = false;
            r.g.visible = false;
          }
        }
      }

      // the gate
      scanBoost = Math.max(0, scanBoost - dt);
      const speed = scanBoost > 0 ? 7 : 1.6;
      scan.position.y = 1.55 + Math.sin(t * speed) * 0.95;
      veilM.opacity = 0.1 + (scanBoost > 0 ? 0.12 : 0) + glow * 0.15;
      glow = Math.max(0, glow - dt * 0.8);
      errFlash = Math.max(0, errFlash - dt);
      const lampC = errFlash > 0 && Math.floor(errFlash * 6) % 2 === 0 ? errC : d.open ? warnC : okC;
      lampM.color.copy(lampC);
      (gateM.emissive as THREE.Color).copy(accent).multiplyScalar(0.25 * glow + (scanBoost > 0 ? 0.15 : 0));

      // rings and sweep
      for (const r of rings) {
        if (r.life <= 0) continue;
        r.life -= dt * 0.9;
        const k = 1 - r.life;
        r.m.scale.setScalar(1 + k * 3.2);
        (r.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.life) * 0.7;
        if (r.life <= 0) r.m.visible = false;
      }
      if (sweepT >= 0) {
        sweepT += dt;
        sweep.position.x = -9 + sweepT * 9;
        (sweep.material as THREE.MeshBasicMaterial).opacity = Math.min(1, Math.sin(Math.min(1, sweepT / 2) * Math.PI) * 1.1);
        if (sweepT > 2) sweepT = -1;
      }

      st.renderer.render(scene, cam);
    });

    return () => {
      window.removeEventListener("shelf:pulse", onPulse);
      window.removeEventListener("shelf:view", onView);
      window.removeEventListener("pointermove", onMove);
      tagTex.flat().forEach((x) => x.dispose());
      cardTex.dispose();
      newTex.dispose();
      st.dispose();
    };
  }, []);

  return <div className="backdrop" ref={ref} aria-hidden="true" />;
}
