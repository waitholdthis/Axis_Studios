import { BrainCircuit, Crosshair, GitBranch, Radar, Route, Target } from 'lucide-react'
import type { Tour } from '../lib/types'
import { buildDealTwin } from '../lib/dealTwin'

export function DealTwinPanel({ tour }: { tour: Tour }) {
  const twin = buildDealTwin(tour)
  const primaryOffer = twin.offerPaths[0]

  return (
    <section className="deal-twin" aria-label="Axis Deal Twin">
      <div className="deal-twin__hero">
        <div>
          <p className="eyebrow">Axis Deal Twin</p>
          <h2>The tour now simulates the deal room before the buyer enters it.</h2>
          <p>
            Competitors show rooms. Axis models the decision: buyer confidence, agent price-defense, inspection risk,
            lender collateral support, offer strategy, and the exact next action needed to move the deal.
          </p>
        </div>
        <div className="deal-score-card">
          <BrainCircuit />
          <span>Close probability</span>
          <strong>{twin.closeProbability}%</strong>
          <small>Primary: {twin.primaryStakeholder}</small>
        </div>
      </div>

      <div className="deal-twin__grid">
        <article className="deal-card deal-card--wide">
          <div className="panel-heading"><Target /><h3>Stakeholder simulations</h3></div>
          <div className="scenario-list">
            {twin.scenarios.map((scenario) => (
              <div className="scenario-row" key={scenario.id}>
                <div>
                  <strong>{scenario.stakeholder}</strong>
                  <span>{scenario.motivation}</span>
                  <small>Evidence: {scenario.evidenceSceneNames.join(', ') || 'none mapped'}</small>
                </div>
                <b>{scenario.confidence}%</b>
                <em>{scenario.leverage}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="deal-card">
          <div className="panel-heading"><Crosshair /><h3>Recommended offer path</h3></div>
          <strong>{primaryOffer.label}</strong>
          <p>{primaryOffer.script}</p>
          <small>{primaryOffer.confidence}% confidence • {primaryOffer.recommendedFor}</small>
        </article>

        <article className="deal-card">
          <div className="panel-heading"><Radar /><h3>Friction radar</h3></div>
          <div className="deal-list">
            {twin.frictionRadar.length ? twin.frictionRadar.map((item) => <p key={item}>{item}</p>) : <p>No major deal-room friction detected.</p>}
          </div>
        </article>

        <article className="deal-card">
          <div className="panel-heading"><Route /><h3>Next best actions</h3></div>
          <div className="deal-list deal-list--actions">
            {twin.nextBestActions.map((item) => <p key={item}>{item}</p>)}
          </div>
        </article>

        <article className="deal-card deal-card--wide">
          <div className="panel-heading"><GitBranch /><h3>Scene evidence map</h3></div>
          <div className="scene-evidence-grid">
            {twin.sceneEvidence.map((scene) => (
              <div key={scene.sceneId}>
                <strong>{scene.sceneName}</strong>
                <span>Proof density {scene.proofDensity}%</span>
                <span>Buyer pull {scene.buyerPull}%</span>
                <small>{scene.unlock}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
