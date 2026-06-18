# AxisTour Production Sprints

AxisTour is being hardened against the baseline set by serious spatial-tour companies: Matterport-style spatial context, Kuula-style browser simplicity, CloudPano-style lead capture, client review workflows, and a backend-ready SaaS operating layer.

## Sprint 1 — Spatial Navigation and Quality

Shipped:
- Floorplan/minimap coordinates on every scene.
- Interactive minimap selector in the public tour stage.
- Navigation-line rendering from the active scan point to linked scenes.
- Spatial readiness scoring for scan depth, map coverage, lead capture, and navigation graph completeness.
- Scene inspector controls for floorplan X/Y and scan quality.

Why it matters:
A real spatial company does not feel like an image carousel. Visitors need room-to-room orientation, mapped scan points, and confidence that the tour is production-ready.

## Sprint 2 — Client Collaboration and Approval

Shipped:
- Expiring review/share links in the SaaS workspace model.
- Scene-anchored review comments with open/resolved states.
- Client review room in the SaaS console.
- Audit events for share-link creation, review-comment creation, and resolution.

Why it matters:
Spatial-tour businesses win by closing revision loops fast with agents, property managers, venue owners, builders, and marketing teams.

## Sprint 3 — Backend and Deployment Hardening

Shipped:
- Backend manifest now includes floorplan coordinates, scan quality, review comments, and share links.
- Backend sync warnings now include open client reviews and missing share links.
- Test coverage added for spatial quality and backend-ready collaboration schema.

Next backend implementation targets:
- Supabase/Neon Postgres schema from the generated manifest.
- Object storage migration for panorama and floorplan assets.
- Auth.js/Clerk organization membership and role enforcement.
- Stripe checkout and subscription portal.
- CRM/email webhook delivery for leads and review events.
- Public slug router and review-token router.

## Sprint 4 — Spatial Intelligence and Market Differentiation

Shipped:
- Room-level measurement metadata for square footage and ceiling height.
- Measurement coverage scoring that compares measured room totals against listed property area.
- Guided route contracts for buyer, leasing, operations, and accessibility walkthroughs.
- Conversion analytics events for views, scene entries, share opens, lead opens, and lead submissions.
- Buyer-intent scoring and hottest-scene detection.
- A new spatial intelligence UI panel that packages measurements, guided routes, analytics, and competitive readiness in one market-facing cockpit.
- Backend manifest expansion for `guided_routes`, `analytics_events`, measurement fields, and `/api/tours/:id/intelligence`.

Why it matters:
Top spatial platforms do more than display 360 imagery. They make tours operational: measurable, narratable, attributable, and exportable for enterprise buyers.

## Sprint 5 — Axis Proof Layer

Shipped:
- Scene-backed proof claims that turn listing language into verifiable tour evidence.
- A trust score combining claim confidence, evidence coverage, measurement coverage, guided routes, and unsupported-claim risk.
- Audit fingerprints for proof packets so buyer-facing claims can be exported as durable due-diligence artifacts.
- Buyer objection analysis that calls out measurement gaps, unsupported claims, and reviewer-gated accessibility language before a deal room goes live.
- A new Axis Proof Layer UI panel that surfaces the claim ledger, objection engine, trust score, and exportable packet identity.
- Backend manifest expansion for `proof_claims`, `proof_packets`, `/api/tours/:id/proof-packet`, and `/api/tours/:id/proof-claims`.

Why it matters:
Most spatial-tour competitors sell prettier walkthroughs. AxisTour can sell trust: every important promise is attached to evidence, risk, and a packet a buyer, broker, builder, insurer, or enterprise client can review.

## Competitive Product Standard

AxisTour now needs every future sprint to preserve these minimum bars:
- Every tour must include spatial context, not just panoramas.
- Every public tour must have a conversion path.
- Every client handoff must have review links, comments, and audit history.
- Every backend feature must have a local-first fallback and an API-ready contract.
- Every production move must pass tests, build, browser smoke, secret scan, and GitHub push.
