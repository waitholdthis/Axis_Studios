import { describe, expect, it } from 'vitest'
import { demoTour } from './demoTour'
import { buildSpatialProofPack, summarizeBuyerObjections } from './spatialProof'

describe('spatial proof layer', () => {
  it('builds a stable proof pack that ties listing claims to scene evidence', () => {
    const pack = buildSpatialProofPack(demoTour)

    expect(pack.tourId).toBe(demoTour.id)
    expect(pack.claims.length).toBeGreaterThanOrEqual(4)
    expect(pack.verifiedClaims).toBeGreaterThan(2)
    expect(pack.trustScore).toBeGreaterThan(70)
    expect(pack.auditFingerprint).toMatch(/^AXIS-[A-Z0-9]{12}$/)
    expect(pack.claims.every((claim) => claim.evidenceSceneIds.length > 0)).toBe(true)
  })

  it('generates buyer objection responses from proof quality gaps', () => {
    const weakTour = {
      ...demoTour,
      totalSquareFeet: 4800,
      scenes: demoTour.scenes.map((scene) => ({ ...scene, squareFeet: undefined, ceilingHeightFt: undefined })),
      proofClaims: [
        {
          id: 'claim_unverified_light',
          claim: 'The residence has strong natural light in every room.',
          category: 'natural-light' as const,
          sceneIds: ['foyer'],
          confidence: 42,
          status: 'needs-review' as const,
        },
      ],
    }

    const objections = summarizeBuyerObjections(buildSpatialProofPack(weakTour))
    expect(objections.length).toBeGreaterThan(0)
    expect(objections.join(' ').toLowerCase()).toContain('measurement')
  })
})
