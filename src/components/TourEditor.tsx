import { Copy, Download, FileUp, Plus, RotateCcw, Save, Share2, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { HotspotType, Tour } from '../lib/types'
import { addHotspot, addScene, compileEmbed, resetTour, saveTour, updateHotspot, validateTour } from '../lib/tourStore'

export function TourEditor({ tour, setTour, activeSceneId, setActiveSceneId }: { tour: Tour; setTour: (tour: Tour) => void; activeSceneId: string; setActiveSceneId: (id: string) => void }) {
  const active = tour.scenes.find((scene) => scene.id === activeSceneId) ?? tour.scenes[0]
  const updateTour = (next: Tour) => {
    setTour(next)
    saveTour(next)
  }
  const importTour = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const json = JSON.parse(await file.text())
    const next = validateTour(json)
    updateTour(next)
    setActiveSceneId(next.scenes[0].id)
  }
  const exportTour = () => {
    const blob = new Blob([JSON.stringify(tour, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${tour.slug || 'tour'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const copyEmbed = async () => navigator.clipboard?.writeText(compileEmbed(tour))
  return (
    <aside className="studio-panel">
      <div className="panel-section">
        <p className="eyebrow">Tour command center</p>
        <input className="title-input" value={tour.title} onChange={(e) => updateTour({ ...tour, title: e.target.value })} />
        <div className="field-grid">
          <label>Slug<input value={tour.slug} onChange={(e) => updateTour({ ...tour, slug: e.target.value })} /></label>
          <label>Client<input value={tour.client} onChange={(e) => updateTour({ ...tour, client: e.target.value })} /></label>
        </div>
        <div className="button-row">
          <button onClick={() => updateTour({ ...tour, status: tour.status === 'published' ? 'draft' : 'published' })}><Share2 size={16}/>{tour.status}</button>
          <button onClick={() => { saveTour(tour); }}><Save size={16}/>Save</button>
          <button onClick={copyEmbed}><Copy size={16}/>Embed</button>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-heading"><span>Scan points</span><button onClick={() => { const next = addScene(tour); updateTour(next); setActiveSceneId(next.scenes.at(-1)!.id) }}><Plus size={16}/>Scene</button></div>
        <div className="scene-list">
          {tour.scenes.map((scene) => <button className={scene.id === active.id ? 'active' : ''} key={scene.id} onClick={() => setActiveSceneId(scene.id)}><span>{scene.name}</span><small>{scene.hotspots.length} nodes</small></button>)}
        </div>
      </div>

      <div className="panel-section">
        <p className="eyebrow">Scene inspector</p>
        <label>Name<input value={active.name} onChange={(e) => updateTour({ ...tour, scenes: tour.scenes.map(s => s.id === active.id ? { ...s, name: e.target.value } : s) })}/></label>
        <label>Floor<input value={active.floor} onChange={(e) => updateTour({ ...tour, scenes: tour.scenes.map(s => s.id === active.id ? { ...s, floor: e.target.value } : s) })}/></label>
        <label>Panorama URL / data URI<textarea rows={3} value={active.panoramaUrl} onChange={(e) => updateTour({ ...tour, scenes: tour.scenes.map(s => s.id === active.id ? { ...s, panoramaUrl: e.target.value } : s) })}/></label>
      </div>

      <div className="panel-section">
        <div className="section-heading"><span>Hotspots</span><select onChange={(e) => { const type = e.target.value as HotspotType; if(type) updateTour(addHotspot(tour, active.id, type, type === 'navigation' ? 'Move here' : 'New annotation', tour.scenes.find(s => s.id !== active.id)?.id)); e.currentTarget.value='' }}><option value="">Add...</option><option value="navigation">Navigation</option><option value="info">Info</option><option value="media">Media</option><option value="lead">Lead</option></select></div>
        <div className="hotspot-list">
          {active.hotspots.map((h) => <div className="hotspot-editor" key={h.id}>
            <input value={h.label} onChange={(e) => updateTour(updateHotspot(tour, active.id, h.id, { label: e.target.value }))}/>
            <div className="range-row"><span>Yaw</span><input type="range" min="-180" max="180" value={h.yaw} onChange={(e) => updateTour(updateHotspot(tour, active.id, h.id, { yaw: Number(e.target.value) }))}/><b>{h.yaw}°</b></div>
            <div className="range-row"><span>Pitch</span><input type="range" min="-60" max="60" value={h.pitch} onChange={(e) => updateTour(updateHotspot(tour, active.id, h.id, { pitch: Number(e.target.value) }))}/><b>{h.pitch}°</b></div>
            {h.type === 'navigation' && <select value={h.targetSceneId} onChange={(e) => updateTour(updateHotspot(tour, active.id, h.id, { targetSceneId: e.target.value }))}>{tour.scenes.filter(s => s.id !== active.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
            {h.type !== 'navigation' && <textarea rows={2} value={h.body ?? ''} onChange={(e) => updateTour(updateHotspot(tour, active.id, h.id, { body: e.target.value }))}/>} 
            <button className="danger" onClick={() => updateTour({ ...tour, scenes: tour.scenes.map(s => s.id === active.id ? { ...s, hotspots: s.hotspots.filter(x => x.id !== h.id) } : s) })}><Trash2 size={14}/>Remove</button>
          </div>)}
        </div>
      </div>

      <div className="panel-section button-row wrap">
        <button onClick={exportTour}><Download size={16}/>Export JSON</button>
        <label className="file-button"><FileUp size={16}/>Import JSON<input type="file" accept="application/json" onChange={importTour}/></label>
        <button onClick={() => { const next = resetTour(); setTour(next); setActiveSceneId(next.scenes[0].id) }}><RotateCcw size={16}/>Reset demo</button>
      </div>
    </aside>
  )
}
