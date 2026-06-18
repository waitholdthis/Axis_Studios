import { describe, expect, it, vi } from 'vitest'
import { createDefaultWorkspace } from './saasStore'
import { buildBackendEndpoints, createBackendManifest, createBackendSyncReport, defaultBackendConfig, queueBackendSync, validateBackendConfig } from './backendGateway'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('backend gateway contracts', () => {
  it('normalizes backend configuration safely', () => {
    expect(validateBackendConfig({ mode: 'api-ready', apiBaseUrl: 'https://api.axis.test/', storageBucket: '' })).toMatchObject({
      mode: 'api-ready',
      apiBaseUrl: 'https://api.axis.test',
      storageBucket: defaultBackendConfig.storageBucket,
    })
  })

  it('generates API endpoints for workspace persistence, assets, publishing, leads, billing, analytics, intelligence, and proof packets', () => {
    const workspace = createDefaultWorkspace()
    const endpoints = buildBackendEndpoints({ ...defaultBackendConfig, mode: 'api-ready', apiBaseUrl: 'https://api.axis.test' }, workspace)
    expect(endpoints.map((endpoint) => endpoint.path)).toEqual([
      '/api/workspaces/org_axis_studios',
      '/api/workspaces/org_axis_studios',
      '/api/assets/sign-upload',
      `/api/tours/${workspace.activeTourId}/publish`,
      '/api/leads',
      '/api/billing/checkout',
      '/api/analytics/events',
      `/api/tours/${workspace.activeTourId}/intelligence`,
      `/api/tours/${workspace.activeTourId}/proof-packet`,
      `/api/tours/${workspace.activeTourId}/proof-claims`,
    ])
  })

  it('blocks API-ready cutover when production wiring is incomplete', () => {
    const workspace = createDefaultWorkspace()
    const report = createBackendSyncReport(workspace, { ...defaultBackendConfig, mode: 'api-ready' })
    expect(report.status).toBe('blocked')
    expect(report.warnings).toContain('API base URL is missing.')
    expect(report.toursSynced).toBe(workspace.tours.length)
  })

  it('marks sync contract ready when required backend wiring exists and assets are object URLs', () => {
    const baseWorkspace = createDefaultWorkspace()
    const workspace = {
      ...baseWorkspace,
      assets: baseWorkspace.assets.map((asset) => ({ ...asset, url: `https://cdn.axis.test/${asset.name}` })),
      reviewComments: [],
    }
    const report = createBackendSyncReport(workspace, {
      mode: 'api-ready',
      apiBaseUrl: 'https://api.axis.test',
      organizationId: 'org_axis_studios',
      storageBucket: 'axis-assets',
      crmWebhookUrl: 'https://hooks.axis.test/leads',
      stripePriceId: 'price_studio_monthly',
    })
    expect(report.status).toBe('ready')
    expect(report.leadsDelivered).toBe(workspace.leads.length)
    expect(report.warnings).toEqual([])
  })

  it('queues a dry-run sync report and appends an audit event', () => {
    localStorageMock.clear()
    const workspace = createDefaultWorkspace()
    const result = queueBackendSync(workspace, defaultBackendConfig)
    expect(result.report.status).toBe('local-only')
    expect(result.workspace.auditLog[0].action).toBe('backend.sync_dry_run')
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('exports a backend manifest with table contracts, storage, webhooks, billing, and endpoints', () => {
    const workspace = createDefaultWorkspace()
    const manifest = createBackendManifest(workspace, defaultBackendConfig)
    expect(manifest.product).toBe('AxisTour SaaS')
    expect(manifest.tables).toHaveProperty('organizations')
    expect(manifest.tables).toHaveProperty('audit_events')
    expect(manifest.tables).toHaveProperty('review_comments')
    expect(manifest.tables).toHaveProperty('share_links')
    expect(manifest.tables).toHaveProperty('guided_routes')
    expect(manifest.tables).toHaveProperty('analytics_events')
    expect(manifest.tables).toHaveProperty('proof_claims')
    expect(manifest.tables).toHaveProperty('proof_packets')
    expect(manifest.storage.assetCount).toBe(workspace.assets.length)
    expect(manifest.webhooks.leadEvents).toHaveLength(workspace.leads.length)
    expect(manifest.endpoints).toHaveLength(10)
  })
})
