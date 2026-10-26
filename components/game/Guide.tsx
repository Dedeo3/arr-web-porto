"use client"

import { useEffect, useRef, useState } from "react"
import { GUIDE, GUIDE_AVATAR, type GuideAction } from "@/lib/content"
import { closeGuide, input, useGame } from "@/lib/game/store"
import { buildingById, DOCK_Z, doorPoint } from "@/lib/game/world"
import { sfx } from "@/lib/game/audio"

type Msg = { from: "claude" | "you"; text: string }

function walkTo(w: GuideAction["walk"]) {
  if (!w) return
  if (w === "dock") {
    input.targetX = 0
    input.targetZ = DOCK_Z + 7.5
  } else {
    const d = doorPoint(buildingById(w))
    input.targetX = d.x
    input.targetZ = d.z
  }
  input.targetActive = true
}

const SEND_OFF = ["On my way, follow the yellow ring!", "Great choice, let's go!", "Lead the way, I'll be right here."]

export function Guide() {
  const open = useGame((s) => s.guide)
  const phase = useGame((s) => s.phase)
  const [log, setLog] = useState<Msg[]>([])
  const [node, setNode] = useState("root")
  const [chars, setChars] = useState(0) // characters of the last Claude message revealed
  const [thinking, setThinking] = useState(false)
  const [bye, setBye] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const firstBtn = useRef<HTMLButtonElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const last = log[log.length - 1]
  const typing = !!last && last.from === "claude" && chars < last.text.length
  const ready = !!last && !typing && !thinking && last.from === "claude"

  // restart the conversation every time the guide opens
  useEffect(() => {
    if (!open) return
    setLog([{ from: "claude", text: GUIDE.root.text }])
    setNode("root")
    setChars(0)
    setThinking(false)
    setBye(false)
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [open])

  // typewriter
  useEffect(() => {
    if (!typing) return
    const id = setInterval(() => setChars((c) => c + 2), 24)
    return () => clearInterval(id)
  }, [typing])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" })
  }, [log, chars, thinking])

  useEffect(() => {
    if (ready) firstBtn.current?.focus({ preventScroll: true })
  }, [ready, node])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGuide()
      if (e.key === "Enter" && typing && last) setChars(last.text.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, typing, last])

  if (!open || phase !== "city") return null

  const n = GUIDE[node]

  const pick = (a: GuideAction) => {
    sfx.click()
    setLog((l) => [...l, { from: "you", text: a.label }])
    setThinking(true)
    const t = setTimeout(() => {
      setThinking(false)
      if (a.next) {
        setNode(a.next)
        setChars(0)
        setLog((l) => [...l, { from: "claude", text: GUIDE[a.next!].text }])
      } else {
        const msg = a.walk ? SEND_OFF[Math.floor(Math.random() * SEND_OFF.length)] : "Have fun! Call me anytime with the Guide button."
        setChars(0)
        setBye(true)
        setLog((l) => [...l, { from: "claude", text: msg }])
        const t2 = setTimeout(() => {
          walkTo(a.walk)
          closeGuide()
        }, 1400)
        timers.current.push(t2)
      }
    }, 650)
    timers.current.push(t)
  }


  return (
    <div className="guide glass" role="dialog" aria-label="Chat with Claude, your guide">
      <div className="guide-head">
        <span className="guide-avatar" aria-hidden>
          ✦
        </span>
        <strong>{GUIDE_AVATAR}</strong>
        <span className="muted small">your guide</span>
        <button className="icon-btn guide-close" onClick={closeGuide} aria-label="Close guide">
          ✕
        </button>
      </div>
      <div className="chat" ref={scroller} aria-live="polite" onPointerDown={() => typing && last && setChars(last.text.length)}>
        {log.map((m, i) => {
          const isLast = i === log.length - 1
          const text = m.from === "claude" && isLast ? m.text.slice(0, chars) : m.text
          return (
            <div key={i} className={`bubble ${m.from}`}>
              {text}
              {m.from === "claude" && isLast && typing && <span className="caret">▍</span>}
            </div>
          )
        })}
        {thinking && (
          <div className="bubble claude dots" aria-label="Claude is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {ready && !bye && (
        <div className="guide-actions">
          {n.actions.map((a, i) => (
            <button key={a.label} ref={i === 0 ? firstBtn : undefined} className={a.walk ? "btn btn-primary" : "btn"} onClick={() => pick(a)}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
