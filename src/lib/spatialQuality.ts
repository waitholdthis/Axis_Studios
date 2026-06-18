import type { Scene, Tour } from './types'

export type SpatialReadiness = {
  score: number
  grade: 'elite' | 'production-ready' | 'needs-work'
  blockers: string[]
  wins: string[]
  floorCount: number
  navigationLinks: number
  leadHotspots: number
}

export function assessSpatialReadiness(tour: Tour): SpatialReadiness {
  const blockers: string[] = []
  const wins: string[] = []
  const navigationLinks = tour.scenes.reduce((sum, scene) => sum + scene.hotspots.filter((hotspot) => hotspot.type === 'navigation' && hotspot.targetSceneId).length, 0)
  const leadHotspots = tour.scenes.reduce((sum, scene) => sum + scene.hotspots.filter((hotspot) => hotspot.type === 'lead').length, 0)
  const floorCount = new Set(tour.scenes.map((scene) => scene.floor)).size
  const coordinateCoverage = tour.scenes.filter((scene) => Number.isFinite(scene.floorplanX) && Number.isFinite(scene.floorplanY)).length
  const orphanScenes = tour.scenes.filter((scene) => scene.hotspots.filter((hotspot) => hotspot.type === 'navigation').length === 0)

  if (tour.scenes.length < 3) blockers.push('Add at least 3 scan points so the tour feels spatial, not like a gallery.')
  else wins.push('Multi-scene walkthrough depth is present.')

  if (navigationLinks < Math.max(2, tour.scenes.length - 1)) blockers.push('Add more navigation hotspots to reduce dead ends between rooms.')
  else wins.push('Navigation graph is connected enough for a guided walkthrough.')

  if (coordinateCoverage !== tour.scenes.length) blockers.push('Every scan point needs floorplan coordinates for minimap navigation.')
  else wins.push('All scan points are mapped to floorplan coordinates.')

  if (leadHotspots === 0) blockers.push('Add at least one lead hotspot or CTA to convert public tour traffic.')
  else wins.push('Lead capture exists inside the tour experience.')

  if (orphanScenes.length) blockers.push(`${orphanScenes.length} scan point${orphanScenes.length === 1 ? '' : 's'} need outbound navigation.`)
  if (!tour.slug) blockers.push('Tour slug is required for public publishing.')

  const score = Math.max(0, Math.min(100, 100 - blockers.length * 14 + wins.length * 3))
  const grade: SpatialReadiness['grade'] = score >= 92 ? 'elite' : score >= 78 ? 'production-ready' : 'needs-work'
  return { score, grade, blockers, wins, floorCount, navigationLinks, leadHotspots }
}

export function scenesByFloor(tour: Tour) {
  return tour.scenes.reduce<Record<string, Scene[]>>((groups, scene) => {
    groups[scene.floor] = [...(groups[scene.floor] ?? []), scene]
    return groups
  }, {})
}

export function clampFloorplanPoint(value: number) {
  return Math.max(4, Math.min(96, Math.round(value)))
}
