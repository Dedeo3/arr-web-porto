"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  Object3D,
  Points,
  PointsMaterial,
  ShaderMaterial,
  MeshBasicMaterial,
  Vector3,
} from "three"
import { env, player, quality } from "./env"
import { mulberry32 } from "./world"

const C = (h: string) => new Color(h)
const dayTop = C("#3f9bec")
const dayBot = C("#d4efff")
const nightTop = C("#050a22")
const nightBot = C("#1c2a58")
const rainTop = C("#6b7d92")
const rainBot = C("#aab6c2")
const fogDay = C("#c3e6f7")
const fogNight = C("#121b3d")
const fogRain = C("#9aa8b5")
const sunCol = C("#fff0cf")
const moonCol = C("#8fa6ff")
const ambDay = C("#ffffff")
const ambNight = C("#5c6cc4")
const hemiSkyDay = C("#cdeaff")
const hemiSkyNight = C("#4856a8")
const hemiGndDay = C("#74905a")
const hemiGndNight = C("#1c2440")

const sunDir = new Vector3(0.5, 0.7, 0.5).normalize()
const moonDir = new Vector3(-0.45, 0.6, -0.5).normalize()
const tmpA = new Color()
const tmpB = new Color()
const tmpV = new Vector3()

function mix(out: Color, a: Color, b: Color, t: number) {
  return out.copy(a).lerp(b, t)
}

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const skyFrag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBot;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y * 1.25 + 0.08, 0.0, 1.0);
  vec3 col = mix(uBot, uTop, pow(h, 0.7));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export function Lighting({ shadows = true }: { shadows?: boolean }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const dirRef = useRef<DirectionalLight>(null)
  const ambRef = useRef<AmbientLight>(null)
  const hemiRef = useRef<HemisphereLight>(null)
  const targetRef = useRef<Object3D>(null)
  const skyRef = useRef<Mesh>(null)
  const sunRef = useRef<Mesh>(null)
  const moonRef = useRef<Mesh>(null)
  const starsRef = useRef<Points>(null)

  const skyMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTop: { value: new Color() }, uBot: { value: new Color() } },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  )
  const sunMat = useMemo(() => new MeshBasicMaterial({ color: "#fff3b8", fog: false, depthWrite: false }), [])
  const moonMat = useMemo(() => new MeshBasicMaterial({ color: "#e9efff", fog: false, depthWrite: false }), [])
  const starGeo = useMemo(() => {
    const rnd = mulberry32(77)
    const n = 420
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const u = rnd()
      const v = rnd()
      const th = u * Math.PI * 2
      const y = 0.05 + v * 0.95
      const rr = Math.sqrt(1 - y * y)
      pos[i * 3] = Math.cos(th) * rr * 380
      pos[i * 3 + 1] = y * 380
      pos[i * 3 + 2] = Math.sin(th) * rr * 380
    }
    const g = new BufferGeometry()
    g.setAttribute("position", new BufferAttribute(pos, 3))
    return g
  }, [])
  const starMat = useMemo(
    () => new PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: AdditiveBlending }),
    [],
  )

  useEffect(() => {
    scene.fog = new Fog("#c3e6f7", 60, 260)
    return () => {
      scene.fog = null
    }
  }, [scene])

  useEffect(() => {
    const d = dirRef.current
    const t = targetRef.current
    if (d && t) d.target = t
  }, [])

  useFrame(() => {
    const n = env.night
    const r = env.rain
    const top = mix(tmpA, dayTop, nightTop, n).lerp(rainTop, r * (1 - n * 0.6))
    const bot = mix(tmpB, dayBot, nightBot, n).lerp(rainBot, r * (1 - n * 0.6))
    ;(skyMat.uniforms.uTop.value as Color).copy(top)
    ;(skyMat.uniforms.uBot.value as Color).copy(bot)

    const fog = scene.fog as Fog | null
    if (fog) {
      mix(fog.color, fogDay, fogNight, n).lerp(fogRain, r * (1 - n * 0.5))
      fog.near = 70 - n * 25 - r * 45
      fog.far = 270 - n * 70 - r * 120
    }

    const sky = skyRef.current
    if (sky) sky.position.copy(camera.position)
    const sun = sunRef.current
    if (sun) {
      sun.position.copy(camera.position).addScaledVector(sunDir, 330)
      const s = Math.max(0.0001, (1 - n) * (1 - r))
      sun.scale.setScalar(s)
    }
    const moon = moonRef.current
    if (moon) {
      moon.position.copy(camera.position).addScaledVector(moonDir, 330)
      moon.scale.setScalar(Math.max(0.0001, n * (1 - r * 0.7)))
    }
    const st = starsRef.current
    if (st) {
      st.position.copy(camera.position)
      starMat.opacity = Math.max(0, n - r * 0.9)
    }

    const amb = ambRef.current
    if (amb) {
      mix(amb.color, ambDay, ambNight, n)
      amb.intensity = (1.0 - n * 0.38) * (1 - r * 0.15)
    }
    const hemi = hemiRef.current
    if (hemi) {
      mix(hemi.color, hemiSkyDay, hemiSkyNight, n)
      mix(hemi.groundColor, hemiGndDay, hemiGndNight, n)
      hemi.intensity = (1.2 - n * 0.48) * (1 - r * 0.2)
    }
    const d = dirRef.current
    const t = targetRef.current
    if (d && t) {
      const sx = Math.round(player.x)
      const sz = Math.round(player.z)
      const sy = Math.round(player.y)
      t.position.set(sx, sy, sz)
      tmpV.copy(sunDir).lerp(moonDir, n).normalize()
      d.position.set(sx + tmpV.x * 60, sy + tmpV.y * 60, sz + tmpV.z * 60)
      mix(d.color, sunCol, moonCol, n)
      d.intensity = (2.3 * (1 - n) + 1.0 * n) * (1 - r * 0.6)
      d.castShadow = shadows && quality.shadows
      t.updateMatrixWorld()
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} />
      <hemisphereLight ref={hemiRef} />
      <directionalLight
        ref={dirRef}
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <object3D ref={targetRef} />
      <mesh ref={skyRef} material={skyMat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[420, 24, 14]} />
      </mesh>
      <mesh ref={sunRef} material={sunMat} renderOrder={-9} frustumCulled={false}>
        <sphereGeometry args={[16, 14, 10]} />
      </mesh>
      <mesh ref={moonRef} material={moonMat} renderOrder={-9} frustumCulled={false}>
        <sphereGeometry args={[11, 14, 10]} />
      </mesh>
      <points ref={starsRef} geometry={starGeo} material={starMat} renderOrder={-9} frustumCulled={false} />
    </>
  )
}
