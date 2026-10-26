"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { Raycaster, Vector2 } from "three"
import { getState, input } from "./store"
import { groundY, heightAt, isWater } from "./world"

const intentOut = { x: 0, z: 0, mag: 0, run: false }

/** Reads keyboard / joystick / click target and returns a world-space move direction. No allocation. */
export function readIntent(yaw: number, px: number, pz: number) {
  const o = intentOut
  o.x = 0
  o.z = 0
  o.mag = 0
  o.run = false
  if (input.frozen) return o
  const k = input.keys
  let ix = 0
  let iy = 0
  if (k["a"] || k["arrowleft"]) ix -= 1
  if (k["d"] || k["arrowright"]) ix += 1
  if (k["w"] || k["arrowup"]) iy += 1
  if (k["s"] || k["arrowdown"]) iy -= 1
  ix += input.joyX
  iy += input.joyY
  let m = Math.hypot(ix, iy)
  if (m > 0.05) {
    if (m > 1) {
      ix /= m
      iy /= m
      m = 1
    }
    input.targetActive = false
    const sy = Math.sin(yaw)
    const cy = Math.cos(yaw)
    // forward (away from the camera) = (-sin, -cos); right = (cos, -sin)
    o.x = -sy * iy + cy * ix
    o.z = -cy * iy - sy * ix
    o.mag = m
    o.run = !!k["shift"] || input.run
    return o
  }
  if (input.targetActive) {
    const dx = input.targetX - px
    const dz = input.targetZ - pz
    const d = Math.hypot(dx, dz)
    if (d < 0.3) {
      input.targetActive = false
    } else {
      o.x = dx / d
      o.z = dz / d
      o.mag = d < 1 ? 0.6 : 1
      o.run = d > 18
    }
  }
  return o
}

const ray = new Raycaster()
const ndc = new Vector2()

export function InputController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = "none"
    const pointers = new Map<number, { x: number; y: number }>()
    let downX = 0
    let downY = 0
    let downT = 0
    let moved = false
    let pinch = 0

    const blocked = () => !!getState().panel || getState().cover
    const typing = (t: EventTarget | null) => {
      const n = (t as HTMLElement | null)?.tagName
      return n === "INPUT" || n === "TEXTAREA" || n === "SELECT"
    }

    const keydown = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      const key = e.key.toLowerCase()
      if (getState().panel) return
      if (key === " " || key.startsWith("arrow")) e.preventDefault()
      if (!e.repeat) {
        if (key === " ") input.jumpQueued = true
        if (key === "e" || key === "enter") input.interactQueued = true
      }
      input.keys[key] = true
    }
    const keyup = (e: KeyboardEvent) => {
      input.keys[e.key.toLowerCase()] = false
      if (e.key === "Shift") input.keys["shift"] = false
    }
    const blur = () => {
      for (const k in input.keys) input.keys[k] = false
    }

    const pick = (cx: number, cy: number) => {
      const rect = el.getBoundingClientRect()
      ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const o = ray.ray.origin
      const d = ray.ray.direction
      const phase = getState().phase
      if (phase === "room") {
        if (d.y >= -0.01) return
        const t = -o.y / d.y
        input.targetX = o.x + d.x * t
        input.targetZ = o.z + d.z * t
        input.targetActive = true
        return
      }
      if (phase !== "city") return
      let t = 0.5
      let prev = 0
      for (let i = 0; i < 420; i++) {
        const x = o.x + d.x * t
        const y = o.y + d.y * t
        const z = o.z + d.z * t
        if (y < heightAt(x, z)) {
          // refine between prev and t
          let a = prev
          let b = t
          for (let j = 0; j < 8; j++) {
            const mid = (a + b) / 2
            const mx = o.x + d.x * mid
            const my = o.y + d.y * mid
            const mz = o.z + d.z * mid
            if (my < groundY(mx, mz)) b = mid
            else a = mid
          }
          const fx = o.x + d.x * b
          const fz = o.z + d.z * b
          if (!isWater(fx, fz)) {
            input.targetX = fx
            input.targetZ = fz
            input.targetActive = true
          }
          return
        }
        prev = t
        t += 0.6 + t * 0.012
      }
    }

    const down = (e: PointerEvent) => {
      if (blocked()) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already gone */
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1) {
        downX = e.clientX
        downY = e.clientY
        downT = performance.now()
        moved = false
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
        moved = true
      }
    }
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId)
      if (!p || blocked()) return
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      if (pointers.size === 1) {
        if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 7) moved = true
        if (moved) {
          if (getState().phase === "city") {
            input.camYaw -= dx * 0.006
            input.camPitch = Math.min(1.2, Math.max(0.12, input.camPitch + dy * 0.005))
          }
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0) input.camDist = Math.min(22, Math.max(5, input.camDist * (pinch / dist)))
        pinch = dist
      }
    }
    const up = (e: PointerEvent) => {
      const had = pointers.delete(e.pointerId)
      if (!had) return
      if (pointers.size === 0 && !moved && performance.now() - downT < 450 && !blocked()) pick(e.clientX, e.clientY)
      if (pointers.size < 2) pinch = 0
    }
    const wheel = (e: WheelEvent) => {
      if (blocked()) return
      input.camDist = Math.min(22, Math.max(5, input.camDist * Math.exp(e.deltaY * 0.0012)))
    }
    const ctx = (e: Event) => e.preventDefault()

    window.addEventListener("keydown", keydown)
    window.addEventListener("keyup", keyup)
    window.addEventListener("blur", blur)
    el.addEventListener("pointerdown", down)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
    el.addEventListener("wheel", wheel, { passive: true })
    el.addEventListener("contextmenu", ctx)
    return () => {
      window.removeEventListener("keydown", keydown)
      window.removeEventListener("keyup", keyup)
      window.removeEventListener("blur", blur)
      el.removeEventListener("pointerdown", down)
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
      el.removeEventListener("wheel", wheel)
      el.removeEventListener("contextmenu", ctx)
    }
  }, [gl, camera])

  return null
}
