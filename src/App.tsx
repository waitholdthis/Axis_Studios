import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Building2, Camera, ChevronRight, Cuboid, Database, Map, Sparkles } from 'lucide-react'
import './App.css'
import { PanoramaViewer } from './components/PanoramaViewer'
import { SaaSDashboard } from './components/SaaSDashboard'
import { TourEditor } from './components/TourEditor'
import { loadWorkspace, saveWorkspace, updateTourInWorkspace } from './lib/saasStore'

function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace)
  const tour = workspace.tours.find((item) => item.id === workspace.activeTourId) ?? workspace.tours[0]
  const [activeSceneId, setActiveSceneId] = useState(tour.scenes[0].id)
  const activeScene = useMemo(() => tour.scenes.find((scene) => scene.id === activeSceneId) ?? tour.scenes[0], [activeSceneId, tour])

  useEffect(() => saveWorkspace(workspace), [workspace])
  useEffect(() => setActiveSceneId(tour.scenes[0].id), [tour.id])

  const setTour = (nextTour: typeof tour) => setWorkspace((current) => updateTourInWorkspace(current, nextTour))

  const navigate = (sceneId: string) => {
    if (tour.scenes.some((scene) => scene.id === sceneId)) setActiveSceneId(sceneId)
  }

  return (
    <main className="app-shell">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="brand-mark"><Cuboid /> AxisTour <span>SaaS Studio</span></div>
          <h1>Launch a spatial-tour SaaS from the browser.</h1>
          <p>
            AxisTour now wraps the 360° editor in a SaaS control plane: organization workspaces, plan limits, client tour vault,
            cloud-style asset management, public publishing URLs, lead capture, and auditable operations.
          </p>
          <div className="hero-actions">
            <a href="#saas" className="primary-cta">Open SaaS console <ChevronRight size={18}/></a>
            <a href="#studio" className="ghost-cta">Edit active tour</a>
          </div>
          <div className="metric-strip">
            <span><strong>{workspace.tours.length}</strong> client tours</span>
            <span><strong>{workspace.leads.length}</strong> captured leads</span>
            <span><strong>{workspace.organization.plan}</strong> plan</span>
          </div>
        </div>
        <div className="hero-card">
          <PanoramaViewer scene={activeScene} onNavigate={navigate} />
        </div>
      </section>

      <section className="capability-band" id="architecture">
        <article><Camera/><strong>360 capture ready</strong><span>Upload or paste panorama assets into a managed asset library per client tour.</span></article>
        <article><Map/><strong>Scene graph engine</strong><span>Rooms connect as navigable scan points with editable yaw/pitch placement.</span></article>
        <article><Database/><strong>SaaS workspace</strong><span>Multi-tour organization state, plan limits, leads, audit events, and exportable data.</span></article>
        <article><BadgeCheck/><strong>Public publishing</strong><span>Draft/published state, slugs, custom-domain-ready URLs, and iframe embed output.</span></article>
      </section>

      <SaaSDashboard workspace={workspace} setWorkspace={setWorkspace} />

      <section className="studio" id="studio">
        <div className="studio-stage">
          <div className="stage-topbar">
            <div><p className="eyebrow">Live public tour</p><h2>{tour.title}</h2></div>
            <div className="status-pill"><Sparkles size={16}/>{tour.status}</div>
          </div>
          <PanoramaViewer scene={activeScene} onNavigate={navigate} />
          <div className="filmstrip">
            {tour.scenes.map((scene) => <button key={scene.id} className={scene.id === activeScene.id ? 'active' : ''} onClick={() => setActiveSceneId(scene.id)}><img src={scene.panoramaUrl} alt=""/><span>{scene.name}</span></button>)}
          </div>
        </div>
        <TourEditor tour={tour} setTour={setTour} activeSceneId={activeScene.id} setActiveSceneId={setActiveSceneId} />
      </section>

      <section className="roadmap-panel">
        <Building2 />
        <div>
          <p className="eyebrow">Production path</p>
          <h2>Next: wire the generated backend contract into Supabase/Neon Postgres, R2/S3 object storage, Clerk/Auth.js, Stripe billing, and background image processing.</h2>
          <p>This sprint now gives AxisTour a backend cutover cockpit: API contracts, table manifest, object-storage queue, CRM webhook handoff, Stripe price metadata, and dry-run sync audit events.</p>
        </div>
      </section>
    </main>
  )
}

export default App
