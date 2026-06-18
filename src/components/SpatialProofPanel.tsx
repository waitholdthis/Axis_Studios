import { CheckCircle2, FileCheck2, Fingerprint, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Tour } from '../lib/types'
import { buildSpatialProofPack } from '../lib/spatialProof'

export function SpatialProofPanel({ tour }: { tour: Tour }) {
  const pack = buildSpatialProofPack(tour)
  const lowRiskClaims = pack.claims.filter((claim) => claim.risk === 'low').length

  return (
    <section className="spatial-proof" aria-label="Spatial proof and claim verification">
      <div className="proof-hero">
        <div>
          <p className="eyebrow">Axis Proof Layer</p>
          <h2>Not just a tour — a verifiable spatial deal room competitors are not giving buyers.</h2>
          <p>
            Axis turns every listing promise into a scene-backed proof packet: claims, evidence rooms, confidence scores, objections,
            review risk, and an audit fingerprint buyers, agents, builders, and enterprise clients can trust.
          </p>
        </div>
        <div className="proof-score-card">
          <ShieldCheck />
          <span>Trust score</span>
          <strong>{pack.trustScore}</strong>
          <small>{pack.auditFingerprint}</small>
        </div>
      </div>

      <div className="proof-grid">
        <article className="proof-card proof-ledger">
          <div className="section-heading"><span><FileCheck2 size={16}/> Claim ledger</span><b>{pack.verifiedClaims}/{pack.totalClaims} verified</b></div>
          <div className="claim-list">
            {pack.claims.map((claim) => (
              <div key={claim.id} className={`claim-row claim-row--${claim.risk}`}>
                {claim.risk === 'low' ? <CheckCircle2 size={16}/> : <ShieldAlert size={16}/>} 
                <span>
                  <strong>{claim.claim}</strong>
                  <small>{claim.category} • {claim.confidence}% confidence • evidence: {claim.evidenceLabels.join(', ') || 'missing'}</small>
                  {claim.note && <em>{claim.note}</em>}
                </span>
                <b>{claim.status}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="proof-card objection-card">
          <div className="section-heading"><span><ShieldAlert size={16}/> Buyer objection engine</span><b>{pack.needsReview + pack.unsupportedClaims} flags</b></div>
          <div className="objection-list">
            {pack.buyerObjections.map((objection) => <p key={objection}>{objection}</p>)}
          </div>
          <div className="proof-metrics">
            <span><strong>{pack.measurementCoveragePercent}%</strong> measurement proof</span>
            <span><strong>{lowRiskClaims}</strong> low-risk claims</span>
            <span><strong>{pack.unsupportedClaims}</strong> unsupported</span>
          </div>
        </article>

        <article className="proof-card fingerprint-card">
          <div className="section-heading"><span><Fingerprint size={16}/> Exportable proof packet</span><b>enterprise-ready</b></div>
          <p>
            Competitors show spaces. Axis can prove them. This packet becomes a shareable trust artifact for buyer due diligence,
            broker approvals, builder handoffs, asset management, insurance review, and procurement.
          </p>
          <code>{JSON.stringify({ tourId: pack.tourId, trustScore: pack.trustScore, fingerprint: pack.auditFingerprint })}</code>
        </article>
      </div>
    </section>
  )
}
