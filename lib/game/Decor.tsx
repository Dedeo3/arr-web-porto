"use client"

import { useLayoutEffect, useMemo, useRef } from "react"
import { Color, InstancedMesh, Object3D, type BufferGeometry, type Material } from "three"
import { getDecor, type Placement } from "./world"
import { mat, unitCone, unitCyl, unitIco } from "./character"

const dummy = new Object3D()
const col = new Color()

type FillFn = (i: number, d: Object3D, c: Color) => void

export function Inst({
  geometry,
  material,
  count,
  fill,
  cast = false,
  receive = false,
}: {
  geometry: BufferGeometry
  material: Material
  count: number
  fill: FillFn
  cast?: boolean
  receive?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      col.set("#ffffff")
      fill(i, dummy, col)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, col)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
    m.computeBoundingBox()
  }, [count, fill])
  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow={cast} receiveShadow={receive} frustumCulled />
}

const OAK_GREENS = ["#4f9f45", "#5fae4c", "#3f8a3f", "#6bb852"]
const PINE_GREENS = ["#2f7a4a", "#3a8a52", "#276a42"]
const FLOWER = ["#f472b6", "#fde047", "#ffffff", "#c084fc", "#fb7185", "#fdba74"]
const ROCKS = ["#8b8b95", "#9a9aa4", "#767683"]
const GRASS = ["#5fae4c", "#74c05c", "#4e9a47"]

const pick = (arr: string[], t: number) => arr[Math.floor(t * arr.length) % arr.length]

function useFill(list: Placement[], f: (p: Placement, d: Object3D, c: Color) => void): FillFn {
  return useMemo(() => (i: number, d: Object3D, c: Color) => f(list[i], d, c), [list, f])
}

export function Decor() {
  const decor = useMemo(() => getDecor(), [])
  const white = mat("#ffffff")
  const trunkMat = mat("#7a5230")

  const oakTrunk = useFill(decor.oaks, (p, d) => {
    d.position.set(p.x, p.y - 0.1, p.z)
    d.scale.set(0.28 * p.s, 1.9 * p.s, 0.28 * p.s)
    d.position.y += 0.95 * p.s
    d.rotation.y = p.r
  })
  const oakA = useFill(decor.oaks, (p, d, c) => {
    d.position.set(p.x, p.y + 2.3 * p.s, p.z)
    d.scale.set(1.5 * p.s, 1.25 * p.s, 1.5 * p.s)
    d.rotation.y = p.r
    c.set(pick(OAK_GREENS, p.c))
  })
  const oakB = useFill(decor.oaks, (p, d, c) => {
    d.position.set(p.x + Math.cos(p.r) * 0.7 * p.s, p.y + 1.7 * p.s, p.z + Math.sin(p.r) * 0.7 * p.s)
    d.scale.set(1.0 * p.s, 0.85 * p.s, 1.0 * p.s)
    d.rotation.y = p.r * 2
    c.set(pick(OAK_GREENS, p.c)).offsetHSL(0, 0, -0.04)
  })

  const pineTrunk = useFill(decor.pines, (p, d) => {
    d.position.set(p.x, p.y - 0.1 + 0.9 * p.s, p.z)
    d.scale.set(0.24 * p.s, 1.8 * p.s, 0.24 * p.s)
  })
  const pine1 = useFill(decor.pines, (p, d, c) => {
    d.position.set(p.x, p.y + 1.9 * p.s, p.z)
    d.scale.set(1.35 * p.s, 2.1 * p.s, 1.35 * p.s)
    d.rotation.y = p.r
    c.set(pick(PINE_GREENS, p.c))
  })
  const pine2 = useFill(decor.pines, (p, d, c) => {
    d.position.set(p.x, p.y + 3.1 * p.s, p.z)
    d.scale.set(1.0 * p.s, 1.8 * p.s, 1.0 * p.s)
    d.rotation.y = p.r
    c.set(pick(PINE_GREENS, p.c)).offsetHSL(0, 0, 0.03)
  })
  const pine3 = useFill(decor.pines, (p, d, c) => {
    d.position.set(p.x, p.y + 4.1 * p.s, p.z)
    d.scale.set(0.65 * p.s, 1.4 * p.s, 0.65 * p.s)
    d.rotation.y = p.r
    c.set(pick(PINE_GREENS, p.c)).offsetHSL(0, 0, 0.06)
  })

  const bush = useFill(decor.bushes, (p, d, c) => {
    d.position.set(p.x, p.y + 0.25 * p.s, p.z)
    d.scale.set(0.95 * p.s, 0.65 * p.s, 0.95 * p.s)
    d.rotation.y = p.r
    c.set(pick(OAK_GREENS, p.c)).offsetHSL(0, 0, -0.03)
  })
  const rock = useFill(decor.rocks, (p, d, c) => {
    d.position.set(p.x, p.y + 0.2 * p.s, p.z)
    d.scale.set(1.0 * p.s, 0.75 * p.s, 0.85 * p.s)
    d.rotation.set(p.c * 0.6, p.r, 0)
    c.set(pick(ROCKS, p.c))
  })
  const flower = useFill(decor.flowers, (p, d, c) => {
    d.position.set(p.x, p.y + 0.34 * p.s, p.z)
    d.scale.set(0.13 * p.s, 0.1 * p.s, 0.13 * p.s)
    c.set(pick(FLOWER, p.c * 7.3 - Math.floor(p.c * 7.3)))
  })
  const stem = useFill(decor.flowers, (p, d, c) => {
    d.position.set(p.x, p.y + 0.15 * p.s, p.z)
    d.scale.set(0.02, 0.32 * p.s, 0.02)
    c.set("#4e9a47")
  })
  const grass = useFill(decor.grass, (p, d, c) => {
    d.position.set(p.x, p.y + 0.22 * p.s, p.z)
    d.scale.set(0.14 * p.s, 0.5 * p.s, 0.14 * p.s)
    d.rotation.y = p.r
    c.set(pick(GRASS, p.c))
  })

  return (
    <group>
      <Inst geometry={unitCyl(6)} material={trunkMat} count={decor.oaks.length} fill={oakTrunk} cast />
      <Inst geometry={unitIco(1)} material={white} count={decor.oaks.length} fill={oakA} cast />
      <Inst geometry={unitIco(1)} material={white} count={decor.oaks.length} fill={oakB} cast />
      <Inst geometry={unitCyl(6)} material={trunkMat} count={decor.pines.length} fill={pineTrunk} cast />
      <Inst geometry={unitCone(7)} material={white} count={decor.pines.length} fill={pine1} cast />
      <Inst geometry={unitCone(7)} material={white} count={decor.pines.length} fill={pine2} cast />
      <Inst geometry={unitCone(7)} material={white} count={decor.pines.length} fill={pine3} cast />
      <Inst geometry={unitIco(0)} material={white} count={decor.bushes.length} fill={bush} cast />
      <Inst geometry={unitIco(0)} material={white} count={decor.rocks.length} fill={rock} cast receive />
      <Inst geometry={unitIco(0)} material={white} count={decor.flowers.length} fill={flower} />
      <Inst geometry={unitCyl(3)} material={white} count={decor.flowers.length} fill={stem} />
      <Inst geometry={unitCone(4)} material={white} count={decor.grass.length} fill={grass} />
    </group>
  )
}
