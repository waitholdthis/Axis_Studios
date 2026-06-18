# AxisTour — Matterport-Inspired Spatial Tour MVP

A legally distinct 3D/360 virtual-tour platform prototype built with Vite, React, Three.js, and local-first persistence.

## What works now

- Cinematic landing page and live tour viewer.
- Three.js equirectangular 360 panorama sphere.
- Clickable navigation, info, media, and lead hotspots.
- Browser-based studio/editor.
- Add scenes and hotspots.
- Edit scene metadata, panorama URL/data URI, hotspot labels, yaw, pitch, body, and navigation target.
- Auto-save to `localStorage`.
- Export/import portable JSON tour packages.
- Draft/published state and iframe embed generator.
- Seeded demo residence with three connected scan points.

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
5. Lead capture integration.
6. Mobile capture flow for Ricoh/Insta360/iPhone panoramas.
7. GLB/Gaussian-splat/mesh mode for dollhouse-style digital twins.

## Legal/product note

This is not a Matterport clone and does not copy Matterport branding, proprietary capture pipelines, or proprietary UI. It recreates the broad product category with an original implementation and identity.
