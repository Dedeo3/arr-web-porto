// Fully generative audio. No files. Starts on the first user gesture.

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
let ambBus: GainNode | null = null
let delayIn: GainNode | null = null
let reverbIn: ConvolverNode | null = null
let noiseBuf: AudioBuffer | null = null
let started = false
let muted = false
let night = false
let scene: "select" | "city" | "room" = "select"
let rainOn = false
let timer: ReturnType<typeof setInterval> | undefined
let ambTimer: ReturnType<typeof setInterval> | undefined

let windGain: GainNode | null = null
let seaGain: GainNode | null = null
let rainGain: GainNode | null = null
let cricketGain: GainNode | null = null

const MUTE_KEY = "dedeo-muted"

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1"
  } catch {
    return false
  }
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

// chords as midi arrays (pad), root (bass), pentatonic scale for plucks
const DAY = {
  bpm: 84,
  chords: [
    { root: 36, pad: [60, 64, 67, 71] }, // Cmaj7
    { root: 33, pad: [57, 60, 64, 67] }, // Am7
    { root: 29, pad: [57, 60, 64, 65] }, // Fmaj7
    { root: 31, pad: [55, 59, 62, 65] }, // G7
  ],
  scale: [72, 74, 76, 79, 81, 84],
}
const NIGHT = {
  bpm: 68,
  chords: [
    { root: 33, pad: [57, 60, 64, 67] }, // Am7
    { root: 29, pad: [53, 57, 60, 64] }, // Fmaj7
    { root: 38, pad: [57, 60, 62, 65] }, // Dm7
    { root: 28, pad: [56, 59, 62, 64] }, // E7
  ],
  scale: [69, 72, 74, 76, 79, 81],
}

function makeNoise(c: Ctx) {
  const len = c.sampleRate * 2
  const b = c.createBuffer(1, len, c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return b
}

function makeImpulse(c: Ctx) {
  const dur = 2.2
  const len = Math.floor(c.sampleRate * dur)
  const b = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  }
  return b
}

function loopNoise(c: Ctx, type: BiquadFilterType, freq: number, q = 0.7) {
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.value = 0
  src.connect(f)
  f.connect(g)
  src.start()
  return { g, f }
}

function buildAmbience(c: Ctx) {
  if (!ambBus) return
  const wind = loopNoise(c, "bandpass", 420, 0.6)
  wind.g.connect(ambBus)
  windGain = wind.g
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.09
  const lfoG = c.createGain()
  lfoG.gain.value = 220
  lfo.connect(lfoG)
  lfoG.connect(wind.f.frequency)
  lfo.start()

  const sea = loopNoise(c, "lowpass", 520, 0.4)
  sea.g.connect(ambBus)
  seaGain = sea.g
  const lfo2 = c.createOscillator()
  lfo2.frequency.value = 0.11
  const lfo2G = c.createGain()
  lfo2G.gain.value = 0.05
  lfo2.connect(lfo2G)
  lfo2G.connect(sea.g.gain)
  lfo2.start()

  const rain = loopNoise(c, "highpass", 1800, 0.5)
  rain.g.connect(ambBus)
  rainGain = rain.g

  // crickets: AM-modulated high oscillator
  const osc = c.createOscillator()
  osc.type = "sine"
  osc.frequency.value = 4300
  const am = c.createGain()
  am.gain.value = 0
  const amLfo = c.createOscillator()
  amLfo.type = "square"
  amLfo.frequency.value = 14
  const amDepth = c.createGain()
  amDepth.gain.value = 0.5
  amLfo.connect(amDepth)
  amDepth.connect(am.gain)
  const cg = c.createGain()
  cg.gain.value = 0
  osc.connect(am)
  am.connect(cg)
  cg.connect(ambBus)
  osc.start()
  amLfo.start()
  cricketGain = cg
  refreshAmbience()
}

function refreshAmbience() {
  if (!ctx) return
  const t = ctx.currentTime
  const inCity = scene === "city"
  const inSelect = scene === "select"
  const set = (g: GainNode | null, v: number) => g?.gain.setTargetAtTime(v, t, 0.6)
  // sea and wind use LFO on top of a base value; targetAtTime sets the base
  set(windGain, inCity ? 0.05 : inSelect ? 0.025 : 0.008)
  set(seaGain, inCity ? 0.1 : inSelect ? 0.05 : 0.012)
  set(rainGain, rainOn ? (inCity ? 0.05 : 0.025) : 0)
  set(cricketGain, night && inCity ? 0.012 : 0)
}

export function initAudio() {
  if (started) {
    if (ctx && ctx.state === "suspended" && document.visibilityState === "visible") void ctx.resume()
    return
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  started = true
  muted = loadMuted()
  ctx = new AC()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -16
  comp.knee.value = 18
  comp.ratio.value = 5
  comp.attack.value = 0.005
  comp.release.value = 0.2
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.8
  master.connect(comp)
  comp.connect(ctx.destination)

  musicBus = ctx.createGain()
  musicBus.gain.value = 0.55
  musicBus.connect(master)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.9
  sfxBus.connect(master)
  ambBus = ctx.createGain()
  ambBus.gain.value = 1
  ambBus.connect(master)

  noiseBuf = makeNoise(ctx)

  // delay + reverb sends
  delayIn = ctx.createGain()
  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.36
  const fb = ctx.createGain()
  fb.gain.value = 0.38
  const dlp = ctx.createBiquadFilter()
  dlp.type = "lowpass"
  dlp.frequency.value = 2400
  delayIn.connect(delay)
  delay.connect(dlp)
  dlp.connect(fb)
  fb.connect(delay)
  dlp.connect(musicBus)

  reverbIn = ctx.createConvolver()
  reverbIn.buffer = makeImpulse(ctx)
  const rg = ctx.createGain()
  rg.gain.value = 0.5
  reverbIn.connect(rg)
  rg.connect(musicBus)

  buildAmbience(ctx)
  startMusic()

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else void ctx.resume()
  })
}

export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0")
  } catch {
    /* ignore */
  }
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05)
}

export function setNight(n: boolean) {
  night = n
  refreshAmbience()
}

export function setScene(s: "select" | "city" | "room") {
  scene = s
  refreshAmbience()
}

export function setRain(r: boolean) {
  rainOn = r
  refreshAmbience()
}

// ---------- music ----------
let nextBeat = 0
let beat = 0

function startMusic() {
  if (!ctx) return
  nextBeat = ctx.currentTime + 0.2
  beat = 0
  if (timer) clearInterval(timer)
  timer = setInterval(schedule, 40)
  if (ambTimer) clearInterval(ambTimer)
  ambTimer = setInterval(ambientEvents, 1500)
}

function schedule() {
  if (!ctx || ctx.state !== "running") return
  const set = night ? NIGHT : DAY
  const spb = 60 / set.bpm / 2 // eighth note
  while (nextBeat < ctx.currentTime + 0.25) {
    playStep(set, beat, nextBeat, spb)
    nextBeat += spb
    beat = (beat + 1) % 64
  }
}

function playStep(set: typeof DAY, step: number, t: number, spb: number) {
  if (!ctx || !musicBus || !noiseBuf) return
  const bar = Math.floor(step / 16) % 4
  const inBar = step % 16
  const chord = set.chords[bar]
  const quiet = scene === "room" ? 0.8 : 1

  if (inBar === 0) {
    for (const m of chord.pad) tone("triangle", mtof(m), t, spb * 15, 0.035 * quiet, 0.9, 1100, true)
  }
  if (inBar === 0 || inBar === 6 || inBar === 10) tone("sine", mtof(chord.root), t, spb * 4, 0.12 * quiet, 0.02, 400, false)
  // plucks: probabilistic pentatonic
  if (inBar % 2 === 0 && Math.random() < 0.55) {
    const n = set.scale[Math.floor(Math.random() * set.scale.length)]
    pluck(mtof(n), t, 0.05 * quiet)
  }
  // shaker on offbeats
  if (inBar % 2 === 1) shaker(t, 0.018 * quiet)
}

function tone(type: OscillatorType, f: number, t: number, dur: number, vol: number, attack: number, lp: number, wet: boolean) {
  if (!ctx || !musicBus) return
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.value = f
  o.detune.value = (Math.random() - 0.5) * 8
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  const flt = ctx.createBiquadFilter()
  flt.type = "lowpass"
  flt.frequency.value = lp
  o.connect(flt)
  flt.connect(g)
  g.connect(musicBus)
  if (wet && reverbIn) g.connect(reverbIn)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function pluck(f: number, t: number, vol: number) {
  if (!ctx || !musicBus) return
  const o = ctx.createOscillator()
  o.type = "triangle"
  o.frequency.value = f
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
  o.connect(g)
  g.connect(musicBus)
  if (delayIn) g.connect(delayIn)
  if (reverbIn) g.connect(reverbIn)
  o.start(t)
  o.stop(t + 1)
}

function shaker(t: number, vol: number) {
  if (!ctx || !musicBus || !noiseBuf) return
  const s = ctx.createBufferSource()
  s.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = "highpass"
  f.frequency.value = 6500
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  s.connect(f)
  f.connect(g)
  g.connect(musicBus)
  s.start(t, Math.random())
  s.stop(t + 0.07)
}

function ambientEvents() {
  if (!ctx || ctx.state !== "running" || !ambBus) return
  if (scene === "city" && !night && !rainOn && Math.random() < 0.45) bird()
}

function bird() {
  if (!ctx || !ambBus) return
  const t = ctx.currentTime
  const base = 2200 + Math.random() * 1600
  const n = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator()
    o.type = "sine"
    const g = ctx.createGain()
    const st = t + i * 0.13
    o.frequency.setValueAtTime(base, st)
    o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), st + 0.08)
    g.gain.setValueAtTime(0, st)
    g.gain.linearRampToValueAtTime(0.018, st + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, st + 0.1)
    o.connect(g)
    g.connect(ambBus)
    o.start(st)
    o.stop(st + 0.12)
  }
}

// ---------- sfx ----------
function sfxTone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
  if (!ctx || !sfxBus || ctx.state !== "running" || muted) return
  const t = ctx.currentTime + delay
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(sfxBus)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function sfxNoise(freq: number, dur: number, vol: number, type: BiquadFilterType = "lowpass") {
  if (!ctx || !sfxBus || !noiseBuf || ctx.state !== "running" || muted) return
  const t = ctx.currentTime
  const s = ctx.createBufferSource()
  s.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f)
  f.connect(g)
  g.connect(sfxBus)
  s.start(t, Math.random())
  s.stop(t + dur + 0.02)
}

let lastBump = 0
export const sfx = {
  step() {
    sfxNoise(500 + Math.random() * 300, 0.07, 0.05)
  },
  jump() {
    sfxTone("sine", 280, 620, 0.16, 0.08)
  },
  land() {
    sfxNoise(320, 0.1, 0.09)
  },
  star() {
    sfxTone("triangle", 880, 880, 0.12, 0.09)
    sfxTone("triangle", 1320, 1320, 0.18, 0.09, 0.09)
    sfxTone("triangle", 1760, 1760, 0.3, 0.07, 0.19)
  },
  splash() {
    sfxNoise(1200, 0.25, 0.1, "bandpass")
    sfxTone("sine", 300, 120, 0.2, 0.05)
  },
  bite() {
    sfxTone("square", 700, 700, 0.07, 0.07)
    sfxTone("square", 900, 900, 0.09, 0.07, 0.09)
  },
  door() {
    sfxTone("square", 160, 90, 0.18, 0.05)
    sfxNoise(900, 0.2, 0.04)
    sfxTone("sine", 520, 780, 0.2, 0.05, 0.12)
  },
  click() {
    sfxTone("sine", 700, 500, 0.06, 0.06)
  },
  bump(power: number) {
    if (!ctx) return
    const now = ctx.currentTime
    if (now - lastBump < 0.07) return
    lastBump = now
    const v = Math.min(0.12, 0.02 + power * 0.02)
    sfxTone("sine", 200 + power * 20, 70, 0.12, v)
    sfxNoise(1400, 0.05, v * 0.5, "bandpass")
  },
  strike() {
    sfxTone("triangle", 523, 523, 0.15, 0.08)
    sfxTone("triangle", 659, 659, 0.15, 0.08, 0.1)
    sfxTone("triangle", 784, 784, 0.15, 0.08, 0.2)
    sfxTone("triangle", 1046, 1046, 0.35, 0.08, 0.3)
  },
}
