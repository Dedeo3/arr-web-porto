// Pure world data and simple physics. No three.js imports, so it can be tested in plain node.

export const SEA = -0.5

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number) {
  return vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.1
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export const ISLAND_R = 100

export function islandRadius(a: number) {
  return ISLAND_R + 7 * Math.sin(a * 3 + 1) + 4 * Math.sin(a * 5 + 2)
}

export function heightAt(x: number, z: number) {
  const r = Math.hypot(x, z)
  const a = Math.atan2(z, x)
  const R = islandRadius(a)
  let d = Math.abs(a - Math.PI / 2)
  if (d > Math.PI) d = Math.PI * 2 - d
  const beach = 1 - 0.95 * Math.exp(-(d * d) / 0.18) // low near the south dock
  const flat = smooth(24, 31, r)
  const hills = Math.max(0, fbm(x * 0.045 + 3, z * 0.045 - 5) - 0.3) * 22 * flat * beach
  const width = 6 + 10 * (1 - beach)
  const t = smooth(R - width, R, r)
  return hills * (1 - t) + -4 * t
}

// ---------- platforms (dock, boat) ----------
export type Platform = { x: number; z: number; hx: number; hz: number; y: number }
export const DOCK_Z = 86
export const platforms: Platform[] = [
  { x: 0, z: DOCK_Z, hx: 1.6, hz: 13, y: 0.35 },
  { x: 2.4, z: 90, hx: 0.9, hz: 0.7, y: 0.6 },
  { x: 4.5, z: 89, hx: 1.5, hz: 2.2, y: 0.85 },
]

export function groundY(x: number, z: number) {
  let y = heightAt(x, z)
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i]
    if (Math.abs(x - p.x) < p.hx && Math.abs(z - p.z) < p.hz && p.y > y) y = p.y
  }
  return y
}

// ---------- buildings ----------
export type BuildingId = "about" | "projects" | "skills" | "contact"
export type BuildingDef = {
  id: BuildingId
  name: string
  x: number
  z: number
  yaw: number
  hx: number
  hz: number
  cos: number
  sin: number
}

function mkBuilding(id: BuildingId, name: string, x: number, z: number): BuildingDef {
  const yaw = Math.atan2(-x, -z)
  return { id, name, x, z, yaw, hx: 6.5, hz: 5, cos: Math.cos(yaw), sin: Math.sin(yaw) }
}

export const BUILDINGS: BuildingDef[] = [
  mkBuilding("about", "My House", -14.8, -14.8),
  mkBuilding("projects", "Project Gallery", 14.8, -14.8),
  mkBuilding("skills", "Workshop", -14.8, 14.8),
  mkBuilding("contact", "Post Office", 14.8, 14.8),
]

export function buildingById(id: string) {
  return BUILDINGS.find((b) => b.id === id)!
}

export function localToWorld(b: BuildingDef, lx: number, lz: number, out: { x: number; z: number }) {
  out.x = b.x + lx * b.cos + lz * b.sin
  out.z = b.z - lx * b.sin + lz * b.cos
  return out
}

export function doorPoint(b: BuildingDef) {
  return localToWorld(b, 0, b.hz + 2, { x: 0, z: 0 })
}
export function exitPoint(b: BuildingDef) {
  return localToWorld(b, 0, b.hz + 3.4, { x: 0, z: 0 })
}

// ---------- static colliders ----------
export type Circle = { x: number; z: number; r: number }
export const circles: Circle[] = []

export const FOUNTAIN_R = 3.2
circles.push({ x: 0, z: 0, r: FOUNTAIN_R })

// Props that live outside the buildings (see CityScene for their visuals)
export const PROPS = {
  windmill: { x: -52, z: -36 },
  lighthouse: { x: 66, z: -52 },
}
circles.push({ x: PROPS.windmill.x, z: PROPS.windmill.z, r: 3.2 })
circles.push({ x: PROPS.lighthouse.x, z: PROPS.lighthouse.z, r: 3 })

// street lamps around the plaza and along the paths
export const LAMPS: Array<[number, number]> = []
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8
  LAMPS.push([Math.cos(a) * 11.5, Math.sin(a) * 11.5])
}
LAMPS.push([-3.2, 30], [3.2, 30], [-3.2, 48], [3.2, 48], [-3.2, 66], [3.2, 66], [-1.9, 78], [1.9, 78])
for (const [x, z] of LAMPS) circles.push({ x, z, r: 0.22 })

// van in front of the post office and statue / gear props near other buildings
export const VAN = { x: 22.6, z: 7.4, yaw: -0.5 }
circles.push({ x: VAN.x, z: VAN.z, r: 1.6 }, { x: VAN.x - 0.8, z: VAN.z - 1.2, r: 1.3 })
export const STATUE = { x: 24, z: -7 }
circles.push({ x: STATUE.x, z: STATUE.z, r: 0.9 })
export const CLAUDE = { x: 2.6, z: 6.4 }
circles.push({ x: CLAUDE.x, z: CLAUDE.z, r: 0.55 })
export const SIGN = { x: 4.2, z: 4.6 }
circles.push({ x: SIGN.x, z: SIGN.z, r: 0.3 })
export const GEAR = { x: -24.5, z: 8 }
circles.push({ x: GEAR.x, z: GEAR.z, r: 0.9 })

export type Box = { x: number; z: number; hx: number; hz: number; cos: number; sin: number }
export const boxes: Box[] = BUILDINGS.map((b) => ({ x: b.x, z: b.z, hx: b.hx, hz: b.hz, cos: b.cos, sin: b.sin }))

// Water tower legs and extras are small enough to be ignored.

/** Resolve a circle against every static collider. Returns true when it was pushed. Normal accumulates in nrm. */
export function pushOut(pos: { x: number; z: number }, r: number, nrm: { x: number; z: number }) {
  let hit = false
  nrm.x = 0
  nrm.z = 0
  for (let i = 0; i < circles.length; i++) {
    const c = circles[i]
    const dx = pos.x - c.x
    const dz = pos.z - c.z
    const min = r + c.r
    if (dx > min || dx < -min || dz > min || dz < -min) continue
    const d2 = dx * dx + dz * dz
    if (d2 >= min * min) continue
    const d = Math.sqrt(d2) || 0.0001
    const nx = dx / d
    const nz = dz / d
    pos.x = c.x + nx * min
    pos.z = c.z + nz * min
    nrm.x += nx
    nrm.z += nz
    hit = true
  }
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]
    const dx = pos.x - b.x
    const dz = pos.z - b.z
    if (dx > 13 || dx < -13 || dz > 13 || dz < -13) continue
    const lx = dx * b.cos - dz * b.sin
    const lz = dx * b.sin + dz * b.cos
    const cx = Math.max(-b.hx, Math.min(b.hx, lx))
    const cz = Math.max(-b.hz, Math.min(b.hz, lz))
    let ox = lx - cx
    let oz = lz - cz
    const d2 = ox * ox + oz * oz
    if (d2 >= r * r) continue
    let nlx: number
    let nlz: number
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2)
      nlx = ox / d
      nlz = oz / d
      ox = cx + nlx * r
      oz = cz + nlz * r
    } else {
      // centre inside the box: leave through the nearest face
      const px = b.hx - Math.abs(lx)
      const pz = b.hz - Math.abs(lz)
      if (px < pz) {
        nlx = lx >= 0 ? 1 : -1
        nlz = 0
        ox = nlx * (b.hx + r)
        oz = lz
      } else {
        nlx = 0
        nlz = lz >= 0 ? 1 : -1
        ox = lx
        oz = nlz * (b.hz + r)
      }
    }
    pos.x = b.x + ox * b.cos + oz * b.sin
    pos.z = b.z - ox * b.sin + oz * b.cos
    nrm.x += nlx * b.cos + nlz * b.sin
    nrm.z += -nlx * b.sin + nlz * b.cos
    hit = true
  }
  return hit
}

export function isWater(x: number, z: number) {
  return groundY(x, z) < SEA + 0.18
}

// ---------- vegetation / decor (seeded) ----------
export type Placement = { x: number; z: number; y: number; s: number; r: number; c: number }
export type Decor = {
  oaks: Placement[]
  pines: Placement[]
  bushes: Placement[]
  rocks: Placement[]
  flowers: Placement[]
  grass: Placement[]
}

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abx = bx - ax
  const abz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz)))
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t))
}

let decor: Decor | null = null

export function isBlockedForDecor(x: number, z: number) {
  const r = Math.hypot(x, z)
  if (r < 13.5) return true
  if (x > -6 && x < 6 && z < -3 && z > -27) return true // bowling lane
  if (Math.abs(x) < 3.6 && z > 0 && z < 84) return true // south path
  for (const b of BUILDINGS) {
    const dx = x - b.x
    const dz = z - b.z
    const lx = dx * b.cos - dz * b.sin
    const lz = dx * b.sin + dz * b.cos
    if (Math.abs(lx) < b.hx + 5 && lz > -b.hz - 3 && lz < b.hz + 11) return true
    const d = doorPoint(b)
    if (segDist(x, z, 0, 0, d.x, d.z) < 2.6) return true
  }
  if (Math.hypot(x - VAN.x, z - VAN.z) < 4) return true
  if (Math.hypot(x - STATUE.x, z - STATUE.z) < 3) return true
  if (Math.hypot(x - GEAR.x, z - GEAR.z) < 3) return true
  if (Math.hypot(x - PROPS.windmill.x, z - PROPS.windmill.z) < 6) return true
  if (Math.hypot(x - PROPS.lighthouse.x, z - PROPS.lighthouse.z) < 6) return true
  return false
}

export function getDecor(): Decor {
  if (decor) return decor
  const rnd = mulberry32(20240607)
  const d: Decor = { oaks: [], pines: [], bushes: [], rocks: [], flowers: [], grass: [] }
  const place = (list: Placement[], count: number, minR: number, maxH: number, minH: number, make: () => Placement | null, tries = 40) => {
    let n = 0
    let t = 0
    while (n < count && t < count * tries) {
      t++
      const a = rnd() * Math.PI * 2
      const r = minR + Math.sqrt(rnd()) * (ISLAND_R - minR)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      const y = heightAt(x, z)
      if (y < minH || y > maxH) continue
      if (isBlockedForDecor(x, z)) continue
      const p = make()
      if (!p) continue
      p.x = x
      p.z = z
      p.y = y
      list.push(p)
      n++
    }
  }
  const mk = (smin: number, smax: number, col = 0, rad = 0) => () => ({
    x: 0,
    z: 0,
    y: 0,
    s: smin + rnd() * (smax - smin),
    r: rnd() * Math.PI * 2,
    c: col || rnd() * rad,
  })
  place(d.oaks, 62, 15, 14, 0.35, mk(0.9, 1.5, 0, 1))
  place(d.pines, 90, 22, 20, 0.5, mk(0.9, 1.7, 0, 1))
  place(d.bushes, 70, 14, 12, 0.3, mk(0.6, 1.1, 0, 1))
  place(d.rocks, 46, 14, 20, -0.2, mk(0.6, 1.8, 0, 1))
  place(d.flowers, 300, 14, 7, 0.4, mk(0.7, 1.2, 0, 1))
  place(d.grass, 800, 14, 10, 0.35, mk(0.7, 1.4, 0, 1))
  for (const o of d.oaks) circles.push({ x: o.x, z: o.z, r: 0.55 * o.s })
  for (const o of d.pines) circles.push({ x: o.x, z: o.z, r: 0.5 * o.s })
  for (const o of d.rocks) if (o.s > 1.0) circles.push({ x: o.x, z: o.z, r: 0.75 * o.s })
  decor = d
  return d
}

// ---------- toys ----------
export type Body = {
  x: number
  z: number
  vx: number
  vz: number
  r: number
  m: number
  kind: 0 | 1 | 2 | 3 // crate, ball, pin, bowling ball
  rx: number
  rz: number
  ry: number
  px: number
  pz: number
  hx: number
  hz: number
  hy: number
}

export const bodies: Body[] = []
let toysReady = false

function body(kind: Body["kind"], x: number, z: number, r: number, m: number) {
  bodies.push({ x, z, vx: 0, vz: 0, r, m, kind, rx: 0, rz: 0, ry: Math.random() * 6, px: x, pz: z, hx: x, hz: z, hy: 0 })
}

export function initToys() {
  if (toysReady) return
  toysReady = true
  // crates: a small stack field west of the fountain
  const cp: Array<[number, number]> = [
    [-9, 4], [-9, 6.2], [-7.1, 5.1], [-11.2, 5], [-9, 8.5], [-7, 7.4], [-11, 7.6], [-12.5, 6.3],
  ]
  for (const [x, z] of cp) body(0, x, z, 0.72, 2)
  const bp: Array<[number, number]> = [[8, 5], [9.5, 6], [8.6, 7.6], [10.4, 4.2], [7.2, 9], [10.8, 8]]
  for (const [x, z] of bp) body(1, x, z, 0.5, 0.9)
  // bowling lane to the north of the fountain
  const rows = 4
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= i; j++) body(2, (j - i / 2) * 0.95, -19.5 - i * 0.9, 0.3, 0.7)
  }
  body(3, 0, -11, 0.55, 4)
}

export function resetToys() {
  bodies.length = 0
  toysReady = false
  initToys()
}

let impact = 0
export function takeImpact() {
  const v = impact
  impact = 0
  return v
}

const sp = { x: 0, z: 0 }
const sn = { x: 0, z: 0 }

export function stepToys(dt: number, px: number, pz: number, pvx: number, pvz: number, pr: number) {
  initToys()
  const n = bodies.length
  const damp = Math.exp(-dt * 1.6)
  for (let i = 0; i < n; i++) {
    const b = bodies[i]
    b.px = b.x
    b.pz = b.z
    b.vx *= damp
    b.vz *= damp
    if (b.vx * b.vx + b.vz * b.vz < 0.0004) {
      b.vx = 0
      b.vz = 0
    }
    b.x += b.vx * dt
    b.z += b.vz * dt
  }
  // player pushes bodies
  for (let i = 0; i < n; i++) {
    const b = bodies[i]
    const dx = b.x - px
    const dz = b.z - pz
    const min = b.r + pr
    const d2 = dx * dx + dz * dz
    if (d2 >= min * min) continue
    const d = Math.sqrt(d2) || 0.0001
    const nx = dx / d
    const nz = dz / d
    b.x = px + nx * min
    b.z = pz + nz * min
    const rel = (pvx - b.vx) * nx + (pvz - b.vz) * nz
    if (rel > 0) {
      const k = 10 / (10 + b.m)
      b.vx += nx * rel * (1.25 * k)
      b.vz += nz * rel * (1.25 * k)
      if (rel > impact) impact = rel * 0.6
    }
  }
  // pairs
  for (let i = 0; i < n; i++) {
    const a = bodies[i]
    for (let j = i + 1; j < n; j++) {
      const b = bodies[j]
      const dx = b.x - a.x
      const dz = b.z - a.z
      const min = a.r + b.r
      if (dx > min || dx < -min || dz > min || dz < -min) continue
      const d2 = dx * dx + dz * dz
      if (d2 >= min * min) continue
      const d = Math.sqrt(d2) || 0.0001
      const nx = dx / d
      const nz = dz / d
      const over = min - d
      const ia = 1 / a.m
      const ib = 1 / b.m
      const tot = ia + ib
      a.x -= nx * over * (ia / tot)
      a.z -= nz * over * (ia / tot)
      b.x += nx * over * (ib / tot)
      b.z += nz * over * (ib / tot)
      const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz
      if (rel < 0) {
        const jn = (-(1 + 0.55) * rel) / tot
        a.vx -= jn * ia * nx
        a.vz -= jn * ia * nz
        b.vx += jn * ib * nx
        b.vz += jn * ib * nz
        if (-rel > impact) impact = -rel
      }
    }
  }
  // world
  for (let i = 0; i < n; i++) {
    const b = bodies[i]
    sp.x = b.x
    sp.z = b.z
    if (pushOut(sp, b.r, sn)) {
      b.x = sp.x
      b.z = sp.z
      const l = Math.hypot(sn.x, sn.z)
      if (l > 0) {
        const nx = sn.x / l
        const nz = sn.z / l
        const vn = b.vx * nx + b.vz * nz
        if (vn < 0) {
          b.vx -= (1 + 0.45) * vn * nx
          b.vz -= (1 + 0.45) * vn * nz
          if (-vn > impact) impact = -vn
        }
      }
    }
    if (groundY(b.x, b.z) < SEA + 0.25) {
      b.x = b.px
      b.z = b.pz
      b.vx *= -0.4
      b.vz *= -0.4
    }
    b.rx += (b.vz * dt) / b.r
    b.rz -= (b.vx * dt) / b.r
    b.hy = groundY(b.x, b.z)
  }
}

export function pinsDown() {
  let down = 0
  let total = 0
  for (const b of bodies) {
    if (b.kind !== 2) continue
    total++
    const k = Math.hypot(b.x - b.hx, b.z - b.hz)
    if (k > 0.5) down++
  }
  return { down, total }
}

export function resetPins() {
  for (const b of bodies) {
    if (b.kind === 2) {
      b.x = b.hx
      b.z = b.hz
      b.vx = 0
      b.vz = 0
    } else if (b.kind === 3) {
      b.x = 0
      b.z = -11
      b.vx = 0
      b.vz = 0
    }
  }
}

export function snapshotPins() {
  for (const b of bodies) {
    b.hx = b.x
    b.hz = b.z
  }
}

// ---------- fishing ----------
export const FISH_SPOTS: Array<{ x: number; z: number; r: number }> = [
  { x: 0, z: DOCK_Z + 9, r: 3.6 }, // dock end
  { x: 4.5, z: 88.8, r: 2.4 }, // boat
]
