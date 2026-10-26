"use client"

import { useEffect } from "react"
import * as store from "@/lib/game/store"
import { setState, useGame } from "@/lib/game/store"
import { initAudio, loadMuted, setNight, setRain, setScene } from "@/lib/game/audio"
import GameCanvas from "./GameCanvas"
import { Cover, Fallback, Hud, SelectUI, TouchControls } from "./Ui"
import { PanelHost } from "./Panels"
import { Guide } from "./Guide"

function hasWebGL() {
  try {
    const c = document.createElement("canvas")
    return !!(c.getContext("webgl2") || c.getContext("webgl"))
  } catch {
    return false
  }
}

export default function Game() {
  const phase = useGame((s) => s.phase)
  const webgl = useGame((s) => s.webgl)
  const night = useGame((s) => s.night)
  const weather = useGame((s) => s.weather)

  useEffect(() => {
    setState({ webgl: hasWebGL(), muted: loadMuted() })
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __game: store })
    // audio may only start on a user gesture
    const start = () => initAudio()
    window.addEventListener("pointerdown", start)
    window.addEventListener("keydown", start)
    return () => {
      window.removeEventListener("pointerdown", start)
      window.removeEventListener("keydown", start)
    }
  }, [])

  useEffect(() => {
    setScene(phase)
  }, [phase])
  useEffect(() => {
    setNight(night)
  }, [night])
  useEffect(() => {
    setRain(weather === "rain")
  }, [weather])

  // make sure the page never scrolls or bounces while playing
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener("gesturestart", prevent)
    return () => document.removeEventListener("gesturestart", prevent)
  }, [])

  return (
    <div className="game-root">
      {webgl ? (
        <>
          <GameCanvas />
          {phase === "select" && <SelectUI />}
          <Hud />
          <TouchControls />
          <Guide />
        </>
      ) : (
        <Fallback />
      )}
      <PanelHost />
      <Cover />
    </div>
  )
}
