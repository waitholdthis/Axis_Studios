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

export type ProofClaim = {
  id: string
  claim: string
  category: 'measurement' | 'finish' | 'natural-light' | 'flow' | 'accessibility' | 'upgrade'
  sceneIds: string[]
  confidence: number
  status: 'verified' | 'needs-review' | 'unsupported'
  note?: string
}

export type DealTwinScenario = {
  id: string
  stakeholder: 'buyer' | 'investor' | 'agent' | 'inspector' | 'lender' | 'builder'
  motivation: string
  decisionWeight: number
  targetSceneIds: string[]
  successSignal: string
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
  proofClaims?: ProofClaim[]
  dealTwinScenarios?: DealTwinScenario[]
  scenes: Scene[]
}
