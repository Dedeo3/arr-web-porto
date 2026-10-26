"use client"

import { useEffect, useRef, useState } from "react"
import { CHARACTER_INFO, PROFILE, SECTIONS, type SectionId } from "@/lib/content"
import {
  backToSelect,
  exitRoom,
  getState,
  input,
  openGuide,
  openPanel,
  setState,
  startExplore,
  toggleNight,
  toggleWeather,
  useGame,
} from "@/lib/game/store"
import { initAudio, setMuted, sfx } from "@/lib/game/audio"
import { buildingById, doorPoint, heightAt, islandRadius, ISLAND_R, BUILDINGS } from "@/lib/game/world"
import { player } from "@/lib/game/env"

// ---------- cover (circle wipe) ----------
export function Cover() {
  const cover = useGame((s) => s.cover)
  return <div className={`cover ${cover ? "closed" : "open"}`} aria-hidden />
}

// ---------- character select ----------
const ACCENTS = ["#7a1f2e", "#1f8c8f"]

export function SelectUI() {
  const sel = useGame((s) => s.character)
  const go = () => {
    initAudio()
    sfx.click()
    startExplore()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (getState().phase !== "select") return
      if (e.key === "ArrowLeft") setState({ character: 0 })
      if (e.key === "ArrowRight") setState({ character: 1 })
      if (e.key === "Enter") {
        initAudio()
        startExplore()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  return (
    <div className="select-ui">
      <div className="select-title">
        <p className="kicker">Interactive portfolio</p>
        <h1>{PROFILE.worldName}</h1>
        <p className="muted">Choose your explorer, then walk into my work.</p>
      </div>
      <div className="select-bottom">
        <div className="char-cards" role="radiogroup" aria-label="Choose a character">
          {CHARACTER_INFO.map((c, i) => (
            <button
              key={c.name}
              role="radio"
              aria-checked={sel === i}
              className={`char-card ${sel === i ? "active" : ""}`}
              style={{ ["--accent" as string]: ACCENTS[i] }}
              onClick={() => {
                initAudio()
                sfx.click()
                setState({ character: i })
              }}
            >
              <strong>{c.name}</strong>
              <span>{c.blurb}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-xl" onClick={go}>
          Explore
        </button>
        <p className="muted small hint-desktop">← → choose · Enter to start</p>
      </div>
    </div>
  )
}

// ---------- minimap ----------
const MAP = 116
const WORLD = ISLAND_R * 2.3

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = MAP * dpr
    cv.height = MAP * dpr
    const g = cv.getContext("2d")!
    g.scale(dpr, dpr)
    const base = document.createElement("canvas")
    base.width = MAP
    base.height = MAP
    const bg = base.getContext("2d")!
    const cell = 2
    for (let py = 0; py < MAP; py += cell) {
      for (let px = 0; px < MAP; px += cell) {
        const x = (px / MAP - 0.5) * WORLD
        const z = (py / MAP - 0.5) * WORLD
        const h = heightAt(x, z)
        const coast = islandRadius(Math.atan2(z, x)) - Math.hypot(x, z)
        bg.fillStyle = h < -0.5 ? "#2a6f9a" : h < 0.5 && coast < 24 ? "#e8d69c" : h > 8 ? "#8b8b95" : "#6fb25a"
        bg.fillRect(px, py, cell, cell)
      }
    }
    const colors: Record<string, string> = { about: "#fbbf24", projects: "#818cf8", skills: "#34d399", contact: "#fb7185" }
    let raf = 0
    let last = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < 100) return
      last = t
      g.clearRect(0, 0, MAP, MAP)
      g.save()
      g.beginPath()
      g.arc(MAP / 2, MAP / 2, MAP / 2 - 1, 0, Math.PI * 2)
      g.clip()
      g.drawImage(base, 0, 0)
      for (const b of BUILDINGS) {
        g.fillStyle = colors[b.id]
        g.beginPath()
        g.arc((b.x / WORLD + 0.5) * MAP, (b.z / WORLD + 0.5) * MAP, 3.2, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = "#0b1020"
        g.lineWidth = 1
        g.stroke()
      }
      const px = (player.x / WORLD + 0.5) * MAP
      const pz = (player.z / WORLD + 0.5) * MAP
      g.translate(px, pz)
      g.rotate(-player.heading + Math.PI)
      g.fillStyle = "#ffffff"
      g.strokeStyle = "#0b1020"
      g.lineWidth = 1.5
      g.beginPath()
      g.moveTo(0, -5)
      g.lineTo(3.6, 4)
      g.lineTo(0, 2)
      g.lineTo(-3.6, 4)
      g.closePath()
      g.fill()
      g.stroke()
      g.restore()
      g.strokeStyle = "rgba(255,255,255,0.35)"
      g.lineWidth = 2
      g.beginPath()
      g.arc(MAP / 2, MAP / 2, MAP / 2 - 1, 0, Math.PI * 2)
      g.stroke()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="minimap" style={{ width: MAP, height: MAP }} aria-hidden />
}

// ---------- HUD ----------
export function Hud() {
  const phase = useGame((s) => s.phase)
  const near = useGame((s) => s.near)
  const fish = useGame((s) => s.fish)
  const fishState = useGame((s) => s.fishState)
  const muted = useGame((s) => s.muted)
  const night = useGame((s) => s.night)
  const weather = useGame((s) => s.weather)
  const toastMsg = useGame((s) => s.toast)
  const places = useGame((s) => s.places)
  const panel = useGame((s) => s.panel)
  const [coarse, setCoarse] = useState(false)
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), [])

  if (phase === "select" || panel) return null

  const walkTo = (id: SectionId) => {
    const d = doorPoint(buildingById(id))
    input.targetX = d.x
    input.targetZ = d.z
    input.targetActive = true
    setState({ places: false })
    sfx.click()
  }

  return (
    <div className="hud">
      <div className="hud-top-left">
        {phase === "room" ? (
          <button className="pill" onClick={() => exitRoom()}>
            ← Exit
          </button>
        ) : (
          <>
            <button
              className="pill"
              onClick={() => {
                sfx.click()
                backToSelect()
              }}
              aria-label="Back to character select"
            >
              ☺ <span className="lbl">Characters</span>
            </button>
            <button className="pill" aria-label="Ask the guide" onClick={() => { sfx.click(); openGuide() }}>
              ✦ <span className="lbl">Guide</span>
            </button>
            <div className="places-wrap">
              <button className="pill" aria-label="Places" aria-expanded={places} onClick={() => setState({ places: !places })}>
                ⌖ <span className="lbl">Places</span>
              </button>
              {places && (
                <ul className="places glass">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <button onClick={() => walkTo(s.id)}>
                        <strong>{s.building}</strong>
                        <span>{s.blurb}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <div className="hud-top-right">
        <div className="pill static" aria-label={`${fish} fish caught`}>
          <span aria-hidden>🐟</span> {fish}
        </div>
        <button
          className="pill icon"
          onClick={() => {
            setMuted(!muted)
            setState({ muted: !muted })
          }}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button className="pill icon" onClick={() => { sfx.click(); toggleNight() }} aria-label={night ? "Switch to day" : "Switch to night"}>
          {night ? "🌙" : "☀️"}
        </button>
        {phase === "city" && (
          <button className="pill icon" onClick={() => { sfx.click(); toggleWeather() }} aria-label="Toggle rain">
            {weather === "rain" ? "🌧️" : "🌤️"}
          </button>
        )}
      </div>

      {phase === "city" && (
        <div className="hud-map">
          <Minimap />
        </div>
      )}

      {near && (
        <div className={`prompt glass ${fishState === "bite" ? "bite" : ""}`} role="status">
          <kbd>E</kbd>
          {near.kind === "fish" ? (
            <span>
              {fishState === "idle" ? "Cast your line" : fishState === "wait" ? "Waiting for a bite…" : "Bite! Reel in!"}
            </span>
          ) : (
            <span>
              {near.kind === "door" ? "Enter" : near.kind === "exit" ? "Exit" : near.kind === "talk" ? "Talk to" : "Open"} <strong>{near.label}</strong>
            </span>
          )}
        </div>
      )}

      {toastMsg && (
        <div key={toastMsg.id} className="toast glass" role="status">
          {toastMsg.text}
        </div>
      )}

      {!coarse && (
        <p className="controls-hint">
          {phase === "city" ? "WASD / arrows move · Shift run · Space jump · drag to look · scroll to zoom · click to walk" : "WASD move · Space jump · click the floor to walk · E to interact"}
        </p>
      )}
    </div>
  )
}

// ---------- touch controls ----------
export function TouchControls() {
  const phase = useGame((s) => s.phase)
  const near = useGame((s) => s.near)
  const panel = useGame((s) => s.panel)
  const [coarse, setCoarse] = useState(false)
  const [stick, setStick] = useState<{ bx: number; by: number; kx: number; ky: number } | null>(null)
  const id = useRef<number | null>(null)

  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window), [])

  if (!coarse || phase === "select" || panel) return null

  const R = 56
  const update = (cx: number, cy: number, bx: number, by: number) => {
    let dx = cx - bx
    let dy = cy - by
    const d = Math.hypot(dx, dy)
    const m = Math.min(1, d / R)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    const dead = 0.14
    const k = m < dead ? 0 : Math.pow((m - dead) / (1 - dead), 1.35)
    const ang = Math.atan2(dy, dx)
    input.joyX = Math.cos(ang) * k
    input.joyY = -Math.sin(ang) * k
    input.run = k > 0.92
    setStick({ bx, by, kx: bx + dx, ky: by + dy })
  }

  return (
    <>
      <div
        className="joy-zone"
        onPointerDown={(e) => {
          if (id.current !== null) return
          id.current = e.pointerId
          ;try {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          } catch {
            /* pointer already gone */
          }
          navigator.vibrate?.(8)
          initAudio()
          update(e.clientX, e.clientY, e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (id.current !== e.pointerId || !stick) return
          update(e.clientX, e.clientY, stick.bx, stick.by)
        }}
        onPointerUp={(e) => {
          if (id.current !== e.pointerId) return
          id.current = null
          input.joyX = 0
          input.joyY = 0
          input.run = false
          setStick(null)
        }}
        onPointerCancel={() => {
          id.current = null
          input.joyX = 0
          input.joyY = 0
          input.run = false
          setStick(null)
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {stick && (
          <>
            <div className="joy-base" style={{ left: stick.bx, top: stick.by }} />
            <div className="joy-knob" style={{ left: stick.kx, top: stick.ky }} />
          </>
        )}
      </div>
      <div className="touch-buttons">
        <button
          className={`tbtn jump`}
          onPointerDown={(e) => {
            e.preventDefault()
            input.jumpQueued = true
            navigator.vibrate?.(10)
          }}
          aria-label="Jump"
        >
          Jump
        </button>
        <button
          className={`tbtn enter ${near ? "ready" : ""}`}
          onPointerDown={(e) => {
            e.preventDefault()
            input.interactQueued = true
            navigator.vibrate?.(14)
          }}
          aria-label="Enter"
        >
          {near ? (near.kind === "exit" ? "Exit" : near.kind === "door" ? "Enter" : near.kind === "fish" ? "Fish" : near.kind === "talk" ? "Talk" : "Open") : "Enter"}
        </button>
      </div>
    </>
  )
}

// ---------- fallback when WebGL is unavailable ----------
export function Fallback() {
  return (
    <div className="fallback">
      <div className="fallback-inner">
        <p className="kicker">Interactive portfolio</p>
        <h1>{PROFILE.worldName}</h1>
        <p className="muted">Your browser cannot run the 3D world (WebGL is unavailable), so here are the places directly.</p>
        <div className="fallback-list">
          {SECTIONS.map((s) => (
            <button key={s.id} className="char-card active" onClick={() => openPanel(`section:${s.id}`)}>
              <strong>{s.building}</strong>
              <span>
                {s.section} · {s.blurb}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
