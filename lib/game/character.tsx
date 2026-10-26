"use client"

import { useMemo, type MutableRefObject } from "react"
import { useFrame } from "@react-three/fiber"
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// ---------- global caches (geometry + material are shared by every mesh in the game) ----------
const geoCache = new Map<string, BufferGeometry>()
export function geo<T extends BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key)
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g as T
}

const matCache = new Map<string, MeshLambertMaterial>()
export function mat(color: string | number, extra?: { key: string; make: (m: MeshLambertMaterial) => void }): MeshLambertMaterial {
  const key = String(color) + (extra ? "|" + extra.key : "")
  let m = matCache.get(key)
  if (!m) {
    m = new MeshLambertMaterial({ color, flatShading: true })
    if (extra) extra.make(m)
    matCache.set(key, m)
  }
  return m
}

export const unitBox = () => geo("box", () => new BoxGeometry(1, 1, 1))
export const unitCyl = (seg = 8) => geo("cyl" + seg, () => new CylinderGeometry(1, 1, 1, seg))
export const unitIco = (d = 1) => geo("ico" + d, () => new IcosahedronGeometry(1, d))
export const unitCone = (seg = 6) => geo("cone" + seg, () => new ConeGeometry(1, 1, seg))

// ---------- specs ----------
export type CharSpec = {
  id: string
  name: string
  kind: "boy" | "girl" | "claude"
  skin: string
  hair: string
  top: string
  topDetail: string
  bottom: string
  shoes: string
  accent: string
  glasses: boolean
  bow: boolean
}

export const CHARACTERS: CharSpec[] = [
  {
    id: "kai",
    name: "Kai",
    kind: "boy",
    skin: "#f1c59b",
    hair: "#3b2418",
    top: "#7a1f2e",
    topDetail: "#5f1523",
    bottom: "#e7dabb",
    shoes: "#f6f6f4",
    accent: "#2b2b33",
    glasses: true,
    bow: false,
  },
  {
    id: "mira",
    name: "Mira",
    kind: "girl",
    skin: "#f4cdb0",
    hair: "#3a1f5c",
    top: "#1f8c8f",
    topDetail: "#f5f5f5",
    bottom: "#6a3ba5",
    shoes: "#3d2a52",
    accent: "#f472b6",
    glasses: false,
    bow: true,
  },
  {
    id: "claude",
    name: "Claude",
    kind: "claude",
    skin: "#e0805f",
    hair: "#e0805f",
    top: "#f4ece1",
    topDetail: "#d97757",
    bottom: "#4a3a33",
    shoes: "#d97757",
    accent: "#ffd9a8",
    glasses: false,
    bow: false,
  },
]

// ---------- rig ----------
export type Rig = {
  root: Group
  hips: Group
  torso: Group
  head: Group
  armL: Group
  armR: Group
  foreL: Group
  foreR: Group
  thighL: Group
  thighR: Group
  kneeL: Group
  kneeR: Group
  eyeL: Mesh
  eyeR: Mesh
  phase: number
  blinkIn: number
  blink: number
  wavePhase: number
  air: number
}

export type Motion = { speed: number; air: boolean; wave: boolean; look?: number }

const hairCache = new Map<string, BufferGeometry>()
const _o = new Object3D()
const _up = new Vector3(0, 1, 0)
const _n = new Vector3()
const _q = new Quaternion()

function hairGeometry(spec: CharSpec): BufferGeometry {
  const cached = hairCache.get(spec.id)
  if (cached) return cached
  const parts: BufferGeometry[] = []
  const add = (g: BufferGeometry, x: number, y: number, z: number, rot?: Vector3, scale?: Vector3) => {
    const ng = g.index ? g.toNonIndexed() : g.clone()
    _o.position.set(x, y, z)
    _o.rotation.set(rot ? rot.x : 0, rot ? rot.y : 0, rot ? rot.z : 0)
    _o.scale.set(scale ? scale.x : 1, scale ? scale.y : 1, scale ? scale.z : 1)
    _o.updateMatrix()
    ng.applyMatrix4(_o.matrix)
    parts.push(ng)
  }
  const cap = new SphereGeometry(1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.43)
  add(cap, 0, 0.98, -0.05)
  if (spec.kind === "boy") {
    // spiky strands: cones standing on the cap, each leaning away from the head centre
    const count = 11
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const tilt = i % 2 === 0 ? 0.62 : 0.95
      _n.set(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt)).normalize()
      _q.setFromUnitVectors(_up, _n)
      const px = _n.x * 1.12
      const py = 0.98 + _n.y * 1.12
      const pz = -0.05 + _n.z * 1.12
      const cone = new ConeGeometry(0.34, 0.95, 4)
      const ng = cone.toNonIndexed()
      _o.position.set(px + _n.x * 0.3, py + _n.y * 0.3, pz + _n.z * 0.3)
      _o.quaternion.copy(_q)
      _o.scale.set(1, 1, 1)
      _o.updateMatrix()
      ng.applyMatrix4(_o.matrix)
      parts.push(ng)
    }
    // fringe
    add(new IcosahedronGeometry(0.5, 0), 0.55, 1.75, 0.8, undefined, new Vector3(1, 0.5, 0.7))
    add(new IcosahedronGeometry(0.5, 0), -0.45, 1.8, 0.85, undefined, new Vector3(1, 0.5, 0.7))
    // nape
    add(new IcosahedronGeometry(1, 1), 0, 0.5, -0.55, undefined, new Vector3(1.1, 0.75, 0.6))
  } else {
    // long hair behind the shoulders + side locks
    add(new IcosahedronGeometry(1, 1), 0, 0.15, -0.65, undefined, new Vector3(1.22, 1.9, 0.72))
    add(new IcosahedronGeometry(1, 1), 1.02, 0.55, 0.15, undefined, new Vector3(0.3, 1.0, 0.5))
    add(new IcosahedronGeometry(1, 1), -1.02, 0.55, 0.15, undefined, new Vector3(0.3, 1.0, 0.5))
    add(new IcosahedronGeometry(0.55, 0), 0.4, 1.78, 0.85, undefined, new Vector3(1.3, 0.5, 0.7))
    add(new IcosahedronGeometry(0.55, 0), -0.4, 1.78, 0.85, undefined, new Vector3(1.3, 0.5, 0.7))
  }
  const merged = mergeGeometries(parts, false)
  for (const p of parts) p.dispose()
  hairCache.set(spec.id, merged)
  return merged
}

function part(parent: Object3D, g: BufferGeometry, m: MeshLambertMaterial, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const mesh = new Mesh(g, m)
  mesh.position.set(x, y, z)
  mesh.scale.set(sx, sy, sz)
  parent.add(mesh)
  return mesh
}

const grp = (parent: Object3D, x = 0, y = 0, z = 0) => {
  const g = new Group()
  g.position.set(x, y, z)
  parent.add(g)
  return g
}

export function buildCharacter(spec: CharSpec, castShadow: boolean): Rig {
  const root = new Group()
  const skin = mat(spec.skin)
  const top = mat(spec.top)
  const topD = mat(spec.topDetail)
  const bottom = mat(spec.bottom)
  const shoes = mat(spec.shoes)
  const dark = mat("#1b1b22")
  const white = mat("#ffffff")
  const girl = spec.kind === "girl"

  const hips = grp(root, 0, 3.65, 0)
  part(hips, unitBox(), girl ? skin : bottom, 0, 0, 0, 2.5, 0.8, 1.5)

  // legs
  const makeLeg = (side: number) => {
    const thigh = grp(hips, side * 0.7, -0.1, 0)
    part(thigh, unitCyl(7), girl ? skin : bottom, 0, -0.8, 0, 0.5, 1.6, 0.5)
    const knee = grp(thigh, 0, -1.6, 0)
    part(knee, unitCyl(7), girl ? skin : bottom, 0, -0.75, 0, 0.43, 1.5, 0.43)
    if (girl) part(knee, unitCyl(7), white, 0, -1.0, 0, 0.47, 1.0, 0.47)
    const ankle = grp(knee, 0, -1.5, 0)
    part(ankle, unitBox(), shoes, 0, -0.22, 0.25, 0.9, 0.45, 1.4)
    if (!girl) part(ankle, unitBox(), mat("#b9b9b4"), 0, -0.42, 0.25, 0.94, 0.1, 1.44)
    return { thigh, knee }
  }
  const legL = makeLeg(1)
  const legR = makeLeg(-1)

  if (girl) part(hips, geo("skirt", () => new CylinderGeometry(1.0, 1.65, 1.15, 8)), bottom, 0, -0.35, 0)

  // torso
  const torso = grp(hips, 0, 0.4, 0)
  part(torso, geo("torso", () => new CylinderGeometry(1.25, 1.12, 2.1, 8)), top, 0, 1.05, 0, 1, 1, 0.8)
  if (girl) {
    part(torso, unitBox(), topD, 0, 1.95, 0.5, 1.1, 0.35, 0.5)
    part(torso, unitBox(), topD, 0, 1.0, 0.98, 0.18, 1.8, 0.1)
  } else {
    part(torso, geo("hood", () => new TorusGeometry(0.85, 0.32, 5, 8)), topD, 0, 2.15, -0.1, 1, 1, 0.9).rotation.x = Math.PI / 2
    part(torso, unitBox(), topD, 0, 0.55, 1.0, 1.4, 0.7, 0.1)
  }

  const makeArm = (side: number) => {
    const arm = grp(torso, side * 1.55, 1.8, 0)
    part(arm, unitCyl(7), top, 0, -0.7, 0, 0.38, 1.4, 0.38)
    const fore = grp(arm, 0, -1.4, 0)
    part(fore, unitCyl(7), top, 0, -0.65, 0, 0.33, 1.3, 0.33)
    part(fore, unitIco(0), skin, 0, -1.4, 0, 0.38, 0.38, 0.38)
    return { arm, fore }
  }
  const armL = makeArm(1)
  const armR = makeArm(-1)

  // head
  const head = grp(torso, 0, 2.35, 0)
  part(head, unitCyl(6), skin, 0, -0.05, 0, 0.42, 0.45, 0.42)
  part(head, unitIco(1), skin, 0, 0.95, 0, 1.08, 1.1, 1.05)
  part(head, unitIco(0), skin, 1.05, 0.9, 0, 0.2, 0.26, 0.2)
  part(head, unitIco(0), skin, -1.05, 0.9, 0, 0.2, 0.26, 0.2)
  const eyeGeo = geo("eye", () => new SphereGeometry(0.15, 6, 5))
  const eyeL = part(head, eyeGeo, dark, 0.42, 1.0, 0.98)
  const eyeR = part(head, eyeGeo, dark, -0.42, 1.0, 0.98)
  part(head, unitBox(), mat("#a24f4f"), 0, 0.6, 1.02, 0.28, 0.07, 0.06)
  if (spec.kind === "claude") {
    const glow = mat(spec.accent)
    part(head, unitCyl(5), mat("#4a3a33"), 0, 2.15, 0, 0.06, 0.6, 0.06)
    part(head, unitIco(0), glow, 0, 2.55, 0, 0.26, 0.26, 0.26)
    part(head, unitBox(), mat("#f4ece1"), 0, 0.97, 1.0, 1.2, 0.5, 0.1) // visor
    part(torso, unitBox(), mat("#d97757"), 0, 1.1, 0.98, 0.14, 0.9, 0.08) // sparkle emblem
    part(torso, unitBox(), mat("#d97757"), 0, 1.1, 0.98, 0.9, 0.14, 0.08)
    const d1 = part(torso, unitBox(), mat("#d97757"), 0, 1.1, 0.99, 0.12, 0.7, 0.08)
    d1.rotation.z = Math.PI / 4
    const d2 = part(torso, unitBox(), mat("#d97757"), 0, 1.1, 0.99, 0.12, 0.7, 0.08)
    d2.rotation.z = -Math.PI / 4
  } else {
    const hair = new Mesh(hairGeometry(spec), mat(spec.hair))
    head.add(hair)
  }
  if (spec.glasses) {
    const rim = geo("rim", () => new TorusGeometry(0.34, 0.05, 4, 10))
    part(head, rim, dark, 0.45, 1.0, 1.0)
    part(head, rim, dark, -0.45, 1.0, 1.0)
    part(head, unitBox(), dark, 0, 1.03, 1.02, 0.18, 0.05, 0.05)
    part(head, unitBox(), dark, 0.82, 1.0, 0.6, 0.05, 0.05, 0.85)
    part(head, unitBox(), dark, -0.82, 1.0, 0.6, 0.05, 0.05, 0.85)
  }
  if (spec.bow) {
    const pink = mat(spec.accent)
    part(head, unitCone(4), pink, 0.95, 1.95, -0.1, 0.38, 0.55, 0.3).rotation.z = -Math.PI / 2
    part(head, unitCone(4), pink, 1.65, 1.95, -0.1, 0.38, 0.55, 0.3).rotation.z = Math.PI / 2
    part(head, unitIco(0), pink, 1.3, 1.95, -0.1, 0.22, 0.22, 0.22)
    // blush
    const blush = geo("blush", () => new CircleGeometry(0.2, 8))
    const bm = mat("#f58fb0")
    const b1 = part(head, blush, bm, 0.62, 0.68, 0.9)
    b1.rotation.y = 0.55
    const b2 = part(head, blush, bm, -0.62, 0.68, 0.9)
    b2.rotation.y = -0.55
  }

  if (castShadow) {
    root.traverse((o) => {
      if ((o as Mesh).isMesh) (o as Mesh).castShadow = true
    })
  }

  return {
    root,
    hips,
    torso,
    head,
    armL: armL.arm,
    armR: armR.arm,
    foreL: armL.fore,
    foreR: armR.fore,
    thighL: legL.thigh,
    thighR: legR.thigh,
    kneeL: legL.knee,
    kneeR: legR.knee,
    eyeL,
    eyeR,
    phase: Math.random() * 6,
    blinkIn: 2 + Math.random() * 2,
    blink: 0,
    wavePhase: 0,
    air: 0,
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Walk, breathe, blink and wave. No allocation. speed: 0 idle, 1 walk, ~1.7 run. */
export function animateRig(rig: Rig, dt: number, t: number, m: Motion) {
  const speed = m.speed
  const k = Math.min(1, speed)
  const run = Math.max(0, speed - 1)
  rig.phase += dt * (6.5 + speed * 3.2)
  const ph = rig.phase
  rig.air = lerp(rig.air, m.air ? 1 : 0, Math.min(1, dt * 14))
  const air = rig.air
  const s = Math.sin(ph)
  const c = Math.cos(ph)
  const swing = (0.75 + run * 0.35) * k * (1 - air)

  rig.thighL.rotation.x = lerp(-s * swing, -0.9, air)
  rig.thighR.rotation.x = lerp(s * swing, 0.35, air)
  rig.kneeL.rotation.x = lerp(Math.max(0, c) * (0.9 + run * 0.4) * k, 0.9, air)
  rig.kneeR.rotation.x = lerp(Math.max(0, -c) * (0.9 + run * 0.4) * k, 0.4, air)

  const breathe = Math.sin(t * 2.1) * 0.02
  rig.hips.position.y = 3.65 + Math.abs(c) * 0.28 * k * (1 - air) + breathe
  rig.hips.rotation.y = s * 0.12 * k
  rig.torso.rotation.y = -s * 0.2 * k
  rig.torso.rotation.x = 0.05 + run * 0.18
  rig.torso.scale.y = 1 + Math.sin(t * 2.1) * 0.012

  const armSwing = (0.8 + run * 0.4) * k * (1 - air)
  rig.armL.rotation.x = lerp(s * armSwing, -2.2, air)
  rig.armL.rotation.z = lerp(0.08, 0.5, air)
  rig.foreL.rotation.x = lerp(-0.2 - k * 0.5 - run * 0.4, -0.3, air)

  if (m.wave) {
    rig.wavePhase += dt * 9
    rig.armR.rotation.x = 0
    rig.armR.rotation.z = -2.75
    rig.foreR.rotation.x = 0
    rig.foreR.rotation.z = -0.35 + Math.sin(rig.wavePhase) * 0.5
  } else {
    rig.armR.rotation.x = lerp(-s * armSwing, -2.2, air)
    rig.armR.rotation.z = lerp(-0.08, -0.5, air)
    rig.foreR.rotation.x = lerp(-0.2 - k * 0.5 - run * 0.4, -0.3, air)
    rig.foreR.rotation.z = 0
  }

  const look = m.look ?? 0
  rig.head.rotation.y = Math.sin(t * 0.7) * 0.12 * (1 - k) + look
  rig.head.rotation.z = Math.sin(t * 0.9 + 1) * 0.04 * (1 - k)
  rig.head.rotation.x = Math.sin(t * 1.3) * 0.03 + k * 0.05

  rig.blinkIn -= dt
  if (rig.blinkIn <= 0) {
    rig.blink = 0.14
    rig.blinkIn = 2 + Math.random() * 3
  }
  let ey = 1
  if (rig.blink > 0) {
    rig.blink -= dt
    ey = 0.12
  }
  rig.eyeL.scale.y = ey
  rig.eyeR.scale.y = ey
}

// ---------- React wrapper ----------
export function CharacterView({
  index,
  motion,
  scale = 0.2,
  shadow = true,
}: {
  index: number
  motion: MutableRefObject<Motion>
  scale?: number
  shadow?: boolean
}) {
  const rig = useMemo(() => buildCharacter(CHARACTERS[index % CHARACTERS.length], shadow), [index, shadow])
  useFrame((state, dt) => {
    animateRig(rig, Math.min(dt, 0.05), state.clock.elapsedTime, motion.current)
  })
  return (
    <group scale={scale}>
      <primitive object={rig.root} />
    </group>
  )
}
