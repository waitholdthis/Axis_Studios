import type { Tour } from './types'

export type SubscriptionPlan = 'starter' | 'studio' | 'enterprise'

export type UserAccount = {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

export type Organization = {
  id: string
  name: string
  plan: SubscriptionPlan
  seatsUsed: number
  seatsLimit: number
  storageLimitMb: number
  monthlyTourLimit: number
  customDomain?: string
}

export type Asset = {
  id: string
  tourId: string
  name: string
  type: 'panorama' | 'floorplan' | 'document' | 'video'
  url: string
  sizeMb: number
  createdAt: string
}

export type Lead = {
  id: string
  tourId: string
  tourTitle: string
  name: string
  email: string
  phone?: string
  message: string
  source: 'hotspot' | 'embed' | 'public-tour'
  createdAt: string
  status: 'new' | 'contacted' | 'won' | 'archived'
}

export type AuditEvent = {
  id: string
  actor: string
  action: string
  detail: string
  createdAt: string
}

export type SaaSWorkspace = {
  account: UserAccount
  organization: Organization
  activeTourId: string
  tours: Tour[]
  assets: Asset[]
  leads: Lead[]
  auditLog: AuditEvent[]
}
