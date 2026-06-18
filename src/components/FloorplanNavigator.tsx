import { MapPinned, Route, ShieldCheck } from 'lucide-react'
import type { Tour } from '../lib/types'
import { assessSpatialReadiness, scenesByFloor } from '../lib/spatialQuality'

export function FloorplanNavigator({ tour, activeSceneId, onSelectScene }: { tour: Tour; activeSceneId: string; onSelectScene: (sceneId: string) => void }) {
  const readiness = assessSpatialReadiness(tour)
  const floors = scenesByFloor(tour)
  const activeScene = tour.scenes.find((scene) => scene.id === activeSceneId) ?? tour.scenes[0]

  return (
    <section className="spatial-command">
      <div className="floorplan-card">
        <div className="section-heading">
          <span><MapPinned size={16}/> Spatial minimap</span>
          <b>{Object.keys(floors).length} floor{Object.keys(floors).length === 1 ? '' : 's'}</b>
        </div>
        <div className="floorplan-canvas" aria-label="Interactive tour floorplan minimap">
          <div className="floorplan-room floorplan-room--foyer">Entry</div>
          <div className="floorplan-room floorplan-room--living">Great Room</div>
          <div className="floorplan-room floorplan-room--kitchen">Kitchen</div>
          <svg viewBox="0 0 100 100" role="presentation">
            {activeScene.hotspots.filter((hotspot) => hotspot.type === 'navigation' && hotspot.targetSceneId).map((hotspot) => {
              const target = tour.scenes.find((scene) => scene.id === hotspot.targetSceneId)
              if (!target) return null
              return <line key={hotspot.id} x1={activeScene.floorplanX} y1={activeScene.floorplanY} x2={target.floorplanX} y2={target.floorplanY} />
            })}
          </svg>
          {tour.scenes.map((scene, index) => (
            <button
              key={scene.id}
              className={`floorplan-node ${scene.id === activeScene.id ? 'active' : ''}`}
              style={{ left: `${scene.floorplanX}%`, top: `${scene.floorplanY}%` }}
              onClick={() => onSelectScene(scene.id)}
              aria-label={`Open ${scene.name}`}
            >
              <span>{index + 1}</span>
              <small>{scene.name}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="quality-card">
        <div className="quality-score">
          <ShieldCheck />
          <span>Spatial readiness</span>
          <strong>{readiness.score}</strong>
          <b>{readiness.grade}</b>
        </div>
        <div className="quality-metrics">
          <span><Route size={15}/>{readiness.navigationLinks} nav links</span>
          <span>{readiness.leadHotspots} lead node{readiness.leadHotspots === 1 ? '' : 's'}</span>
          <span>{readiness.floorCount} mapped floor{readiness.floorCount === 1 ? '' : 's'}</span>
        </div>
        <div className="quality-list">
          {(readiness.blockers.length ? readiness.blockers : readiness.wins).slice(0, 3).map((item) => <p key={item}>{item}</p>)}
        </div>
      </div>
    </section>
  )
}
