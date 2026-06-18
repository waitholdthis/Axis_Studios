import { demoTour } from './demoTour'
import type { Hotspot, HotspotType, Scene, Tour } from './types'

const STORAGE_KEY = 'axistour.workspace.v1'

export const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

export function loadTour(): Tour {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return demoTour
    return validateTour(JSON.parse(raw))
  } catch {
    return demoTour
  }
}

export function saveTour(tour: Tour) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tour, null, 2))
}

export function resetTour() {
  saveTour(demoTour)
  return demoTour
}

export function validateTour(value: unknown): Tour {
  if (!value || typeof value !== 'object') throw new Error('Tour must be an object')
  const tour = value as Tour
  if (!tour.title || !Array.isArray(tour.scenes) || tour.scenes.length === 0) throw new Error('Tour requires title and scenes')
  const ids = new Set<string>()
  tour.scenes.forEach((scene) => {
    if (!scene.id || !scene.name || !scene.panoramaUrl) throw new Error('Scene missing id, name, or panoramaUrl')
    if (ids.has(scene.id)) throw new Error(`Duplicate scene id ${scene.id}`)
    ids.add(scene.id)
  })
  tour.scenes.forEach((scene) => {
    scene.hotspots?.forEach((hotspot) => {
      if (hotspot.type === 'navigation' && hotspot.targetSceneId && !ids.has(hotspot.targetSceneId)) {
        throw new Error(`Hotspot ${hotspot.id} points to missing scene ${hotspot.targetSceneId}`)
      }
    })
  })
  return { ...tour, status: tour.status ?? 'draft', brandColor: tour.brandColor ?? '#7cf7ff' }
}

export function addScene(tour: Tour, name = 'New Scan Point'): Tour {
  const id = makeId('scene')
  const scene: Scene = {
    id,
    name,
    floor: 'Unassigned',
    panoramaUrl: demoTour.scenes[tour.scenes.length % demoTour.scenes.length].panoramaUrl,
    initialYaw: 0,
    initialPitch: 0,
    hotspots: [],
  }
  return { ...tour, scenes: [...tour.scenes, scene] }
}

export function addHotspot(tour: Tour, sceneId: string, type: HotspotType, label: string, targetSceneId?: string): Tour {
  const hotspot: Hotspot = { id: makeId('hotspot'), type, label, yaw: 0, pitch: 0, targetSceneId, body: type === 'navigation' ? undefined : 'Edit this annotation in the inspector.' }
  return {
    ...tour,
    scenes: tour.scenes.map((scene) => (scene.id === sceneId ? { ...scene, hotspots: [...scene.hotspots, hotspot] } : scene)),
  }
}

export function updateHotspot(tour: Tour, sceneId: string, hotspotId: string, patch: Partial<Hotspot>): Tour {
  return {
    ...tour,
    scenes: tour.scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, hotspots: scene.hotspots.map((h) => (h.id === hotspotId ? { ...h, ...patch } : h)) } : scene,
    ),
  }
}

export function compileEmbed(tour: Tour) {
  return `<iframe src="https://your-domain.com/tour/${tour.slug}" title="${tour.title}" width="100%" height="720" style="border:0;border-radius:18px;overflow:hidden" allowfullscreen></iframe>`
}
