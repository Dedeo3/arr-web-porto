"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { AdditiveBlending, Color, ConeGeometry, Group, InstancedMesh, MeshBasicMaterial, MeshLambertMaterial, Object3D } from "three"
import { env } from "./env"
import { BUILDINGS, LAMPS, PROPS, SIGN, doorPoint, groundY, heightAt, platforms } from "./world"
import { mat, unitBox, unitCyl, unitIco } from "./character"
import { B, Co, Cy, Sp, glassMat } from "./Buildings"
import { Inst } from "./Decor"

// ---------- dock + boat ----------
export function Dock() {
  const boat = useRef<Group>(null)
  useFrame((s) => {
    const g = boat.current
    if (!g || env.reduced) return
    const t = s.clock.elapsedTime
    g.position.y = Math.sin(t * 1.2) * 0.05
    g.rotation.z = Math.sin(t * 0.9) * 0.015
  })
  const d = platforms[0]
  const posts = useMemo(() => {
    const list: Array<[number, number]> = []
    for (let z = d.z - d.hz + 1; z <= d.z + d.hz; z += 4) list.push([-d.hx + 0.1, z], [d.hx - 0.1, z])
    return list
  }, [d])
  return (
    <group>
      <B p={[d.x, d.y - 0.14, d.z]} s={[d.hx * 2, 0.28, d.hz * 2]} c="#a9784a" />
      {Array.from({ length: Math.floor(d.hz * 2) }).map((_, i) => (
        <B key={i} p={[d.x, d.y + 0.01, d.z - d.hz + 0.5 + i]} s={[d.hx * 2 + 0.04, 0.04, 0.04]} c="#7f5a36" cast={false} />
      ))}
      {posts.map(([x, z], i) => (
        <group key={i}>
          <Cy p={[x, d.y - 0.2, z]} s={[0.16, 2.6, 0.16]} c="#6b4a2c" seg={6} />
          <Sp p={[x, d.y + 0.55, z]} s={[0.12, 0.12, 0.12]} c="#e7c35a" d={0} />
        </group>
      ))}
      {/* gangplank */}
      <B p={[2.4, 0.55, 90]} s={[1.8, 0.1, 1.4]} c="#8a6038" />
      {/* boat: hull drawn separately from the platform the player stands on */}
      <group ref={boat} position={[4.5, 0, 90]}>
        <B p={[0, 0.4, 0]} s={[3.0, 0.9, 6.4]} c="#f2efe6" />
        <B p={[0, 0.0, 0]} s={[3.1, 0.5, 6.5]} c="#2f5aa8" />
        <B p={[0, 0.85, 0]} s={[3.1, 0.12, 6.5]} c="#c43d3d" cast={false} />
        <Co p={[0, 0.4, -3.9]} s={[1.5, 1.6, 1.5]} c="#f2efe6" seg={4} r={[-Math.PI / 2, Math.PI / 4, 0]} />
        <B p={[0, 1.7, 2]} s={[2.2, 1.6, 1.9]} c="#e8e1d0" />
        <B p={[0, 1.85, 2]} s={[2.25, 0.5, 1.4]} m={glassMat} cast={false} />
        <B p={[0, 2.6, 2]} s={[2.5, 0.2, 2.2]} c="#c43d3d" />
        <Cy p={[0, 3.2, -0.6]} s={[0.07, 4.6, 0.07]} c="#6b4a2c" seg={5} />
        <B p={[0.6, 4.1, -0.6]} s={[1.2, 1.5, 0.04]} c="#fff6e0" />
      </group>
    </group>
  )
}

// ---------- windmill ----------
export function Windmill() {
  const blades = useRef<Group>(null)
  useFrame((s, dt) => {
    if (blades.current) blades.current.rotation.z += dt * (env.reduced ? 0.2 : 0.7 + env.rain * 0.4)
    void s
  })
  const { x, z } = PROPS.windmill
  const y = heightAt(x, z)
  const yaw = Math.atan2(-x, -z)
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <Cy p={[0, -1.5, 0]} s={[3.6, 4, 3.6]} c="#8d8a80" seg={10} />
      <Cy p={[0, 4, 0]} s={[2.6, 8, 2.6]} c="#efe7d6" seg={10} />
      <Cy p={[0, 4, 0]} s={[2.4, 8.05, 2.4]} c="#d8cdb4" seg={4} r={[0, Math.PI / 4, 0]} cast={false} />
      <Co p={[0, 9.4, 0]} s={[3.1, 3.2, 3.1]} c="#a2483a" seg={10} />
      <B p={[0, 0.9, 2.55]} s={[1.3, 1.8, 0.2]} c="#7a4a2a" />
      <B p={[0, 5.5, 2.5]} s={[1.0, 1.2, 0.2]} m={glassMat} cast={false} />
      <group position={[0, 8.2, 2.9]}>
        <Sp p={[0, 0, 0]} s={[0.5, 0.5, 0.5]} c="#6b4a2c" d={0} />
        <group ref={blades}>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
              <B p={[0, 3.2, 0]} s={[0.25, 6.2, 0.18]} c="#6b4a2c" />
              <B p={[0.55, 3.8, 0.02]} s={[0.9, 4.2, 0.06]} c="#f7f1e1" />
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

// ---------- lighthouse ----------
const beamMat = new MeshBasicMaterial({ color: "#fff2b0", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false })
const beamGeo = new ConeGeometry(4.5, 44, 12, 1, true)
beamGeo.translate(0, -22, 0)
beamGeo.rotateZ(Math.PI / 2)
// after the rotations the cone's apex sits at the origin and its wide end is toward +x

export function Lighthouse() {
  const beam = useRef<Group>(null)
  useFrame((s, dt) => {
    if (beam.current) beam.current.rotation.y += dt * 0.6
    beamMat.opacity = Math.max(0.0, env.night * 0.3 - env.rain * 0.1)
    void s
  })
  const { x, z } = PROPS.lighthouse
  const y = heightAt(x, z)
  return (
    <group position={[x, y, z]}>
      <Cy p={[0, -1.5, 0]} s={[4.6, 4.4, 4.6]} c="#8d8a80" seg={10} />
      {[0, 1, 2, 3].map((i) => (
        <Cy key={i} p={[0, 1.8 + i * 3.4, 0]} s={[2.6 - i * 0.25, 3.4, 2.6 - i * 0.25]} c={i % 2 ? "#ffffff" : "#d64545"} seg={10} />
      ))}
      <Cy p={[0, 15.6, 0]} s={[2.4, 0.4, 2.4]} c="#3f4a57" seg={10} />
      <Cy p={[0, 16.7, 0]} s={[1.4, 1.8, 1.4]} m={glassMat} seg={8} cast={false} />
      <Co p={[0, 18.5, 0]} s={[1.9, 1.9, 1.9]} c="#d64545" seg={8} />
      <Sp p={[0, 20, 0]} s={[0.3, 0.3, 0.3]} c="#e7c35a" d={0} />
      <B p={[0, 1.0, 2.4]} s={[1.0, 2, 0.3]} c="#6b4a2c" />
      <group ref={beam} position={[0, 16.7, 0]}>
        <mesh geometry={beamGeo} material={beamMat} frustumCulled={false} />
        <mesh geometry={beamGeo} material={beamMat} rotation={[0, Math.PI, 0]} frustumCulled={false} />
      </group>
    </group>
  )
}

// ---------- balloon ----------
export function Balloon() {
  const g = useRef<Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.05
    const gr = g.current
    if (!gr) return
    gr.position.set(Math.cos(t) * 58, 42 + Math.sin(t * 3) * 3, Math.sin(t) * 58)
    gr.rotation.y = -t
  })
  return (
    <group ref={g}>
      <Sp p={[0, 5, 0]} s={[3.2, 3.8, 3.2]} c="#ef476f" d={1} />
      <Cy p={[0, 5, 0]} s={[3.25, 0.6, 3.25]} c="#ffd166" seg={10} cast={false} />
      <Sp p={[0, 8.3, 0]} s={[0.9, 0.5, 0.9]} c="#ffd166" d={0} />
      <B p={[0, 0, 0]} s={[1.4, 1, 1.4]} c="#a9784a" />
      {[
        [-0.6, -0.6],
        [0.6, -0.6],
        [-0.6, 0.6],
        [0.6, 0.6],
      ].map(([x, z], i) => (
        <Cy key={i} p={[x * 1.1, 2.1, z * 1.1]} s={[0.03, 3.2, 0.03]} c="#5b4630" seg={3} cast={false} />
      ))}
    </group>
  )
}

// ---------- fountain ----------
const JETS = 26
export function Fountain() {
  const ref = useRef<InstancedMesh>(null)
  const d = useMemo(() => new Object3D(), [])
  const waterMat = useMemo(() => new MeshLambertMaterial({ color: "#7fd0ff", transparent: true, opacity: 0.85, flatShading: true, emissive: new Color("#2a6f9a"), emissiveIntensity: 0.25 }), [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    for (let i = 0; i < JETS; i++) {
      const ph = (t * 0.8 + i / JETS) % 1
      const a = (i / JETS) * Math.PI * 2 * 3.7
      const r = 0.08 + ph * 2.5
      d.position.set(Math.cos(a) * r, 2.5 + 3.2 * ph * (1 - ph) * 2 - ph * 1.6, Math.sin(a) * r)
      const sc = 0.12 + (1 - ph) * 0.05
      d.scale.set(sc, sc, sc)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <Cy p={[0, 0.35, 0]} s={[3.5, 0.7, 3.5]} c="#b9b3a6" seg={14} />
      <Cy p={[0, 0.72, 0]} s={[3.1, 0.12, 3.1]} m={waterMat} seg={14} cast={false} />
      <Cy p={[0, 1.4, 0]} s={[0.45, 1.6, 0.45]} c="#cfc9bb" seg={8} />
      <Cy p={[0, 2.2, 0]} s={[1.2, 0.25, 1.2]} c="#cfc9bb" seg={10} />
      <Sp p={[0, 2.5, 0]} s={[0.3, 0.3, 0.3]} c="#e7c35a" d={0} />
      <instancedMesh ref={ref} args={[unitIco(0), waterMat, JETS]} frustumCulled={false} />
    </group>
  )
}

// ---------- street lamps ----------
const haloMat = new MeshBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })
const lampHeadMat = new MeshLambertMaterial({ color: "#fff1c2", emissive: new Color("#ffcf70"), emissiveIntensity: 0, flatShading: true })

export function Lamps() {
  const items = useMemo(() => LAMPS.map(([x, z]) => ({ x, z, y: groundY(x, z) })), [])
  useFrame(() => {
    haloMat.opacity = env.night * 0.38
    lampHeadMat.emissiveIntensity = 0.1 + env.night * 1.6
  })
  const post = useMemo(
    () => (i: number, d: Object3D) => {
      const l = items[i]
      d.position.set(l.x, l.y + 1.5, l.z)
      d.scale.set(0.09, 3.0, 0.09)
    },
    [items],
  )
  const head = useMemo(
    () => (i: number, d: Object3D) => {
      const l = items[i]
      d.position.set(l.x, l.y + 3.15, l.z)
      d.scale.set(0.34, 0.4, 0.34)
    },
    [items],
  )
  const halo = useMemo(
    () => (i: number, d: Object3D) => {
      const l = items[i]
      d.position.set(l.x, l.y + 3.15, l.z)
      d.scale.set(0.75, 0.75, 0.75)
    },
    [items],
  )
  return (
    <group>
      <Inst geometry={unitCyl(5)} material={mat("#3b4350")} count={items.length} fill={post} cast />
      <Inst geometry={unitBox()} material={lampHeadMat} count={items.length} fill={head} />
      <Inst geometry={unitIco(1)} material={haloMat} count={items.length} fill={halo} />
    </group>
  )
}

// ---------- signpost ----------
export function SignPost() {
  const planks = useMemo(
    () =>
      BUILDINGS.map((b, i) => {
        const d = doorPoint(b)
        const dx = d.x - SIGN.x
        const dz = d.z - SIGN.z
        return { id: b.id, rot: Math.atan2(-dz, dx), y: 2.5 - i * 0.42, color: ["#fbbf24", "#818cf8", "#34d399", "#fb7185"][["about", "projects", "skills", "contact"].indexOf(b.id)] }
      }),
    [],
  )
  return (
    <group position={[SIGN.x, 0, SIGN.z]}>
      <Cy p={[0, 1.5, 0]} s={[0.1, 3, 0.1]} c="#6b4a2c" seg={5} />
      {planks.map((p) => (
        <group key={p.id} position={[0, p.y, 0]} rotation={[0, p.rot, 0]}>
          <B p={[0.8, 0, 0]} s={[1.6, 0.3, 0.1]} c={p.color} />
          <Co p={[1.68, 0, 0]} s={[0.22, 0.3, 0.22]} c={p.color} seg={3} r={[0, 0, -Math.PI / 2]} />
        </group>
      ))}
    </group>
  )
}

