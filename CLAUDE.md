# Substrata — Project Context for Claude Code

## What This Is
Substrata (substrata.be) is a psychometrically grounded personality profiling platform that optionally becomes a dating layer. It is NOT marketed as a dating app. Framed as a "personality digital print" — a self-knowledge instrument built on validated academic frameworks. The name refers to the geological layers beneath the surface: parts of a person not yet discovered, even by themselves.

## Current Status (as of June 2026)
- **Design phase complete** — all major product decisions made
- **Brand decided** — Substrata, domain substrata.be purchased (pending DNS Belgium verification)
- **Ready to build** — Phase 0 starts next session
- **No code written yet**

## Tech Stack
Follows the multi-app-shared-infra pattern at `c:\Users\hect0\OneDrive\Projects\multi-app-shared-infra\`
- Next.js 14 App Router
- Supabase (schema: `substrata`)
- Vercel (deployment)
- Cloudflare R2 (media storage)
- Resend (email)
- Anthropic Claude API (insight reports, feedback synthesis, compatibility analysis)

## Work Plan
- **Phase 0** — Register in app-registry.md, design Supabase schema, scaffold from starter-template
- **Phase 1** — Test engine (270-question bank, CAT algorithm, 8 sections, confidence score)
- **Phase 2** — Insight reports (Claude API integration, session reports via Resend)
- **Phase 3** — Public profiles, UID sharing, bookmark mechanic, access tiers
- **Phase 4** — Community layer (capped insight windows, topic forums, resonance signal)
- **Phase 5** — Dating layer (mutual bookmark matching, gradual revelation, exit interviews)
- **Phase 6** — Revenue (Stripe subscriptions, paid full reports, Dark Triad gating)

## Key Design Decisions
- 8 psychometric sections: Big Five/HEXACO, Attachment (ECR-R), Conflict/Gottman, Values/Schwartz, Emotional Intelligence, Life Architecture, Physical/Health, Moral Foundations/Haidt
- 270-question bank (3 parallel versions × 30 questions × 8 sections = 90 questions per version)
- 10–25 questions per session maximum — daily habit model
- Confidence score system (50% → share UID, 65% → community, 80% → dating layer, 90% → full matching)
- No photos — silhouette + written description + live video as truth-telling reveal
- Dark Triad screening (SD3) embedded invisibly — high scorers quietly restricted
- Capped insight windows (20–50 person cohorts, not broadcast)
- Mutual bookmark required to enter match/chat
- Post-interaction exit interview (simultaneous blind submission, Airbnb model)
- AI insight reports: claude-sonnet-4-6 for sessions 1–3, claude-haiku-4-5 after

## Files in This Repo
- `substrata-brand-guide.md` — full brand guide (colors, typography, voice, taglines)
- `Resources/about-us-draft.md` — About Us draft with science citations needed

## AI Cost Profile (at 10K users)
~$215/month total — negligible against revenue. Prompt caching will reduce by 40–60% at scale.

## Legal Notes
- USPTO Classes 042 and 045 clear — file trademark before launch
- Need legal review before launch: psychological data collection, adult introductions, mental health adjacency
- Psychologist involvement needed for question writing and insight generation logic

## Shared Infrastructure
Read `c:\Users\hect0\OneDrive\Projects\multi-app-shared-infra\` before writing any code:
- `README.md` — overview
- `architecture.md` — Supabase schema strategy
- `new-app-playbook.md` — step-by-step for new apps
- `starter-template.md` — Next.js 14 scaffold to generate from
- `app-registry.md` — register substrata here (schema: `substrata`) before building
