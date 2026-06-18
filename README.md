# AxisTour — Matterport-Inspired Spatial Tour MVP

A legally distinct 3D/360 virtual-tour platform prototype built with Vite, React, Three.js, and local-first persistence.

## What works now

- Cinematic landing page and live tour viewer.
- Three.js equirectangular 360 panorama sphere.
- Spatial minimap/floorplan scan-point navigation.
- Spatial readiness scoring for tour depth, map coverage, lead capture, and navigation graph quality.
- Measurement intelligence with room-level square footage, ceiling-height metadata, coverage scoring, and total property area.
- Guided routes for buyer, leasing, operations, and accessibility narratives.
- Conversion analytics and buyer-intent scoring from views, dwell time, scene entries, share opens, and lead actions.
- Axis Proof Layer: scene-backed listing claims, trust scoring, audit fingerprints, and buyer objection analysis for verifiable due diligence.
- Axis Deal Twin: stakeholder simulations, close-probability modeling, offer paths, friction radar, and scene evidence maps that rehearse the transaction before the showing.
- Clickable navigation, info, media, and lead hotspots.
- Browser-based studio/editor.
- Add scenes, hotspots, floorplan coordinates, and scan-quality metadata.
- Client review links and scene-anchored approval comments.
- Edit scene metadata, panorama URL/data URI, hotspot labels, yaw, pitch, body, and navigation target.
- Auto-save to `localStorage`.
- Export/import portable JSON tour packages.
- Draft/published state and iframe embed generator.
- Seeded demo residence with three connected scan points.
- Backend cutover cockpit with API contracts, Postgres/storage schema manifest, CRM webhook fields, and Stripe price metadata.
- Enterprise export contracts for guided routes, analytics events, measurement fields, proof claims, proof packets, deal twin scenarios, close simulation reports, and spatial intelligence reports.

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

## Production roadmap

1. Auth and organization workspaces.
2. Cloud object storage for 360 images/video/assets.
3. Server-side tour publishing and public slugs.
4. Floorplan upload + minimap calibration.
5. Backend analytics dashboards, attribution reports, and CRM automations.
6. Mobile capture flow for Ricoh/Insta360/iPhone panoramas.
7. GLB/Gaussian-splat/mesh mode for dollhouse-style digital twins.

## Legal/product note

This is not a Matterport clone and does not copy Matterport branding, proprietary capture pipelines, or proprietary UI. It recreates the broad product category with an original implementation and identity.
