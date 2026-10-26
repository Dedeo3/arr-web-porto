"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { BufferAttribute, BufferGeometry, Color, Group, InstancedMesh, Line, LineBasicMaterial, Mesh, Object3D, type PerspectiveCamera } from "three"
import { CharacterView, mat, unitBox, unitCyl, unitIco, type Motion } from "./character"
import { env, player, doors, NPCS, fishing } from "./env"
import { InputController, readIntent } from "./controls"
import { Lighting } from "./Lighting"
import { Sea, Terrain } from "./Terrain"
import { Decor } from "./Decor"
import { Buildings } from "./Buildings"
import { Balloon, Dock, Fountain, Lamps, Lighthouse, SignPost, Windmill } from "./Landmarks"
import { Birds, Clouds, Dust, Fireflies, Rain, Smoke, TargetMarker, emitDust } from "./Effects"
import { addFish, enterRoom, openGuide, getState, input, markReady, setNear, setState, spawn, toast, useGame } from "./store"
import { sfx } from "./audio"
import {
  BUILDINGS,
  CLAUDE,
  SEA,
  FISH_SPOTS,
  bodies,
  buildingById,
  doorPoint,
  exitPoint,
  groundY,
  initToys,
  isWater,
  pinsDown,
  pushOut,
  resetPins,
  stepToys,
  takeImpact,
  type BuildingId,
} from "./world"

/** Calls markReady() once the scene has rendered a few frames (compiles shaders behind the curtain). */
export function useReady(frames = 10) {
  const n = useRef(0)
  useFrame(() => {
    n.current++
    if (n.current === frames) markReady()
  })
}

const DOORS = BUILDINGS.map((b) => {
  const d = doorPoint(b)
  return { id: b.id as BuildingId, name: b.name, x: d.x, z: d.z }
})

type PState = {
  x: number
  y: number
  z: number
  vx: number
  vz: number
  vy: number
  heading: number
  onGround: boolean
  stepD: number
  dustT: number
  safeX: number
  safeZ: number
  safeT: number
  intro: number
  push: number
  camInit: boolean
  nearId: string
  pinsT: number
  struck: boolean
}

function initPlayer(): PState {
  let x = spawn.cityX
  let z = spawn.cityZ
  let heading = spawn.cityYaw
  let intro = 1
  if (spawn.fromBuilding) {
    const b = buildingById(spawn.fromBuilding)
    const e = exitPoint(b)
    x = e.x
    z = e.z
    heading = b.yaw
    // camera on the plaza side looking back at the facade, never inside the building
    input.camYaw = b.yaw
    spawn.fromBuilding = null
  } else {
    input.camYaw = 0
    if (spawn.intro) intro = env.reduced ? 0.6 : 0
  }
  spawn.intro = false
  input.targetActive = false
  return {
    x,
    y: groundY(x, z),
    z,
    vx: 0,
    vz: 0,
    vy: 0,
    heading,
    onGround: true,
    stepD: 0,
    dustT: 0,
    safeX: x,
    safeZ: z,
    safeT: 0,
    intro,
    push: 0,
    camInit: false,
    nearId: "",
    pinsT: 0,
    struck: false,
  }
}

const pos = { x: 0, z: 0 }
const nrm = { x: 0, z: 0 }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function CityPlayer() {
  const character = useGame((st) => st.character)
  const group = useRef<Group>(null)
  const motion = useRef<Motion>({ speed: 0, air: false, wave: false })
  const stRef = useRef<PState | null>(null)
  if (stRef.current === null) stRef.current = initPlayer()

  useEffect(() => {
    return () => {
      for (const k in doors) doors[k].target = 0
      setNear(null)
    }
  }, [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = stRef.current!
    const cam = state.camera as PerspectiveCamera
    const gs = getState()
    input.frozen = gs.panel !== null || gs.cover || gs.guide || spawn.entering
    const it = readIntent(input.camYaw, p.x, p.z)

    // ----- horizontal -----
    const maxSpeed = it.run ? 7.6 : 4.4
    const k = 1 - Math.exp(-dt * (p.onGround ? 11 : 3.5))
    p.vx += (it.x * it.mag * maxSpeed - p.vx) * k
    p.vz += (it.z * it.mag * maxSpeed - p.vz) * k

    if (input.jumpQueued) {
      input.jumpQueued = false
      if (p.onGround && !input.frozen) {
        p.vy = 7.6
        p.onGround = false
        sfx.jump()
      }
    }

    let nx = p.x + p.vx * dt
    let nz = p.z + p.vz * dt
    if (isWater(nx, nz) && p.onGround) {
      if (!isWater(nx, p.z)) {
        nz = p.z
        p.vz = 0
      } else if (!isWater(p.x, nz)) {
        nx = p.x
        p.vx = 0
      } else {
        nx = p.x
        nz = p.z
        p.vx = 0
        p.vz = 0
      }
    }
    pos.x = nx
    pos.z = nz
    if (pushOut(pos, 0.45, nrm)) {
      const l = Math.hypot(nrm.x, nrm.z)
      if (l > 0) {
        const ux = nrm.x / l
        const uz = nrm.z / l
        const vn = p.vx * ux + p.vz * uz
        if (vn < 0) {
          p.vx -= vn * ux
          p.vz -= vn * uz
        }
      }
    }
    p.x = pos.x
    p.z = pos.z

    // ----- vertical -----
    p.vy -= 24 * dt
    p.y += p.vy * dt
    const g = groundY(p.x, p.z)
    if (p.y <= g) {
      if (!p.onGround && p.vy < -5) {
        sfx.land()
        for (let i = 0; i < 4; i++) emitDust(p.x, g, p.z, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12)
      }
      p.y = g
      p.vy = 0
      p.onGround = true
    } else if (p.onGround && p.y - g < 0.5 && p.vy <= 0) {
      p.y = g
      p.vy = 0
    } else {
      p.onGround = false
    }
    // safety net: never stay in the sea
    if (p.onGround) {
      if (g < SEA + 0.18) {
        p.x = p.safeX
        p.z = p.safeZ
        p.y = groundY(p.x, p.z)
        p.vx = 0
        p.vz = 0
      } else {
        p.safeT -= dt
        if (p.safeT <= 0) {
          p.safeT = 0.3
          p.safeX = p.x
          p.safeZ = p.z
        }
      }
    }

    const sp = Math.hypot(p.vx, p.vz)
    if (it.mag > 0.1 && sp > 0.4) {
      const target = Math.atan2(p.vx, p.vz)
      let diff = target - p.heading
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      p.heading += diff * (1 - Math.exp(-dt * 14))
    }

    // ----- feedback -----
    p.stepD += sp * dt
    if (p.onGround && sp > 1) {
      const th = sp > 6 ? 2.1 : 1.55
      if (p.stepD > th) {
        p.stepD = 0
        sfx.step()
      }
    }
    if (it.run && p.onGround && sp > 5.5) {
      p.dustT -= dt
      if (p.dustT <= 0) {
        p.dustT = 0.07
        emitDust(p.x, p.y, p.z, p.vx, p.vz)
      }
    }

    const m = motion.current
    m.speed = Math.min(1.75, sp / 4.4)
    m.air = !p.onGround

    const gr = group.current
    if (gr) {
      gr.position.set(p.x, p.y, p.z)
      gr.rotation.y = p.heading
    }
    player.x = p.x
    player.y = p.y
    player.z = p.z
    player.vx = p.vx
    player.vz = p.vz
    player.heading = p.heading
    player.running = it.run && sp > 5.5

    // ----- doors / fishing / interaction -----
    let nearId = ""
    for (let i = 0; i < DOORS.length; i++) {
      const d = DOORS[i]
      const dd = Math.hypot(p.x - d.x, p.z - d.z)
      doors[d.id].target = dd < 4.2 ? 1 : 0
      if (dd < 3.1) nearId = d.id
    }
    let nearFish = false
    if (!nearId && p.onGround) {
      for (let i = 0; i < FISH_SPOTS.length; i++) {
        const fs = FISH_SPOTS[i]
        if (Math.hypot(p.x - fs.x, p.z - fs.z) < fs.r) nearFish = true
      }
    }
    const nearTalk = !nearId && !nearFish && Math.hypot(p.x - CLAUDE.x, p.z - CLAUDE.z) < 3.2
    const f = fishing
    if (f.state !== 0 && (!nearFish || sp > 1.5 || !p.onGround)) {
      f.state = 0
      setState({ fishState: "idle" })
    }
    const key = nearId || (nearFish ? "fish" : nearTalk ? "talk" : "")
    if (key !== p.nearId) {
      p.nearId = key
      if (nearId) {
        const d = DOORS.find((q) => q.id === nearId)!
        setNear({ kind: "door", id: d.id, label: d.name })
      } else if (nearFish) setNear({ kind: "fish", id: "fish", label: "the water" })
      else if (nearTalk) setNear({ kind: "talk", id: "claude", label: "Claude" })
      else setNear(null)
    }
    if (f.state === 1) {
      f.t -= dt
      if (f.t <= 0) {
        f.state = 2
        f.t = 1.4
        sfx.bite()
        setState({ fishState: "bite" })
      }
    } else if (f.state === 2) {
      f.t -= dt
      if (f.t <= 0) {
        f.state = 0
        setState({ fishState: "idle" })
        toast("It got away...")
      }
    }
    if (input.interactQueued) {
      input.interactQueued = false
      if (!input.frozen) {
        if (nearId) {
          sfx.door()
          enterRoom(nearId as BuildingId)
        } else if (nearTalk) {
          sfx.click()
          openGuide()
        } else if (nearFish) {
          if (f.state === 0) {
            const bx = p.x + Math.sin(p.heading) * 3.6
            const bz = p.z + Math.cos(p.heading) * 3.6
            if (isWater(bx, bz)) {
              f.state = 1
              f.x = bx
              f.z = bz
              f.t = 2 + Math.random() * 4
              sfx.splash()
              setState({ fishState: "wait" })
            } else toast("Face the water to cast")
          } else if (f.state === 1) {
            f.state = 0
            setState({ fishState: "idle" })
            toast("Too early, nothing bit yet")
          } else {
            f.state = 0
            setState({ fishState: "idle" })
            sfx.splash()
            const c = pickCatch()
            if (c.fish) addFish()
            toast(c.fish ? `You caught a ${c.name}!` : `You pulled up ${c.name}`)
          }
        }
      }
    }

    // ----- toys -----
    stepToys(dt, p.x, p.z, p.vx, p.vz, 0.45)
    const imp = takeImpact()
    if (imp > 1.1) sfx.bump(imp)
    p.pinsT -= dt
    if (p.pinsT <= 0) {
      p.pinsT = 0.25
      const { down } = pinsDown()
      if (down >= 8 && !p.struck) {
        p.struck = true
        sfx.strike()
        toast("STRIKE!")
        setTimeout(() => {
          resetPins()
          p.struck = false
        }, 6000)
      }
    }

    // ----- camera -----
    if (p.intro < 1) p.intro = Math.min(1, p.intro + dt / (env.reduced ? 0.8 : 3.6))
    const e = 1 - Math.pow(1 - p.intro, 3)
    if (spawn.entering) p.push = Math.min(1, p.push + dt * 1.7)
    else p.push = Math.max(0, p.push - dt * 3)
    const pitch = lerp(1.4, input.camPitch, e)
    const dist = lerp(85, input.camDist, e) * (1 - p.push * 0.5)
    const cp = Math.cos(pitch)
    const tx = p.x
    const ty = p.y + 1.3
    const tz = p.z
    let cx = tx + Math.sin(input.camYaw) * cp * dist
    let cy = ty + Math.sin(pitch) * dist
    let cz = tz + Math.cos(input.camYaw) * cp * dist
    const floor = groundY(cx, cz) + 0.9
    if (cy < floor) cy = floor
    if (!p.camInit || p.intro < 1) {
      p.camInit = true
      cam.position.set(cx, cy, cz)
    } else {
      const f = 1 - Math.exp(-dt * 9)
      cx = cam.position.x + (cx - cam.position.x) * f
      cy = cam.position.y + (cy - cam.position.y) * f
      cz = cam.position.z + (cz - cam.position.z) * f
      cam.position.set(cx, cy, cz)
    }
    cam.lookAt(tx, ty, tz)
    const fovT = (player.running ? 66 : 55) - (1 - e) * 14
    if (Math.abs(cam.fov - fovT) > 0.05) {
      cam.fov += (fovT - cam.fov) * (1 - Math.exp(-dt * 5))
      cam.updateProjectionMatrix()
    }
  })

  return (
    <group ref={group}>
      <CharacterView index={character} motion={motion} />
    </group>
  )
}

// ---------- toys ----------
const dummy = new Object3D()
const BALL_COLORS = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#f78c6b", "#c77dff"]

function Toys() {
  initToys()
  const crates = useRef<InstancedMesh>(null)
  const balls = useRef<InstancedMesh>(null)
  const pins = useRef<InstancedMesh>(null)
  const bowl = useRef<InstancedMesh>(null)
  const counts = useMemo(() => {
    const c = [0, 0, 0, 0]
    for (const b of bodies) c[b.kind]++
    return c
  }, [])
  useEffect(() => {
    const m = balls.current
    if (!m) return
    const col = new Color()
    for (let i = 0; i < counts[1]; i++) m.setColorAt(i, col.set(BALL_COLORS[i % BALL_COLORS.length]))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [counts])
  useFrame(() => {
    let ci = 0
    let bi = 0
    let pi = 0
    let wi = 0
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]
      if (b.kind === 0) {
        dummy.position.set(b.x, b.hy + 0.6, b.z)
        dummy.rotation.set(0, b.ry, 0)
        dummy.scale.set(1.15, 1.15, 1.15)
        dummy.updateMatrix()
        crates.current?.setMatrixAt(ci++, dummy.matrix)
      } else if (b.kind === 1) {
        dummy.position.set(b.x, b.hy + b.r, b.z)
        dummy.rotation.set(b.rx, 0, b.rz)
        dummy.scale.set(b.r, b.r, b.r)
        dummy.updateMatrix()
        balls.current?.setMatrixAt(bi++, dummy.matrix)
      } else if (b.kind === 2) {
        const sp = Math.hypot(b.vx, b.vz)
        if (sp > 0.6) b.ry = Math.atan2(b.vx, b.vz)
        const down = Math.hypot(b.x - b.hx, b.z - b.hz) > 0.45
        if (down) {
          dummy.position.set(b.x, b.hy + 0.32, b.z)
          dummy.rotation.set(Math.PI / 2, b.ry, 0, "YXZ")
        } else {
          dummy.position.set(b.x, b.hy + 0.45, b.z)
          dummy.rotation.set(0, 0, 0)
        }
        dummy.scale.set(0.3, 0.9, 0.3)
        dummy.updateMatrix()
        pins.current?.setMatrixAt(pi++, dummy.matrix)
      } else {
        dummy.position.set(b.x, b.hy + b.r, b.z)
        dummy.rotation.set(b.rx, 0, b.rz)
        dummy.scale.set(b.r, b.r, b.r)
        dummy.updateMatrix()
        bowl.current?.setMatrixAt(wi++, dummy.matrix)
      }
    }
    for (const m of [crates.current, balls.current, pins.current, bowl.current]) if (m) m.instanceMatrix.needsUpdate = true
  })
  const crateMat = useMemo(() => mat("#c9954f"), [])
  return (
    <group>
      <instancedMesh ref={crates} args={[unitBox(), crateMat, counts[0]]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={balls} args={[unitIco(1), mat("#ffffff"), counts[1]]} castShadow frustumCulled={false} />
      <instancedMesh ref={pins} args={[unitCyl(7), mat("#f7f3ea"), counts[2]]} castShadow frustumCulled={false} />
      <instancedMesh ref={bowl} args={[unitIco(1), mat("#2c2f4a"), counts[3]]} castShadow frustumCulled={false} />
      {/* lane markings */}
      <mesh position={[0, 0.06, -16]} rotation={[-Math.PI / 2, 0, 0]} material={mat("#e9d6a8")}>
        <planeGeometry args={[2.4, 17]} />
      </mesh>
    </group>
  )
}

// ---------- fishing ----------
const CATCHES: Array<{ name: string; w: number; fish: boolean }> = [
  { name: "Sardine", w: 30, fish: true },
  { name: "Silver Carp", w: 26, fish: true },
  { name: "Rainbow Trout", w: 18, fish: true },
  { name: "Pufferfish", w: 10, fish: true },
  { name: "Golden Koi (rare!)", w: 4, fish: true },
  { name: "old boot", w: 8, fish: false },
  { name: "rusty key", w: 4, fish: false },
]
function pickCatch() {
  let total = 0
  for (const c of CATCHES) total += c.w
  let r = Math.random() * total
  for (const c of CATCHES) {
    r -= c.w
    if (r <= 0) return c
  }
  return CATCHES[0]
}

const linePos = new Float32Array(6)
function Fishing() {
  const bob = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const rod = useRef<Group>(null)
  const line = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(linePos, 3))
    return new Line(g, new LineBasicMaterial({ color: "#f5f5f5" }))
  }, [])
  useFrame((s) => {
    const f = fishing
    const on = f.state > 0
    if (bob.current) bob.current.visible = on
    if (ring.current) ring.current.visible = f.state === 2
    if (rod.current) rod.current.visible = on
    line.visible = on
    if (!on) return
    const t = s.clock.elapsedTime
    const dip = f.state === 2 ? -0.18 + Math.sin(t * 40) * 0.06 : Math.sin(t * 2) * 0.04
    const by = -0.4 + dip
    if (bob.current) bob.current.position.set(f.x, by + 0.15, f.z)
    if (ring.current) {
      const k = 1 + ((t * 3) % 1) * 1.2
      ring.current.position.set(f.x, -0.38, f.z)
      ring.current.scale.set(k, k, k)
    }
    const h = player.heading
    const hx = player.x + Math.sin(h) * 1.5
    const hz = player.z + Math.cos(h) * 1.5
    const hy = player.y + 2.1
    if (rod.current) {
      rod.current.position.set(player.x, player.y, player.z)
      rod.current.rotation.y = h
    }
    linePos[0] = hx
    linePos[1] = hy
    linePos[2] = hz
    linePos[3] = f.x
    linePos[4] = by + 0.15
    linePos[5] = f.z
    ;(line.geometry.attributes.position as BufferAttribute).needsUpdate = true
  })
  return (
    <group>
      <group ref={rod} visible={false}>
        <mesh position={[0.35, 1.45, 0.75]} rotation={[Math.PI / 2 - 0.9, 0, 0]} geometry={unitCyl(5)} material={mat("#7a5230")} scale={[0.03, 2.0, 0.03]} />
      </group>
      <mesh ref={bob} visible={false} geometry={unitIco(0)} material={mat("#e5383b")} scale={[0.14, 0.14, 0.14]} />
      <mesh ref={ring} visible={false} rotation={[-Math.PI / 2, 0, 0]} material={mat("#ffffff")}>
        <ringGeometry args={[0.25, 0.32, 20]} />
      </mesh>
      <primitive object={line} frustumCulled={false} />
    </group>
  )
}

// ---------- Claude, the guide ----------
function ClaudeGuide() {
  const group = useRef<Group>(null)
  const motion = useRef<Motion>({ speed: 0, air: false, wave: true })
  const heading = useRef(0)
  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const dx = player.x - CLAUDE.x
    const dz = player.z - CLAUDE.z
    const dist = Math.hypot(dx, dz)
    if (dist < 14) {
      let diff = Math.atan2(dx, dz) - heading.current
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      heading.current += diff * (1 - Math.exp(-dt * 5))
    }
    motion.current.wave = getState().guide || dist < 9
    const g = group.current
    if (g) {
      g.position.set(CLAUDE.x, groundY(CLAUDE.x, CLAUDE.z) + Math.sin(s.clock.elapsedTime * 2) * 0.05, CLAUDE.z)
      g.rotation.y = heading.current
    }
  })
  return (
    <group ref={group}>
      <CharacterView index={2} motion={motion} />
    </group>
  )
}

// ---------- villagers ----------
const VILLAGER_HOMES: Array<[number, number, number]> = [
  [-5, 19, 1],
  [7, -7, 0],
  [3, 50, 1],
]

function Villager({ index, home, char }: { index: number; home: [number, number]; char: number }) {
  const group = useRef<Group>(null)
  const motion = useRef<Motion>({ speed: 0, air: false, wave: false })
  const st = useRef({ a: index * 2, heading: 0, x: home[0], z: home[1] })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    const dx = player.x - s.x
    const dz = player.z - s.z
    const dist = Math.hypot(dx, dz)
    const near = dist < 7
    const m = motion.current
    if (near) {
      const target = Math.atan2(dx, dz)
      let diff = target - s.heading
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      s.heading += diff * (1 - Math.exp(-dt * 6))
      m.speed = 0
      m.wave = true
    } else {
      m.wave = false
      s.a += dt * 0.16
      const nx = home[0] + Math.cos(s.a) * 3.2
      const nz = home[1] + Math.sin(s.a) * 3.2
      const vx = (nx - s.x) / Math.max(dt, 0.001)
      const vz = (nz - s.z) / Math.max(dt, 0.001)
      const sp = Math.hypot(vx, vz)
      if (sp > 0.05 && sp < 4) {
        let diff = Math.atan2(vx, vz) - s.heading
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        s.heading += diff * (1 - Math.exp(-dt * 6))
      }
      s.x = nx
      s.z = nz
      m.speed = Math.min(1, sp / 4.4)
    }
    NPCS[index].x = s.x
    NPCS[index].z = s.z
    const g = group.current
    if (g) {
      g.position.set(s.x, groundY(s.x, s.z), s.z)
      g.rotation.y = s.heading
    }
  })
  return (
    <group ref={group}>
      <CharacterView index={char} motion={motion} />
    </group>
  )
}

function Villagers() {
  return (
    <>
      {VILLAGER_HOMES.map(([x, z, c], i) => (
        <Villager key={i} index={i} home={[x, z]} char={c} />
      ))}
    </>
  )
}

export function CityScene() {
  useReady(10)
  return (
    <>
      <Lighting />
      <Terrain />
      <Sea />
      <Decor />
      <Buildings />
      <Dock />
      <Windmill />
      <Lighthouse />
      <Balloon />
      <Fountain />
      <Lamps />
      <SignPost />
      <Clouds />
      <Birds />
      <Smoke />
      <Fireflies />
      <Rain />
      <Dust />
      <TargetMarker />
      <Toys />
      <Fishing />
      <Villagers />
      <ClaudeGuide />
      <CityPlayer />
      <InputController />
    </>
  )
}
