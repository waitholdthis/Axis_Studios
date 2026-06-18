import { demoTour } from './demoTour'
import { makeId, validateTour } from './tourStore'
import type { Tour } from './types'
import type { Asset, AuditEvent, Lead, ReviewComment, SaaSWorkspace, ShareLink, TourAnalyticsEvent } from './saasTypes'

export const WORKSPACE_KEY = 'axistour.saas.workspace.v1'

const now = () => new Date().toISOString()

export function createDefaultWorkspace(): SaaSWorkspace {
  const secondTour: Tour = {
    ...demoTour,
    id: 'tour_demo_commercial',
    title: 'Downtown Retail Listing',
    slug: 'downtown-retail-listing',
    client: 'Northline Realty Group',
    status: 'draft',
    createdAt: now(),
  }

  return {
    account: {
      id: 'usr_parker_owner',
      name: 'Parker — Owner',
      email: 'owner@axistour.local',
      role: 'owner',
    },
    organization: {
      id: 'org_axis_studios',
      name: 'Axis Studios',
      plan: 'studio',
      seatsUsed: 3,
      seatsLimit: 8,
      storageLimitMb: 2048,
      monthlyTourLimit: 40,
      customDomain: 'tours.yourdomain.com',
    },
    activeTourId: demoTour.id,
    tours: [demoTour, secondTour],
    assets: [
      {
        id: 'asset_foyer_panorama',
        tourId: demoTour.id,
        name: 'foyer-panorama.svg',
        type: 'panorama',
        url: demoTour.scenes[0].panoramaUrl,
        sizeMb: 4.2,
        createdAt: now(),
      },
      {
        id: 'asset_floorplan_demo',
        tourId: demoTour.id,
        name: 'main-level-floorplan.pdf',
        type: 'floorplan',
        url: 'https://example.com/floorplan.pdf',
        sizeMb: 1.4,
        createdAt: now(),
      },
    ],
    leads: [
      {
        id: 'lead_private_showing',
        tourId: demoTour.id,
        tourTitle: demoTour.title,
        name: 'Morgan Client',
        email: 'morgan@example.com',
        phone: '(910) 555-0134',
        message: 'Can we schedule a private showing this weekend?',
        source: 'hotspot',
        createdAt: now(),
        status: 'new',
      },
    ],
    analyticsEvents: [
      { id: 'evt_demo_view', tourId: demoTour.id, sceneId: 'foyer', type: 'view', visitorRole: 'buyer', dwellSeconds: 42, createdAt: now() },
      { id: 'evt_demo_great_room', tourId: demoTour.id, sceneId: 'great-room', type: 'scene_entered', visitorRole: 'buyer', dwellSeconds: 86, createdAt: now() },
      { id: 'evt_demo_kitchen', tourId: demoTour.id, sceneId: 'kitchen', type: 'scene_entered', visitorRole: 'agent', dwellSeconds: 78, createdAt: now() },
      { id: 'evt_demo_lead_open', tourId: demoTour.id, sceneId: 'great-room', type: 'lead_opened', visitorRole: 'buyer', dwellSeconds: 94, createdAt: now() },
      { id: 'evt_demo_share', tourId: demoTour.id, type: 'share_opened', visitorRole: 'reviewer', dwellSeconds: 120, createdAt: now() },
    ],
    reviewComments: [
      {
        id: 'review_foyer_copy',
        tourId: demoTour.id,
        sceneId: demoTour.scenes[0].id,
        author: 'Client Reviewer',
        body: 'Confirm the smart access wall copy before launch.',
        status: 'open',
        x: 30,
        y: 34,
        createdAt: now(),
      },
    ],
    shareLinks: [
      {
        id: 'share_demo_review',
        tourId: demoTour.id,
        token: 'axis-demo-review',
        permission: 'review',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        createdAt: now(),
      },
    ],
    auditLog: [
      { id: 'audit_seed_publish', actor: 'Parker — Owner', action: 'workspace.seeded', detail: 'SaaS demo workspace created locally.', createdAt: now() },
    ],
  }
}

export function validateWorkspace(value: unknown): SaaSWorkspace {
  if (!value || typeof value !== 'object') throw new Error('Workspace must be an object')
  const workspace = value as SaaSWorkspace
  if (!workspace.organization?.id || !Array.isArray(workspace.tours) || workspace.tours.length === 0) throw new Error('Workspace requires organization and tours')
  const tours = workspace.tours.map(validateTour)
  const activeTourId = tours.some((tour) => tour.id === workspace.activeTourId) ? workspace.activeTourId : tours[0].id
  return {
    ...workspace,
    tours,
    activeTourId,
    assets: workspace.assets ?? [],
    leads: workspace.leads ?? [],
    reviewComments: workspace.reviewComments ?? [],
    shareLinks: workspace.shareLinks ?? [],
    analyticsEvents: workspace.analyticsEvents ?? [],
    auditLog: workspace.auditLog ?? [],
  }
}

export function loadWorkspace(): SaaSWorkspace {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY)
    if (!raw) return createDefaultWorkspace()
    return validateWorkspace(JSON.parse(raw))
  } catch {
    return createDefaultWorkspace()
  }
}

export function saveWorkspace(workspace: SaaSWorkspace) {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace, null, 2))
}

export function storageUsedMb(workspace: SaaSWorkspace) {
  return Math.round(workspace.assets.reduce((sum, asset) => sum + asset.sizeMb, 0) * 10) / 10
}

export function updateTourInWorkspace(workspace: SaaSWorkspace, tour: Tour): SaaSWorkspace {
  return withAudit(
    {
      ...workspace,
      activeTourId: tour.id,
      tours: workspace.tours.map((existing) => (existing.id === tour.id ? validateTour(tour) : existing)),
    },
    'tour.updated',
    `${tour.title} saved to ${workspace.organization.name}.`,
  )
}

export function setActiveTour(workspace: SaaSWorkspace, tourId: string): SaaSWorkspace {
  if (!workspace.tours.some((tour) => tour.id === tourId)) return workspace
  return { ...workspace, activeTourId: tourId }
}

export function createTour(workspace: SaaSWorkspace, title = 'Untitled Client Tour'): SaaSWorkspace {
  const id = makeId('tour')
  const next: Tour = {
    ...demoTour,
    id,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id,
    client: 'New Client',
    status: 'draft',
    createdAt: now(),
    scenes: demoTour.scenes.map((scene, index) => ({ ...scene, id: `${id}_scene_${index}`, hotspots: [] })),
  }
  return withAudit({ ...workspace, activeTourId: id, tours: [...workspace.tours, next] }, 'tour.created', `${title} created from the demo spatial template.`)
}

export function publishTour(workspace: SaaSWorkspace, tourId: string): SaaSWorkspace {
  const tour = workspace.tours.find((item) => item.id === tourId)
  if (!tour) return workspace
  return withAudit(
    {
      ...workspace,
      tours: workspace.tours.map((item) => (item.id === tourId ? { ...item, status: 'published' } : item)),
    },
    'tour.published',
    `${tour.title} published at /tour/${tour.slug}.`,
  )
}

export function addAsset(workspace: SaaSWorkspace, asset: Omit<Asset, 'id' | 'createdAt'>): SaaSWorkspace {
  const nextAsset: Asset = { ...asset, id: makeId('asset'), createdAt: now() }
  return withAudit({ ...workspace, assets: [nextAsset, ...workspace.assets] }, 'asset.uploaded', `${asset.name} added to cloud asset library.`)
}

export function captureLead(workspace: SaaSWorkspace, lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): SaaSWorkspace {
  const nextLead: Lead = { ...lead, id: makeId('lead'), createdAt: now(), status: 'new' }
  return withAudit({ ...workspace, leads: [nextLead, ...workspace.leads] }, 'lead.captured', `${lead.name} submitted a lead on ${lead.tourTitle}.`)
}

export function updateLeadStatus(workspace: SaaSWorkspace, leadId: string, status: Lead['status']): SaaSWorkspace {
  return withAudit(
    { ...workspace, leads: workspace.leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)) },
    'lead.status_updated',
    `Lead ${leadId} moved to ${status}.`,
  )
}

export function createShareLink(workspace: SaaSWorkspace, tourId: string, permission: ShareLink['permission'] = 'review'): SaaSWorkspace {
  const token = `${tourId.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${makeId('share').replace('share_', '')}`
  const link: ShareLink = {
    id: makeId('share'),
    tourId,
    token,
    permission,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    createdAt: now(),
  }
  return withAudit({ ...workspace, shareLinks: [link, ...workspace.shareLinks] }, 'share.created', `${permission} link created for ${tourId}.`)
}

export function addReviewComment(workspace: SaaSWorkspace, comment: Omit<ReviewComment, 'id' | 'createdAt' | 'status'>): SaaSWorkspace {
  const nextComment: ReviewComment = { ...comment, id: makeId('review'), status: 'open', createdAt: now() }
  return withAudit({ ...workspace, reviewComments: [nextComment, ...workspace.reviewComments] }, 'review.comment_added', `${comment.author} commented on a scan point.`)
}

export function recordAnalyticsEvent(workspace: SaaSWorkspace, event: Omit<TourAnalyticsEvent, 'id' | 'createdAt'>): SaaSWorkspace {
  const nextEvent: TourAnalyticsEvent = { ...event, id: makeId('evt'), createdAt: now() }
  return withAudit(
    { ...workspace, analyticsEvents: [nextEvent, ...workspace.analyticsEvents].slice(0, 400) },
    'analytics.event_recorded',
    `${event.type} tracked for ${event.tourId}.`,
  )
}

export function resolveReviewComment(workspace: SaaSWorkspace, commentId: string): SaaSWorkspace {
  return withAudit(
    { ...workspace, reviewComments: workspace.reviewComments.map((comment) => (comment.id === commentId ? { ...comment, status: 'resolved' } : comment)) },
    'review.comment_resolved',
    `Review comment ${commentId} resolved.`,
  )
}

function withAudit(workspace: SaaSWorkspace, action: AuditEvent['action'], detail: string): SaaSWorkspace {
  const event: AuditEvent = { id: makeId('audit'), actor: workspace.account.name, action, detail, createdAt: now() }
  return { ...workspace, auditLog: [event, ...workspace.auditLog].slice(0, 40) }
}
