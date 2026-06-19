import { describe, expect, it } from 'vitest'
import { demoTour } from './demoTour'
import { buildDueDiligenceExport } from './dueDiligenceExport'

describe('due diligence export', () => {
  it('creates a deterministic signed export packet from proof and deal-twin signals', () => {
    const packet = buildDueDiligenceExport(demoTour)

    expect(packet.exportId).toMatch(/^AXIS-EXPORT-/)
    expect(packet.signature).toMatch(/^sig_axis_/)
    expect(packet.checksum).toHaveLength(16)
    expect(packet.trustScore).toBeGreaterThan(70)
    expect(packet.closeProbability).toBeGreaterThan(70)
    expect(packet.packetIncludes).toContain('signed export checksum and chain of custody')
    expect(packet.attestations.length).toBe(5)
    expect(packet.readiness).toBe('review-required')
  })

  it('blocks external release when claims and measurements are too thin', () => {
    const thinPacket = buildDueDiligenceExport({
      ...demoTour,
      proofClaims: [
        {
          id: 'unsupported_claim',
          claim: 'This property has an unsupported premium condition claim.',
          category: 'finish',
          sceneIds: [],
          confidence: 30,
          status: 'unsupported',
        },
      ],
      scenes: demoTour.scenes.map((scene) => ({ ...scene, squareFeet: undefined, scanQuality: 'needs-attention' as const })),
    })

    expect(thinPacket.readiness).toBe('blocked')
    expect(thinPacket.retentionDays).toBe(30)
    expect(thinPacket.attestations.some((item) => item.id === 'claim_review' && item.status === 'blocked')).toBe(true)
  })
})
