import type { RoomId } from "./store"

// Interior room layout data (collision boxes and interaction stations). Room spans x -8..8, z -6..6.
export const ROOM_W = 16
export const ROOM_D = 12

export type AABB = { x: number; z: number; hx: number; hz: number }
export type Station = { id: string; x: number; z: number; label: string }
export type RoomDef = { name: string; colliders: AABB[]; stations: Station[] }

export const EXIT_MAT = { x: 0, z: 5.3, hx: 1.6, hz: 0.75 }
export const ROOM_SPAWN = { x: 0, z: 3.6 }
export const BOUNDS = { minX: -7.4, maxX: 7.4, minZ: -5.4, maxZ: 6.0 }

export const PROJECT_STATIONS: Array<{ x: number; z: number; side: "back" | "left" | "right" }> = [
  { x: -6, z: -4.3, side: "back" },
  { x: -2, z: -4.3, side: "back" },
  { x: 2, z: -4.3, side: "back" },
  { x: 6, z: -4.3, side: "back" },
  { x: -6.5, z: -2, side: "left" },
  { x: -6.5, z: 0.9, side: "left" },
  { x: -6.5, z: 3.6, side: "left" },
  { x: 6.5, z: -2.4, side: "right" },
  { x: 6.5, z: -0.2, side: "right" },
  { x: 6.5, z: 2.0, side: "right" },
  { x: 6.5, z: 4.2, side: "right" },
]

export function roomDef(id: RoomId, projectTitles: string[]): RoomDef {
  switch (id) {
    case "about":
      return {
        name: "My House",
        colliders: [
          { x: -5.2, z: -3.8, hx: 1.5, hz: 2.2 }, // bed
          { x: 2.2, z: -5.5, hx: 2.4, hz: 0.5 }, // bookshelf
          { x: 6, z: -5.1, hx: 1.7, hz: 0.8 }, // desk
          { x: 4.8, z: 3.2, hx: 1.9, hz: 0.8 }, // sofa
          { x: -7.0, z: 5.0, hx: 0.5, hz: 0.5 }, // plant
        ],
        stations: [
          { id: "about:journey", x: 2.2, z: -3.7, label: "My Journey" },
          { id: "about:intro", x: 6, z: -3.5, label: "Introduction" },
          { id: "about:what", x: -6.4, z: 1.2, label: "What I Do" },
        ],
      }
    case "projects":
      return {
        name: "Project Gallery",
        colliders: [{ x: 0, z: 0, hx: 1.25, hz: 1.25 }],
        stations: PROJECT_STATIONS.map((p, i) => ({ id: `project:${i}`, x: p.x, z: p.z, label: projectTitles[i] ?? `Project ${i + 1}` })),
      }
    case "skills":
      return {
        name: "Workshop",
        colliders: [
          { x: -7.0, z: -3.0, hx: 0.7, hz: 0.95 },
          { x: -7.0, z: -0.8, hx: 0.7, hz: 0.95 },
          { x: -7.0, z: 1.4, hx: 0.7, hz: 0.95 },
          { x: -1.0, z: -5.2, hx: 2.8, hz: 0.75 }, // workbench
          { x: 5.5, z: -5.1, hx: 1.6, hz: 0.8 }, // terminal desk
          { x: 6.6, z: 2.6, hx: 0.9, hz: 0.55 }, // toolbox
          { x: -5.2, z: 4.4, hx: 1.2, hz: 1.0 }, // furnace
          { x: -2.6, z: 4.2, hx: 0.6, hz: 0.45 }, // anvil
          { x: 7.0, z: 5.0, hx: 0.55, hz: 0.55 }, // crate
        ],
        stations: [
          { id: "skills:frontend", x: 5.5, z: -3.5, label: "Mobile & Frontend" },
          { id: "skills:backend", x: -5.5, z: -0.8, label: "Backend & Data" },
          { id: "skills:tools", x: 5.0, z: 2.6, label: "Tools & Cloud" },
        ],
      }
    case "contact":
      return {
        name: "Post Office",
        colliders: [
          { x: 2, z: -2.6, hx: 4, hz: 0.6 }, // counter
          { x: -5.5, z: 1.6, hx: 1.3, hz: 0.7 }, // writing desk
          { x: -7.5, z: -2.5, hx: 0.5, hz: 3 }, // mailbox wall
          { x: 7.4, z: 1.5, hx: 0.6, hz: 2.5 }, // parcel shelf
          { x: 2, z: -4.3, hx: 0.5, hz: 0.5 }, // clerk
          { x: -6.4, z: 5.0, hx: 0.5, hz: 0.5 }, // postbox
        ],
        stations: [
          { id: "contact:counter", x: 1.6, z: -1.4, label: "Counter" },
          { id: "contact:write", x: -3.9, z: 1.6, label: "Write a Message" },
          { id: "contact:box", x: -6.2, z: -2.5, label: "Mailboxes" },
        ],
      }
  }
}
