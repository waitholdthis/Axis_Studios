import type { Tour } from './types'

const svgPanorama = (a: string, b: string, accent: string, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".48" stop-color="${b}"/><stop offset="1" stop-color="#080b12"/></linearGradient><radialGradient id="glow" cx="50%" cy="42%" r="45%"><stop offset="0" stop-color="${accent}" stop-opacity=".7"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><pattern id="grid" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M96 0H0V96" fill="none" stroke="white" stroke-opacity=".06" stroke-width="2"/></pattern></defs><rect width="2048" height="1024" fill="url(#sky)"/><rect width="2048" height="1024" fill="url(#glow)"/><rect y="560" width="2048" height="464" fill="url(#grid)"/><path d="M0 640 C320 540 560 760 820 650 S1290 520 1600 650 1880 790 2048 620 V1024 H0Z" fill="#0b1020" opacity=".78"/><path d="M0 760 C390 680 640 850 980 740 S1540 660 2048 790" fill="none" stroke="${accent}" stroke-opacity=".55" stroke-width="5"/><g font-family="Inter,Arial" text-anchor="middle"><text x="1024" y="470" fill="white" font-size="82" font-weight="800" opacity=".92">${label}</text><text x="1024" y="535" fill="white" font-size="28" opacity=".62">equirectangular demo panorama • replace with 360 imagery</text></g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const demoTour: Tour = {
  id: 'tour_demo_axis',
  title: 'AxisTour Demo Residence',
  slug: 'axis-demo-residence',
  client: 'Tootie Spatial Labs',
  status: 'published',
  brandColor: '#7cf7ff',
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  scenes: [
    {
      id: 'foyer',
      name: 'Glass Foyer',
      floor: 'Level 1',
      panoramaUrl: svgPanorama('#13213f', '#253a70', '#7cf7ff', 'Glass Foyer'),
      initialYaw: 0,
      initialPitch: 0,
      hotspots: [
        { id: 'h1', type: 'navigation', label: 'Enter Great Room', yaw: 22, pitch: -6, targetSceneId: 'great-room' },
        { id: 'h2', type: 'info', label: 'Smart access wall', yaw: -52, pitch: 5, body: 'Add agent notes, inspection details, listing copy, or client-facing proof here.' },
      ],
    },
    {
      id: 'great-room',
      name: 'Great Room',
      floor: 'Level 1',
      panoramaUrl: svgPanorama('#19142f', '#46306f', '#ff7ad9', 'Great Room'),
      initialYaw: 15,
      initialPitch: 0,
      hotspots: [
        { id: 'h3', type: 'navigation', label: 'Back to Foyer', yaw: -145, pitch: -5, targetSceneId: 'foyer' },
        { id: 'h4', type: 'navigation', label: 'Kitchen', yaw: 74, pitch: -3, targetSceneId: 'kitchen' },
        { id: 'h5', type: 'lead', label: 'Request Private Showing', yaw: 5, pitch: 14, body: 'Lead capture hooks are ready for CRM or email integration.' },
      ],
    },
    {
      id: 'kitchen',
      name: 'Chef Kitchen',
      floor: 'Level 1',
      panoramaUrl: svgPanorama('#10241e', '#1f5f57', '#b6ff6a', 'Chef Kitchen'),
      initialYaw: -10,
      initialPitch: 0,
      hotspots: [
        { id: 'h6', type: 'navigation', label: 'Great Room', yaw: -92, pitch: -5, targetSceneId: 'great-room' },
        { id: 'h7', type: 'media', label: 'Appliance Package', yaw: 44, pitch: 10, body: 'Attach walkthrough videos, seller docs, spec sheets, or warranty files.', url: 'https://example.com/spec-sheet' },
      ],
    },
  ],
}
