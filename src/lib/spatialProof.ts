import type { ProofClaim, Tour } from './types'
import { summarizeMeasurements } from './spatialIntelligence'

export type ProofPacketClaim = ProofClaim & {
  evidenceSceneIds: string[]
  evidenceLabels: string[]
  risk: 'low' | 'medium' | 'high'
}

export type SpatialProofPack = {
  tourId: string
  title: string
  trustScore: number
  totalClaims: number
  verifiedClaims: number
  needsReview: number
  unsupportedClaims: number
  measurementCoveragePercent: number
  auditFingerprint: string
  claims: ProofPacketClaim[]
  buyerObjections: string[]
  generatedAt: string
}

const DEFAULT_GENERATED_AT = '2026-06-18T00:00:00.000Z'

export function buildSpatialProofPack(tour: Tour, generatedAt = DEFAULT_GENERATED_AT): SpatialProofPack {
  const claims = normalizeClaims(tour).map((claim) => enrichClaim(tour, claim))
  const measurement = summarizeMeasurements(tour)
  const verifiedClaims = claims.filter((claim) => claim.status === 'verified').length
  const unsupportedClaims = claims.filter((claim) => claim.status === 'unsupported').length
  const needsReview = claims.filter((claim) => claim.status === 'needs-review').length
  const evidenceCoverage = claims.length ? Math.round((claims.filter((claim) => claim.evidenceSceneIds.length > 0).length / claims.length) * 100) : 0
  const confidenceAverage = claims.length ? Math.round(claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length) : 0
  const trustScore = clampScore(Math.round(confidenceAverage * 0.42 + evidenceCoverage * 0.3 + measurement.coveragePercent * 0.18 + (tour.guidedRoutes?.length ? 10 : 0) - unsupportedClaims * 8 - needsReview * 3))
  const fingerprintSource = JSON.stringify({ tourId: tour.id, claims: claims.map(({ id, status, confidence, evidenceSceneIds }) => ({ id, status, confidence, evidenceSceneIds })), trustScore })
  const partialPack = {
    tourId: tour.id,
    title: tour.title,
    trustScore,
    totalClaims: claims.length,
    verifiedClaims,
    needsReview,
    unsupportedClaims,
    measurementCoveragePercent: measurement.coveragePercent,
    auditFingerprint: `AXIS-${base36Hash(fingerprintSource).slice(0, 12)}`,
    claims,
    buyerObjections: [] as string[],
    generatedAt,
  }
  return { ...partialPack, buyerObjections: summarizeBuyerObjections(partialPack) }
}

export function summarizeBuyerObjections(pack: Pick<SpatialProofPack, 'measurementCoveragePercent' | 'needsReview' | 'unsupportedClaims' | 'claims'>): string[] {
  const objections: string[] = []
  if (pack.measurementCoveragePercent < 75) objections.push('Measurement confidence gap: add room dimensions or floorplan validation before using exact-area claims in buyer material.')
  if (pack.needsReview > 0) objections.push(`${pack.needsReview} claim${pack.needsReview === 1 ? '' : 's'} still need reviewer approval before the proof packet is deal-room ready.`)
  if (pack.unsupportedClaims > 0) objections.push(`${pack.unsupportedClaims} claim${pack.unsupportedClaims === 1 ? '' : 's'} lack enough scene evidence and should be revised or anchored to a scan point.`)
  const weakCategories = pack.claims.filter((claim) => claim.risk !== 'low').map((claim) => claim.category)
  if (weakCategories.includes('accessibility')) objections.push('Accessibility promise needs stronger spatial evidence: add route photos, threshold notes, or entry measurements.')
  if (!objections.length) objections.push('Proof packet is buyer-ready: claims are scene-backed, reviewable, and exportable with an audit fingerprint.')
  return objections
}

function normalizeClaims(tour: Tour): ProofClaim[] {
  if (tour.proofClaims?.length) return tour.proofClaims
  const first = tour.scenes[0]
  const largest = [...tour.scenes].sort((a, b) => (b.squareFeet ?? 0) - (a.squareFeet ?? 0))[0] ?? first
  return [
    {
      id: 'claim_verified_area',
      claim: `${tour.title} includes measured room-level spatial data tied to the public walkthrough.`,
      category: 'measurement',
      sceneIds: tour.scenes.filter((scene) => scene.squareFeet).map((scene) => scene.id),
      confidence: tour.totalSquareFeet ? 88 : 72,
      status: tour.totalSquareFeet ? 'verified' : 'needs-review',
      note: 'Generated from room square-footage and total listed area metadata.',
    },
    {
      id: 'claim_primary_gathering_space',
      claim: `${largest?.name ?? 'The primary space'} is the main gathering anchor for the tour narrative.`,
      category: 'flow',
      sceneIds: largest ? [largest.id] : [],
      confidence: 91,
      status: largest ? 'verified' : 'unsupported',
    },
    {
      id: 'claim_guided_buyer_path',
      claim: 'A curated buyer path connects the highest-value scenes without forcing visitors to wander blindly.',
      category: 'flow',
      sceneIds: tour.guidedRoutes?.[0]?.sceneIds ?? [],
      confidence: tour.guidedRoutes?.length ? 94 : 45,
      status: tour.guidedRoutes?.length ? 'verified' : 'needs-review',
    },
    {
      id: 'claim_finish_documentation',
      claim: 'Finish and appliance details can be anchored directly to scan points for buyer due diligence.',
      category: 'finish',
      sceneIds: tour.scenes.filter((scene) => scene.hotspots.some((hotspot) => hotspot.type === 'media' || hotspot.type === 'info')).map((scene) => scene.id),
      confidence: 84,
      status: 'verified',
    },
    {
      id: 'claim_accessibility_route',
      claim: 'An accessibility-aware path is prepared for entry-to-living navigation review.',
      category: 'accessibility',
      sceneIds: tour.guidedRoutes?.find((route) => route.intent === 'accessibility')?.sceneIds ?? [],
      confidence: tour.guidedRoutes?.some((route) => route.intent === 'accessibility') ? 79 : 38,
      status: tour.guidedRoutes?.some((route) => route.intent === 'accessibility') ? 'needs-review' : 'unsupported',
      note: 'Flagged for human approval because accessibility claims require precise thresholds and compliance language.',
    },
  ]
}

function enrichClaim(tour: Tour, claim: ProofClaim): ProofPacketClaim {
  const sceneIds = claim.sceneIds.filter((sceneId) => tour.scenes.some((scene) => scene.id === sceneId))
  const sceneNames = sceneIds.map((sceneId) => tour.scenes.find((scene) => scene.id === sceneId)?.name ?? sceneId)
  const risk: ProofPacketClaim['risk'] = claim.status === 'unsupported' || claim.confidence < 55 || sceneIds.length === 0 ? 'high' : claim.status === 'needs-review' || claim.confidence < 80 ? 'medium' : 'low'
  return { ...claim, evidenceSceneIds: sceneIds, evidenceLabels: sceneNames, risk }
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score))
}

function base36Hash(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const primary = (hash >>> 0).toString(36).toUpperCase().padStart(7, '0')
  const secondary = Math.imul(hash ^ input.length, 2246822507).toString(36).replace('-', '').toUpperCase().padStart(7, '0')
  return `${primary}${secondary}`
}
