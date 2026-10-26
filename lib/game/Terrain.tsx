"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute, Mesh, MeshLambertMaterial, PlaneGeometry } from "three"
import { env } from "./env"
import { BUILDINGS, doorPoint, heightAt, islandRadius } from "./world"
import { mat } from "./character"

const SAND = new Color("#e8d69c")
const WET = new Color("#b8a56c")
const GRASS_A = new Color("#74c05c")
const GRASS_B = new Color("#4e9a47")
const GRASS_PLAZA = new Color("#86cc66")
const ROCK = new Color("#8b8b95")
const ROCK_D = new Color("#6f6f7a")
const tmp = new Color()

function noise(x: number, z: number) {
  return (Math.sin(x * 0.31) * Math.cos(z * 0.27) + Math.sin((x + z) * 0.13)) * 0.25 + 0.5
}

function buildTerrain() {
  const size = 270
  const seg = 160
  const g = new PlaneGeometry(size, size, seg, seg)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position as BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = heightAt(x, z)
    pos.setY(i, h)
    const e = 1.2
    const sl = Math.hypot(heightAt(x + e, z) - heightAt(x - e, z), heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e)
    const n = noise(x, z)
    const r = Math.hypot(x, z)
    const coast = islandRadius(Math.atan2(z, x)) - r // metres to the shore line
    if (h < -0.15) tmp.copy(WET)
    else if (h < 0.55 && coast < 24) tmp.copy(SAND).lerp(GRASS_A, Math.max(0, (h - 0.3) / 0.25, (coast - 16) / 8))
    else {
      tmp.copy(GRASS_A).lerp(GRASS_B, n)
      if (r < 30) tmp.lerp(GRASS_PLAZA, 1 - r / 30)
    }
    if (h > 0.5 && (sl > 0.7 || h > 9)) tmp.copy(ROCK).lerp(ROCK_D, n)
    else if (h > 0.5 && sl > 0.45) tmp.lerp(ROCK, (sl - 0.45) / 0.25)
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  g.setAttribute("color", new Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

function pathGeometry(points: Array<[number, number]>, width: number, lift = 0.1) {
  // resample every ~1.6m
  const pts: Array<[number, number]> = []
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]
    const [bx, bz] = points[i + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const n = Math.max(1, Math.ceil(len / 1.6))
    for (let k = 0; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n])
  }
  pts.push(points[points.length - 1])
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    let dx = b[0] - a[0]
    let dz = b[1] - a[1]
    const l = Math.hypot(dx, dz) || 1
    dx /= l
    dz /= l
    const nx = -dz
    const nz = dx
    const [x, z] = pts[i]
    for (const s of [-1, 1]) {
      const px = x + nx * (width / 2) * s
      const pz = z + nz * (width / 2) * s
      pos.push(px, Math.max(heightAt(px, pz), 0) + lift, pz)
    }
    if (i > 0) {
      const k = i * 2
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute("position", new Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function Terrain() {
  const terrainGeo = useMemo(buildTerrain, [])
  const terrainMat = useMemo(() => new MeshLambertMaterial({ vertexColors: true, flatShading: true }), [])
  const pathGeos = useMemo(() => {
    const list: BufferGeometry[] = []
    for (const b of BUILDINGS) {
      const d = doorPoint(b)
      const dir = Math.hypot(d.x, d.z)
      list.push(pathGeometry([[(d.x / dir) * 8, (d.z / dir) * 8], [d.x, d.z]], 2.8))
    }
    list.push(pathGeometry([[0, 8], [0, 40], [0, 74], [0, 84]], 3.4))
    return list
  }, [])
  const pathMat = useMemo(() => {
    const m = new MeshLambertMaterial({ color: "#dcc9a0", flatShading: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    return m
  }, [])
  return (
    <group>
      <mesh geometry={terrainGeo} material={terrainMat} receiveShadow />
      {pathGeos.map((g, i) => (
        <mesh key={i} geometry={g} material={pathMat} receiveShadow />
      ))}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat("#cfc7b8")}>
        <circleGeometry args={[11.5, 28]} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat("#bdb4a3")}>
        <ringGeometry args={[6.2, 6.7, 28]} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat("#e2dccf")}>
        <ringGeometry args={[10.4, 11.5, 28]} />
      </mesh>
    </group>
  )
}

const seaDay = new Color("#2fa4d6")
const seaNight = new Color("#13265a")
const seaRain = new Color("#4a7f98")

export function Sea() {
  const ref = useRef<Mesh>(null)
  const frame = useRef(0)
  const geo = useMemo(() => {
    const g = new PlaneGeometry(620, 620, 72, 72)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const material = useMemo(() => new MeshLambertMaterial({ color: "#2fa4d6", flatShading: true, transparent: true, opacity: 0.92 }), [])
  useFrame((state) => {
    material.color.copy(seaDay).lerp(seaNight, env.night).lerp(seaRain, env.rain * (1 - env.night * 0.5))
    frame.current++
    if (frame.current % 2 !== 0 || env.reduced) return
    const t = state.clock.elapsedTime
    const pos = geo.attributes.position as BufferAttribute
    const a = pos.array as Float32Array
    for (let i = 0; i < pos.count; i++) {
      const x = a[i * 3]
      const z = a[i * 3 + 2]
      a[i * 3 + 1] = Math.sin(x * 0.11 + t * 0.9) * 0.09 + Math.cos(z * 0.13 + t * 0.7) * 0.08 + Math.sin((x + z) * 0.05 + t * 0.4) * 0.1
    }
    pos.needsUpdate = true
  })
  return <mesh ref={ref} geometry={geo} material={material} position={[0, -0.5, 0]} receiveShadow />
}
