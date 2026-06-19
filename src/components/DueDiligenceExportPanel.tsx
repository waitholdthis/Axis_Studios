import { FileArchive, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { Tour } from '../lib/types'
import { buildDueDiligenceExport } from '../lib/dueDiligenceExport'

export function DueDiligenceExportPanel({ tour }: { tour: Tour }) {
  const packet = buildDueDiligenceExport(tour)

  return (
    <section className="due-diligence" aria-label="Signed due diligence export">
      <div className="due-diligence__hero">
        <div>
          <p className="eyebrow">Signed due-diligence export</p>
          <h2>Turn the tour, proof ledger, and deal twin into an escrow-ready trust artifact.</h2>
          <p>
            Axis now packages the buyer-room narrative as a signed export: deterministic checksum, chain of custody,
            release gates, retention policy, redactions, recipients, and backend-ready packet contents.
          </p>
        </div>
        <div className={`export-readiness export-readiness--${packet.readiness}`}>
          <FileArchive />
          <span>Export readiness</span>
          <strong>{packet.readiness}</strong>
          <small>{packet.exportId}</small>
        </div>
      </div>

      <div className="due-diligence__grid">
        <article className="export-card export-card--signature">
          <div className="panel-heading"><KeyRound /><h3>Signature envelope</h3></div>
          <code>{packet.signature}</code>
          <div className="export-metrics">
            <span><strong>{packet.checksum}</strong> payload checksum</span>
            <span><strong>{packet.retentionDays}</strong> retention days</span>
            <span><strong>{packet.closeProbability}%</strong> close signal</span>
          </div>
        </article>

        <article className="export-card export-card--wide">
          <div className="panel-heading"><ShieldCheck /><h3>Release attestations</h3></div>
          <div className="attestation-list">
            {packet.attestations.map((item) => (
              <div key={item.id} className={`attestation attestation--${item.status}`}>
                <b>{item.status}</b>
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              </div>
            ))}
          </div>
        </article>

        <article className="export-card">
          <div className="panel-heading"><LockKeyhole /><h3>Redactions</h3></div>
          <div className="export-list">
            {packet.redactions.map((item) => <p key={item}>{item}</p>)}
          </div>
        </article>

        <article className="export-card export-card--wide">
          <div className="panel-heading"><FileArchive /><h3>Chain of custody</h3></div>
          <div className="custody-list">
            {packet.chainOfCustody.map((item, index) => <p key={item}><b>{index + 1}</b>{item}</p>)}
          </div>
          <div className="recipient-strip">
            {packet.recipients.map((recipient) => <span key={recipient}>{recipient}</span>)}
          </div>
        </article>
      </div>
    </section>
  )
}
