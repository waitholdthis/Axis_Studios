import { describe, expect, it } from 'vitest'
import { addAsset, captureLead, createDefaultWorkspace, createTour, publishTour, recordAnalyticsEvent, storageUsedMb, updateLeadStatus, validateWorkspace } from './saasStore'

describe('saas workspace store', () => {
  it('validates the seeded organization workspace', () => {
    const workspace = validateWorkspace(createDefaultWorkspace())
    expect(workspace.organization.plan).toBe('studio')
    expect(workspace.tours.length).toBeGreaterThanOrEqual(2)
    expect(workspace.activeTourId).toBe(workspace.tours[0].id)
  })

  it('creates and publishes client tours with audit events', () => {
    const workspace = createTour(createDefaultWorkspace(), 'Lake House Listing')
    const created = workspace.tours.at(-1)!
    expect(created.title).toBe('Lake House Listing')
    expect(created.status).toBe('draft')

    const published = publishTour(workspace, created.id)
    expect(published.tours.find((tour) => tour.id === created.id)?.status).toBe('published')
    expect(published.auditLog[0].action).toBe('tour.published')
  })

  it('tracks assets and lead status through the SaaS control plane', () => {
    const base = createDefaultWorkspace()
    const withAsset = addAsset(base, { tourId: base.activeTourId, name: 'suite-360.jpg', type: 'panorama', url: 'data:image/jpeg;base64,abc', sizeMb: 12.25 })
    expect(storageUsedMb(withAsset)).toBeGreaterThan(storageUsedMb(base))

    const withLead = captureLead(withAsset, {
      tourId: base.activeTourId,
      tourTitle: base.tours[0].title,
      name: 'Avery Buyer',
      email: 'avery@example.com',
      message: 'Send me the seller disclosure package.',
      source: 'embed',
    })
    const contacted = updateLeadStatus(withLead, withLead.leads[0].id, 'contacted')
    expect(contacted.leads[0].status).toBe('contacted')
    expect(contacted.auditLog[0].action).toBe('lead.status_updated')
  })

  it('records analytics events with an audit trail and bounded event history', () => {
    const base = createDefaultWorkspace()
    const next = recordAnalyticsEvent(base, {
      tourId: base.activeTourId,
      sceneId: base.tours[0].scenes[0].id,
      type: 'scene_entered',
      visitorRole: 'buyer',
      dwellSeconds: 91,
    })

    expect(next.analyticsEvents[0]).toMatchObject({ type: 'scene_entered', dwellSeconds: 91 })
    expect(next.auditLog[0].action).toBe('analytics.event_recorded')
  })
})
