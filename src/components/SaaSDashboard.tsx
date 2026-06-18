import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, CloudUpload, Copy, Crown, DatabaseZap, Download, Globe2, Inbox, Link2, LockKeyhole, MessageSquarePlus, Plus, Rocket, ServerCog, ShieldCheck, Users, Webhook } from 'lucide-react'
import type React from 'react'
import type { ChangeEvent } from 'react'
import type { BackendConfig, BackendSyncReport } from '../lib/backendGateway'
import { createBackendSyncReport, defaultBackendConfig, downloadBackendManifest, loadBackendConfig, loadLastSyncReport, queueBackendSync, saveBackendConfig } from '../lib/backendGateway'
import type { SaaSWorkspace } from '../lib/saasTypes'
import { addAsset, addReviewComment, captureLead, createShareLink, createTour, publishTour, resolveReviewComment, setActiveTour, storageUsedMb, updateLeadStatus } from '../lib/saasStore'

export function SaaSDashboard({ workspace, setWorkspace }: { workspace: SaaSWorkspace; setWorkspace: (workspace: SaaSWorkspace) => void }) {
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => loadBackendConfig())
  const [syncReport, setSyncReport] = useState<BackendSyncReport | null>(() => loadLastSyncReport())
  const activeTour = workspace.tours.find((tour) => tour.id === workspace.activeTourId) ?? workspace.tours[0]
  const usedStorage = storageUsedMb(workspace)
  const publishedCount = workspace.tours.filter((tour) => tour.status === 'published').length
  const leadCount = workspace.leads.filter((lead) => lead.status === 'new').length
  const openReviews = workspace.reviewComments.filter((comment) => comment.status === 'open').length
  const activeShareLinks = workspace.shareLinks.filter((link) => link.tourId === activeTour.id)
  const publicUrl = `https://${workspace.organization.customDomain ?? 'your-domain.com'}/tour/${activeTour.slug}`
  const draftReport = createBackendSyncReport(workspace, backendConfig)

  useEffect(() => saveBackendConfig(backendConfig), [backendConfig])

  const updateBackendConfig = (patch: Partial<BackendConfig>) => setBackendConfig((current) => ({ ...current, ...patch }))
  const copyPublicUrl = async () => navigator.clipboard?.writeText(publicUrl)

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setWorkspace(
        addAsset(workspace, {
          tourId: activeTour.id,
          name: file.name,
          type: file.type.startsWith('image/') ? 'panorama' : 'document',
          url: String(reader.result ?? ''),
          sizeMb: Math.max(0.1, Math.round((file.size / 1024 / 1024) * 10) / 10),
        }),
      )
    }
    reader.readAsDataURL(file)
  }

  const simulateLead = () => {
    setWorkspace(
      captureLead(workspace, {
        tourId: activeTour.id,
        tourTitle: activeTour.title,
        name: 'Taylor Prospect',
        email: 'taylor.prospect@example.com',
        phone: '(910) 555-0188',
        source: 'public-tour',
        message: `I viewed ${activeTour.title} and want pricing, showing details, or a private consultation.`,
      }),
    )
  }

  const dryRunBackendSync = () => {
    const result = queueBackendSync(workspace, backendConfig)
    setSyncReport(result.report)
    setWorkspace(result.workspace)
  }

  const createReviewLink = () => setWorkspace(createShareLink(workspace, activeTour.id, 'review'))
  const addClientComment = () => {
    const scene = activeTour.scenes[0]
    setWorkspace(addReviewComment(workspace, {
      tourId: activeTour.id,
      sceneId: scene.id,
      author: 'Client Reviewer',
      body: `Review ${scene.name} hero label, floorplan position, and lead CTA before final approval.`,
      x: 42,
      y: 38,
    }))
  }

  return (
    <section className="saas-console" id="saas">
      <div className="console-header">
        <div>
          <p className="eyebrow">SaaS control plane</p>
          <h2>{workspace.organization.name} is running a multi-tenant spatial-tour business layer.</h2>
          <p>Accounts, organizations, plan limits, asset library, public URLs, lead inbox, audit log, and webhook-ready CRM handoff now sit around the 360 editor.</p>
        </div>
        <div className="account-card">
          <Crown />
          <span>{workspace.account.name}</span>
          <strong>{workspace.organization.plan} plan</strong>
        </div>
      </div>

      <div className="kpi-grid">
        <Metric icon={<Building2 />} label="Tours" value={`${workspace.tours.length}/${workspace.organization.monthlyTourLimit}`} detail={`${publishedCount} published`} />
        <Metric icon={<CloudUpload />} label="Storage" value={`${usedStorage} MB`} detail={`${workspace.organization.storageLimitMb} MB limit`} />
        <Metric icon={<Users />} label="Seats" value={`${workspace.organization.seatsUsed}/${workspace.organization.seatsLimit}`} detail="owner/admin/editor roles" />
        <Metric icon={<Inbox />} label="New leads" value={String(leadCount)} detail="captured from public tours" />
        <Metric icon={<MessageSquarePlus />} label="Open reviews" value={String(openReviews)} detail={`${workspace.shareLinks.length} client links`} />
      </div>

      <div className="saas-grid">
        <article className="saas-card tour-vault">
          <div className="section-heading"><span>Client tour vault</span><button onClick={() => setWorkspace(createTour(workspace, 'New Client Listing'))}><Plus size={16}/>New tour</button></div>
          <div className="tour-table">
            {workspace.tours.map((tour) => (
              <button key={tour.id} className={tour.id === activeTour.id ? 'active' : ''} onClick={() => setWorkspace(setActiveTour(workspace, tour.id))}>
                <span><strong>{tour.title}</strong><small>{tour.client} • /tour/{tour.slug}</small></span>
                <b>{tour.status}</b>
              </button>
            ))}
          </div>
        </article>

        <article className="saas-card publish-card">
          <p className="eyebrow">Publishing</p>
          <h3>{activeTour.title}</h3>
          <p className="public-url"><Globe2 size={16}/>{publicUrl}</p>
          <div className="button-row">
            <button onClick={() => setWorkspace(publishTour(workspace, activeTour.id))}><Rocket size={16}/>Publish tour</button>
            <button onClick={copyPublicUrl}><Copy size={16}/>Copy URL</button>
          </div>
          <div className="publish-checklist">
            <span><CheckCircle2/> Scene graph validated</span>
            <span><CheckCircle2/> Embed code available</span>
            <span><CheckCircle2/> Lead capture wired</span>
            <span><ShieldCheck/> Audit event generated on publish</span>
          </div>
        </article>

        <article className="saas-card asset-card">
          <div className="section-heading"><span>Cloud asset library</span><label className="file-button compact"><CloudUpload size={16}/>Upload<input type="file" onChange={uploadAsset}/></label></div>
          <div className="asset-list">
            {workspace.assets.slice(0, 5).map((asset) => (
              <div key={asset.id}><strong>{asset.name}</strong><small>{asset.type} • {asset.sizeMb} MB</small></div>
            ))}
          </div>
        </article>

        <article className="saas-card lead-card">
          <div className="section-heading"><span>Lead inbox</span><button onClick={simulateLead}><Webhook size={16}/>Simulate lead</button></div>
          <div className="lead-list">
            {workspace.leads.slice(0, 4).map((lead) => (
              <div className="lead-row" key={lead.id}>
                <div><strong>{lead.name}</strong><small>{lead.email} • {lead.tourTitle}</small><p>{lead.message}</p></div>
                <select value={lead.status} onChange={(e) => setWorkspace(updateLeadStatus(workspace, lead.id, e.target.value as typeof lead.status))}>
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="won">won</option>
                  <option value="archived">archived</option>
                </select>
              </div>
            ))}
          </div>
        </article>

        <article className="saas-card review-card">
          <div className="section-heading"><span>Client review room</span><button onClick={createReviewLink}><Link2 size={16}/>Create link</button></div>
          <p className="backend-copy">Private review links and scene-anchored comments move AxisTour beyond a viewer into a client approval workflow.</p>
          <div className="review-actions"><button onClick={addClientComment}><MessageSquarePlus size={16}/>Add sample comment</button><b>{openReviews} open</b></div>
          <div className="share-list">
            {activeShareLinks.slice(0, 3).map((link) => <div key={link.id}><strong>{link.permission}</strong><code>/review/{link.token}</code><small>expires {new Date(link.expiresAt).toLocaleDateString()}</small></div>)}
            {!activeShareLinks.length && <span>No review links for this tour yet.</span>}
          </div>
          <div className="comment-list">
            {workspace.reviewComments.filter((comment) => comment.tourId === activeTour.id).slice(0, 3).map((comment) => (
              <div key={comment.id} className={comment.status === 'resolved' ? 'resolved' : ''}>
                <strong>{comment.author}</strong><p>{comment.body}</p><small>{comment.sceneId} • {comment.x}%, {comment.y}%</small>
                {comment.status === 'open' && <button onClick={() => setWorkspace(resolveReviewComment(workspace, comment.id))}>Resolve</button>}
              </div>
            ))}
          </div>
        </article>

        <article className="saas-card backend-card">
          <div className="section-heading"><span>Backend cutover cockpit</span><b className={`sync-status sync-status--${draftReport.status}`}>{draftReport.status}</b></div>
          <p className="backend-copy">Turn the local SaaS workspace into a production backend contract: API routes, Postgres tables, object storage, CRM webhooks, and Stripe checkout metadata.</p>
          <div className="backend-mode">
            <button className={backendConfig.mode === 'local-first' ? 'active' : ''} onClick={() => updateBackendConfig({ mode: 'local-first' })}>Local-first</button>
            <button className={backendConfig.mode === 'api-ready' ? 'active' : ''} onClick={() => updateBackendConfig({ mode: 'api-ready' })}>API-ready</button>
          </div>
          <div className="backend-fields">
            <label>API base URL<input placeholder="https://api.axistour.com" value={backendConfig.apiBaseUrl} onChange={(e) => updateBackendConfig({ apiBaseUrl: e.target.value })}/></label>
            <label>Organization ID<input value={backendConfig.organizationId} onChange={(e) => updateBackendConfig({ organizationId: e.target.value })}/></label>
            <label>Object storage bucket<input value={backendConfig.storageBucket} onChange={(e) => updateBackendConfig({ storageBucket: e.target.value })}/></label>
            <label>CRM webhook URL<input placeholder="https://hooks.crm.com/axis" value={backendConfig.crmWebhookUrl} onChange={(e) => updateBackendConfig({ crmWebhookUrl: e.target.value })}/></label>
            <label>Stripe price ID<input placeholder="price_studio_monthly" value={backendConfig.stripePriceId} onChange={(e) => updateBackendConfig({ stripePriceId: e.target.value })}/></label>
          </div>
          <div className="button-row">
            <button onClick={dryRunBackendSync}><DatabaseZap size={16}/>Generate sync contract</button>
            <button onClick={() => downloadBackendManifest(workspace, backendConfig)}><Download size={16}/>Export backend manifest</button>
            <button onClick={() => setBackendConfig(defaultBackendConfig)}>Reset</button>
          </div>
          <div className="sync-grid">
            <span><strong>{draftReport.toursSynced}</strong> tours mapped</span>
            <span><strong>{draftReport.assetsQueued}</strong> assets queued</span>
            <span><strong>{draftReport.endpoints.length}</strong> API routes</span>
            <span><strong>{Math.round(draftReport.workspaceBytes / 1024)}KB</strong> payload</span>
          </div>
          <div className="endpoint-list">
            {draftReport.endpoints.map((endpoint) => (
              <div key={`${endpoint.method}-${endpoint.path}`}><b>{endpoint.method}</b><code>{endpoint.path}</code><small>{endpoint.purpose}</small></div>
            ))}
          </div>
          <div className="warning-stack">
            {draftReport.warnings.map((warning) => <span key={warning}>{warning}</span>)}
            {!draftReport.warnings.length && <span>Production contract is ready for server implementation.</span>}
          </div>
          {syncReport && <p className="last-sync">Last generated {new Date(syncReport.generatedAt).toLocaleString()} — {syncReport.status}</p>}
        </article>

        <article className="saas-card hardening-card">
          <p className="eyebrow">Production architecture</p>
          <div className="architecture-stack">
            <span><LockKeyhole/> Auth + organizations</span>
            <span><ServerCog/> Postgres + object storage</span>
            <span><Globe2/> Public slug router</span>
            <span><Webhook/> CRM/email webhooks</span>
          </div>
        </article>
      </div>
    </section>
  )
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <article className="metric-card">{icon}<span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}
