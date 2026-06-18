import { Html, OrbitControls, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Hotspot, Scene } from '../lib/types'

function hotspotPosition(yaw: number, pitch: number, radius = 9.4) {
  const phi = THREE.MathUtils.degToRad(90 - pitch)
  const theta = THREE.MathUtils.degToRad(yaw + 180)
  return [radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)] as [number, number, number]
}

function Sphere({ url }: { url: string }) {
  const texture = useTexture(url)
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[10, 96, 48]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

function HotspotButton({ hotspot, onNavigate }: { hotspot: Hotspot; onNavigate: (sceneId: string) => void }) {
  const position = useMemo(() => hotspotPosition(hotspot.yaw, hotspot.pitch), [hotspot.yaw, hotspot.pitch])
  const [open, setOpen] = useState(false)
  const isNav = hotspot.type === 'navigation'
  return (
    <Html position={position} center transform occlude={false} zIndexRange={[60, 0]}>
      <button
        className={`hotspot hotspot--${hotspot.type}`}
        onClick={() => (isNav && hotspot.targetSceneId ? onNavigate(hotspot.targetSceneId) : setOpen(!open))}
        aria-label={hotspot.label}
      >
        <span className="hotspot__pulse" />
        <span className="hotspot__label">{hotspot.label}</span>
      </button>
      {open && !isNav && (
        <div className="hotspot-card">
          <strong>{hotspot.label}</strong>
          <p>{hotspot.body}</p>
          {hotspot.url && <a href={hotspot.url}>Open attachment</a>}
        </div>
      )}
    </Html>
  )
}

export function PanoramaViewer({ scene, onNavigate }: { scene: Scene; onNavigate: (sceneId: string) => void }) {
  return (
    <div className="viewer-shell">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <Suspense fallback={null}>
          <Sphere url={scene.panoramaUrl} />
          {scene.hotspots.map((hotspot) => (
            <HotspotButton key={hotspot.id} hotspot={hotspot} onNavigate={onNavigate} />
          ))}
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={-0.38} minPolarAngle={0.2} maxPolarAngle={Math.PI - 0.2} />
      </Canvas>
      <div className="viewer-hud">
        <span>{scene.floor}</span>
        <strong>{scene.name}</strong>
        <small>Drag to look • tap nodes to move</small>
      </div>
    </div>
  )
}
