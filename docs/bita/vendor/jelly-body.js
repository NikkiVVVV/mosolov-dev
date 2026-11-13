// Jelly UI 1.1 soft-body core. Source: https://jelly-ui.com/dist/jelly.js
// MIT. Compiled core subset; simulation code unchanged. See jelly-LICENSE.txt.
const nt = {
  clickDepthSpring: 115,
  clickDepthDamping: 18,
  insidePressSpring: 92,
  insidePressDamping: 15,
  insideLocalBulgeImpulse: 390,
  insideLocalHoldBulgeForce: 48,
  pressSpring: 76,
  pressDamping: 13,
  holdPressAmount: 0,
  heldCurveSpring: 135,
  heldCurveDamping: 22,
  insideHeldBulgeAmount: 10.8,
  insideHeldHaloAmount: 2.65,
  insideHeldDepthAmount: 0,
  insidePointInfluenceWidth: 38,
  insidePointHaloWidth: 70,
  insidePointEdgeBoost: 0.44,
  outsideHeldDentAmount: 7.2,
  outsideHeldSideBulgeAmount: 1.7,
  outsideHeldDepthAmount: 9.4,
  normalBlendPasses: 3,
  curveTension: 0.68,
  axisDepth: 34,
  axisSpring: 48,
  axisDamping: 11,
  depthImpulse: 420,
  depthBulgeImpulse: 130,
  depthSpring: 76,
  depthDamping: 14,
  depthCoupling: 150,
  maxDepthIn: -26,
  maxDepthOut: 16,
  zRotateSpring: 42,
  zRotateDamping: 12,
  zRotateImpulse: 0.14,
  membraneSpring: 96,
  membraneDamping: 17,
  waveCoupling: 145,
  pressure: 620,
  volumeCorrection: 0.1,
  outsideDentImpulse: 255,
  outsideSideBulgeImpulse: 54,
  outsideOppositeBulgeImpulse: 74,
  rippleWidth: 8,
  outsideHoldForce: 20,
  outsideHoldDepthForce: 52,
  maxDent: 8,
  maxBulge: 24,
  perspective: 390,
  samples: 240
};
let Rt = 0;
function X(l = "jelly") {
  return `${l}-${++Rt}`;
}
function g(l, t, e = null, i = {}) {
  const s = new CustomEvent(t, {
    bubbles: !0,
    composed: !0,
    detail: e,
    ...i
  });
  return l.dispatchEvent(s);
}
function V(l, t, e = 0) {
  const i = l.getAttribute(t);
  if (i === null || i.trim() === "")
    return e;
  const s = Number(i);
  return Number.isFinite(s) ? s : e;
}
function B(l) {
  return String(l).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function k(l) {
  return getComputedStyle(l).direction === "rtl";
}
const J = {
  sm: "small",
  md: "medium",
  lg: "large"
};
function q(l, t) {
  const e = l.getAttribute("size");
  for (const i of l.querySelectorAll(t)) {
    const s = i.hasAttribute("data-jelly-inherited-size");
    e ? (!i.hasAttribute("size") || s) && (i.setAttribute("size", e), i.setAttribute("data-jelly-inherited-size", "")) : s && (i.removeAttribute("size"), i.removeAttribute("data-jelly-inherited-size"));
  }
}
function j(l) {
  const t = l.getAttribute("size");
  t && J[t] && l.setAttribute("size", J[t]);
}
function Pt(l, t = "medium") {
  const e = (l.getAttribute("size") || "").toLowerCase();
  return J[e] ? J[e] : e === "small" || e === "medium" || e === "large" ? e : t;
}
function m(l, t, e) {
  return Math.max(t, Math.min(e, l));
}
function E(l, t, e, i, s, r) {
  const o = (e - l) * i - t * s, n = t + o * r;
  return [l + n * r, n];
}
const ut = typeof matchMedia == "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
function F() {
  const l = typeof document < "u" ? document.documentElement.getAttribute("data-jelly-motion") : null;
  return l === "reduce" ? !0 : l === "no-preference" ? !1 : ut ? ut.matches : !1;
}
function T(l = 8) {
  if ("vibrate" in navigator)
    try {
      navigator.vibrate(l);
    } catch {
    }
}
function O(l, t = !1) {
  return l === "ArrowRight" ? t ? -1 : 1 : l === "ArrowLeft" ? t ? 1 : -1 : 0;
}
function kt(l, t, e, { rtl: i = !1, wrap: s = !0, horizontal: r = !0, vertical: o = !0 } = {}) {
  let n = 0;
  if (r && (n = O(l, i)), o && n === 0 && (l === "ArrowDown" && (n = 1), l === "ArrowUp" && (n = -1)), l === "Home")
    return 0;
  if (l === "End")
    return e - 1;
  if (n === 0 || e === 0)
    return -1;
  const c = t + n;
  return s ? (c + e) % e : m(c, 0, e - 1);
}
const Ht = 1 / 58;
function pt(l, t, e) {
  const i = m((e - l) / (t - l), 0, 1);
  return i * i * (3 - 2 * i);
}
function A(l, t) {
  return (l + t) % t;
}
function bt(l, t, e) {
  const i = Math.abs(l - t);
  return Math.min(i, e - i);
}
function N(l, t) {
  return Math.exp(-(l * l) / (2 * t * t));
}
function Vt(l, t, e, i, s) {
  const r = Math.min(s, e, i), o = Math.abs(l) - (e - r), n = Math.abs(t) - (i - r), c = Math.hypot(Math.max(o, 0), Math.max(n, 0)), h = Math.min(Math.max(o, n), 0);
  return c + h - r;
}
function gt(l, t, e, i) {
  const s = l / 2, r = t / 2, o = Math.min(e, s, r), n = [], c = (v, x) => {
    n.push({ x: v, y: x });
  }, h = 48, a = 48;
  function d(v, x, y, w, S) {
    for (let M = S ? 0 : 1; M <= h; M++) {
      const I = M / h;
      c(v + (y - v) * I, x + (w - x) * I);
    }
  }
  function p(v, x, y, w) {
    for (let S = 1; S <= a; S++) {
      const M = y + (w - y) * (S / a);
      c(v + Math.cos(M) * o, x + Math.sin(M) * o);
    }
  }
  d(-s + o, -r, s - o, -r, !0), p(s - o, -r + o, -Math.PI / 2, 0), d(s, -r + o, s, r - o, !1), p(s - o, r - o, 0, Math.PI / 2), d(s - o, r, -s + o, r, !1), p(-s + o, r - o, Math.PI / 2, Math.PI), d(-s, r - o, -s, -r + o, !1), p(-s + o, -r + o, Math.PI, Math.PI * 1.5);
  const u = [0];
  let f = 0;
  for (let v = 0; v < n.length; v++) {
    const x = n[v], y = n[A(v + 1, n.length)];
    f += Math.hypot(y.x - x.x, y.y - x.y), u.push(f);
  }
  const C = [];
  for (let v = 0; v < i; v++) {
    const x = v / i * f;
    let y = 0;
    for (; y < n.length - 1 && u[y + 1] < x; )
      y += 1;
    const w = n[y], S = n[(y + 1) % n.length], M = u[y], I = u[y + 1], Bt = Math.max(I - M, 1e-4), dt = (x - M) / Bt;
    C.push({
      x: w.x + (S.x - w.x) * dt,
      y: w.y + (S.y - w.y) * dt,
      nx: 0,
      ny: 0,
      d: 0,
      v: 0,
      z: 0,
      zv: 0
    });
  }
  return $t(C), C;
}
function Dt(l, t) {
  const e = l.length, i = l[A(t - 1, e)], s = l[A(t + 1, e)], r = s.x - i.x, o = s.y - i.y, n = Math.hypot(o, -r) || 1;
  return { nx: o / n, ny: -r / n };
}
function $t(l) {
  const t = l.length;
  let e = l.map((i, s) => Dt(l, s));
  for (let i = 0; i < nt.normalBlendPasses; i++)
    e = e.map((s, r) => {
      const o = e[A(r - 1, t)], n = e[A(r + 1, t)], c = o.nx * 0.22 + s.nx * 0.56 + n.nx * 0.22, h = o.ny * 0.22 + s.ny * 0.56 + n.ny * 0.22, a = Math.hypot(c, h) || 1;
      return { nx: c / a, ny: h / a };
    });
  for (let i = 0; i < t; i++)
    l[i].nx = e[i].nx, l[i].ny = e[i].ny;
}
function _(l) {
  let t = 0;
  for (let e = 0; e < l.length; e++) {
    const i = l[e], s = l[A(e + 1, l.length)];
    t += i.x * s.y - s.x * i.y;
  }
  return Math.abs(t) * 0.5;
}
function Q(l, t, e = nt.curveTension) {
  const i = t.length;
  l.beginPath(), l.moveTo(t[0].x, t[0].y);
  for (let s = 0; s < i; s++) {
    const r = t[A(s - 1, i)], o = t[s], n = t[A(s + 1, i)], c = t[A(s + 2, i)], h = o.x + (n.x - r.x) * e / 6, a = o.y + (n.y - r.y) * e / 6, d = n.x - (c.x - o.x) * e / 6, p = n.y - (c.y - o.y) * e / 6;
    l.bezierCurveTo(h, a, d, p, n.x, n.y);
  }
  l.closePath();
}
class D {
  constructor({ width: t, height: e, radius: i, config: s }) {
    this.width = t, this.height = e, this.radius = i ?? Math.min(t, e) / 2, this.config = { ...nt, ...s ?? {} }, this.lean = 0, this.leanAmount = 0, this.membrane = gt(t, e, this.radius, this.config.samples), this.state = {
      clickDepth: 0,
      clickDepthV: 0,
      targetClickDepth: 0,
      insidePress: 0,
      insidePressV: 0,
      targetInsidePress: 0,
      press: 0,
      pressV: 0,
      targetPress: 0,
      insideCurveHold: 0,
      insideCurveHoldV: 0,
      targetInsideCurveHold: 0,
      rotateZ: 0,
      rotateZV: 0,
      tiltX: 0,
      tiltXV: 0,
      tiltY: 0,
      tiltYV: 0,
      targetTiltX: 0,
      targetTiltY: 0,
      pointerActive: !1,
      pointerInsideWeight: 0,
      pointerIndex: 0,
      pointerLocalX: 0,
      pointerLocalY: 0
    }, this.baseArea = _(this.getSurfacePoints());
  }
  // Rebuild the ring for a new size, preserving no motion (used on resize)
  resize(t, e, i) {
    this.width = t, this.height = e, this.radius = i ?? Math.min(t, e) / 2, this.membrane = gt(t, e, this.radius, this.config.samples), this.baseArea = _(this.getSurfacePoints());
  }
  // Signed distance from a local point to the resting surface
  sdf(t, e) {
    return Vt(t, e, this.width / 2, this.height / 2, this.radius);
  }
  // Index of the membrane point closest to a local coordinate
  nearestMembraneIndex(t, e) {
    let i = 0, s = 1 / 0;
    for (let r = 0; r < this.membrane.length; r++) {
      const o = this.membrane[r], n = t - o.x, c = e - o.y, h = n * n + c * c;
      h < s && (s = h, i = r);
    }
    return i;
  }
  // Kick the membrane outward around a ring index with a gaussian falloff
  addMembraneImpulse(t, e, i) {
    const s = this.membrane.length;
    for (let r = 0; r < s; r++) {
      const o = bt(r, t, s);
      this.membrane[r].v += e * N(o, i);
    }
  }
  // Kick the membrane's depth (z) around a ring index with a gaussian falloff
  addDepthImpulse(t, e, i) {
    const s = this.membrane.length;
    for (let r = 0; r < s; r++) {
      const o = bt(r, t, s);
      this.membrane[r].zv += e * N(o, i);
    }
  }
  // Bulge the membrane around the pointer with a softer counter-halo
  addInsidePointImpulse(t) {
    for (let e = 0; e < this.membrane.length; e++) {
      const i = this.insidePointInfluence(e);
      this.membrane[e].v += t * (i.local - i.halo * 0.18);
    }
  }
  // Five-tap smoothing of one membrane channel around an index
  smoothedMembraneValue(t, e) {
    const i = this.membrane.length, s = this.membrane[A(t - 2, i)][e], r = this.membrane[A(t - 1, i)][e], o = this.membrane[t][e], n = this.membrane[A(t + 1, i)][e], c = this.membrane[A(t + 2, i)][e];
    return s * 0.06 + r * 0.2 + o * 0.48 + n * 0.2 + c * 0.06;
  }
  // How strongly the pointer's held position affects one membrane point
  insidePointInfluence(t) {
    const e = this.membrane[t], i = e.x - this.state.pointerLocalX, s = e.y - this.state.pointerLocalY, r = Math.hypot(i, s), o = N(r, this.config.insidePointInfluenceWidth), n = N(r, this.config.insidePointHaloWidth), c = m(
      Math.hypot(
        this.state.pointerLocalX / (this.width / 2),
        this.state.pointerLocalY / (this.height / 2)
      ),
      0,
      1
    ), h = 1 + pt(0.12, 0.82, c) * this.config.insidePointEdgeBoost;
    return {
      local: o * h,
      halo: Math.max(n - o * 0.34, 0)
    };
  }
  // Sustained bulge / depth offsets while the pointer is held inside
  heldMembraneOffsets(t) {
    const e = this.insidePointInfluence(t);
    return {
      d: this.state.insideCurveHold * (this.config.insideHeldBulgeAmount * e.local - this.config.insideHeldHaloAmount * e.halo),
      z: -this.state.insideCurveHold * this.config.insideHeldDepthAmount * e.local
    };
  }
  // Five-tap smoothing over a plain array of ring values
  smoothArrayValue(t, e) {
    const i = t.length;
    return t[A(e - 2, i)] * 0.06 + t[A(e - 1, i)] * 0.2 + t[e] * 0.48 + t[A(e + 1, i)] * 0.2 + t[A(e + 2, i)] * 0.06;
  }
  /*
   * The current deformed surface. `offset` pushes every point outward along
   * its normal - used to trace a focus ring that follows the same jiggle.
   */
  getSurfacePoints(t = 0) {
    const e = [], i = this.membrane.length, s = new Array(i), r = new Array(i);
    for (let o = 0; o < i; o++) {
      const n = this.heldMembraneOffsets(o);
      s[o] = this.smoothedMembraneValue(o, "d") + n.d, r[o] = this.smoothedMembraneValue(o, "z") + n.z;
    }
    for (let o = 0; o < i; o++) {
      const n = this.membrane[o], c = this.smoothArrayValue(s, o), h = this.smoothArrayValue(r, o), a = this.smoothArrayValue(s, A(o - 1, i)), p = this.smoothArrayValue(s, A(o + 1, i)) - a, u = -n.ny, f = n.nx, C = p * 0.05, v = this.leanAmount === 0 ? 0 : this.lean * m(n.x / (this.width / 2), -1, 1) * this.leanAmount, x = n.x + n.nx * (c + t + v) + u * C, y = n.y + n.ny * (c + t + v) + f * C, w = m(x / (this.width / 2), -1, 1), S = m(y / (this.height / 2), -1, 1), M = -(w * this.state.tiltY + S * this.state.tiltX) * this.config.axisDepth;
      e.push({ x, y, z: M + h });
    }
    return e;
  }
  // Apply the perspective projection to one surface point
  projectPoint(t) {
    const e = this.config.perspective / (this.config.perspective - t.z);
    return { x: t.x * e, y: t.y * e, z: t.z };
  }
  // Aim the held-press springs at the pointer's current position
  updatePressTargets(t, e, i = 1) {
    this.state.pointerLocalX = t, this.state.pointerLocalY = e;
    const s = this.sdf(t, e), r = (1 - pt(-2, 5, s)) * i;
    return this.state.pointerInsideWeight = r, this.state.targetClickDepth = r, this.state.targetInsidePress = r, this.state.targetPress = r * this.config.holdPressAmount, this.state.targetInsideCurveHold = r, { insideWeight: r };
  }
  // Press at a point already in local (shape-centered) coordinates
  pressAtLocal(t, e, i = 1, s = 1) {
    const r = this.nearestMembraneIndex(t, e);
    this.state.pointerIndex = r, this.state.pointerActive = !0;
    const { insideWeight: o } = this.updatePressTargets(t, e, s), n = i * 1.15 * s;
    o > 0.01 && (this.addInsidePointImpulse(this.config.insideLocalBulgeImpulse * o * n), this.state.pressV += 1.9 * o * n);
  }
  // Follow the pointer while it is held down
  moveToLocal(t, e, i = 1) {
    this.state.pointerIndex = this.nearestMembraneIndex(t, e), this.updatePressTargets(t, e, i);
  }
  // A press whose energy comes from the shape center (keyboard activation)
  centerPulse(t = 1) {
    this.pressAtLocal(0, 0, t);
  }
  /*
   * A one-shot squish from the center that settles on its own - for feedback
   * that isn't a sustained press (focus, toggle, grab). Unlike centerPulse it
   * sets no held target, so the body returns to rest and can sleep.
   */
  centerPop(t = 1) {
    this.state.pointerLocalX = 0, this.state.pointerLocalY = 0, this.addInsidePointImpulse(this.config.insideLocalBulgeImpulse * 0.5 * t), this.state.pressV += 0.9 * t;
  }
  /*
   * A one-shot directional jiggle along an axis: the leading edge (normals
   * aligned with the direction) bulges out and the trailing edge tucks in, so
   * the blob stretches the way it's thrown. Used by the sliding controls and
   * jelly-alert's shake.
   */
  stretchAlong(t, e, i = 1) {
    const s = Math.hypot(t, e) || 1, r = t / s, o = e / s, n = this.config.insideLocalBulgeImpulse * 0.42 * i;
    for (const c of this.membrane) {
      const h = c.nx * r + c.ny * o;
      c.v += n * h;
    }
  }
  // A one-shot ripple with no hold (typing feedback, toggles, etc.)
  pulseAt(t, e, i = 1) {
    const s = this.nearestMembraneIndex(t, e);
    this.state.pointerLocalX = t, this.state.pointerLocalY = e, this.addMembraneImpulse(
      s,
      this.config.insideLocalBulgeImpulse * 0.5 * i,
      this.config.rippleWidth * 1.6
    );
  }
  // Let go: clear every held target and give a small parting kick
  release() {
    this.state.pointerActive = !1, this.state.targetClickDepth = 0, this.state.targetInsidePress = 0, this.state.targetPress = 0, this.state.targetInsideCurveHold = 0, this.state.targetTiltX = 0, this.state.targetTiltY = 0, this.state.pointerInsideWeight = 0, this.state.pressV -= 0.55;
  }
  // Advance the whole-body springs (press depth, tilt, rotation) one step
  updateGlobal(t) {
    const e = this.state, i = this.config;
    [e.clickDepth, e.clickDepthV] = E(
      e.clickDepth,
      e.clickDepthV,
      e.targetClickDepth,
      i.clickDepthSpring,
      i.clickDepthDamping,
      t
    ), [e.insidePress, e.insidePressV] = E(
      e.insidePress,
      e.insidePressV,
      e.targetInsidePress,
      i.insidePressSpring,
      i.insidePressDamping,
      t
    ), [e.press, e.pressV] = E(
      e.press,
      e.pressV,
      e.targetPress,
      i.pressSpring,
      i.pressDamping,
      t
    ), [e.insideCurveHold, e.insideCurveHoldV] = E(
      e.insideCurveHold,
      e.insideCurveHoldV,
      e.targetInsideCurveHold,
      i.heldCurveSpring,
      i.heldCurveDamping,
      t
    ), [e.rotateZ, e.rotateZV] = E(
      e.rotateZ,
      e.rotateZV,
      0,
      i.zRotateSpring,
      i.zRotateDamping,
      t
    ), [e.tiltX, e.tiltXV] = E(
      e.tiltX,
      e.tiltXV,
      e.targetTiltX,
      i.axisSpring,
      i.axisDamping,
      t
    ), [e.tiltY, e.tiltYV] = E(
      e.tiltY,
      e.tiltYV,
      e.targetTiltY,
      i.axisSpring,
      i.axisDamping,
      t
    ), e.clickDepth = m(e.clickDepth, 0, 1), e.insidePress = m(e.insidePress, 0, 1), e.press = m(e.press, -0.025, 0.085), e.insideCurveHold = m(e.insideCurveHold, 0, 1), e.rotateZ = m(e.rotateZ, -0.018, 0.018), e.tiltX = m(e.tiltX, -1, 1), e.tiltY = m(e.tiltY, -1, 1);
  }
  // Advance the membrane wave equation one step
  updateMembrane(t) {
    const e = this.membrane.length, i = this.config, s = this.getSurfacePoints(), r = _(s), o = m((this.baseArea - r) / this.baseArea, -0.08, 0.08), n = new Array(e), c = new Array(e);
    for (let a = 0; a < e; a++) {
      const d = this.membrane[a], p = this.membrane[A(a - 1, e)], u = this.membrane[A(a + 1, e)], f = p.d + u.d - 2 * d.d, C = p.z + u.z - 2 * d.z;
      n[a] = -d.d * i.membraneSpring + f * i.waveCoupling - d.v * i.membraneDamping + o * i.pressure, c[a] = -d.z * i.depthSpring + C * i.depthCoupling - d.zv * i.depthDamping;
    }
    if (this.state.pointerActive && this.state.pointerInsideWeight > 0.02)
      for (let a = 0; a < e; a++) {
        const d = this.insidePointInfluence(a);
        n[a] += i.insideLocalHoldBulgeForce * d.local * this.state.pointerInsideWeight, n[a] -= i.insideLocalHoldBulgeForce * 0.18 * d.halo * this.state.pointerInsideWeight;
      }
    for (let a = 0; a < e; a++) {
      const d = this.membrane[a];
      d.v += n[a] * t, d.d += d.v * t, d.zv += c[a] * t, d.z += d.zv * t, d.d = m(d.d, -i.maxDent, i.maxBulge), d.v = m(d.v, -410, 410), d.z = m(d.z, i.maxDepthIn, i.maxDepthOut), d.zv = m(d.zv, -600, 600);
    }
    let h = 0;
    for (const a of this.membrane)
      h += a.d;
    h /= e;
    for (const a of this.membrane)
      a.d -= h * i.volumeCorrection;
  }
  /*
   * Advance the simulation by a frame delta. The delta is split into
   * substeps no longer than MAX_STEP so the integration stays stable on
   * slow frames, low-Hz displays and after background-tab pauses.
   */
  update(t) {
    const e = Math.max(1, Math.ceil(t / Ht)), i = t / e;
    for (let s = 0; s < e; s++)
      this.updateGlobal(i), this.updateMembrane(i);
    this.recoverIfUnstable();
  }
  /*
   * Defensive backstop: if anything ever produced a non-finite number
   * (a zero-sized rebuild, an extreme external mutation), reset all motion
   * instead of painting garbage forever. The clamps make this near
   * impossible, but a physics toy should never be able to wedge the UI.
   */
  recoverIfUnstable() {
    const t = this.state;
    let e = Number.isFinite(t.press) && Number.isFinite(t.clickDepth) && Number.isFinite(t.rotateZ);
    if (e) {
      for (const i of this.membrane)
        if (!Number.isFinite(i.d) || !Number.isFinite(i.v) || !Number.isFinite(i.z) || !Number.isFinite(i.zv)) {
          e = !1;
          break;
        }
    }
    if (!e) {
      for (const i of this.membrane)
        i.d = 0, i.v = 0, i.z = 0, i.zv = 0;
      t.clickDepth = 0, t.clickDepthV = 0, t.insidePress = 0, t.insidePressV = 0, t.press = 0, t.pressV = 0, t.insideCurveHold = 0, t.insideCurveHoldV = 0, t.rotateZ = 0, t.rotateZV = 0, t.tiltX = 0, t.tiltXV = 0, t.tiltY = 0, t.tiltYV = 0;
    }
  }
  // True when the body has essentially stopped moving and nothing is held
  isResting() {
    const t = this.state;
    if (t.pointerActive || Math.abs(t.clickDepth) > 1e-3 || Math.abs(t.insidePress) > 1e-3 || Math.abs(t.insideCurveHold) > 1e-3 || Math.abs(t.rotateZ) > 1e-4 || Math.abs(t.tiltX) > 1e-3 || Math.abs(t.tiltY) > 1e-3)
      return !1;
    for (const e of this.membrane)
      if (Math.abs(e.d) > 0.03 || Math.abs(e.v) > 0.05 || Math.abs(e.z) > 0.03 || Math.abs(e.zv) > 0.05)
        return !1;
    return !0;
  }
}

export {D as JellyBody,Q as traceSmoothPath,nt as DEFAULT_CONFIG};
