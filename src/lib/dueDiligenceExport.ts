import { buildDealTwin } from './dealTwin'
import { buildSpatialProofPack } from './spatialProof'
import type { Tour } from './types'

export type ExportAttestation = {
  id: string
  label: string
  status: 'passed' | 'review' | 'blocked'
  detail: string
}

export type DueDiligenceExport = {
  tourId: string
  title: string
  exportId: string
  signature: string
  checksum: string
  trustScore: number
  closeProbability: number
  retentionDays: number
  readiness: 'buyer-ready' | 'review-required' | 'blocked'
  recipients: string[]
  packetIncludes: string[]
  attestations: ExportAttestation[]
  redactions: string[]
  chainOfCustody: string[]
  generatedAt: string
}

const DEFAULT_GENERATED_AT = '2026-06-19T00:00:00.000Z'

export function buildDueDiligenceExport(tour: Tour, generatedAt = DEFAULT_GENERATED_AT): DueDiligenceExport {
  const proof = buildSpatialProofPack(tour, generatedAt)
  const dealTwin = buildDealTwin(tour)
  const attestations = buildAttestations(tour, proof.trustScore, dealTwin.closeProbability, proof.needsReview, proof.unsupportedClaims)
  const blocked = attestations.some((item) => item.status === 'blocked')
  const needsReview = attestations.some((item) => item.status === 'review')
  const canonicalPayload = JSON.stringify({
    tourId: tour.id,
    slug: tour.slug,
    proofFingerprint: proof.auditFingerprint,
    trustScore: proof.trustScore,
    closeProbability: dealTwin.closeProbability,
    scenes: tour.scenes.map((scene) => ({ id: scene.id, scanQuality: scene.scanQuality, squareFeet: scene.squareFeet })),
    claims: proof.claims.map((claim) => ({ id: claim.id, status: claim.status, confidence: claim.confidence, evidenceSceneIds: claim.evidenceSceneIds })),
    generatedAt,
  })
  const checksum = digest(canonicalPayload, 16)

  return {
    tourId: tour.id,
    title: `${tour.title} Due Diligence Export`,
    exportId: `AXIS-EXPORT-${digest(`${tour.id}:${proof.auditFingerprint}:${generatedAt}`, 10)}`,
    signature: `sig_axis_${digest(`${checksum}:${proof.auditFingerprint}:${dealTwin.closeProbability}`, 24).toLowerCase()}`,
    checksum,
    trustScore: proof.trustScore,
    closeProbability: dealTwin.closeProbability,
    retentionDays: blocked ? 30 : needsReview ? 60 : 180,
    readiness: blocked ? 'blocked' : needsReview ? 'review-required' : 'buyer-ready',
    recipients: ['buyer diligence room', 'listing agent', 'seller/build team', 'lender or procurement reviewer'],
    packetIncludes: [
      'scene-backed proof ledger',
      'buyer objection memo',
      'Axis Deal Twin stakeholder simulation',
      'room measurement summary',
      'signed export checksum and chain of custody',
    ],
    attestations,
    redactions: buildRedactions(tour),
    chainOfCustody: [
      `Created local proof packet ${proof.auditFingerprint}`,
      `Calculated deterministic payload checksum ${checksum}`,
      `Issued browser-safe export signature for ${tour.slug}`,
      `Ready for secure-room upload when backend storage is connected`,
    ],
    generatedAt,
  }
}

function buildAttestations(tour: Tour, trustScore: number, closeProbability: number, needsReview: number, unsupportedClaims: number): ExportAttestation[] {
  const measuredScenes = tour.scenes.filter((scene) => scene.squareFeet).length
  const highQualityScenes = tour.scenes.filter((scene) => scene.scanQuality === 'excellent' || scene.scanQuality === 'good').length

  return [
    {
      id: 'proof_trust',
      label: 'Proof trust threshold',
      status: trustScore >= 80 ? 'passed' : trustScore >= 65 ? 'review' : 'blocked',
      detail: `Trust score ${trustScore}/100 from proof claims, evidence coverage, and measurement support.`,
    },
    {
      id: 'claim_review',
      label: 'Claim review gate',
      status: unsupportedClaims > 0 ? 'blocked' : needsReview > 0 ? 'review' : 'passed',
      detail: `${needsReview} review-gated claims and ${unsupportedClaims} unsupported claims before external packet release.`,
    },
    {
      id: 'scan_quality',
      label: 'Scan quality coverage',
      status: highQualityScenes === tour.scenes.length ? 'passed' : highQualityScenes >= Math.ceil(tour.scenes.length * 0.66) ? 'review' : 'blocked',
      detail: `${highQualityScenes}/${tour.scenes.length} scenes meet good-or-better scan quality.`,
    },
    {
      id: 'measurement_support',
      label: 'Measurement support',
      status: measuredScenes >= Math.ceil(tour.scenes.length * 0.75) ? 'passed' : measuredScenes > 0 ? 'review' : 'blocked',
      detail: `${measuredScenes}/${tour.scenes.length} scenes include room measurement metadata.`,
    },
    {
      id: 'deal_confidence',
      label: 'Deal Twin confidence',
      status: closeProbability >= 76 ? 'passed' : closeProbability >= 60 ? 'review' : 'blocked',
      detail: `Close probability ${closeProbability}% from stakeholder simulations and scene evidence density.`,
    },
  ]
}

function buildRedactions(tour: Tour) {
  return [
    'Personal visitor identifiers excluded from the export payload.',
    'CRM/webhook destinations excluded until backend secrets are server-side.',
    ...(tour.status === 'draft' ? ['Draft tour URLs remain internal until publish approval.'] : []),
  ]
}

function digest(input: string, length: number) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const primary = (hash >>> 0).toString(36).toUpperCase().padStart(7, '0')
  const secondary = Math.imul(hash ^ input.length, 3266489917).toString(36).replace('-', '').toUpperCase().padStart(12, '0')
  return `${primary}${secondary}`.slice(0, length)
}
