# TrustBite — Project Specification

**Community-driven food adulteration risk intelligence**
Built for Tech Eximius 2026 (Track: Artificial Intelligence & Machine Learning)

---

## 1. What this is

TrustBite helps people in local/unorganized markets check whether a food item — currently scoped to **dairy and fruits/vegetables** — is likely safe before they buy or consume it. It does this honestly: no single photo can prove adulteration, so the app combines three weak signals into one useful one, and says so explicitly in the UI.

**Positioning line (use this language in UI copy and any judge-facing text):**
"A photo can't smell milk. But a photo, self-reported context, and what's happening nearby, combined, can tell a very different story."

---

## 2. Core architecture — three signal layers

### Layer 1: Visual + sensory screening (per scan)
- User photographs an item (milk, curd, paneer, or a fruit/vegetable).
- A vision-capable LLM API does a first visual pass (color, visible curdling/separation for dairy; spotting, discoloration, texture irregularities for produce).
- App asks 2-3 quick tap-to-answer follow-up questions, **different per category**:
  - **Dairy:** Does it smell sour/off? (yes/no/unsure) — Does it curdle or look lumpy already? (yes/no) — Time since purchase (dropdown).
  - **Produce:** Any visible mold or dark spotting? (yes/no) — Does texture feel unusually soft/mushy or waxy? (yes/no) — Time since purchase (dropdown).
- Backend combines visual AI read + questionnaire answers into one prompt/scoring step → returns a risk level (Low / Caution / High) with a one-line reasoning string.
- Every result screen explicitly states: "Screening aid — not a lab-grade test."

### Layer 2: Community report aggregation
- Every scan (and any manual report) is stored with: locality/area tag, optional vendor name, timestamp, risk level.
- Reports are geo-clustered by area (locality-level, not precise GPS — privacy-friendly).
- Result screen shows: "X reports near you in the last 7 days" — this number should visibly influence displayed confidence (e.g. 1-2 reports = "early signal", 20+ = "strong local pattern").
- Live map view (Leaflet + OpenStreetMap) shows hotspot density by area.

### Layer 3: Public context cross-reference
- Backend does a locality-filtered search (news/recall keyword search) for recent food-safety incidents in the user's area.
- Framed as "cross-referencing your locality against publicly reported food safety incidents" — never claim this is AI-detected, it's search + relevance filtering.

**Why three layers matters (keep this reasoning available for judge Q&A):** any single layer alone is either technically weak (a photo can't prove adulteration) or easily dismissed as "just calling an API." The aggregation and cross-referencing layers are where the real systems-engineering work is — pattern detection across many weak signals, not one clever prompt.

---

## 3. Scope for the 24h build

**In scope:** Dairy (milk, curd, paneer) and fruits/vegetables only.
**Out of scope for demo (mention only in roadmap):** grains, spices, packaged goods, multi-language support, SMS/IVR reporting, municipal dashboard.

---

## 4. Feature list

### Core (must work for the demo)
1. Photo upload for a dairy or produce item
2. AI visual pass on the photo
3. Category-specific sensory questionnaire (2-3 quick tap questions)
4. Combined risk result screen (visual + questionnaire merged, labeled as screening aid)
5. Locality-level geo-tagging of every scan
6. Report storage (risk level, locality, optional vendor name, timestamp)
7. Nearby-report count shown on result screen
8. Live map view of report hotspots by area
9. Optional vendor tagging field on scan/report
10. Locality-based public news/recall cross-reference (simple keyword search API call is sufficient for demo)

### Supporting UX (needed, simple to build)
11. Onboarding/explainer (1-2 screens, states the honesty framing up front)
12. Login: name + area only (no email/password/full auth)
13. Manual report flow (report an issue without photo — text + location only)
14. Scan history (user's own past scans, simple list)

### Roadmap only — do not build, mention as future scope
15. Multi-category support (grains, spices, packaged goods)
16. Municipal/authority dashboard for verified hotspot routing
17. SMS/IVR reporting channel
18. Regional language support
19. Push notifications for new reports in saved localities

---

## 5. Screens (7 total)

1. **Onboarding / explainer** — 1-2 screens. States what the app does and the "screening aid, not lab verdict" honesty framing before any interaction.
2. **Login** — name + area fields only. See Section 7 for the animated concept.
3. **Home / scan entry point** — category selector (dairy vs. produce), prominent "scan an item" CTA, compact map preview.
4. **Scan flow** — photo capture/upload → category-specific questionnaire. Can be one screen with steps or two screens.
5. **Result screen** — risk level (Low/Caution/High), one-line AI reasoning, nearby-report count, mini map preview, "screening aid" disclaimer, option to file a manual report.
6. **Map tab** — full hotspot view, filterable by category (dairy/produce) and time window (7/30 days).
7. **History** — list of the user's own past scans with date, category, and result.

---

## 6. Design system

### Color palette (locked)

| Role | Hex | Usage |
|---|---|---|
| Page background | `#E7F0E5` | Light pastel green, all screens |
| Card/surface | `#FFFFFF` | Cards floating on the green background |
| Primary text/buttons | `#1F3D2A` | Deep forest green — headings, primary buttons, nav |
| Success/safe state | `#4E8362` | "Low risk" results, positive indicators |
| Caution state | `#D9A441` | Amber — "Caution" risk level only |
| Danger/high-risk state | `#C4705F` | Coral-red — "High risk" results only, never decorative |
| Secondary text | `#5F6E5F` | Labels, muted supporting text |
| Card border | `#D3E2CE` | Subtle hairline borders on white cards |

**Rule:** amber and coral are reserved strictly for risk-level indicators. Never use them decoratively elsewhere in the UI — this keeps their meaning unambiguous.

### Typography

| Use | Typeface | Notes |
|---|---|---|
| Headings / brand wordmark | General Sans or Switzer (Fontshare, free) | Geometric, warmer than Inter, avoids generic "AI-tool" grotesk look |
| Body / UI text | Inter or IBM Plex Sans | Legible at small sizes |
| Data (report counts, timestamps, risk %) | IBM Plex Mono | Gives scan results a slightly technical, trustworthy feel |

Avoid: Poppins, Nunito, and other rounded-geometric fonts overused in AI-generated/templated UIs.

### Component notes
- Cards: white background, `border-radius: 12px`, `0.5px solid #D3E2CE` border, generous padding.
- Buttons: primary action uses `#1F3D2A` background with light text; keep to one primary button per screen.
- Risk level display: always pair color with a text label (Low risk / Caution / High risk) — never rely on color alone.
- No gradients, no drop shadows, no glow effects — flat surfaces throughout, consistent with the "honest, not hyped" brand positioning.

---

## 7. Login screen — real-photo slideshow concept

**Layout:** full-bleed background slideshow of real photography (market stalls, fresh produce, dairy, hands selecting food) with a dark gradient overlay for text legibility, and the login content anchored to the bottom of the screen.

**Behavior:**
1. 3-4 real photos cross-fade every ~3 seconds, looping continuously (each photo visible ~2.5s, ~0.5s crossfade).
2. A gradient overlay (dark at bottom fading to near-transparent at top, e.g. `rgba(20,40,26,0.75)` to `rgba(20,40,26,0.05)`) sits over the photos so white text stays readable regardless of which photo is showing.
3. "TrustBite" wordmark (white) and tagline ("One photo protects a neighborhood, not just one buyer.") sit near the bottom, on top of the overlay.
4. A slide-to-login control — a draggable pill/thumb the user slides to log in (rather than a standard tap button) — sits below the tagline, styled with a translucent white track so it reads against any photo underneath.

**Implementation notes for the IDE:**
- Use plain CSS `@keyframes` for the crossfade: stack 3-4 `<img>` or `background-image` divs absolutely positioned within the same container, each with a staggered `animation-delay` (0s, 3s, 6s, ...) cycling opacity 1 → 0 on a shared duration (e.g. 9-12s total loop for 3-4 photos).
- Source real photos from Unsplash (unsplash.com) or Pexels (pexels.com) — search terms: "indian market vendor," "fresh vegetables," "dairy farm," "local grocery." Prefer warm, authentic shots (people, hands, real stalls) over staged studio product photography — this is what keeps the screen feeling authentic rather than stock-generic. Free to use, no attribution required on both sites.
- Keep photo file sizes reasonable (compress/resize to roughly the login screen's display dimensions) since this loads on first screen the user sees — a slow-loading login slideshow is a bad first impression.
- Slide-to-login: implement with `onPointerDown` / `onPointerMove` / `onPointerUp` handlers tracking horizontal drag distance against the track width; on release past ~85% of track width, snap to end, update label to "Logged in," and proceed to the name/area form or home screen.
- Respect `prefers-reduced-motion`: freeze on the first photo and skip the crossfade loop for users with this preference set.

---

## 8. Tech stack

| Layer | Tools |
|---|---|
| Frontend | React + Tailwind CSS |
| AI / Vision | Vision-capable LLM API (few-shot prompted per category) — no custom model training |
| Backend | Node.js / Express REST API |
| Database | PostgreSQL with PostGIS (geo-tagged reports) — or Firebase if faster to stand up in 24h |
| Map / Visualization | Leaflet.js + OpenStreetMap tiles (free, no API key required) |
| Hosting | Vercel (frontend) + Railway or Render (backend) |

---

## 9. Suggested project folder structure

```
trustbite/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── lottie/            # animation JSON files, if used
│   │   ├── components/
│   │   │   ├── ScanCapture.jsx
│   │   │   ├── Questionnaire.jsx
│   │   │   ├── RiskResultCard.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── SlideToLogin.jsx
│   │   │   └── ReportForm.jsx
│   │   ├── screens/
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── ScanFlow.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── MapTab.jsx
│   │   │   └── History.jsx
│   │   ├── styles/
│   │   │   └── tokens.css         # color/typography variables from Section 6
│   │   ├── api/
│   │   │   └── client.js          # fetch wrappers for backend endpoints
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── scan.js            # POST /scan — accepts photo + questionnaire, returns risk result
│   │   │   ├── reports.js         # GET /reports?area=X — aggregated nearby reports
│   │   │   ├── map.js             # GET /map/hotspots — geo-clustered data for map view
│   │   │   └── context.js         # GET /context?area=X — public news/recall cross-reference
│   │   ├── services/
│   │   │   ├── visionAI.js        # LLM vision API calls
│   │   │   ├── aggregation.js     # report clustering/scoring logic
│   │   │   └── newsSearch.js      # locality-filtered search
│   │   ├── db/
│   │   │   └── schema.sql
│   │   └── server.js
│   └── package.json
└── README.md
```

---

## 10. Minimal data model

**reports table:**
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| category | enum | dairy / produce |
| item_name | text | e.g. "milk", "tomato" |
| risk_level | enum | low / caution / high |
| ai_reasoning | text | one-line explanation from Layer 1 |
| locality | text | area/locality name, not precise address |
| vendor_name | text, nullable | optional |
| lat / lng | float, nullable | for map clustering, locality-level precision only |
| created_at | timestamp | |
| user_id | uuid, nullable | tied to name+area login, not full auth |

---

## 11. Build priority order for 24h

1. Core scan flow: photo upload → AI vision call → questionnaire → combined result display
2. Database + report storage
3. Nearby-report count logic + basic aggregation
4. Map integration (start with mock data, layer in live data)
5. Login (name + area) and onboarding screens
6. Login screen animation polish
7. History screen
8. Public context cross-reference (lowest priority — nice-to-have if time remains)

---

## 12. Honesty framing — keep consistent everywhere

Every place the app shows an AI-derived result, it should be visually and textually clear this is a **screening aid**, not a lab-grade verdict. This is the project's core differentiator and should never be diluted in UI copy, marketing language, or judge-facing materials.