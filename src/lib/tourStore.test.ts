import { describe, expect, it } from 'vitest'
import { addHotspot, addScene, compileEmbed, validateTour } from './tourStore'
import { demoTour } from './demoTour'

describe('tour workspace engine', () => {
  it('validates the seeded demo scene graph', () => {
    expect(validateTour(demoTour).scenes).toHaveLength(3)
  })

  it('rejects navigation hotspots pointing to missing scenes', () => {
    const broken = structuredClone(demoTour)
    broken.scenes[0].hotspots[0].targetSceneId = 'missing-room'
    expect(() => validateTour(broken)).toThrow(/missing scene/)
  })

  it('adds scenes and hotspots without mutating the original tour', () => {
    const withScene = addScene(demoTour, 'Garage')
    expect(withScene.scenes).toHaveLength(demoTour.scenes.length + 1)
    expect(demoTour.scenes.some((scene) => scene.name === 'Garage')).toBe(false)
    const withHotspot = addHotspot(withScene, withScene.scenes[0].id, 'info', 'Inspection note')
    expect(withHotspot.scenes[0].hotspots.at(-1)?.label).toBe('Inspection note')
  })

  it('compiles a shareable iframe embed', () => {
    expect(compileEmbed(demoTour)).toContain(`/tour/${demoTour.slug}`)
    expect(compileEmbed(demoTour)).toContain('iframe')
  })
})
