import { Building2, CheckCircle2, CloudUpload, Copy, Crown, Globe2, Inbox, LockKeyhole, Plus, Rocket, ServerCog, ShieldCheck, Users, Webhook } from 'lucide-react'
import type React from 'react'
import type { ChangeEvent } from 'react'
import type { SaaSWorkspace } from '../lib/saasTypes'
import { addAsset, captureLead, createTour, publishTour, setActiveTour, storageUsedMb, updateLeadStatus } from '../lib/saasStore'

export function SaaSDashboard({ workspace, setWorkspace }: { workspace: SaaSWorkspace; setWorkspace: (workspace: SaaSWorkspace) => void }) {
  const activeTour = workspace.tours.find((tour) => tour.id === workspace.activeTourId) ?? workspace.tours[0]
  const usedStorage = storageUsedMb(workspace)
  const publishedCount = workspace.tours.filter((tour) => tour.status === 'published').length
  const leadCount = workspace.leads.filter((lead) => lead.status === 'new').length
  const publicUrl = `https://${workspace.organization.customDomain ?? 'your-domain.com'}/tour/${activeTour.slug}`

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
