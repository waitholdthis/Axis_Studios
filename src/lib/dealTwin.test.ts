import { describe, expect, it } from 'vitest'
import { demoTour } from './demoTour'
import { buildDealTwin } from './dealTwin'

describe('axis deal twin', () => {
  it('simulates stakeholder-specific deal paths from tour evidence', () => {
    const twin = buildDealTwin(demoTour)

    expect(twin.scenarios.length).toBeGreaterThanOrEqual(4)
    expect(twin.closeProbability).toBeGreaterThan(70)
    expect(twin.primaryStakeholder).toBeTruthy()
    expect(twin.offerPaths.map((path) => path.strategy)).toContain('proof-premium')
    expect(twin.sceneEvidence.some((scene) => scene.sceneName === 'Chef Kitchen')).toBe(true)
  })

  it('surfaces friction and next best actions for thin tours', () => {
    const thinTour = {
      ...demoTour,
      totalSquareFeet: 5000,
      guidedRoutes: [],
      proofClaims: [],
      dealTwinScenarios: [],
      scenes: demoTour.scenes.map((scene) => ({ ...scene, squareFeet: undefined, ceilingHeightFt: undefined, scanQuality: 'needs-attention' as const })),
    }

    const twin = buildDealTwin(thinTour)

    expect(twin.closeProbability).toBeLessThan(55)
    expect(twin.frictionRadar.length).toBeGreaterThan(0)
    expect(twin.nextBestActions.join(' ').toLowerCase()).toContain('measurement')
  })
})
