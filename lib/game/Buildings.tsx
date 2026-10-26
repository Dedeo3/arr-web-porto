"use client"

import { useEffect, useMemo, useRef, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import { CanvasTexture, Color, ConeGeometry, ExtrudeGeometry, Group, Mesh, MeshLambertMaterial, SRGBColorSpace, Shape, Sprite, SpriteMaterial } from "three"
import { env, doors } from "./env"
import { BUILDINGS, GEAR, STATUE, VAN, groundY, type BuildingDef } from "./world"
import { geo, mat, unitBox, unitCone, unitCyl, unitIco } from "./character"

type V3 = [number, number, number]

// ---------- tiny primitives (shared geometry + shared materials) ----------
export function B({ p, s, c, r, cast = true, rec = true, m }: { p: V3; s: V3; c?: string; r?: V3; cast?: boolean; rec?: boolean; m?: MeshLambertMaterial }) {
  return <mesh geometry={unitBox()} material={m ?? mat(c ?? "#ffffff")} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow={rec} />
}
export function Cy({ p, s, c, seg = 8, r, cast = true, m }: { p: V3; s: V3; c?: string; seg?: number; r?: V3; cast?: boolean; m?: MeshLambertMaterial }) {
  return <mesh geometry={unitCyl(seg)} material={m ?? mat(c ?? "#ffffff")} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow />
}
export function Co({ p, s, c, seg = 6, r, cast = true }: { p: V3; s: V3; c: string; seg?: number; r?: V3; cast?: boolean }) {
  return <mesh geometry={unitCone(seg)} material={mat(c)} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow />
}
export function Sp({ p, s, c, d = 1, cast = true, m }: { p: V3; s: V3; c?: string; d?: number; cast?: boolean; m?: MeshLambertMaterial }) {
  return <mesh geometry={unitIco(d)} material={m ?? mat(c ?? "#ffffff")} position={p} scale={s} castShadow={cast} receiveShadow />
}

// triangular prism: base spans local x in [-0.5,0.5], apex at y=1, thickness 1 along z
const triPrism = () =>
  geo("triprism", () => {
    const sh = new Shape()
    sh.moveTo(-0.5, 0)
    sh.lineTo(0.5, 0)
    sh.lineTo(0, 1)
    sh.closePath()
    const g = new ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false })
    g.translate(0, 0, -0.5)
    return g
  })
export function Tri({ p, s, c, r }: { p: V3; s: V3; c: string; r?: V3 }) {
  return <mesh geometry={triPrism()} material={mat(c)} position={p} scale={s} rotation={r} castShadow receiveShadow />
}
const pyramid = () =>
  geo("pyramid", () => {
    const g = new ConeGeometry(Math.SQRT2, 1, 4, 1)
    g.rotateY(Math.PI / 4)
    g.translate(0, 0.5, 0)
    return g
  })
export function Pyr({ p, s, c }: { p: V3; s: V3; c: string }) {
  return <mesh geometry={pyramid()} material={mat(c)} position={p} scale={s} castShadow receiveShadow />
}

// ---------- lit windows ----------
export const glassMat = new MeshLambertMaterial({ color: "#bfe0f2", emissive: new Color("#ffcc66"), emissiveIntensity: 0, flatShading: true })
const glassDay = new Color("#bfe0f2")
const glassNight = new Color("#ffe3a1")

export function GlowDriver() {
  useFrame(() => {
    glassMat.emissiveIntensity = env.night * 1.25
    glassMat.color.copy(glassDay).lerp(glassNight, env.night)
  })
  return null
}

function Win({ p, w = 1.5, h = 1.3, flowers = false, frame = "#ffffff", ry = 0 }: { p: V3; w?: number; h?: number; flowers?: boolean; frame?: string; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0, 0]} s={[w + 0.3, h + 0.3, 0.14]} c={frame} />
      <B p={[0, 0, 0.05]} s={[w, h, 0.1]} m={glassMat} cast={false} />
      <B p={[0, 0, 0.08]} s={[0.06, h, 0.06]} c={frame} cast={false} />
      <B p={[0, 0, 0.08]} s={[w, 0.06, 0.06]} c={frame} cast={false} />
      {flowers && (
        <group position={[0, -h / 2 - 0.2, 0.3]}>
          <B p={[0, 0, 0]} s={[w + 0.3, 0.3, 0.45]} c="#7a5230" />
          {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
            <Sp key={i} p={[x * (w / 1.5), 0.25, 0]} s={[0.17, 0.17, 0.17]} c={["#f472b6", "#fde047", "#fb7185", "#c084fc"][i]} d={0} cast={false} />
          ))}
        </group>
      )}
    </group>
  )
}

function Door({ id, w = 1.6, h = 2.6, c = "#7a4a2a", z }: { id: string; w?: number; h?: number; c?: string; z: number }) {
  const leaf = useRef<Group>(null)
  useFrame((_, dt) => {
    const d = doors[id]
    d.open += (d.target - d.open) * Math.min(1, dt * 7)
    if (leaf.current) leaf.current.rotation.y = -d.open * 1.5
  })
  return (
    <group position={[0, 0, z]}>
      <B p={[0, h / 2, 0.02]} s={[w + 0.3, h + 0.2, 0.12]} c="#f4f1ea" />
      <B p={[0, h / 2 - 0.05, 0.04]} s={[w, h - 0.1, 0.1]} c="#2b1d14" cast={false} />
      <group ref={leaf} position={[-w / 2, 0, 0.1]}>
        <B p={[w / 2, h / 2 - 0.05, 0]} s={[w, h - 0.1, 0.12]} c={c} />
        <Sp p={[w - 0.2, h / 2 - 0.1, 0.1]} s={[0.1, 0.1, 0.1]} c="#e7c35a" d={0} cast={false} />
      </group>
    </group>
  )
}

// ---------- labels ----------
function makeLabel(text: string, sub: string, accent: string) {
  const w = 512
  const h = 160
  const cv = document.createElement("canvas")
  cv.width = w
  cv.height = h
  const g = cv.getContext("2d")!
  g.clearRect(0, 0, w, h)
  g.fillStyle = "rgba(15,20,40,0.78)"
  const r = 36
  g.beginPath()
  g.moveTo(r, 8)
  g.lineTo(w - r, 8)
  g.quadraticCurveTo(w - 8, 8, w - 8, r)
  g.lineTo(w - 8, h - r)
  g.quadraticCurveTo(w - 8, h - 8, w - r, h - 8)
  g.lineTo(r, h - 8)
  g.quadraticCurveTo(8, h - 8, 8, h - r)
  g.lineTo(8, r)
  g.quadraticCurveTo(8, 8, r, 8)
  g.closePath()
  g.fill()
  g.lineWidth = 5
  g.strokeStyle = accent
  g.stroke()
  g.textAlign = "center"
  g.fillStyle = "#ffffff"
  g.font = "600 56px Fredoka, Inter, system-ui, sans-serif"
  g.fillText(text, w / 2, 78)
  g.fillStyle = accent
  g.font = "500 30px Inter, system-ui, sans-serif"
  g.fillText(sub.toUpperCase(), w / 2, 124)
  const t = new CanvasTexture(cv)
  t.colorSpace = SRGBColorSpace
  return t
}

function Label({ text, sub, accent, y }: { text: string; sub: string; accent: string; y: number }) {
  const tex = useMemo(() => makeLabel(text, sub, accent), [text, sub, accent])
  const m = useMemo(() => new SpriteMaterial({ map: tex, transparent: true, depthWrite: false }), [tex])
  useEffect(
    () => () => {
      tex.dispose()
      m.dispose()
    },
    [tex, m],
  )
  const ref = useRef<Sprite>(null)
  useFrame((s) => {
    const g = ref.current
    if (g) g.position.y = y + Math.sin(s.clock.elapsedTime * 1.4 + y) * 0.18
  })
  return (
    <sprite ref={ref} material={m} position={[0, y, 0]} scale={[7, 2.2, 1]} renderOrder={5} />
  )
}

function Frame({ b, children }: { b: BuildingDef; children: ReactNode }) {
  return (
    <group position={[b.x, groundY(b.x, b.z), b.z]} rotation={[0, b.yaw, 0]}>
      {children}
    </group>
  )
}

function Mat({ z, c = "#8b3a3a" }: { z: number; c?: string }) {
  return <B p={[0, 0.04, z]} s={[2.4, 0.08, 1.2]} c={c} cast={false} />
}

// ---------- 1. My House ----------
function MyHouse({ b }: { b: BuildingDef }) {
  const hz = b.hz
  const hx = b.hx
  const slope = Math.atan2(3.2, hz + 0.9)
  const slabLen = Math.hypot(hz + 0.9, 3.2)
  return (
    <Frame b={b}>
      <B p={[0, 0.25, 0]} s={[hx * 2 + 0.4, 0.5, hz * 2 + 0.4]} c="#c9a875" />
      <B p={[0, 2.6, 0]} s={[hx * 2, 4.2, hz * 2]} c="#f4e6cb" />
      <B p={[0, 0.7, hz + 0.02]} s={[hx * 2, 0.5, 0.06]} c="#e3cfa6" cast={false} />
      {/* gable roof */}
      <B p={[0, 4.7 + 1.6, (hz + 0.9) / 2]} s={[hx * 2 + 1.4, 0.3, slabLen]} r={[slope, 0, 0]} c="#c2573a" />
      <B p={[0, 4.7 + 1.6, -(hz + 0.9) / 2]} s={[hx * 2 + 1.4, 0.3, slabLen]} r={[-slope, 0, 0]} c="#b34a31" />
      <B p={[0, 4.7 + 3.2, 0]} s={[hx * 2 + 1.5, 0.3, 0.5]} c="#8e3a26" />
      <Tri p={[hx, 4.7, 0]} s={[hz * 2, 3.2, 0.2]} r={[0, Math.PI / 2, 0]} c="#f4e6cb" />
      <Tri p={[-hx, 4.7, 0]} s={[hz * 2, 3.2, 0.2]} r={[0, Math.PI / 2, 0]} c="#f4e6cb" />
      {/* porch */}
      <B p={[0, 0.15, hz + 1.5]} s={[6.4, 0.3, 3]} c="#9a6b3f" />
      <Cy p={[-2.7, 1.6, hz + 2.7]} s={[0.16, 3.2, 0.16]} c="#ffffff" seg={6} />
      <Cy p={[2.7, 1.6, hz + 2.7]} s={[0.16, 3.2, 0.16]} c="#ffffff" seg={6} />
      <B p={[0, 3.3, hz + 1.7]} s={[6.8, 0.2, 3.4]} c="#c2573a" r={[0.1, 0, 0]} />
      <Door id="about" z={hz} />
      <Mat z={hz + 1.6} />
      {/* windows */}
      <Win p={[-3.9, 2.5, hz + 0.05]} flowers />
      <Win p={[3.9, 2.5, hz + 0.05]} flowers />
      <Win p={[hx + 0.05, 2.5, -1.8]} ry={Math.PI / 2} />
      <Win p={[hx + 0.05, 2.5, 1.8]} ry={Math.PI / 2} />
      <Win p={[-hx - 0.05, 2.5, -1.8]} ry={-Math.PI / 2} />
      <Win p={[-hx - 0.05, 2.5, 1.8]} ry={-Math.PI / 2} />
      {/* dormer */}
      <B p={[-3.2, 6.0, hz - 1.6]} s={[2.2, 1.7, 1.8]} c="#f4e6cb" />
      <Tri p={[-3.2, 6.85, hz - 1.6]} s={[2.9, 1.2, 2.3]} r={[0, Math.PI / 2, 0]} c="#b34a31" />
      <Win p={[-3.2, 6.05, hz - 0.68]} w={0.9} h={0.8} />
      {/* chimney */}
      <B p={[3.8, 7.2, -1.6]} s={[1, 3, 1]} c="#a14d3a" />
      <B p={[3.8, 8.8, -1.6]} s={[1.3, 0.25, 1.3]} c="#6b3a2a" />
      <Label text="My House" sub="About" accent="#fbbf24" y={11.2} />
    </Frame>
  )
}

// ---------- 2. Project Gallery ----------
function Gallery({ b }: { b: BuildingDef }) {
  const hz = b.hz
  const hx = b.hx
  const dome = useMemo(() => new MeshLambertMaterial({ color: "#9be7ff", transparent: true, opacity: 0.45, flatShading: true }), [])
  const flagA = useRef<Mesh>(null)
  const flagB = useRef<Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (flagA.current) flagA.current.rotation.y = Math.sin(t * 2) * 0.25
    if (flagB.current) flagB.current.rotation.y = Math.sin(t * 2 + 1) * 0.25
  })
  return (
    <Frame b={b}>
      <B p={[0, 0.3, 0]} s={[hx * 2 + 0.6, 0.6, hz * 2 + 0.6]} c="#c7cfe0" />
      <B p={[0, 3.2, 0]} s={[hx * 2, 5.2, hz * 2]} c="#eef1f8" />
      <B p={[0, 1.0, hz + 0.03]} s={[hx * 2, 0.7, 0.06]} c="#3b5bdb" cast={false} />
      <B p={[0, 6.0, 0]} s={[hx * 2 + 0.6, 0.5, hz * 2 + 0.6]} c="#3b5bdb" />
      <Sp p={[0, 6.2, 0]} s={[3.6, 3, 3.6]} m={dome} cast={false} />
      <Cy p={[0, 6.3, 0]} s={[3.7, 0.2, 3.7]} c="#e7c35a" seg={12} />
      {/* portico */}
      <B p={[0, 5.5, hz + 1.1]} s={[hx * 2 - 1, 0.5, 2.6]} c="#eef1f8" />
      <Tri p={[0, 5.75, hz + 1.1]} s={[hx * 2 - 1, 1.5, 2.6]} c="#d5dbea" r={[0, 0, 0]} />
      {[-5.4, -3.3, 3.3, 5.4].map((x, i) => (
        <Cy key={i} p={[x, 2.7, hz + 2.1]} s={[0.4, 5.1, 0.4]} c="#ffffff" seg={10} />
      ))}
      <B p={[0, 0.2, hz + 1.2]} s={[hx * 2 - 0.4, 0.4, 3.2]} c="#cfd6e6" />
      <Door id="projects" z={hz} w={2} h={3} c="#3b5bdb" />
      <Mat z={hz + 1.7} c="#3b5bdb" />
      {[-4.4, 4.4].map((x, i) => (
        <Win key={i} p={[x, 3.0, hz + 0.05]} w={1.4} h={2.6} />
      ))}
      {[-2, 2].map((z, i) => (
        <group key={i}>
          <Win p={[hx + 0.05, 3, z * 1.4]} w={1.4} h={2.6} ry={Math.PI / 2} />
          <Win p={[-hx - 0.05, 3, z * 1.4]} w={1.4} h={2.6} ry={-Math.PI / 2} />
        </group>
      ))}
      {/* banners */}
      <group position={[-2.1, 4.6, hz + 0.12]}>
        <mesh ref={flagA} geometry={unitBox()} material={mat("#ef476f")} scale={[0.9, 1.8, 0.05]} position={[0, -0.9, 0]} castShadow />
      </group>
      <group position={[2.1, 4.6, hz + 0.12]}>
        <mesh ref={flagB} geometry={unitBox()} material={mat("#ffd166")} scale={[0.9, 1.8, 0.05]} position={[0, -0.9, 0]} castShadow />
      </group>
      <Label text="Project Gallery" sub="Projects" accent="#818cf8" y={10.2} />
    </Frame>
  )
}

// ---------- 3. Workshop ----------
function Workshop({ b }: { b: BuildingDef }) {
  const hz = b.hz
  const hx = b.hx
  return (
    <Frame b={b}>
      <B p={[0, 0.25, 0]} s={[hx * 2 + 0.4, 0.5, hz * 2 + 0.4]} c="#6b7280" />
      <B p={[0, 2.5, 0]} s={[hx * 2, 4.5, hz * 2]} c="#c79a66" />
      {[-4.4, -1.5, 1.5, 4.4].map((x, i) => (
        <B key={i} p={[x, 2.5, hz + 0.04]} s={[0.16, 4.5, 0.1]} c="#8a6038" cast={false} />
      ))}
      <B p={[0, 4.9, 0]} s={[hx * 2 + 0.5, 0.3, hz * 2 + 0.5]} c="#4b5563" />
      {[-4.3, 0, 4.3].map((x, i) => (
        <Tri key={i} p={[x, 5.0, 0]} s={[4.3, 2.2, hz * 2 + 0.5]} c={i % 2 ? "#59606f" : "#4b5563"} />
      ))}
      {[-4.3, 0, 4.3].map((x, i) => (
        <B key={i} p={[x - 1.8, 6.1, 0]} s={[0.05, 1.5, hz * 2]} m={glassMat} cast={false} />
      ))}
      <Cy p={[-4.6, 7.4, -2.5]} s={[0.55, 5.4, 0.55]} c="#7a4a3a" seg={8} />
      <Cy p={[-4.6, 10.2, -2.5]} s={[0.7, 0.3, 0.7]} c="#4a2f26" seg={8} />
      <Door id="skills" z={hz} w={2.4} h={3} c="#556070" />
      <Mat z={hz + 1.6} c="#3f4a57" />
      <Win p={[-4.6, 2.6, hz + 0.05]} w={2} h={1.5} frame="#8a6038" />
      <Win p={[4.6, 2.6, hz + 0.05]} w={2} h={1.5} frame="#8a6038" />
      <Win p={[hx + 0.05, 2.6, 0]} w={2.4} h={1.5} frame="#8a6038" ry={Math.PI / 2} />
      <Win p={[-hx - 0.05, 2.6, 0]} w={2.4} h={1.5} frame="#8a6038" ry={-Math.PI / 2} />
      {/* water tank on legs */}
      <group position={[4.2, 5.0, -2.5]}>
        {[
          [-0.9, -0.9],
          [0.9, -0.9],
          [-0.9, 0.9],
          [0.9, 0.9],
        ].map(([x, z], i) => (
          <Cy key={i} p={[x, 1.1, z]} s={[0.09, 2.2, 0.09]} c="#6b7280" seg={5} />
        ))}
        <Cy p={[0, 3.2, 0]} s={[1.3, 2.1, 1.3]} c="#9a6b3f" seg={10} />
        <Cy p={[0, 3.0, 0]} s={[1.36, 0.1, 1.36]} c="#4b5563" seg={10} />
        <Cy p={[0, 3.6, 0]} s={[1.36, 0.1, 1.36]} c="#4b5563" seg={10} />
        <Co p={[0, 4.7, 0]} s={[1.5, 0.9, 1.5]} c="#4b5563" seg={10} />
      </group>
      {/* barrels + planks */}
      {[
        [-5.6, hz + 1.6],
        [-4.6, hz + 2.1],
        [5.6, hz + 1.4],
      ].map(([x, z], i) => (
        <Cy key={i} p={[x, 0.55, z]} s={[0.55, 1.1, 0.55]} c={i === 2 ? "#3b82a0" : "#8a5a32"} seg={8} />
      ))}
      <B p={[5.2, 0.35, hz + 2.4]} s={[1.6, 0.7, 0.9]} c="#b08a58" />
      <Label text="Workshop" sub="Skills" accent="#34d399" y={11.4} />
    </Frame>
  )
}

// ---------- 4. Post Office ----------
function PostOffice({ b }: { b: BuildingDef }) {
  const hz = b.hz
  const hx = b.hx
  const env1 = useRef<Group>(null)
  useFrame((s) => {
    if (env1.current) {
      env1.current.rotation.y = s.clock.elapsedTime * 0.8
      env1.current.position.y = 10.6 + Math.sin(s.clock.elapsedTime * 1.5) * 0.3
    }
  })
  return (
    <Frame b={b}>
      <B p={[0, 0.25, 0]} s={[hx * 2 + 0.4, 0.5, hz * 2 + 0.4]} c="#c9bda0" />
      <B p={[0, 2.5, 0]} s={[hx * 2, 4.5, hz * 2]} c="#efe0bd" />
      <B p={[0, 4.55, 0]} s={[hx * 2 + 0.4, 0.4, hz * 2 + 0.4]} c="#2f5aa8" />
      <Pyr p={[0, 4.75, 0]} s={[hx + 0.9, 3.4, hz + 0.9]} c="#2f5aa8" />
      <B p={[0, 3.8, hz + 0.05]} s={[hx * 2, 0.5, 0.1]} c="#d64545" cast={false} />
      {/* awning over door */}
      <B p={[0, 3.2, hz + 1.1]} s={[4.4, 0.18, 2.4]} c="#d64545" r={[0.25, 0, 0]} />
      {[-0.9, 0.9].map((x, i) => (
        <B key={i} p={[x * 2.2 - 0, 3.15, hz + 1.1]} s={[0.9, 0.2, 2.45]} c="#ffffff" r={[0.25, 0, 0]} cast={false} />
      ))}
      <Door id="contact" z={hz} c="#d64545" />
      <Mat z={hz + 1.6} c="#2f5aa8" />
      <Win p={[-4.1, 2.5, hz + 0.05]} w={1.7} />
      <Win p={[4.1, 2.5, hz + 0.05]} w={1.7} />
      <Win p={[hx + 0.05, 2.5, 0]} ry={Math.PI / 2} />
      <Win p={[-hx - 0.05, 2.5, 0]} ry={-Math.PI / 2} />
      {/* pillar box */}
      <Cy p={[3.6, 0.8, hz + 2.2]} s={[0.4, 1.6, 0.4]} c="#d64545" seg={10} />
      <Sp p={[3.6, 1.65, hz + 2.2]} s={[0.42, 0.28, 0.42]} c="#b83a3a" />
      {/* giant spinning envelope */}
      <group ref={env1} position={[0, 10.6, 0]}>
        <B p={[0, 0, 0]} s={[3.6, 2.4, 0.3]} c="#ffffff" />
        <Tri p={[0, 0.6, 0.17]} s={[3.6, -1.2, 0.08]} c="#e5e7eb" r={[0, 0, Math.PI]} />
        <Sp p={[0, 0.15, 0.24]} s={[0.28, 0.28, 0.1]} c="#d64545" d={0} />
      </group>
      <Label text="Post Office" sub="Contact" accent="#fb7185" y={13.4} />
    </Frame>
  )
}

// ---------- free-standing props ----------
export function Van() {
  return (
    <group position={[VAN.x, groundY(VAN.x, VAN.z), VAN.z]} rotation={[0, VAN.yaw, 0]}>
      <B p={[0, 1.15, -0.2]} s={[2.2, 1.7, 3.6]} c="#f5f5f5" />
      <B p={[0, 0.85, 1.9]} s={[2.1, 1.1, 1.3]} c="#2f5aa8" />
      <B p={[0, 1.5, 2.5]} s={[1.8, 0.7, 0.1]} m={glassMat} cast={false} />
      <B p={[0, 1.2, -0.2]} s={[2.24, 0.25, 3.62]} c="#d64545" cast={false} />
      {[
        [-1.1, 1.3],
        [1.1, 1.3],
        [-1.1, -1.4],
        [1.1, -1.4],
      ].map(([x, z], i) => (
        <Cy key={i} p={[x, 0.42, z]} s={[0.45, 0.35, 0.45]} c="#2b2b33" seg={8} r={[0, 0, Math.PI / 2]} />
      ))}
    </group>
  )
}

export function Statue() {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (g.current) g.current.rotation.y = s.clock.elapsedTime * 0.7
  })
  const y = groundY(STATUE.x, STATUE.z)
  return (
    <group position={[STATUE.x, y, STATUE.z]}>
      <Cy p={[0, 0.5, 0]} s={[1.0, 1.0, 1.0]} c="#c7cfe0" seg={8} />
      <group ref={g} position={[0, 1.0, 0]}>
        <Sp p={[0, 1.1, 0]} s={[0.55, 0.55, 0.55]} c="#e7c35a" d={0} />
        <Co p={[0, 0.45, 0]} s={[0.6, 0.9, 0.6]} c="#e7c35a" seg={5} r={[Math.PI, 0, 0]} />
        <Co p={[0, 1.9, 0]} s={[0.3, 0.8, 0.3]} c="#f472b6" seg={5} />
        <B p={[0, 1.3, 0]} s={[1.6, 0.1, 0.1]} c="#e7c35a" r={[0, 0, 0.4]} />
      </group>
    </group>
  )
}

export function GearProp() {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (g.current) g.current.rotation.z = s.clock.elapsedTime * 0.5
  })
  const y = groundY(GEAR.x, GEAR.z)
  const teeth = 10
  return (
    <group position={[GEAR.x, y, GEAR.z]} rotation={[0, 0.8, 0]}>
      <Cy p={[0, 1.2, -0.3]} s={[0.12, 2.4, 0.12]} c="#6b7280" seg={5} />
      <group ref={g} position={[0, 2.8, 0]}>
        <Cy p={[0, 0, 0]} s={[1.3, 0.35, 1.3]} c="#9aa3b2" seg={14} r={[Math.PI / 2, 0, 0]} />
        <Cy p={[0, 0, 0]} s={[0.4, 0.5, 0.4]} c="#4b5563" seg={8} r={[Math.PI / 2, 0, 0]} />
        {Array.from({ length: teeth }).map((_, i) => {
          const a = (i / teeth) * Math.PI * 2
          return <B key={i} p={[Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0]} s={[0.45, 0.45, 0.35]} c="#9aa3b2" r={[0, 0, a]} />
        })}
      </group>
    </group>
  )
}

export function Buildings() {
  return (
    <>
      <GlowDriver />
      {BUILDINGS.map((b) => {
        if (b.id === "about") return <MyHouse key={b.id} b={b} />
        if (b.id === "projects") return <Gallery key={b.id} b={b} />
        if (b.id === "skills") return <Workshop key={b.id} b={b} />
        return <PostOffice key={b.id} b={b} />
      })}
      <Van />
      <Statue />
      <GearProp />
    </>
  )
}

