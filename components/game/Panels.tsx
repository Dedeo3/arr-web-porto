"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { CONTACT, CVS, JOURNEY, PROFILE, PROJECTS, SECTIONS, SKILLS, WHAT_I_DO } from "@/lib/content"
import { closePanel, useGame } from "@/lib/game/store"
import { sfx } from "@/lib/game/audio"

export function panelTitle(id: string): { title: string; kicker: string } {
  const [kind, key] = id.split(":")
  if (kind === "section") {
    const s = SECTIONS.find((x) => x.id === key)
    return { title: s?.section ?? "Section", kicker: s?.building ?? "" }
  }
  if (kind === "project") return { title: PROJECTS[Number(key)]?.title ?? "Project", kicker: "Project Gallery" }
  if (id === "about:journey") return { title: "My Journey", kicker: "My House" }
  if (id === "about:intro") return { title: PROFILE.fullName, kicker: "My House" }
  if (id === "about:what") return { title: "What I Do", kicker: "My House" }
  if (kind === "skills") return { title: SKILLS.find((s) => s.id === key)?.title ?? "Skills", kicker: "Workshop" }
  if (id === "contact:counter") return { title: "At the Counter", kicker: "Post Office" }
  if (id === "contact:write") return { title: "Write a Message", kicker: "Post Office" }
  if (id === "contact:box") return { title: "Mailboxes", kicker: "Post Office" }
  return { title: "", kicker: "" }
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>
}

function LinkBtn({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a className={primary ? "btn btn-primary" : "btn"} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function Intro() {
  return (
    <div className="stack">
      <p className="lead">{PROFILE.role}</p>
      {PROFILE.bio.map((b, i) => (
        <p key={i}>{b}</p>
      ))}
      <h3 className="sub">Download CV</h3>
      <div className="row">
        {CVS.map((c) => (
          <a key={c.file} className="btn" href={c.file} download>
            {c.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function Journey() {
  return (
    <ol className="timeline">
      {JOURNEY.map((j, i) => (
        <li key={i}>
          <strong>{j.title}</strong>
          <span>{j.text}</span>
        </li>
      ))}
    </ol>
  )
}

function WhatIDo() {
  return (
    <div className="grid2">
      {WHAT_I_DO.map((w) => (
        <div key={w.title} className="card">
          <div className="card-icon" aria-hidden>
            {w.icon}
          </div>
          <strong>{w.title}</strong>
          <p>{w.text}</p>
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ index }: { index: number }) {
  const p = PROJECTS[index]
  if (!p) return null
  return (
    <div className="stack">
      <div className="accent-bar" style={{ background: p.color }} />
      <p>{p.description}</p>
      <div className="row">
        {p.tech.map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
      </div>
      <div className="row">
        {p.live && (
          <LinkBtn href={p.live} primary>
            Live Demo
          </LinkBtn>
        )}
        {p.repo && <LinkBtn href={p.repo}>Source Code</LinkBtn>}
      </div>
    </div>
  )
}

function Skills({ id }: { id: string }) {
  const g = SKILLS.find((s) => s.id === id)
  if (!g) return null
  return (
    <div className="row">
      {g.items.map((s) => (
        <Chip key={s}>{s}</Chip>
      ))}
    </div>
  )
}

function Counter() {
  return (
    <div className="stack">
      <p>Send mail the old-fashioned way, or just ping me.</p>
      <div className="list">
        <a href={`mailto:${CONTACT.email}`}>
          <span>Email</span>
          <strong>{CONTACT.email}</strong>
        </a>
        <a href={`tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`}>
          <span>Phone</span>
          <strong>{CONTACT.phone}</strong>
        </a>
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
          <span>WhatsApp</span>
          <strong>Chat with me</strong>
        </a>
      </div>
    </div>
  )
}

function Write() {
  const [name, setName] = useState("")
  const [msg, setMsg] = useState("")
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        const subject = encodeURIComponent(`Hello from ${name || "your portfolio"}`)
        const body = encodeURIComponent(`${msg}\n\n— ${name}`)
        window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`
      }}
    >
      <label className="field">
        <span>Your name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required autoComplete="name" />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} placeholder="Tell me about your project or just say hello…" required />
      </label>
      <button type="submit" className="btn btn-primary" onClick={() => sfx.click()}>
        Send via email
      </button>
      <p className="muted">Opens your email app with the message ready to send to {CONTACT.email}.</p>
    </form>
  )
}

function Mailboxes() {
  return (
    <div className="stack">
      <div className="list">
        <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">
          <span>Instagram</span>
          <strong>{CONTACT.instagramHandle}</strong>
        </a>
        <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">
          <span>LinkedIn</span>
          <strong>Yoannes De Deo Haryo Wibisono</strong>
        </a>
        <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
          <span>GitHub</span>
          <strong>Dedeo3</strong>
        </a>
      </div>
      <p className="muted">📍 {CONTACT.location}</p>
    </div>
  )
}

function Body({ id }: { id: string }) {
  const [kind, key] = id.split(":")
  if (kind === "section") {
    return (
      <div className="stack">
        {key === "about" && (
          <>
            <Intro />
            <h3 className="sub">My Journey</h3>
            <Journey />
            <h3 className="sub">What I Do</h3>
            <WhatIDo />
          </>
        )}
        {key === "projects" &&
          PROJECTS.map((p, i) => (
            <div key={p.title} className="stack block">
              <h3 className="sub">{p.title}</h3>
              <ProjectCard index={i} />
            </div>
          ))}
        {key === "skills" &&
          SKILLS.map((s) => (
            <div key={s.id} className="stack block">
              <h3 className="sub">{s.title}</h3>
              <Skills id={s.id} />
            </div>
          ))}
        {key === "contact" && (
          <>
            <Counter />
            <h3 className="sub">Write a message</h3>
            <Write />
            <h3 className="sub">Find me online</h3>
            <Mailboxes />
          </>
        )}
      </div>
    )
  }
  if (kind === "project") return <ProjectCard index={Number(key)} />
  if (kind === "skills") return <Skills id={key} />
  if (id === "about:intro") return <Intro />
  if (id === "about:journey") return <Journey />
  if (id === "about:what") return <WhatIDo />
  if (id === "contact:counter") return <Counter />
  if (id === "contact:write") return <Write />
  if (id === "contact:box") return <Mailboxes />
  return null
}

export function PanelHost() {
  const panel = useGame((s) => s.panel)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!panel) return
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        closePanel()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      prev?.focus?.()
    }
  }, [panel])

  if (!panel) return null
  const t = panelTitle(panel)
  return (
    <div className="panel-backdrop" onPointerDown={(e) => e.target === e.currentTarget && closePanel()}>
      <div className="panel glass" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <header>
          <div>
            <p className="kicker">{t.kicker}</p>
            <h2 id="panel-title">{t.title}</h2>
          </div>
          <button ref={closeRef} className="icon-btn" onClick={closePanel} aria-label="Close panel">
            ✕
          </button>
        </header>
        <div className="panel-body">
          <Body id={panel} />
        </div>
      </div>
    </div>
  )
}
