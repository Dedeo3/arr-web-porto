// Mutable environment shared between scenes. Written by EnvDriver, read inside useFrame loops.

export const env = {
  night: 0, // 0 day .. 1 night, smoothed
  rain: 0, // 0 clear .. 1 rain, smoothed
  reduced: false, // prefers-reduced-motion
  coarse: false, // touch device
}

export const quality = {
  level: 0, // 0 best .. 3 worst
  shadows: true,
  dpr: 1.5,
  locked: false, // ?hq
}

/** Player state shared with lighting, minimap and effects. */
export const player = {
  x: 0,
  y: 0,
  z: 9,
  vx: 0,
  vz: 0,
  heading: Math.PI,
  running: false,
}

export const doors: Record<string, { open: number; target: number }> = {
  about: { open: 0, target: 0 },
  projects: { open: 0, target: 0 },
  skills: { open: 0, target: 0 },
  contact: { open: 0, target: 0 },
}

export const NPCS: Array<{ x: number; z: number; heading: number; speed: number }> = [
  { x: -3, z: 20, heading: 0, speed: 0 },
  { x: 5, z: -8, heading: 0, speed: 0 },
  { x: 2, z: 56, heading: 0, speed: 0 },
]

/** Fishing state shared by the player controller and the bobber visual. */
export const fishing = {
  state: 0, // 0 idle, 1 waiting, 2 bite
  x: 0,
  z: 0,
  t: 0,
}
