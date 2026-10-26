"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh, PerspectiveCamera } from "three"
import { CharacterView, mat, type Motion } from "./character"
import { Lighting } from "./Lighting"
import { Clouds } from "./Effects"
import { B, Co, Cy, Sp } from "./Buildings"
import { useReady } from "./CityScene"
import { env, player } from "./env"
import { getState, setState } from "./store"
import { sfx } from "./audio"

const X = [-2.7, 2.7]
const layout = { spread: 1 }

function Podium({ index }: { index: number }) {
  const root = useRef<Group>(null)
  const g = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const motion = useRef<Motion>({ speed: 0, air: false, wave: false })
  useFrame((s, dt) => {
    const sel = getState().character === index
    motion.current.wave = sel
    if (root.current) root.current.position.x = X[index] * layout.spread
    const grp = g.current
    if (grp) {
      const target = sel ? 1 : 0
      const k = 1 - Math.exp(-Math.min(dt, 0.05) * 6)
      const cur = grp.userData.k ?? 0
      const nk = cur + (target - cur) * k
      grp.userData.k = nk
      const face = index === 0 ? 0.35 : -0.35
      grp.rotation.y = face * (1 - nk)
      const sc = 1 + nk * 0.08
      grp.scale.set(sc, sc, sc)
      grp.position.y = 0.5 + (env.reduced ? 0 : Math.sin(s.clock.elapsedTime * 2.2) * 0.03 * nk)
    }
    const r = ring.current
    if (r) {
      const sel2 = sel ? 1 : 0
      r.scale.setScalar(1 + sel2 * 0.1 + Math.sin(s.clock.elapsedTime * 3) * 0.03 * sel2)
      r.visible = sel
    }
  })
  return (
    <group ref={root} position={[X[index], 0, 0]}>
      <Cy p={[0, 0.25, 0]} s={[1.7, 0.5, 1.7]} c="#d5dbea" seg={20} />
      <Cy p={[0, 0.52, 0]} s={[1.5, 0.06, 1.5]} c={index === 0 ? "#7a1f2e" : "#1f8c8f"} seg={20} />
      <mesh ref={ring} position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat("#ffd84a", { key: "ring", make: (m) => m.emissive.set("#ffb300") })}>
        <ringGeometry args={[1.25, 1.42, 32]} />
      </mesh>
      <group
        ref={g}
        position={[0, 0.5, 0]}
        onPointerDown={() => {
          if (getState().character !== index) {
            sfx.click()
            setState({ character: index })
          }
        }}
      >
        <CharacterView index={index} motion={motion} scale={0.3} />
      </group>
    </group>
  )
}

export function SelectScene() {
  useReady(8)
  useFrame((s) => {
    const cam = s.camera as PerspectiveCamera
    const t = env.reduced ? 0 : s.clock.elapsedTime
    const aspect = s.size.width / Math.max(1, s.size.height)
    const wide = aspect >= 1.2
    layout.spread = wide ? 1 : Math.max(0.55, (aspect * 3.8) / 2.7)
    const dist = wide ? 9.2 : 9.2 + (1.2 - aspect) * 15
    cam.position.set(Math.sin(t * 0.25) * 0.8, wide ? 2.9 : 3.6, dist)
    cam.lookAt(0, wide ? 1.2 : 0.5, 0)
    if (Math.abs(cam.fov - 38) > 0.05) {
      cam.fov = 38
      cam.updateProjectionMatrix()
    }
    player.x = 0
    player.y = 0
    player.z = 0
  })
  return (
    <>
      <Lighting />
      <Clouds />
      <Cy p={[0, -0.3, 0]} s={[22, 0.6, 22]} c="#7fc86a" seg={32} />
      <Cy p={[0, 0.02, 0]} s={[8.4, 0.08, 8.4]} c="#e9dfc6" seg={32} cast={false} />
      <Cy p={[0, 0.06, 0]} s={[6.2, 0.06, 6.2]} c="#d6c9a8" seg={32} cast={false} />
      {[
        [-9, -4],
        [9, -5],
        [-13, -9],
        [13, -10],
        [-7, -9],
        [6.5, -9],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cy p={[0, 1.0, 0]} s={[0.35, 2, 0.35]} c="#7a5230" seg={6} />
          {i % 2 ? (
            <>
              <Co p={[0, 2.8, 0]} s={[2.0, 3.2, 2.0]} c="#2f7a4a" seg={7} />
              <Co p={[0, 4.2, 0]} s={[1.4, 2.4, 1.4]} c="#3a8a52" seg={7} />
            </>
          ) : (
            <>
              <Sp p={[0, 3.0, 0]} s={[2.0, 1.8, 2.0]} c="#5fae4c" />
              <Sp p={[0.9, 2.4, 0.3]} s={[1.3, 1.1, 1.3]} c="#4f9f45" />
            </>
          )}
        </group>
      ))}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2
        const r = 5.2 + (i % 3) * 0.6
        return <Sp key={i} p={[Math.cos(a) * r, 0.2, Math.sin(a) * r - 1]} s={[0.14, 0.12, 0.14]} c={["#f472b6", "#fde047", "#ffffff", "#c084fc"][i % 4]} d={0} cast={false} />
      })}
      <B p={[0, 4.6, -6]} s={[10, 0.12, 0.12]} c="#8a5a32" cast={false} />
      {Array.from({ length: 9 }).map((_, i) => (
        <Co key={i} p={[-4.5 + i * 1.12, 4.3, -6]} s={[0.4, 0.55, 0.05]} c={["#ef476f", "#ffd166", "#06d6a0", "#118ab2"][i % 4]} seg={3} r={[0, 0, Math.PI]} cast={false} />
      ))}
      <Podium index={0} />
      <Podium index={1} />
    </>
  )
}
