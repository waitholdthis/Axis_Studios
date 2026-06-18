import type { GuidedRoute, Scene, Tour } from './types'
import type { SaaSWorkspace, TourAnalyticsEvent } from './saasTypes'

export type MeasurementSummary = {
  measuredScenes: number
  measuredSquareFeet: number
  totalSquareFeet: number
  coveragePercent: number
  averageCeilingHeightFt: number | null
}

export type RouteSummary = GuidedRoute & {
  stops: Array<Pick<Scene, 'id' | 'name' | 'floor' | 'floorplanX' | 'floorplanY'>>
  estimatedMinutes: number
  missingSceneIds: string[]
}

export type ConversionAnalytics = {
  visitors: number
  engagedVisitors: number
  averageDwellSeconds: number
  leadOpens: number
  leadSubmissions: number
  conversionRate: number
  hottestScene: string
  buyerIntentScore: number
}

export type CompetitiveGap = {
  label: string
  status: 'elite' | 'strong' | 'missing'
  detail: string
}

export function summarizeMeasurements(tour: Tour): MeasurementSummary {
  const measuredScenes = tour.scenes.filter((scene) => Number.isFinite(scene.squareFeet) && Number(scene.squareFeet) > 0)
  const measuredSquareFeet = measuredScenes.reduce((sum, scene) => sum + Number(scene.squareFeet ?? 0), 0)
  const totalSquareFeet = tour.totalSquareFeet && tour.totalSquareFeet > 0 ? tour.totalSquareFeet : measuredSquareFeet
  const heights = tour.scenes.map((scene) => scene.ceilingHeightFt).filter((height): height is number => Number.isFinite(height))
  return {
    measuredScenes: measuredScenes.length,
    measuredSquareFeet,
    totalSquareFeet,
    coveragePercent: totalSquareFeet ? Math.round((measuredSquareFeet / totalSquareFeet) * 100) : 0,
    averageCeilingHeightFt: heights.length ? Math.round((heights.reduce((sum, height) => sum + height, 0) / heights.length) * 10) / 10 : null,
  }
}

export function summarizeGuidedRoutes(tour: Tour): RouteSummary[] {
  const routes = tour.guidedRoutes ?? []
  return routes.map((route) => {
    const stops = route.sceneIds.map((sceneId) => tour.scenes.find((scene) => scene.id === sceneId)).filter((scene): scene is Scene => Boolean(scene))
    const missingSceneIds = route.sceneIds.filter((sceneId) => !tour.scenes.some((scene) => scene.id === sceneId))
    return {
      ...route,
      stops: stops.map(({ id, name, floor, floorplanX, floorplanY }) => ({ id, name, floor, floorplanX, floorplanY })),
      estimatedMinutes: Math.max(1, Math.ceil(stops.length * 0.75)),
      missingSceneIds,
    }
  })
}

export function summarizeConversionAnalytics(workspace: SaaSWorkspace, tourId: string): ConversionAnalytics {
  const events = workspace.analyticsEvents.filter((event) => event.tourId === tourId)
  const visitors = events.filter((event) => event.type === 'view' || event.type === 'share_opened').length
  const engagedVisitors = events.filter((event) => event.dwellSeconds >= 45 || event.type === 'scene_entered').length
  const averageDwellSeconds = events.length ? Math.round(events.reduce((sum, event) => sum + event.dwellSeconds, 0) / events.length) : 0
  const leadOpens = events.filter((event) => event.type === 'lead_opened').length
  const leadSubmissions = workspace.leads.filter((lead) => lead.tourId === tourId).length + events.filter((event) => event.type === 'lead_submitted').length
  const sceneCounts = events.reduce<Record<string, number>>((counts, event) => {
    if (event.sceneId) counts[event.sceneId] = (counts[event.sceneId] ?? 0) + 1
    return counts
  }, {})
  const hottestSceneId = Object.entries(sceneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No scene traffic yet'
  const buyerIntentScore = Math.min(100, Math.round(engagedVisitors * 8 + leadOpens * 12 + leadSubmissions * 24 + averageDwellSeconds / 3))
  return {
    visitors,
    engagedVisitors,
    averageDwellSeconds,
    leadOpens,
    leadSubmissions,
    conversionRate: visitors ? Math.round((leadSubmissions / visitors) * 1000) / 10 : 0,
    hottestScene: hottestSceneId,
    buyerIntentScore,
  }
}

export function competitiveGaps(workspace: SaaSWorkspace, tour: Tour): CompetitiveGap[] {
  const measurements = summarizeMeasurements(tour)
  const routes = summarizeGuidedRoutes(tour)
  const analytics = summarizeConversionAnalytics(workspace, tour.id)
  const activeLinks = workspace.shareLinks.filter((link) => link.tourId === tour.id).length
  return [
    {
      label: 'Measurement intelligence',
      status: measurements.coveragePercent >= 80 ? 'elite' : measurements.coveragePercent >= 40 ? 'strong' : 'missing',
      detail: `${measurements.coveragePercent}% of the listed area has room-level measurements.`,
    },
    {
      label: 'Guided buyer routes',
      status: routes.length >= 2 && routes.every((route) => !route.missingSceneIds.length) ? 'elite' : routes.length ? 'strong' : 'missing',
      detail: `${routes.length} curated path${routes.length === 1 ? '' : 's'} available for buyers, reviewers, or operators.`,
    },
    {
      label: 'Conversion analytics',
      status: analytics.buyerIntentScore >= 75 ? 'elite' : analytics.buyerIntentScore >= 35 ? 'strong' : 'missing',
      detail: `${analytics.buyerIntentScore}/100 buyer-intent score from dwell, lead, and share events.`,
    },
    {
      label: 'Client delivery loop',
      status: activeLinks && workspace.reviewComments.some((comment) => comment.tourId === tour.id) ? 'elite' : activeLinks ? 'strong' : 'missing',
      detail: `${activeLinks} active delivery link${activeLinks === 1 ? '' : 's'} and ${workspace.reviewComments.filter((comment) => comment.tourId === tour.id).length} review note${workspace.reviewComments.filter((comment) => comment.tourId === tour.id).length === 1 ? '' : 's'}.`,
    },
  ]
}

export function createAnalyticsEvent(tourId: string, type: TourAnalyticsEvent['type'], sceneId?: string): TourAnalyticsEvent {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    tourId,
    sceneId,
    type,
    visitorRole: type === 'share_opened' ? 'reviewer' : 'buyer',
    dwellSeconds: type === 'view' ? 38 : type === 'scene_entered' ? 74 : type === 'lead_opened' ? 96 : 122,
    createdAt: new Date().toISOString(),
  }
}
