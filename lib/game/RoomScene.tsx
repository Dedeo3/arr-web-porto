"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  ConeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SRGBColorSpace,
  type PerspectiveCamera,
} from "three"
import { CharacterView, mat, unitBox, type Motion } from "./character"
import { env, player } from "./env"
import { InputController, readIntent } from "./controls"
import { B, Co, Cy, Sp } from "./Buildings"
import { TargetMarker } from "./Effects"
import { useReady } from "./CityScene"
import { BOUNDS, EXIT_MAT, PROJECT_STATIONS, ROOM_SPAWN, roomDef, type AABB } from "./rooms"
import { exitRoom, getState, input, openPanel, setNear, useGame, type RoomId } from "./store"
import { PROJECTS } from "../content"
import { mulberry32 } from "./world"
import { sfx } from "./audio"

// ---------- canvas helpers ----------
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas")
  cv.width = w
  cv.height = h
  draw(cv.getContext("2d")!)
  const t = new CanvasTexture(cv)
  t.colorSpace = SRGBColorSpace
  return t
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, maxLines = 3) {
  const words = text.split(" ")
  let line = ""
  let n = 0
  for (const w of words) {
    const test = line ? line + " " + w : w
    if (g.measureText(test).width > max && line) {
      g.fillText(line, x, y + n * lh)
      line = w
      n++
      if (n >= maxLines) return
    } else line = test
  }
  g.fillText(line, x, y + n * lh)
}

function screenTexture(index: number) {
  const p = PROJECTS[index]
  return canvasTex(512, 320, (g) => {
    const grad = g.createLinearGradient(0, 0, 512, 320)
    grad.addColorStop(0, "#10142b")
    grad.addColorStop(1, "#1d2450")
    g.fillStyle = grad
    g.fillRect(0, 0, 512, 320)
    g.fillStyle = p.color
    g.fillRect(0, 0, 512, 14)
    g.fillRect(34, 60, 8, 150)
    g.fillStyle = "#ffffff"
    g.font = "700 54px Fredoka, Inter, system-ui, sans-serif"
    g.textAlign = "left"
    wrap(g, p.title, 60, 100, 420, 58, 2)
    g.fillStyle = "#9fb0d8"
    g.font = "400 24px Inter, system-ui, sans-serif"
    wrap(g, p.tech.slice(0, 4).join("  ·  "), 60, 230, 420, 30, 2)
    g.fillStyle = p.color
    g.font = "600 24px Inter, system-ui, sans-serif"
    g.fillText(`#${String(index + 1).padStart(2, "0")}`, 60, 290)
  })
}

const codeLines = ["const app = Kotlin.compose()", "@Composable fun Home() {", "  Scaffold { Column { Text(\"Hi\") } }", "}", "flutter run --release", "npm run build && ship"]
function codeTexture() {
  return canvasTex(512, 320, (g) => {
    g.fillStyle = "#0c1222"
    g.fillRect(0, 0, 512, 320)
    g.font = "500 26px ui-monospace, Menlo, monospace"
    const cols = ["#7dd3fc", "#f9a8d4", "#86efac", "#fde68a", "#c4b5fd", "#fca5a5"]
    for (let i = 0; i < 9; i++) {
      g.fillStyle = cols[i % cols.length]
      g.fillText(codeLines[i % codeLines.length], 24 + (i % 3) * 18, 44 + i * 32)
    }
  })
}

function textTexture(text: string, bg: string, fg: string) {
  return canvasTex(512, 160, (g) => {
    g.fillStyle = bg
    g.fillRect(0, 0, 512, 160)
    g.strokeStyle = fg
    g.lineWidth = 8
    g.strokeRect(10, 10, 492, 140)
    g.fillStyle = fg
    g.font = "700 84px Fredoka, Inter, system-ui, sans-serif"
    g.textAlign = "center"
    g.fillText(text, 256, 112)
  })
}

function Plane({ p, s, tex, ry = 0 }: { p: [number, number, number]; s: [number, number]; tex: CanvasTexture; ry?: number }) {
  const m = useMemo(() => new MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  useEffect(
    () => () => {
      tex.dispose()
      m.dispose()
    },
    [tex, m],
  )
  return (
    <mesh position={p} rotation={[0, ry, 0]} material={m}>
      <planeGeometry args={s} />
    </mesh>
  )
}

// ---------- shell ----------
function Shell({ floor, wall, base, children }: { floor: string; wall: string; base: string; children?: React.ReactNode }) {
  return (
    <group>
      <B p={[0, -0.15, 0]} s={[16.8, 0.3, 12.8]} c={floor} />
      <B p={[0, 2.75, -6.2]} s={[16.8, 5.5, 0.4]} c={wall} />
      <B p={[-8.2, 2.75, 0]} s={[0.4, 5.5, 12.8]} c={wall} />
      <B p={[8.2, 2.75, 0]} s={[0.4, 5.5, 12.8]} c={wall} />
      <B p={[0, 0.2, -5.95]} s={[16, 0.4, 0.12]} c={base} cast={false} />
      <B p={[-7.95, 0.2, 0]} s={[0.12, 0.4, 12]} c={base} cast={false} />
      <B p={[7.95, 0.2, 0]} s={[0.12, 0.4, 12]} c={base} cast={false} />
      <B p={[0, 5.6, -6.2]} s={[17, 0.3, 0.6]} c={base} />
      <B p={[-8.2, 5.6, 0]} s={[0.6, 0.3, 13]} c={base} />
      <B p={[8.2, 5.6, 0]} s={[0.6, 0.3, 13]} c={base} />
      {/* doorstep + mat */}
      <B p={[0, -0.02, 6.25]} s={[16.8, 0.2, 0.5]} c="#6b6258" />
      <B p={[EXIT_MAT.x, 0.03, EXIT_MAT.z]} s={[EXIT_MAT.hx * 2, 0.06, EXIT_MAT.hz * 2]} c="#8b3a3a" cast={false} />
      <B p={[EXIT_MAT.x, 0.065, EXIT_MAT.z]} s={[EXIT_MAT.hx * 2 - 0.3, 0.02, EXIT_MAT.hz * 2 - 0.3]} c="#e8c27a" cast={false} />
      {children}
    </group>
  )
}

// ---------- stations ----------
const ringMat = new MeshBasicMaterial({ color: "#ffd84a", transparent: true, opacity: 0.9, depthWrite: false })
const beamMatR = new MeshBasicMaterial({ color: "#ffe27a", transparent: true, opacity: 0.18, blending: AdditiveBlending, depthWrite: false })
const beamGeoR = new ConeGeometry(0.85, 3.2, 14, 1, true)

function Stations({ list }: { list: Array<{ x: number; z: number }> }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    const grp = g.current
    if (!grp) return
    const t = s.clock.elapsedTime
    for (let i = 0; i < grp.children.length; i++) {
      const c = grp.children[i]
      const k = 1 + Math.sin(t * 3 + i) * 0.06
      c.scale.set(k, 1, k)
    }
    beamMatR.opacity = 0.14 + Math.sin(t * 2) * 0.04
  })
  return (
    <group ref={g}>
      {list.map((st, i) => (
        <group key={i} position={[st.x, 0.05, st.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
            <ringGeometry args={[0.7, 0.95, 28]} />
          </mesh>
          <mesh position={[0, 1.6, 0]} geometry={beamGeoR} material={beamMatR} />
        </group>
      ))}
    </group>
  )
}

// ---------- room player ----------
const rp = { x: 0, z: 0, vx: 0, vz: 0, y: 0, vy: 0, heading: Math.PI, ground: true, stepD: 0 }

function pushAABB(pos: { x: number; z: number }, r: number, b: AABB) {
  const cx = Math.max(b.x - b.hx, Math.min(b.x + b.hx, pos.x))
  const cz = Math.max(b.z - b.hz, Math.min(b.z + b.hz, pos.z))
  const dx = pos.x - cx
  const dz = pos.z - cz
  const d2 = dx * dx + dz * dz
  if (d2 >= r * r) return
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2)
    pos.x = cx + (dx / d) * r
    pos.z = cz + (dz / d) * r
  } else {
    const px = b.hx - Math.abs(pos.x - b.x)
    const pz = b.hz - Math.abs(pos.z - b.z)
    if (px < pz) pos.x = b.x + (pos.x >= b.x ? 1 : -1) * (b.hx + r)
    else pos.z = b.z + (pos.z >= b.z ? 1 : -1) * (b.hz + r)
  }
}

const tmpPos = { x: 0, z: 0 }

function RoomPlayer({ room }: { room: RoomId }) {
  const character = useGame((s) => s.character)
  const group = useRef<Group>(null)
  const motion = useRef<Motion>({ speed: 0, air: false, wave: false })
  const def = useMemo(() => roomDef(room, PROJECTS.map((p) => p.title)), [room])
  const init = useRef(false)
  const nearKey = useRef("")
  const t0 = useRef(0)

  if (!init.current) {
    init.current = true
    rp.x = ROOM_SPAWN.x
    rp.z = ROOM_SPAWN.z
    rp.vx = 0
    rp.vz = 0
    rp.y = 0
    rp.vy = 0
    rp.heading = Math.PI
    rp.ground = true
    input.targetActive = false
    player.x = rp.x
    player.z = rp.z
  }

  useEffect(() => () => setNear(null), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const cam = state.camera as PerspectiveCamera
    const gs = getState()
    input.frozen = gs.panel !== null || gs.cover
    const it = readIntent(0, rp.x, rp.z)
    const maxSpeed = it.run ? 6.2 : 3.8
    const k = 1 - Math.exp(-dt * 11)
    rp.vx += (it.x * it.mag * maxSpeed - rp.vx) * k
    rp.vz += (it.z * it.mag * maxSpeed - rp.vz) * k

    if (input.jumpQueued) {
      input.jumpQueued = false
      if (rp.ground && !input.frozen) {
        rp.vy = 6.2
        rp.ground = false
        sfx.jump()
      }
    }
    rp.vy -= 22 * dt
    rp.y += rp.vy * dt
    if (rp.y <= 0) {
      if (!rp.ground && rp.vy < -4) sfx.land()
      rp.y = 0
      rp.vy = 0
      rp.ground = true
    }

    tmpPos.x = rp.x + rp.vx * dt
    tmpPos.z = rp.z + rp.vz * dt
    for (let i = 0; i < def.colliders.length; i++) pushAABB(tmpPos, 0.42, def.colliders[i])
    tmpPos.x = Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, tmpPos.x))
    tmpPos.z = Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, tmpPos.z))
    rp.x = tmpPos.x
    rp.z = tmpPos.z

    const sp = Math.hypot(rp.vx, rp.vz)
    if (it.mag > 0.1 && sp > 0.4) {
      let diff = Math.atan2(rp.vx, rp.vz) - rp.heading
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      rp.heading += diff * (1 - Math.exp(-dt * 14))
    }
    rp.stepD += sp * dt
    if (rp.ground && sp > 1 && rp.stepD > 1.5) {
      rp.stepD = 0
      sfx.step()
    }
    motion.current.speed = Math.min(1.75, sp / 3.8)
    motion.current.air = !rp.ground
    const g = group.current
    if (g) {
      g.position.set(rp.x, rp.y, rp.z)
      g.rotation.y = rp.heading
    }
    player.x = rp.x
    player.y = rp.y
    player.z = rp.z

    // nearest station / exit
    let best = ""
    let bestLabel = ""
    let bestD = 1.35
    for (let i = 0; i < def.stations.length; i++) {
      const s = def.stations[i]
      const d = Math.hypot(rp.x - s.x, rp.z - s.z)
      if (d < bestD) {
        bestD = d
        best = s.id
        bestLabel = s.label
      }
    }
    let kind: "station" | "exit" | "" = best ? "station" : ""
    if (!best && Math.abs(rp.x - EXIT_MAT.x) < EXIT_MAT.hx + 0.3 && rp.z > EXIT_MAT.z - EXIT_MAT.hz - 0.4) {
      best = "exit"
      bestLabel = "Exit"
      kind = "exit"
    }
    const key = kind + best
    if (key !== nearKey.current) {
      nearKey.current = key
      setNear(kind ? { kind, id: best, label: bestLabel } : null)
    }
    if (input.interactQueued) {
      input.interactQueued = false
      if (!input.frozen && kind === "station") {
        sfx.click()
        openPanel(best)
      } else if (!input.frozen && kind === "exit") {
        sfx.door()
        exitRoom()
      }
    }

    // fixed three-quarter camera that drifts toward the player
    t0.current = Math.min(1, t0.current + dt / 1.1)
    const e = 1 - Math.pow(1 - t0.current, 3)
    const aspect = state.size.width / Math.max(1, state.size.height)
    const fit = Math.max(1, Math.pow(1.25 / aspect, 0.85))
    const dist = (1.35 - 0.35 * e) * fit
    const tx = rp.x * 0.3
    const tz = rp.z * 0.25 + 0.4
    cam.position.set(tx, 13.2 * dist, tz + 13.4 * dist)
    cam.lookAt(tx, 0.6, tz - 0.4)
    if (Math.abs(cam.fov - 40) > 0.05) {
      cam.fov = 40
      cam.updateProjectionMatrix()
    }
  })

  return (
    <group ref={group}>
      <CharacterView index={character} motion={motion} />
    </group>
  )
}

// ---------- lights ----------
function RoomLights({ warm = "#ffe2b8", bg = "#171421" }: { warm?: string; bg?: string }) {
  return (
    <>
      <color attach="background" args={[bg]} />
      <ambientLight intensity={1.15} color={warm} />
      <hemisphereLight args={["#fff4e0", "#5a4a3a", 0.9]} />
      <directionalLight
        position={[5, 14, 9]}
        intensity={1.9}
        color="#fff0d6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />
      <pointLight position={[0, 4.5, 1]} intensity={14} distance={16} color={warm} />
    </>
  )
}

// ---------- ROOM 1: About (bedroom) ----------
const skyGlass = new MeshBasicMaterial({ color: "#8fd0ff" })
const skyDay = new Color("#8fd0ff")
const skyNight = new Color("#1c2a58")

function Books({ x, y, z, w, n, seed }: { x: number; y: number; z: number; w: number; n: number; seed: number }) {
  const ref = useRef<InstancedMesh>(null)
  useEffect(() => {
    const m = ref.current
    if (!m) return
    const r = mulberry32(seed)
    const d = new Object3D()
    const c = new Color()
    const pal = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#8338ec", "#fb8500", "#e9c46a", "#2a9d8f"]
    let cx = x - w / 2 + 0.1
    for (let i = 0; i < n; i++) {
      const bw = 0.12 + r() * 0.14
      const bh = 0.55 + r() * 0.4
      d.position.set(cx + bw / 2, y + bh / 2, z)
      d.rotation.set(0, 0, i % 7 === 3 ? 0.18 : 0)
      d.scale.set(bw, bh, 0.55)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, c.set(pal[Math.floor(r() * pal.length)]))
      cx += bw + 0.02
      if (cx > x + w / 2 - 0.2) cx = x - w / 2 + 0.1
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [x, y, z, w, n, seed])
  return <instancedMesh ref={ref} args={[unitBox(), mat("#ffffff"), n]} castShadow frustumCulled={false} />
}

function AboutRoom() {
  useFrame(() => {
    skyGlass.color.copy(skyDay).lerp(skyNight, env.night)
  })
  const frames = useMemo(
    () => [
      { z: -0.6, y: 3.4, c: "#fca5a5", w: 1.1, h: 1.4 },
      { z: 0.9, y: 2.7, c: "#93c5fd", w: 1.5, h: 1.0 },
      { z: 2.4, y: 3.5, c: "#86efac", w: 1.0, h: 1.2 },
      { z: 1.4, y: 4.4, c: "#fde68a", w: 1.2, h: 0.8 },
      { z: -0.4, y: 2.2, c: "#c4b5fd", w: 0.9, h: 0.9 },
    ],
    [],
  )
  return (
    <Shell floor="#b98b5e" wall="#efe1c6" base="#8a5a32">
      {/* rug */}
      <Cy p={[0.3, 0.03, 0.8]} s={[2.8, 0.06, 2.8]} c="#c25b6b" seg={20} cast={false} />
      <Cy p={[0.3, 0.07, 0.8]} s={[2.0, 0.04, 2.0]} c="#e8a5ae" seg={20} cast={false} />
      {/* bed */}
      <B p={[-5.2, 0.3, -3.8]} s={[3, 0.5, 4.4]} c="#8a5a32" />
      <B p={[-5.2, 0.75, -3.8]} s={[2.8, 0.45, 4.1]} c="#ffffff" />
      <B p={[-5.2, 1.0, -3.0]} s={[2.9, 0.15, 2.5]} c="#2a9d8f" />
      <B p={[-5.2, 1.05, -5.4]} s={[1.6, 0.25, 0.8]} c="#fff8e7" />
      <B p={[-5.2, 1.5, -6.0]} s={[3.1, 1.5, 0.22]} c="#8a5a32" />
      {/* window */}
      <B p={[-5.2, 3.3, -5.98]} s={[2.6, 2.2, 0.16]} c="#ffffff" />
      <B p={[-5.2, 3.3, -5.88]} s={[2.3, 1.9, 0.1]} c="#ffffff" cast={false} />
      <mesh position={[-5.2, 3.3, -5.82]} material={skyGlass}>
        <planeGeometry args={[2.2, 1.8]} />
      </mesh>
      <B p={[-5.2, 3.3, -5.8]} s={[0.07, 1.8, 0.05]} c="#ffffff" cast={false} />
      <B p={[-5.2, 3.3, -5.8]} s={[2.2, 0.07, 0.05]} c="#ffffff" cast={false} />
      <B p={[-6.7, 3.3, -5.7]} s={[0.5, 2.3, 0.15]} c="#e07a8a" />
      <B p={[-3.7, 3.3, -5.7]} s={[0.5, 2.3, 0.15]} c="#e07a8a" />
      {/* bookshelf */}
      <B p={[2.2, 2.0, -5.9]} s={[4.8, 4.0, 0.1]} c="#7a4a2a" />
      <B p={[-0.15, 2.0, -5.5]} s={[0.12, 4.0, 1.0]} c="#7a4a2a" />
      <B p={[4.55, 2.0, -5.5]} s={[0.12, 4.0, 1.0]} c="#7a4a2a" />
      {[0.1, 1.1, 2.1, 3.1, 4.0].map((y, i) => (
        <B key={i} p={[2.2, y, -5.5]} s={[4.8, 0.1, 1.0]} c="#8a5a32" />
      ))}
      <Books x={2.2} y={0.15} z={-5.5} w={4.5} n={20} seed={11} />
      <Books x={2.2} y={1.15} z={-5.5} w={4.5} n={21} seed={12} />
      <Books x={2.2} y={2.15} z={-5.5} w={4.5} n={19} seed={13} />
      <Books x={2.2} y={3.15} z={-5.5} w={4.5} n={18} seed={14} />
      {/* desk + monitor */}
      <B p={[6, 1.0, -5.1]} s={[3.2, 0.14, 1.4]} c="#d9b383" />
      <B p={[4.6, 0.5, -5.1]} s={[0.14, 1.0, 1.3]} c="#b98b5e" />
      <B p={[7.4, 0.5, -5.1]} s={[0.14, 1.0, 1.3]} c="#b98b5e" />
      <B p={[6, 1.9, -5.4]} s={[1.6, 0.95, 0.1]} c="#2b2f3a" />
      <B p={[6, 1.9, -5.34]} s={[1.45, 0.8, 0.04]} c="#6aa7ff" cast={false} />
      <B p={[6, 1.3, -5.4]} s={[0.15, 0.5, 0.15]} c="#2b2f3a" />
      <B p={[6, 1.09, -4.7]} s={[1.0, 0.05, 0.35]} c="#3a3f4b" />
      <Cy p={[7.0, 1.2, -4.6]} s={[0.15, 0.25, 0.15]} c="#ef476f" seg={8} />
      <Cy p={[6, 0.55, -3.7]} s={[0.55, 0.12, 0.55]} c="#2a9d8f" seg={8} />
      <Cy p={[6, 0.28, -3.7]} s={[0.08, 0.55, 0.08]} c="#4b5563" seg={5} />
      {/* photo wall */}
      {frames.map((f, i) => (
        <group key={i} position={[-7.92, f.y, f.z]} rotation={[0, Math.PI / 2, 0]}>
          <B p={[0, 0, 0]} s={[f.w + 0.2, f.h + 0.2, 0.08]} c="#ffffff" />
          <B p={[0, 0, 0.05]} s={[f.w, f.h, 0.04]} c={f.c} cast={false} />
        </group>
      ))}
      {/* sofa */}
      <B p={[4.8, 0.35, 3.2]} s={[3.6, 0.6, 1.5]} c="#3f7f8f" />
      <B p={[4.8, 0.95, 3.85]} s={[3.6, 0.9, 0.4]} c="#36707e" />
      <B p={[3.1, 0.65, 3.2]} s={[0.35, 0.8, 1.5]} c="#36707e" />
      <B p={[6.5, 0.65, 3.2]} s={[0.35, 0.8, 1.5]} c="#36707e" />
      <B p={[4.8, 0.72, 3.1]} s={[3.0, 0.2, 1.0]} c="#4a97a8" />
      <B p={[4.8, 0.25, 1.5]} s={[1.5, 0.5, 0.8]} c="#a9784a" />
      {/* plant + lamp */}
      <Cy p={[-7.0, 0.3, 5.0]} s={[0.4, 0.6, 0.4]} c="#c0663a" seg={8} />
      <Sp p={[-7.0, 1.0, 5.0]} s={[0.6, 0.7, 0.6]} c="#4f9f45" />
      <Sp p={[-6.7, 1.4, 5.1]} s={[0.4, 0.45, 0.4]} c="#6bb852" />
      <Cy p={[-2.2, 1.0, -5.6]} s={[0.05, 2.0, 0.05]} c="#3a3f4b" seg={5} />
      <Co p={[-2.2, 2.1, -5.6]} s={[0.4, 0.4, 0.4]} c="#ffd166" seg={8} />
    </Shell>
  )
}

// ---------- ROOM 2: Gallery ----------
const spotMat = new MeshBasicMaterial({ color: "#fff2b8", transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false })
const spotGeo = new ConeGeometry(1.7, 4.6, 14, 1, true)

function Checker() {
  const ref = useRef<InstancedMesh>(null)
  useEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new Object3D()
    const c = new Color()
    let i = 0
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 12; z++) {
        d.position.set(-7.5 + x, 0.01, -5.5 + z)
        d.scale.set(0.98, 0.04, 0.98)
        d.updateMatrix()
        m.setMatrixAt(i, d.matrix)
        m.setColorAt(i, c.set((x + z) % 2 ? "#f3efe6" : "#c9d2e6"))
        i++
      }
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])
  return <instancedMesh ref={ref} args={[unitBox(), mat("#ffffff"), 192]} receiveShadow frustumCulled={false} />
}

function GalleryRoom() {
  const textures = useMemo(() => PROJECTS.map((_, i) => screenTexture(i)), [])
  const statue = useRef<Group>(null)
  useFrame((s) => {
    if (statue.current) statue.current.rotation.y = s.clock.elapsedTime * 0.7
  })
  return (
    <Shell floor="#9aa3b8" wall="#e5e9f3" base="#3b5bdb">
      <Checker />
      <B p={[0, 2.6, -5.98]} s={[15, 3.4, 0.08]} c="#1f2a5a" cast={false} />
      {PROJECT_STATIONS.map((st, i) => {
        if (st.side === "back") {
          return (
            <group key={i}>
              <B p={[st.x, 2.7, -5.9]} s={[3.5, 2.5, 0.2]} c="#0b0f22" />
              <Plane p={[st.x, 2.7, -5.78]} s={[3.1, 2.0]} tex={textures[i]} />
              <Cy p={[st.x, 5.1, -4.6]} s={[0.35, 0.3, 0.35]} c="#2b2f3a" seg={8} />
              <mesh position={[st.x, 2.7, -4.6]} geometry={spotGeo} material={spotMat} />
              <B p={[st.x, 0.2, -5.4]} s={[3.2, 0.4, 0.8]} c="#e7c35a" />
            </group>
          )
        }
        const dir = st.side === "left" ? 1 : -1
        const wx = st.side === "left" ? -7.9 : 7.9
        return (
          <group key={i}>
            <B p={[wx, 2.5, st.z]} s={[0.2, 1.8, 2.5]} c="#0b0f22" />
            <Plane p={[wx + dir * 0.11, 2.5, st.z]} s={[2.2, 1.4]} tex={textures[i]} ry={(dir * Math.PI) / 2} />
          </group>
        )
      })}
      {/* center statue on plinth */}
      <Cy p={[0, 0.35, 0]} s={[1.3, 0.7, 1.3]} c="#d5dbea" seg={10} />
      <Cy p={[0, 0.75, 0]} s={[1.5, 0.12, 1.5]} c="#e7c35a" seg={10} />
      <group ref={statue} position={[0, 0.8, 0]}>
        <Sp p={[0, 1.4, 0]} s={[0.55, 0.55, 0.55]} c="#f472b6" />
        <Co p={[0, 0.65, 0]} s={[0.7, 1.1, 0.7]} c="#818cf8" seg={5} r={[Math.PI, 0, 0]} />
        <Co p={[0, 2.2, 0]} s={[0.35, 0.9, 0.35]} c="#fbbf24" seg={5} />
        <B p={[0, 1.4, 0]} s={[1.9, 0.12, 0.12]} c="#34d399" r={[0, 0, 0.5]} />
        <B p={[0, 1.4, 0]} s={[0.12, 0.12, 1.9]} c="#34d399" r={[0.5, 0, 0]} />
      </group>
      {/* benches */}
      <B p={[-3.2, 0.3, 2.2]} s={[2.2, 0.4, 0.7]} c="#6b4a2c" />
      <B p={[3.2, 0.3, 2.2]} s={[2.2, 0.4, 0.7]} c="#6b4a2c" />
    </Shell>
  )
}

// ---------- ROOM 3: Workshop ----------
const ledA = new MeshBasicMaterial({ color: "#35f08a" })
const ledB = new MeshBasicMaterial({ color: "#ffb347" })
const ledC = new MeshBasicMaterial({ color: "#5ac8ff" })
const fireMat = new MeshBasicMaterial({ color: "#ff8a2a" })
const BASE_A = new Color("#35f08a")
const BASE_B = new Color("#ffb347")
const BASE_C = new Color("#5ac8ff")

function WorkshopRoom() {
  const code = useMemo(codeTexture, [])
  const gear = useRef<Group>(null)
  const fire = useRef<Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (gear.current) gear.current.rotation.y = t * 1.2
    ledA.color.copy(BASE_A).multiplyScalar(0.45 + 0.55 * Math.abs(Math.sin(t * 3.1)))
    ledB.color.copy(BASE_B).multiplyScalar(0.4 + 0.6 * Math.abs(Math.sin(t * 2.3 + 1)))
    ledC.color.copy(BASE_C).multiplyScalar(0.4 + 0.6 * Math.abs(Math.sin(t * 4.7 + 2)))
    fireMat.color.setHSL(0.07 + Math.sin(t * 9) * 0.015, 1, 0.5 + Math.sin(t * 13) * 0.06)
    if (fire.current) fire.current.scale.y = 1 + Math.sin(t * 11) * 0.12
  })
  const leds = useMemo(() => {
    const out: Array<{ p: [number, number, number]; m: number }> = []
    for (const rz of [-3.0, -0.8, 1.4]) for (let i = 0; i < 9; i++) out.push({ p: [-6.2, 0.6 + i * 0.3, rz + (i % 2 ? 0.3 : -0.3)], m: (i + Math.round(rz * 3)) % 3 })
    return out
  }, [])
  const tools: Array<[number, number, string, string]> = [
    [-6, 3.6, "#ef476f", "hammer"],
    [-4.6, 3.3, "#4b5563", "wrench"],
    [-3.4, 3.7, "#ffd166", "saw"],
    [-2.0, 3.4, "#06d6a0", "driver"],
    [-0.6, 3.6, "#118ab2", "pliers"],
    [0.8, 3.3, "#f78c6b", "hammer"],
    [2.2, 3.7, "#4b5563", "wrench"],
  ]
  return (
    <Shell floor="#7b8089" wall="#b5a387" base="#5b4630">
      <B p={[0, 0.02, 0.5]} s={[0.2, 0.02, 10]} c="#ffd166" cast={false} />
      <B p={[0, 3.2, -5.95]} s={[14, 3.4, 0.1]} c="#c9b48f" />
      {tools.map(([x, y, c, k], i) => (
        <group key={i} position={[x, y, -5.8]}>
          <B p={[0, -0.3, 0]} s={[0.12, 0.9, 0.08]} c="#8a5a32" />
          {k === "hammer" && <B p={[0, 0.25, 0]} s={[0.5, 0.25, 0.14]} c={c} />}
          {k === "wrench" && <Cy p={[0, 0.2, 0]} s={[0.24, 0.1, 0.24]} c={c} seg={6} r={[Math.PI / 2, 0, 0]} />}
          {k === "saw" && <B p={[0.2, -0.1, 0]} s={[0.9, 0.3, 0.05]} c={c} r={[0, 0, 0.5]} />}
          {k === "driver" && <B p={[0, 0.25, 0]} s={[0.1, 0.5, 0.1]} c={c} />}
          {k === "pliers" && <B p={[0, 0.2, 0]} s={[0.4, 0.5, 0.08]} c={c} r={[0, 0, 0.15]} />}
        </group>
      ))}
      {/* workbench */}
      <B p={[-1.0, 1.0, -5.2]} s={[5.6, 0.18, 1.5]} c="#a9784a" />
      {[-3.6, 1.6].map((x, i) => (
        <B key={i} p={[x, 0.5, -5.2]} s={[0.2, 1.0, 1.3]} c="#6b4a2c" />
      ))}
      <B p={[-2.9, 1.3, -5.1]} s={[0.5, 0.5, 0.5]} c="#d64545" />
      <group ref={gear} position={[0.3, 1.2, -5.1]}>
        <Cy p={[0, 0, 0]} s={[0.4, 0.15, 0.4]} c="#9aa3b2" seg={8} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <B key={i} p={[Math.cos((i * Math.PI) / 3) * 0.45, 0, Math.sin((i * Math.PI) / 3) * 0.45]} s={[0.2, 0.15, 0.2]} c="#9aa3b2" />
        ))}
      </group>
      <Cy p={[-0.6, 1.2, -5.0]} s={[0.12, 0.3, 0.12]} c="#ffd166" seg={6} />
      {/* terminal */}
      <B p={[5.5, 1.0, -5.1]} s={[3.2, 0.14, 1.5]} c="#d9d2c3" />
      <B p={[4.1, 0.5, -5.1]} s={[0.14, 1.0, 1.4]} c="#6b7280" />
      <B p={[6.9, 0.5, -5.1]} s={[0.14, 1.0, 1.4]} c="#6b7280" />
      <B p={[5.5, 2.0, -5.4]} s={[2.2, 1.45, 0.14]} c="#1b2030" />
      <Plane p={[5.5, 2.0, -5.32]} s={[2.0, 1.25]} tex={code} />
      <B p={[5.5, 1.25, -5.4]} s={[0.2, 0.55, 0.2]} c="#1b2030" />
      <B p={[5.5, 1.09, -4.6]} s={[1.3, 0.05, 0.4]} c="#3a3f4b" />
      {/* servers */}
      {[-3.0, -0.8, 1.4].map((z, i) => (
        <group key={i}>
          <B p={[-7.0, 1.7, z]} s={[1.4, 3.4, 1.9]} c="#36405c" />
          <B p={[-6.28, 1.7, z]} s={[0.05, 3.1, 1.7]} c="#222a40" cast={false} />
        </group>
      ))}
      {leds.map((l, i) => (
        <mesh key={i} position={l.p} material={l.m === 0 ? ledA : l.m === 1 ? ledB : ledC} geometry={unitBox()} scale={[0.04, 0.08, 0.14]} />
      ))}
      {/* toolbox */}
      <B p={[6.6, 0.5, 2.6]} s={[1.8, 0.9, 1.0]} c="#d64545" />
      <B p={[6.6, 1.0, 2.6]} s={[1.9, 0.15, 1.1]} c="#b83a3a" />
      <B p={[6.6, 1.25, 2.6]} s={[0.9, 0.12, 0.12]} c="#4b5563" />
      <Cy p={[6.1, 1.15, 2.9]} s={[0.12, 0.3, 0.12]} c="#ffd166" seg={6} r={[0, 0, Math.PI / 2]} />
      {/* furnace + anvil */}
      <B p={[-5.2, 1.1, 4.4]} s={[2.4, 2.2, 2.0]} c="#6b6f78" />
      <B p={[-5.2, 0.9, 5.42]} s={[1.4, 1.0, 0.1]} c="#2b2b33" cast={false} />
      <mesh ref={fire} position={[-5.2, 0.8, 5.36]} material={fireMat} geometry={unitBox()} scale={[1.1, 0.7, 0.06]} />
      <Cy p={[-5.2, 3.0, 4.2]} s={[0.4, 1.6, 0.4]} c="#4b5563" seg={8} />
      <B p={[-2.6, 0.4, 4.2]} s={[0.6, 0.8, 0.4]} c="#3a3f4b" />
      <B p={[-2.6, 0.95, 4.2]} s={[1.3, 0.3, 0.5]} c="#4b5563" />
      <Co p={[-1.8, 0.95, 4.2]} s={[0.25, 0.5, 0.25]} c="#4b5563" seg={5} r={[0, 0, -Math.PI / 2]} />
      {/* crates */}
      <B p={[7.0, 0.5, 5.0]} s={[1.0, 1.0, 1.0]} c="#c9954f" />
      <B p={[7.0, 1.4, 5.0]} s={[0.7, 0.8, 0.7]} c="#d6a35f" />
      <Cy p={[3.6, 0.5, 5.2]} s={[0.5, 1.0, 0.5]} c="#3b82a0" seg={8} />
    </Shell>
  )
}

// ---------- ROOM 4: Post Office ----------
function PostRoom({ npc }: { npc: number }) {
  const npcMotion = useRef<Motion>({ speed: 0, air: false, wave: true })
  const sign = useMemo(() => textTexture("MAIL", "#2f5aa8", "#ffffff"), [])
  const boxes = useRef<InstancedMesh>(null)
  const parcels = useRef<InstancedMesh>(null)
  useEffect(() => {
    const d = new Object3D()
    const c = new Color()
    const r = mulberry32(8)
    const pal = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#f78c6b", "#c77dff"]
    const m = boxes.current
    if (m) {
      let i = 0
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          d.position.set(-6.86, 0.7 + row * 0.55, -5.2 + col * 0.72)
          d.scale.set(0.06, 0.45, 0.62)
          d.rotation.set(0, 0, 0)
          d.updateMatrix()
          m.setMatrixAt(i, d.matrix)
          m.setColorAt(i, c.set(pal[Math.floor(r() * pal.length)]))
          i++
        }
      }
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    const q = parcels.current
    if (q) {
      let i = 0
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          const s = 0.5 + r() * 0.35
          d.position.set(7.35, 0.25 + row * 0.9 + s / 2, -0.8 + col * 0.95)
          d.scale.set(0.8, s, 0.7)
          d.rotation.set(0, (r() - 0.5) * 0.3, 0)
          d.updateMatrix()
          q.setMatrixAt(i, d.matrix)
          q.setColorAt(i, c.set(["#c9954f", "#d6b27a", "#e9d8b4"][Math.floor(r() * 3)]))
          i++
        }
      }
      q.instanceMatrix.needsUpdate = true
      if (q.instanceColor) q.instanceColor.needsUpdate = true
    }
  }, [])
  return (
    <Shell floor="#c9a574" wall="#efe3c8" base="#b83a3a">
      <B p={[-7.4, 1.8, -2.5]} s={[1.0, 3.6, 6.4]} c="#6b4a2c" />
      <instancedMesh ref={boxes} args={[unitBox(), mat("#ffffff"), 48]} frustumCulled={false} />
      <B p={[2, 0.55, -2.6]} s={[8, 1.1, 1.2]} c="#b83a3a" />
      <B p={[2, 1.15, -2.6]} s={[8.2, 0.14, 1.4]} c="#d9d2c3" />
      <Plane p={[2, 3.8, -5.9]} s={[3.2, 1.0]} tex={sign} />
      <B p={[2, 3.8, -5.95]} s={[3.4, 1.2, 0.1]} c="#1f2a5a" cast={false} />
      {/* counter props */}
      <Cy p={[0.2, 1.3, -2.4]} s={[0.18, 0.22, 0.18]} c="#8a5a32" seg={8} />
      <B p={[0.2, 1.45, -2.4]} s={[0.2, 0.1, 0.2]} c="#d64545" />
      <B p={[3.6, 1.28, -2.7]} s={[0.8, 0.14, 0.55]} c="#ffffff" />
      <B p={[3.6, 1.38, -2.7]} s={[0.8, 0.06, 0.55]} c="#fdf6e3" r={[0, 0.2, 0]} />
      <Cy p={[5.2, 1.3, -2.6]} s={[0.2, 0.2, 0.2]} c="#ffd166" seg={10} />
      <Sp p={[5.2, 1.45, -2.6]} s={[0.15, 0.1, 0.15]} c="#ffd166" d={0} />
      {/* clerk */}
      <group position={[2, 0, -4.3]}>
        <CharacterView index={npc} motion={npcMotion} />
      </group>
      {/* writing desk */}
      <B p={[-5.5, 1.0, 1.6]} s={[2.6, 0.14, 1.4]} c="#a9784a" />
      {[-6.6, -4.4].map((x, i) => (
        <B key={i} p={[x, 0.5, 1.6]} s={[0.14, 1.0, 1.3]} c="#6b4a2c" />
      ))}
      <B p={[-5.8, 1.1, 1.6]} s={[0.7, 0.04, 0.5]} c="#ffffff" r={[0, 0.3, 0]} cast={false} />
      <Cy p={[-4.8, 1.18, 1.3]} s={[0.12, 0.22, 0.12]} c="#1f2a5a" seg={8} />
      <Cy p={[-5.2, 1.12, 1.9]} s={[0.03, 0.4, 0.03]} c="#d64545" seg={4} r={[0, 0, 1.2]} />
      <Cy p={[-3.9, 0.55, 1.6]} s={[0.5, 0.1, 0.5]} c="#2f5aa8" seg={8} />
      <Cy p={[-3.9, 0.28, 1.6]} s={[0.08, 0.55, 0.08]} c="#4b5563" seg={5} />
      {/* parcel shelf */}
      <B p={[7.98, 2.0, 1.5]} s={[0.12, 4, 5.2]} c="#6b4a2c" />
      {[0.1, 1.0, 1.9, 2.8, 3.7].map((y, i) => (
        <B key={i} p={[7.4, y, 1.5]} s={[1.2, 0.1, 5.2]} c="#8a5a32" />
      ))}
      <instancedMesh ref={parcels} args={[unitBox(), mat("#ffffff"), 20]} castShadow frustumCulled={false} />
      {/* postbox + bags */}
      <Cy p={[-6.4, 0.9, 5.0]} s={[0.45, 1.8, 0.45]} c="#d64545" seg={10} />
      <Sp p={[-6.4, 1.8, 5.0]} s={[0.47, 0.3, 0.47]} c="#b83a3a" />
      <Sp p={[4.8, 0.4, 0.5]} s={[0.6, 0.45, 0.5]} c="#9a8a6a" />
      <Sp p={[5.5, 0.35, 1.2]} s={[0.5, 0.4, 0.45]} c="#8a7a5a" />
      <Cy p={[2, 0.02, 2.2]} s={[1.6, 0.04, 1.6]} c="#2f5aa8" seg={16} cast={false} />
    </Shell>
  )
}

// ---------- scene ----------
export function RoomScene() {
  const room = useGame((s) => s.room)
  const character = useGame((s) => s.character)
  useReady(10)
  if (!room) return null
  const def = roomDef(room, PROJECTS.map((p) => p.title))
  return (
    <group key={room}>
      <RoomLights bg={room === "projects" ? "#0f1226" : "#171421"} warm={room === "projects" ? "#e8eeff" : "#ffe2b8"} />
      {room === "about" && <AboutRoom />}
      {room === "projects" && <GalleryRoom />}
      {room === "skills" && <WorkshopRoom />}
      {room === "contact" && <PostRoom npc={1 - character} />}
      <Stations list={def.stations} />
      <RoomPlayer room={room} />
      <TargetMarker room />
      <InputController />
    </group>
  )
}

