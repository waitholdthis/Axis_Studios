import { describe, expect, it } from 'vitest'
import { demoTour } from './demoTour'
import { assessSpatialReadiness, clampFloorplanPoint, scenesByFloor } from './spatialQuality'

const fullyMappedTour = {
  ...demoTour,
  scenes: demoTour.scenes.map((scene) => ({
    ...scene,
    floorplanX: scene.floorplanX ?? 50,
    floorplanY: scene.floorplanY ?? 50,
    hotspots: scene.hotspots.length ? scene.hotspots : [{ id: `${scene.id}_lead`, type: 'lead' as const, label: 'Book showing', yaw: 0, pitch: 0 }],
  })),
}

describe('spatial quality intelligence', () => {
  it('scores a connected mapped tour as production ready or better', () => {
    const readiness = assessSpatialReadiness(fullyMappedTour)
    expect(readiness.score).toBeGreaterThanOrEqual(78)
    expect(readiness.navigationLinks).toBeGreaterThanOrEqual(2)
    expect(readiness.leadHotspots).toBeGreaterThanOrEqual(1)
  })

  it('groups scan points by floor', () => {
    const grouped = scenesByFloor(demoTour)
    expect(grouped['Level 1']).toHaveLength(3)
  })

  it('clamps minimap points to a safe clickable range', () => {
    expect(clampFloorplanPoint(-10)).toBe(4)
    expect(clampFloorplanPoint(120)).toBe(96)
    expect(clampFloorplanPoint(42.3)).toBe(42)
  })
})
