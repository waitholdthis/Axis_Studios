import { describe, expect, it } from 'vitest'
import { createDefaultWorkspace } from './saasStore'
import { demoTour } from './demoTour'
import { competitiveGaps, summarizeConversionAnalytics, summarizeGuidedRoutes, summarizeMeasurements } from './spatialIntelligence'


describe('spatial intelligence layer', () => {
  it('summarizes measurement coverage from room-level scene data', () => {
    const summary = summarizeMeasurements(demoTour)
    expect(summary.measuredScenes).toBeGreaterThanOrEqual(3)
    expect(summary.measuredSquareFeet).toBeGreaterThan(0)
    expect(summary.totalSquareFeet).toBeGreaterThanOrEqual(summary.measuredSquareFeet)
    expect(summary.coveragePercent).toBeGreaterThan(50)
    expect(summary.averageCeilingHeightFt).toBeGreaterThan(8)
  })

  it('resolves guided routes into ordered scene stops with estimates', () => {
    const routes = summarizeGuidedRoutes(demoTour)
    expect(routes.length).toBeGreaterThanOrEqual(2)
    expect(routes[0].stops.map((stop) => stop.id)).toEqual(demoTour.guidedRoutes?.[0].sceneIds)
    expect(routes.every((route) => route.missingSceneIds.length === 0)).toBe(true)
    expect(routes[0].estimatedMinutes).toBeGreaterThan(0)
  })

  it('scores conversion analytics and competitive readiness from workspace signals', () => {
    const workspace = createDefaultWorkspace()
    const analytics = summarizeConversionAnalytics(workspace, demoTour.id)
    expect(analytics.visitors).toBeGreaterThan(0)
    expect(analytics.leadSubmissions).toBeGreaterThan(0)
    expect(analytics.buyerIntentScore).toBeGreaterThan(35)

    const gaps = competitiveGaps(workspace, demoTour)
    expect(gaps.map((gap) => gap.label)).toEqual([
      'Measurement intelligence',
      'Guided buyer routes',
      'Conversion analytics',
      'Client delivery loop',
    ])
    expect(gaps.some((gap) => gap.status === 'missing')).toBe(false)
  })
})
