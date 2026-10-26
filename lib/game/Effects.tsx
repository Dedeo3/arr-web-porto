"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Points,
  PointsMaterial,
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { env, player } from "./env"
import { input } from "./store"
import { BUILDINGS, groundY, heightAt, localToWorld, mulberry32 } from "./world"
import { unitIco, mat } from "./character"

// ---------- clouds ----------
const CLOUDS = 10
export function Clouds() {
  const ref = useRef<InstancedMesh>(null)
  const d = useMemo(() => new Object3D(), [])
  const geo = useMemo(() => {
    const parts: BufferGeometry[] = []
    const spec: Array<[number, number, number, number]> = [
      [0, 0, 0, 7],
      [6, -0.5, 1, 5.5],
      [-6, -0.8, -1, 5],
      [2.5, 2, 0, 5],
    ]
    for (const [x, y, z, r] of spec) {
      const g = new IcosahedronGeometry(r, 1)
      g.scale(1, 0.55, 0.8)
      g.translate(x, y, z)
      parts.push(g)
    }
    const m = mergeGeometries(parts, false)
    for (const p of parts) p.dispose()
    return m
  }, [])
  const material = useMemo(() => new MeshLambertMaterial({ color: "#ffffff", emissive: new Color("#cfe0f5"), emissiveIntensity: 0.35, flatShading: true }), [])
  const seeds = useMemo(() => {
    const r = mulberry32(5)
    return Array.from({ length: CLOUDS }, () => ({ a: r() * Math.PI * 2, rad: 70 + r() * 150, y: 70 + r() * 35, s: 0.8 + r() * 1.2, v: 0.002 + r() * 0.004 }))
  }, [])
  const nightCol = useMemo(() => new Color("#3d4a78"), [])
  const dayEm = useMemo(() => new Color("#cfe0f5"), [])
  const nightEm = useMemo(() => new Color("#222c55"), [])
  const grey = useMemo(() => new Color("#8b96a3"), [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    material.color.set("#ffffff").lerp(nightCol, env.night).lerp(grey, env.rain * 0.7)
    material.emissive.copy(dayEm).lerp(nightEm, env.night)
    const t = s.clock.elapsedTime
    for (let i = 0; i < CLOUDS; i++) {
      const c = seeds[i]
      const a = c.a + t * c.v
      d.position.set(Math.cos(a) * c.rad, c.y, Math.sin(a) * c.rad)
      d.scale.setScalar(c.s)
      d.rotation.y = -a
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geo, material, CLOUDS]} frustumCulled={false} />
}

// ---------- birds ----------
const BIRDS = 7
export function Birds() {
  const ref = useRef<InstancedMesh>(null)
  const d = useMemo(() => new Object3D(), [])
  const geo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute("position", new Float32BufferAttribute([0, 0, 0.3, -1, 0.25, -0.2, 0, 0, -0.2, 0, 0, 0.3, 0, 0, -0.2, 1, 0.25, -0.2], 3))
    g.computeVertexNormals()
    return g
  }, [])
  const material = useMemo(() => new MeshLambertMaterial({ color: "#2b2f3a", side: 2, flatShading: true }), [])
  const seeds = useMemo(() => {
    const r = mulberry32(21)
    return Array.from({ length: BIRDS }, () => ({ a: r() * 6.28, rad: 22 + r() * 40, y: 18 + r() * 16, v: 0.08 + r() * 0.1, f: 6 + r() * 3, cx: (r() - 0.5) * 30, cz: (r() - 0.5) * 30 }))
  }, [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    const vis = Math.max(0.0001, 1 - env.night * 1.4 - env.rain)
    for (let i = 0; i < BIRDS; i++) {
      const b = seeds[i]
      const a = b.a + t * b.v
      d.position.set(b.cx + Math.cos(a) * b.rad, b.y + Math.sin(t * 0.7 + i) * 1.4, b.cz + Math.sin(a) * b.rad)
      d.rotation.set(0, -a, Math.sin(t * 0.5 + i) * 0.2)
      const flap = env.reduced ? 0.6 : 0.5 + 0.5 * Math.sin(t * b.f + i)
      d.scale.set(0.9 * vis, (0.4 + flap) * vis, 0.9 * vis)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geo, material, BIRDS]} frustumCulled={false} />
}

// ---------- chimney smoke ----------
const PUFFS = 10
export function Smoke() {
  const ref = useRef<InstancedMesh>(null)
  const d = useMemo(() => new Object3D(), [])
  const emitters = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number }> = []
    const house = BUILDINGS.find((b) => b.id === "about")!
    const shop = BUILDINGS.find((b) => b.id === "skills")!
    const a = localToWorld(house, 3.8, -1.6, { x: 0, z: 0 })
    out.push({ x: a.x, y: groundY(a.x, a.z) + 9.0, z: a.z })
    const b = localToWorld(shop, -4.6, -2.5, { x: 0, z: 0 })
    out.push({ x: b.x, y: groundY(b.x, b.z) + 10.4, z: b.z })
    return out
  }, [])
  const material = useMemo(() => new MeshLambertMaterial({ color: "#e9edf2", transparent: true, opacity: 0.6, flatShading: true, depthWrite: false }), [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    for (let e = 0; e < emitters.length; e++) {
      for (let i = 0; i < PUFFS; i++) {
        const ph = (t * 0.18 + i / PUFFS + e * 0.37) % 1
        d.position.set(emitters[e].x + ph * 3.5 + Math.sin(ph * 9 + e) * 0.25, emitters[e].y + ph * 6, emitters[e].z + Math.cos(ph * 7 + e) * 0.25)
        const sc = (0.25 + ph * 0.85) * (1 - ph * ph * ph * 0.9)
        d.scale.set(sc, sc, sc)
        d.updateMatrix()
        m.setMatrixAt(e * PUFFS + i, d.matrix)
      }
    }
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[unitIco(0), material, PUFFS * emitters.length]} frustumCulled={false} />
}

// ---------- fireflies ----------
const FLIES = 140
export function Fireflies() {
  const ref = useRef<Points>(null)
  const { geo, base } = useMemo(() => {
    const r = mulberry32(99)
    const base = Array.from({ length: FLIES }, () => ({ x: (r() - 0.5) * 80, z: (r() - 0.5) * 80, p: r() * 6.28, h: 0.6 + r() * 2.2 }))
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(new Float32Array(FLIES * 3), 3))
    return { geo: g, base }
  }, [])
  const material = useMemo(
    () => new PointsMaterial({ color: "#d9ff7a", size: 0.4, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }),
    [],
  )
  useFrame((s) => {
    const p = ref.current
    if (!p) return
    material.opacity = Math.max(0, env.night - env.rain * 0.6) * (0.65 + 0.35 * Math.sin(s.clock.elapsedTime * 3))
    p.visible = env.night > 0.05
    if (!p.visible) return
    const t = s.clock.elapsedTime
    const arr = (geo.attributes.position as BufferAttribute).array as Float32Array
    for (let i = 0; i < FLIES; i++) {
      const b = base[i]
      // keep the swarm centred on the player by wrapping offsets into a 80 m box
      const ox = ((((b.x + Math.sin(t * 0.3 + b.p) * 2 - player.x) % 80) + 120) % 80) - 40
      const oz = ((((b.z + Math.cos(t * 0.27 + b.p) * 2 - player.z) % 80) + 120) % 80) - 40
      const x = player.x + ox
      const z = player.z + oz
      arr[i * 3] = x
      arr[i * 3 + 1] = Math.max(heightAt(x, z), 0) + b.h + Math.sin(t * 0.8 + b.p) * 0.4
      arr[i * 3 + 2] = z
    }
    ;(geo.attributes.position as BufferAttribute).needsUpdate = true
  })
  return <points ref={ref} geometry={geo} material={material} frustumCulled={false} />
}

// ---------- rain ----------
const DROPS = 650
export function Rain() {
  const ref = useRef<LineSegments>(null)
  const { geo, seeds } = useMemo(() => {
    const r = mulberry32(3)
    const seeds = Array.from({ length: DROPS }, () => ({ x: r() * 40, y: r() * 26, z: r() * 40, v: 24 + r() * 8 }))
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(new Float32Array(DROPS * 6), 3))
    return { geo: g, seeds }
  }, [])
  const material = useMemo(() => new LineBasicMaterial({ color: "#d4e6ff", transparent: true, opacity: 0.0, depthWrite: false }), [])
  useFrame((s, dt) => {
    const l = ref.current
    if (!l) return
    l.visible = env.rain > 0.03
    if (!l.visible) return
    material.opacity = env.rain * 0.45
    const arr = (geo.attributes.position as BufferAttribute).array as Float32Array
    const d = Math.min(dt, 0.05)
    for (let i = 0; i < DROPS; i++) {
      const q = seeds[i]
      q.y -= q.v * d
      if (q.y < 0) q.y += 26
      const x = player.x + ((q.x % 40) - 20)
      const z = player.z + ((q.z % 40) - 20)
      const y = player.y - 2 + q.y
      arr[i * 6] = x
      arr[i * 6 + 1] = y
      arr[i * 6 + 2] = z
      arr[i * 6 + 3] = x - 0.12
      arr[i * 6 + 4] = y - 0.8
      arr[i * 6 + 5] = z
    }
    ;(geo.attributes.position as BufferAttribute).needsUpdate = true
    void s
  })
  return <lineSegments ref={ref} geometry={geo} material={material} frustumCulled={false} />
}

// ---------- dust puffs when running ----------
const DUST = 28
const dust = { x: new Float32Array(DUST), y: new Float32Array(DUST), z: new Float32Array(DUST), life: new Float32Array(DUST), vx: new Float32Array(DUST), vz: new Float32Array(DUST), next: 0 }
export function emitDust(x: number, y: number, z: number, vx: number, vz: number) {
  const i = dust.next
  dust.next = (i + 1) % DUST
  dust.x[i] = x
  dust.y[i] = y + 0.1
  dust.z[i] = z
  dust.vx[i] = -vx * 0.15 + (Math.random() - 0.5) * 0.6
  dust.vz[i] = -vz * 0.15 + (Math.random() - 0.5) * 0.6
  dust.life[i] = 1
}

export function Dust() {
  const ref = useRef<InstancedMesh>(null)
  const d = useMemo(() => new Object3D(), [])
  const material = useMemo(() => new MeshLambertMaterial({ color: "#d9cfae", transparent: true, opacity: 0.55, depthWrite: false, flatShading: true }), [])
  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    const step = Math.min(dt, 0.05)
    for (let i = 0; i < DUST; i++) {
      const l = dust.life[i]
      if (l <= 0) {
        d.scale.set(0, 0, 0)
      } else {
        dust.life[i] = l - step * 2.2
        dust.x[i] += dust.vx[i] * step
        dust.z[i] += dust.vz[i] * step
        dust.y[i] += step * 0.8
        const sc = (1 - l) * 0.35 + 0.08
        d.scale.set(sc, sc, sc)
        d.position.set(dust.x[i], dust.y[i], dust.z[i])
      }
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[unitIco(0), material, DUST]} frustumCulled={false} />
}

// ---------- click target marker ----------
export function TargetMarker({ room = false }: { room?: boolean }) {
  const ref = useRef<Mesh>(null)
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    m.visible = input.targetActive
    if (!m.visible) return
    m.position.set(input.targetX, (room ? 0 : groundY(input.targetX, input.targetZ)) + 0.1, input.targetZ)
    const k = 1 + Math.sin(s.clock.elapsedTime * 6) * 0.12
    m.scale.set(k, k, k)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} material={mat("#fde047", { key: "marker", make: (m) => (m.emissive = new Color("#fde047")) })}>
      <ringGeometry args={[0.35, 0.55, 20]} />
    </mesh>
  )
}

