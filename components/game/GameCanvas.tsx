"use client"

import { useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { env, quality } from "@/lib/game/env"
import { getState, useGame } from "@/lib/game/store"
import { SelectScene } from "@/lib/game/SelectScene"
import { CityScene } from "@/lib/game/CityScene"
import { RoomScene } from "@/lib/game/RoomScene"

function EnvDriver() {
  useFrame((_, dt) => {
    const gs = getState()
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 1.6)
    env.night += ((gs.night ? 1 : 0) - env.night) * k
    env.rain += ((gs.weather === "rain" ? 1 : 0) - env.rain) * k
  })
  return null
}

/** Adaptive quality: <42 fps for 2 s steps the quality down (shadows off, dpr 1, dpr 0.75). */
function Perf() {
  const setDpr = useThree((s) => s.setDpr)
  const acc = useRef({ t: 0, n: 0, skip: 2 })
  useFrame((_, dt) => {
    if (quality.locked) return
    const a = acc.current
    a.t += dt
    a.n++
    if (a.t < 2) return
    const fps = a.n / a.t
    a.t = 0
    a.n = 0
    if (document.hidden) return
    if (a.skip > 0) {
      a.skip--
      return
    }
    if (fps < 42 && quality.level < 3) {
      quality.level++
      if (quality.level === 1) quality.shadows = false
      if (quality.level === 2) quality.dpr = 1
      if (quality.level === 3) quality.dpr = 0.75
      setDpr(quality.dpr)
      a.skip = 1
    }
  })
  return null
}

export default function GameCanvas() {
  const phase = useGame((s) => s.phase)
  const panel = useGame((s) => s.panel)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    quality.locked = q.has("hq")
    env.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    env.coarse = window.matchMedia("(pointer: coarse)").matches
    if (env.coarse && !quality.locked) {
      quality.level = 1
      quality.shadows = false
    }
    if (quality.locked) {
      quality.level = 0
      quality.shadows = true
    }
  }, [])

  return (
    <Canvas
      className="game-canvas"
      dpr={[1, 1.5]}
      flat
      shadows="percentage"
      frameloop={panel ? "demand" : "always"}
      camera={{ fov: 55, near: 0.1, far: 700, position: [0, 6, 12] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <EnvDriver />
      <Perf />
      {phase === "select" && <SelectScene />}
      {phase === "city" && <CityScene />}
      {phase === "room" && <RoomScene />}
    </Canvas>
  )
}
