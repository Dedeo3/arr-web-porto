import { useSyncExternalStore } from "react"

export type Phase = "select" | "city" | "room"
export type RoomId = "about" | "projects" | "skills" | "contact"
export type Weather = "clear" | "rain"

export type Near = { kind: "door" | "station" | "exit" | "fish" | "talk"; id: string; label: string } | null
export type FishState = "idle" | "wait" | "bite"

export type GameState = {
  phase: Phase
  character: number
  near: Near
  room: RoomId | null
  panel: string | null
  cover: boolean
  night: boolean
  weather: Weather
  muted: boolean
  fish: number
  fishState: FishState
  guide: boolean
  toast: { id: number; text: string } | null
  webgl: boolean
  places: boolean
}

let state: GameState = {
  phase: "select",
  character: 0,
  near: null,
  room: null,
  panel: null,
  cover: false,
  night: false,
  weather: "clear",
  muted: false,
  fish: 0,
  fishState: "idle",
  guide: false,
  toast: null,
  webgl: true,
  places: false,
}

const listeners = new Set<() => void>()

export function getState() {
  return state
}

export function setState(patch: Partial<GameState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}

export function setNear(next: Near) {
  const cur = state.near
  if (cur === next) return
  if (cur && next && cur.kind === next.kind && cur.id === next.id) return
  setState({ near: next })
}

let toastId = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined
export function toast(text: string) {
  toastId += 1
  setState({ toast: { id: toastId, text } })
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => setState({ toast: null }), 2600)
}

/** Mutable input shared by keyboard, joystick, pointer and the camera. Never triggers a render. */
export const input = {
  keys: Object.create(null) as Record<string, boolean>,
  joyX: 0,
  joyY: 0,
  joyActive: false,
  jumpQueued: false,
  interactQueued: false,
  run: false,
  targetActive: false,
  targetX: 0,
  targetZ: 0,
  camYaw: 0,
  camPitch: 0.42,
  camDist: 11,
  // set while a wave of the interface wants the player to stand still (panel open)
  frozen: false,
}

export function clearInput() {
  for (const k in input.keys) input.keys[k] = false
  input.joyX = 0
  input.joyY = 0
  input.jumpQueued = false
  input.interactQueued = false
  input.targetActive = false
}

/** Scene readiness: the scene calls markReady() once it has rendered a few frames. */
let readyResolvers: Array<() => void> = []
export function markReady() {
  const r = readyResolvers
  readyResolvers = []
  r.forEach((f) => f())
}
function waitReady(timeout = 12000) {
  return new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    readyResolvers.push(finish)
    setTimeout(finish, timeout)
  })
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Where the player should appear next in the city / room (module level so it survives scene swaps). */
export const spawn = {
  cityX: 0,
  cityZ: 9,
  cityYaw: Math.PI,
  fromBuilding: null as RoomId | null,
  intro: false,
  entering: false,
}

let busy = false

/** Circle-wipe transition around a scene change. */
export async function transition(apply: () => void) {
  if (busy) return
  busy = true
  setState({ cover: true })
  await sleep(720)
  apply()
  await waitReady()
  await sleep(120)
  setState({ cover: false })
  await sleep(720)
  busy = false
}

export function isBusy() {
  return busy
}

export function startExplore() {
  spawn.intro = true
  spawn.cityX = 0
  spawn.cityZ = 9
  spawn.cityYaw = Math.PI
  void transition(() => {
    clearInput()
    setState({ phase: "city", near: null, room: null, panel: null, guide: true })
  })
}

export function backToSelect() {
  void transition(() => {
    clearInput()
    setState({ phase: "select", near: null, room: null, panel: null, places: false, guide: false, fishState: "idle" })
  })
}

export function enterRoom(room: RoomId) {
  if (busy) return
  spawn.fromBuilding = room
  spawn.entering = true
  void transition(() => {
    clearInput()
    spawn.entering = false
    setState({ phase: "room", room, near: null, panel: null, places: false })
  })
}

export function exitRoom() {
  if (busy) return
  void transition(() => {
    clearInput()
    setState({ phase: "city", room: null, near: null, panel: null })
  })
}

export function openPanel(id: string) {
  clearInput()
  setState({ panel: id })
}

export function closePanel() {
  setState({ panel: null })
}

export function toggleNight() {
  setState({ night: !state.night })
}

export function toggleWeather() {
  setState({ weather: state.weather === "clear" ? "rain" : "clear" })
}

export function addFish() {
  setState({ fish: getState().fish + 1 })
}

export function openGuide() {
  clearInput()
  setState({ guide: true })
}

export function closeGuide() {
  setState({ guide: false })
}
