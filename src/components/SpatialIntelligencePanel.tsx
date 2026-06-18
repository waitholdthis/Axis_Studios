import { Activity, BarChart3, Boxes, Compass, Milestone, Ruler, TrendingUp } from 'lucide-react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import type { SaaSWorkspace } from '../lib/saasTypes'
import type { Tour } from '../lib/types'
import { competitiveGaps, summarizeConversionAnalytics, summarizeGuidedRoutes, summarizeMeasurements } from '../lib/spatialIntelligence'
import { recordAnalyticsEvent } from '../lib/saasStore'

export function SpatialIntelligencePanel({ workspace, setWorkspace, tour }: { workspace: SaaSWorkspace; setWorkspace: Dispatch<SetStateAction<SaaSWorkspace>>; tour: Tour }) {
  const measurements = summarizeMeasurements(tour)
  const routes = summarizeGuidedRoutes(tour)
  const analytics = summarizeConversionAnalytics(workspace, tour.id)
  const gaps = competitiveGaps(workspace, tour)
  const hottestScene = tour.scenes.find((scene) => scene.id === analytics.hottestScene)?.name ?? analytics.hottestScene
  const trackHighIntentVisit = () => {
    setWorkspace((current) => recordAnalyticsEvent(current, {
      tourId: tour.id,
      sceneId: tour.scenes[0]?.id,
      type: 'scene_entered',
      visitorRole: 'buyer',
      dwellSeconds: 105,
    }))
  }

  return (
    <section className="spatial-intelligence" aria-label="Spatial intelligence and market readiness">
      <div className="intelligence-header">
        <div>
          <p className="eyebrow">Spatial intelligence layer</p>
          <h2>Measurement-aware tours, guided paths, and conversion analytics — the layer serious spatial platforms compete on.</h2>
          <button className="compact" type="button" onClick={trackHighIntentVisit}>Simulate high-intent visit</button>
        </div>
        <div className="intent-score"><TrendingUp/><span>Buyer intent</span><strong>{analytics.buyerIntentScore}</strong></div>
      </div>

      <div className="intelligence-grid">
        <article className="intel-card measurement-card">
          <div className="section-heading"><span><Ruler size={16}/> Measurements</span><b>{measurements.coveragePercent}% covered</b></div>
          <div className="measure-ring" style={{ '--coverage': `${measurements.coveragePercent}%` } as CSSProperties}>
            <strong>{measurements.measuredSquareFeet.toLocaleString()}</strong>
            <span>measured sq ft</span>
          </div>
          <div className="intel-stats">
            <span><b>{measurements.totalSquareFeet.toLocaleString()}</b> listed sq ft</span>
            <span><b>{measurements.measuredScenes}</b> measured rooms</span>
            <span><b>{measurements.averageCeilingHeightFt ?? '—'}</b> avg ceiling ft</span>
          </div>
        </article>

        <article className="intel-card route-card">
          <div className="section-heading"><span><Compass size={16}/> Guided routes</span><b>{routes.length} paths</b></div>
          <div className="route-list">
            {routes.map((route) => (
              <div key={route.id}>
                <strong>{route.name}</strong>
                <small>{route.intent} • {route.stops.length} stops • ~{route.estimatedMinutes} min</small>
                <p>{route.stops.map((stop) => stop.name).join(' → ')}</p>
              </div>
            ))}
            {!routes.length && <p>Add curated buyer, leasing, operations, or accessibility paths.</p>}
          </div>
        </article>

        <article className="intel-card analytics-card">
          <div className="section-heading"><span><BarChart3 size={16}/> Conversion analytics</span><b>{analytics.conversionRate}% CVR</b></div>
          <div className="analytics-grid">
            <span><strong>{analytics.visitors}</strong> visitors</span>
            <span><strong>{analytics.engagedVisitors}</strong> engaged</span>
            <span><strong>{analytics.averageDwellSeconds}s</strong> avg dwell</span>
            <span><strong>{analytics.leadSubmissions}</strong> leads</span>
          </div>
          <p className="hotspot-note"><Activity size={14}/> Hottest scene: {hottestScene}</p>
        </article>

        <article className="intel-card gap-card">
          <div className="section-heading"><span><Boxes size={16}/> Competitive readiness</span><b>market grade</b></div>
          <div className="gap-list">
            {gaps.map((gap) => (
              <div key={gap.label} className={`gap-row gap-row--${gap.status}`}>
                <Milestone size={15}/>
                <span><strong>{gap.label}</strong><small>{gap.detail}</small></span>
                <b>{gap.status}</b>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
