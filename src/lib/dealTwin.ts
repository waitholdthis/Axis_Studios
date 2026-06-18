import type { DealTwinScenario, Scene, Tour } from './types'
import { buildSpatialProofPack } from './spatialProof'
import { summarizeGuidedRoutes, summarizeMeasurements } from './spatialIntelligence'

export type DealTwinStakeholderReport = DealTwinScenario & {
  evidenceSceneNames: string[]
  confidence: number
  leverage: 'price-discovery' | 'proof-premium' | 'risk-credit' | 'speed-to-close'
  friction: string[]
  nextBestAction: string
}

export type DealTwinOfferPath = {
  strategy: 'proof-premium' | 'balanced-close' | 'risk-adjusted' | 'investor-upside'
  label: string
  recommendedFor: string
  confidence: number
  script: string
}

export type DealTwinSceneEvidence = {
  sceneId: string
  sceneName: string
  proofDensity: number
  buyerPull: number
  unlock: string
}

export type DealTwinReport = {
  title: string
  closeProbability: number
  primaryStakeholder: string
  frictionRadar: string[]
  nextBestActions: string[]
  scenarios: DealTwinStakeholderReport[]
  offerPaths: DealTwinOfferPath[]
  sceneEvidence: DealTwinSceneEvidence[]
  generatedAtLabel: string
}

const defaultScenarios = (tour: Tour): DealTwinScenario[] => [
  {
    id: 'stakeholder_emotional_buyer',
    stakeholder: 'buyer',
    motivation: 'Needs confidence that the home feels as good in sequence as it looks in photos.',
    decisionWeight: 94,
    targetSceneIds: tour.scenes.slice(0, 3).map((scene) => scene.id),
    successSignal: 'Buyer can retell the entry, living, and kitchen story without a showing escort.',
  },
  {
    id: 'stakeholder_listing_agent',
    stakeholder: 'agent',
    motivation: 'Needs a differentiated proof asset to defend price and shorten back-and-forth.',
    decisionWeight: 86,
    targetSceneIds: tour.guidedRoutes?.[0]?.sceneIds ?? tour.scenes.slice(0, 2).map((scene) => scene.id),
    successSignal: 'Agent has proof-backed copy, route links, and objection responses ready before launch.',
  },
  {
    id: 'stakeholder_inspector',
    stakeholder: 'inspector',
    motivation: 'Needs clear scene references for claims that should not be accepted blindly.',
    decisionWeight: 72,
    targetSceneIds: tour.proofClaims?.flatMap((claim) => claim.sceneIds).slice(0, 4) ?? [],
    successSignal: 'Claims with review risk are separated from verified evidence.',
  },
  {
    id: 'stakeholder_lender',
    stakeholder: 'lender',
    motivation: 'Needs a compact collateral story: measured area, condition confidence, and buyer demand.',
    decisionWeight: 68,
    targetSceneIds: tour.scenes.filter((scene) => scene.squareFeet).map((scene) => scene.id),
    successSignal: 'The property packet explains measurable collateral value without extra screenshots.',
  },
]

export function buildDealTwin(tour: Tour): DealTwinReport {
  const proof = buildSpatialProofPack(tour)
  const measurement = summarizeMeasurements(tour)
  const routes = summarizeGuidedRoutes(tour)
  const scenarios = (tour.dealTwinScenarios?.length ? tour.dealTwinScenarios : defaultScenarios(tour)).map((scenario) =>
    simulateScenario(scenario, tour, proof.trustScore, measurement.coveragePercent, routes.length),
  )
  const closeProbability = clamp(Math.round(
    scenarios.reduce((sum, scenario) => sum + scenario.confidence * (scenario.decisionWeight / 100), 0) /
      Math.max(1, scenarios.reduce((sum, scenario) => sum + scenario.decisionWeight / 100, 0)),
  ))
  const frictionRadar = unique([
    ...proof.buyerObjections,
    ...scenarios.flatMap((scenario) => scenario.friction),
    ...(measurement.coveragePercent < 65 ? ['Measurement coverage is not strong enough for a premium proof-led close.'] : []),
    ...(routes.length < 2 ? ['Add at least two stakeholder-specific guided routes so the tour can sell to more than one decision-maker.'] : []),
  ]).slice(0, 5)
  const nextBestActions = unique([
    ...scenarios.map((scenario) => scenario.nextBestAction),
    ...(measurement.coveragePercent < 80 ? ['Complete measurement metadata for every major room before presenting a premium offer path.'] : []),
    ...(proof.unsupportedClaims ? ['Resolve unsupported claims before exporting the deal twin.'] : []),
  ]).slice(0, 5)

  return {
    title: `${tour.title} Deal Twin`,
    closeProbability,
    primaryStakeholder: scenarios.sort((a, b) => b.confidence * b.decisionWeight - a.confidence * a.decisionWeight)[0]?.stakeholder ?? 'buyer',
    frictionRadar,
    nextBestActions,
    scenarios,
    offerPaths: buildOfferPaths(closeProbability, proof.trustScore, measurement.coveragePercent),
    sceneEvidence: buildSceneEvidence(tour, proof.claims.map((claim) => ({ sceneIds: claim.sceneIds, confidence: claim.confidence }))),
    generatedAtLabel: 'local deterministic simulation',
  }
}

function simulateScenario(
  scenario: DealTwinScenario,
  tour: Tour,
  trustScore: number,
  measurementCoverage: number,
  routeCount: number,
): DealTwinStakeholderReport {
  const evidenceScenes = scenario.targetSceneIds
    .map((id) => tour.scenes.find((scene) => scene.id === id))
    .filter(Boolean) as Scene[]
  const evidenceScore = Math.min(100, evidenceScenes.length * 18)
  const scanScore = evidenceScenes.length
    ? evidenceScenes.reduce((sum, scene) => sum + (scene.scanQuality === 'excellent' ? 18 : scene.scanQuality === 'good' ? 12 : 4), 0) / evidenceScenes.length
    : 0
  const confidence = clamp(Math.round(trustScore * 0.42 + measurementCoverage * 0.22 + evidenceScore * 0.22 + scanScore + routeCount * 3))
  const friction = [
    ...(evidenceScenes.length ? [] : ['No scene evidence is mapped to this stakeholder yet.']),
    ...(measurementCoverage < 60 ? ['Measurement proof is too thin for this stakeholder.'] : []),
    ...(confidence < 70 ? ['Confidence is not high enough for an assertive close path.'] : []),
  ]
  const leverage: DealTwinStakeholderReport['leverage'] =
    confidence >= 84 ? 'proof-premium' : confidence >= 72 ? 'speed-to-close' : confidence >= 58 ? 'price-discovery' : 'risk-credit'

  return {
    ...scenario,
    evidenceSceneNames: evidenceScenes.map((scene) => scene.name),
    confidence,
    leverage,
    friction,
    nextBestAction: nextActionFor(scenario.stakeholder, confidence, measurementCoverage, evidenceScenes.length),
  }
}

function buildOfferPaths(closeProbability: number, trustScore: number, measurementCoverage: number): DealTwinOfferPath[] {
  return [
    {
      strategy: 'proof-premium',
      label: 'Premium proof close',
      recommendedFor: 'high-confidence listings, builders, luxury agents, and enterprise clients',
      confidence: clamp(Math.round((closeProbability + trustScore + measurementCoverage) / 3)),
      script: 'Lead with verified claims, measured rooms, guided route proof, and the audit fingerprint before price discussion.',
    },
    {
      strategy: 'balanced-close',
      label: 'Balanced confidence close',
      recommendedFor: 'normal buyer traffic and agent follow-up',
      confidence: clamp(Math.round(closeProbability * 0.92 + 6)),
      script: 'Open with the buyer route, show the proof ledger, then use objection notes to schedule the right showing.',
    },
    {
      strategy: 'risk-adjusted',
      label: 'Risk-adjusted negotiation',
      recommendedFor: 'skeptical buyers, inspectors, lenders, or incomplete property packets',
      confidence: clamp(Math.round(100 - Math.max(0, trustScore - 65) * 0.4)),
      script: 'Acknowledge unresolved claims first, then turn each gap into a bounded verification task instead of a price panic.',
    },
    {
      strategy: 'investor-upside',
      label: 'Investor upside path',
      recommendedFor: 'renovation, rental, and resale conversations',
      confidence: clamp(Math.round((measurementCoverage + closeProbability) / 2)),
      script: 'Package measured rooms and weak spots into an upside memo: what to improve, what to preserve, and what proves demand.',
    },
  ]
}

function buildSceneEvidence(tour: Tour, claims: Array<{ sceneIds: string[]; confidence: number }>): DealTwinSceneEvidence[] {
  return tour.scenes.map((scene) => {
    const sceneClaims = claims.filter((claim) => claim.sceneIds.includes(scene.id))
    const proofDensity = clamp(sceneClaims.length * 25 + (scene.squareFeet ? 18 : 0) + (scene.hotspots.length ? 10 : 0))
    const buyerPull = clamp(Math.round(proofDensity * 0.58 + (scene.scanQuality === 'excellent' ? 28 : scene.scanQuality === 'good' ? 18 : 4)))
    return {
      sceneId: scene.id,
      sceneName: scene.name,
      proofDensity,
      buyerPull,
      unlock: sceneClaims.length
        ? `${sceneClaims.length} proof claim${sceneClaims.length === 1 ? '' : 's'} can anchor the close here.`
        : 'Add a proof claim or upgrade note so this scene participates in the deal room.',
    }
  })
}

function nextActionFor(stakeholder: DealTwinScenario['stakeholder'], confidence: number, measurementCoverage: number, evidenceCount: number) {
  if (!evidenceCount) return `Attach at least one scene to the ${stakeholder} simulation.`
  if (measurementCoverage < 60) return 'Complete measurement metadata before using this path in a negotiation.'
  if (confidence < 70) return `Add proof claims and guided-route context for the ${stakeholder} path.`
  if (stakeholder === 'inspector') return 'Export the review-gated claims before inspection so risk language stays controlled.'
  if (stakeholder === 'lender') return 'Package measured-area proof and trust score as collateral support.'
  return 'Use this scenario as a live deal-room script during follow-up.'
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}
