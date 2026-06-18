import { makeId } from './tourStore'
import type { Asset, AuditEvent, Lead, SaaSWorkspace } from './saasTypes'

export const BACKEND_CONFIG_KEY = 'axistour.backend.config.v1'
export const BACKEND_LAST_SYNC_KEY = 'axistour.backend.lastSync.v1'

export type BackendMode = 'local-first' | 'api-ready'

export type BackendConfig = {
  mode: BackendMode
  apiBaseUrl: string
  organizationId: string
  storageBucket: string
  crmWebhookUrl: string
  stripePriceId: string
}

export type BackendEndpoint = {
  method: 'GET' | 'POST' | 'PUT'
  path: string
  purpose: string
  payload: string
}

export type BackendSyncReport = {
  id: string
  status: 'local-only' | 'ready' | 'blocked'
  mode: BackendMode
  apiBaseUrl: string
  workspaceBytes: number
  toursSynced: number
  assetsQueued: number
  leadsDelivered: number
  endpoints: BackendEndpoint[]
  warnings: string[]
  generatedAt: string
}

export type BackendManifest = {
  product: 'AxisTour SaaS'
  organization: SaaSWorkspace['organization']
  account: SaaSWorkspace['account']
  tables: Record<string, string[]>
  storage: {
    bucket: string
    assetCount: number
    queuedAssetNames: string[]
  }
  webhooks: {
    crm: string
    leadEvents: Array<Pick<Lead, 'id' | 'email' | 'source' | 'status'>>
  }
  billing: {
    stripePriceId: string
    plan: SaaSWorkspace['organization']['plan']
  }
  endpoints: BackendEndpoint[]
  generatedAt: string
}

export const defaultBackendConfig: BackendConfig = {
  mode: 'local-first',
  apiBaseUrl: '',
  organizationId: 'org_axis_studios',
  storageBucket: 'axistour-assets',
  crmWebhookUrl: '',
  stripePriceId: '',
}

const now = () => new Date().toISOString()

export function loadBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(BACKEND_CONFIG_KEY)
    if (!raw) return defaultBackendConfig
    return validateBackendConfig(JSON.parse(raw))
  } catch {
    return defaultBackendConfig
  }
}

export function saveBackendConfig(config: BackendConfig) {
  localStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(validateBackendConfig(config), null, 2))
}

export function loadLastSyncReport(): BackendSyncReport | null {
  try {
    const raw = localStorage.getItem(BACKEND_LAST_SYNC_KEY)
    return raw ? (JSON.parse(raw) as BackendSyncReport) : null
  } catch {
    return null
  }
}

export function validateBackendConfig(value: unknown): BackendConfig {
  const config = typeof value === 'object' && value ? (value as Partial<BackendConfig>) : {}
  const mode: BackendMode = config.mode === 'api-ready' ? 'api-ready' : 'local-first'
  return {
    mode,
    apiBaseUrl: cleanUrl(config.apiBaseUrl),
    organizationId: String(config.organizationId || defaultBackendConfig.organizationId),
    storageBucket: String(config.storageBucket || defaultBackendConfig.storageBucket),
    crmWebhookUrl: cleanUrl(config.crmWebhookUrl),
    stripePriceId: String(config.stripePriceId || ''),
  }
}

export function buildBackendEndpoints(config: BackendConfig, workspace: SaaSWorkspace): BackendEndpoint[] {
  const orgId = encodeURIComponent(config.organizationId || workspace.organization.id)
  const activeTourId = encodeURIComponent(workspace.activeTourId)
  return [
    {
      method: 'GET',
      path: `/api/workspaces/${orgId}`,
      purpose: 'Hydrate account, organization, plan limits, tours, assets, leads, and audit log after login.',
      payload: 'SaaSWorkspace',
    },
    {
      method: 'PUT',
      path: `/api/workspaces/${orgId}`,
      purpose: 'Persist validated workspace mutations from the studio/editor control plane.',
      payload: 'SaaSWorkspace',
    },
    {
      method: 'POST',
      path: `/api/assets/sign-upload`,
      purpose: `Issue signed object-storage uploads for bucket ${config.storageBucket || defaultBackendConfig.storageBucket}.`,
      payload: 'AssetUploadRequest -> SignedUploadUrl',
    },
    {
      method: 'POST',
      path: `/api/tours/${activeTourId}/publish`,
      purpose: 'Publish the active tour slug, create public route metadata, and invalidate CDN cache.',
      payload: 'PublishTourRequest',
    },
    {
      method: 'POST',
      path: '/api/leads',
      purpose: 'Capture public-tour or embedded-tour leads server-side with spam checks and CRM fanout.',
      payload: 'LeadCaptureRequest',
    },
    {
      method: 'POST',
      path: '/api/billing/checkout',
      purpose: 'Start Stripe checkout for starter/studio/enterprise subscription upgrades.',
      payload: 'CheckoutRequest',
    },
  ]
}

export function createBackendSyncReport(workspace: SaaSWorkspace, config: BackendConfig): BackendSyncReport {
  const safeConfig = validateBackendConfig(config)
  const endpoints = buildBackendEndpoints(safeConfig, workspace)
  const workspaceBytes = new Blob([JSON.stringify(workspace)]).size
  const warnings = backendWarnings(workspace, safeConfig)
  const status: BackendSyncReport['status'] = safeConfig.mode === 'local-first' ? 'local-only' : warnings.length ? 'blocked' : 'ready'

  return {
    id: makeId('sync'),
    status,
    mode: safeConfig.mode,
    apiBaseUrl: safeConfig.apiBaseUrl || 'not configured',
    workspaceBytes,
    toursSynced: workspace.tours.length,
    assetsQueued: workspace.assets.length,
    leadsDelivered: safeConfig.crmWebhookUrl ? workspace.leads.length : 0,
    endpoints,
    warnings,
    generatedAt: now(),
  }
}

export function queueBackendSync(workspace: SaaSWorkspace, config: BackendConfig): { workspace: SaaSWorkspace; report: BackendSyncReport } {
  const report = createBackendSyncReport(workspace, config)
  localStorage.setItem(BACKEND_LAST_SYNC_KEY, JSON.stringify(report, null, 2))
  const event: AuditEvent = {
    id: makeId('audit'),
    actor: workspace.account.name,
    action: 'backend.sync_dry_run',
    detail: `${report.status} sync contract generated for ${report.toursSynced} tours, ${report.assetsQueued} assets, and ${workspace.leads.length} leads.`,
    createdAt: now(),
  }
  return { workspace: { ...workspace, auditLog: [event, ...workspace.auditLog].slice(0, 40) }, report }
}

export function createBackendManifest(workspace: SaaSWorkspace, config: BackendConfig): BackendManifest {
  const safeConfig = validateBackendConfig(config)
  return {
    product: 'AxisTour SaaS',
    organization: workspace.organization,
    account: workspace.account,
    tables: {
      accounts: ['id', 'name', 'email', 'role', 'created_at', 'updated_at'],
      organizations: ['id', 'name', 'plan', 'seats_limit', 'storage_limit_mb', 'monthly_tour_limit', 'custom_domain'],
      organization_members: ['organization_id', 'account_id', 'role'],
      tours: ['id', 'organization_id', 'title', 'slug', 'client', 'status', 'brand_color', 'created_at', 'updated_at'],
      scenes: ['id', 'tour_id', 'name', 'floor', 'panorama_url', 'initial_yaw', 'initial_pitch', 'floorplan_x', 'floorplan_y', 'scan_quality', 'sort_order'],
      hotspots: ['id', 'scene_id', 'type', 'label', 'yaw', 'pitch', 'target_scene_id', 'body'],
      assets: ['id', 'tour_id', 'name', 'type', 'url', 'size_mb', 'created_at'],
      leads: ['id', 'tour_id', 'name', 'email', 'phone', 'message', 'source', 'status', 'created_at'],
      review_comments: ['id', 'tour_id', 'scene_id', 'author', 'body', 'status', 'x', 'y', 'created_at'],
      share_links: ['id', 'tour_id', 'token', 'permission', 'expires_at', 'created_at'],
      audit_events: ['id', 'organization_id', 'actor', 'action', 'detail', 'created_at'],
    },
    storage: {
      bucket: safeConfig.storageBucket,
      assetCount: workspace.assets.length,
      queuedAssetNames: workspace.assets.map((asset: Asset) => asset.name),
    },
    webhooks: {
      crm: safeConfig.crmWebhookUrl || 'not configured',
      leadEvents: workspace.leads.map((lead) => ({ id: lead.id, email: lead.email, source: lead.source, status: lead.status })),
    },
    billing: {
      stripePriceId: safeConfig.stripePriceId || 'not configured',
      plan: workspace.organization.plan,
    },
    endpoints: buildBackendEndpoints(safeConfig, workspace),
    generatedAt: now(),
  }
}

export function downloadBackendManifest(workspace: SaaSWorkspace, config: BackendConfig) {
  const manifest = createBackendManifest(workspace, config)
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `axistour-backend-manifest-${workspace.organization.id}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function backendWarnings(workspace: SaaSWorkspace, config: BackendConfig): string[] {
  const warnings: string[] = []
  if (config.mode === 'local-first') warnings.push('Local-first mode is active. Switch to API-ready mode before production cutover.')
  if (config.mode === 'api-ready' && !config.apiBaseUrl) warnings.push('API base URL is missing.')
  if (!config.crmWebhookUrl) warnings.push('CRM/email webhook URL is missing; leads will stay queued.')
  if (!config.stripePriceId) warnings.push('Stripe price ID is missing; billing checkout is not production-ready.')
  if (workspace.assets.some((asset) => asset.url.startsWith('data:'))) warnings.push('Some assets are still data URLs and must be migrated to object storage.')
  if (workspace.reviewComments.some((comment) => comment.status === 'open')) warnings.push('Open client review comments remain before final handoff.')
  if (!workspace.shareLinks.length) warnings.push('Create at least one expiring review/share link before client delivery.')
  if (!workspace.organization.customDomain) warnings.push('Custom tour domain is not configured.')
  return warnings
}

function cleanUrl(value: unknown) {
  const url = String(value || '').trim()
  return url.replace(/\/$/, '')
}
