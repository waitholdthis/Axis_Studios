export type HotspotType = 'navigation' | 'info' | 'media' | 'lead'

export type Hotspot = {
  id: string
  type: HotspotType
  label: string
  yaw: number
  pitch: number
  targetSceneId?: string
  body?: string
  url?: string
}

export type Scene = {
  id: string
  name: string
  floor: string
  panoramaUrl: string
  initialYaw: number
  initialPitch: number
  floorplanX: number
  floorplanY: number
  scanQuality?: 'excellent' | 'good' | 'needs-attention'
  squareFeet?: number
  ceilingHeightFt?: number
  hotspots: Hotspot[]
}

export type GuidedRoute = {
  id: string
  name: string
  sceneIds: string[]
  intent: 'buyer' | 'leasing' | 'operations' | 'accessibility'
}

export type Tour = {
  id: string
  title: string
  slug: string
  client: string
  status: 'draft' | 'published'
  brandColor: string
  createdAt: string
  shareToken?: string
  propertyType?: 'residential' | 'commercial' | 'hospitality' | 'construction' | 'venue'
  totalSquareFeet?: number
  guidedRoutes?: GuidedRoute[]
  scenes: Scene[]
}
