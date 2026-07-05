# API contracts

The web app exposes a small set of server routes. The Flutter app calls the same
`/api/reports` endpoint so routing + AI triage stay server-side. Direct reads
(reports, categories, zones, institutions) go through Supabase REST/SDK with RLS.

Auth: send the Supabase access token as `Authorization: Bearer <token>` for
authenticated routes (the web client sends it via cookies automatically).

## POST /api/reports

Create a report. Runs zone + institution routing and best-effort Gemini image analysis.

Request:

```json
{
  "title": "Large pothole on Main St",
  "description": "Deep pothole near the crosswalk",
  "category": "pothole",
  "latitude": 40.7328,
  "longitude": -73.9911,
  "address_text": "Main St & 3rd",
  "image_url": "https://<project>.supabase.co/storage/v1/object/public/report-images/..."
}
```

Response: `{ "id": "<uuid>" }`

Behavior:
- Resolves `zone_id` by bounding box, then `assigned_institution_id` by category + zone.
- Sets status `assigned` or `unassigned`.
- If an image + `GEMINI_API_KEY` exist, fills `ai_category_suggestion`, `ai_priority_suggestion`, `ai_confidence`, `ai_reason`, and adopts the AI priority. On failure, `ai_status = failed`.

## POST /api/ai/analyze

Re-run image analysis for an existing report. Body: `{ "report_id": "<uuid>" }`.
Requires an authenticated user and a report with an image. Returns `{ ok, analysis }`.

## POST /api/ai/chat

Institution-only. Answers a question using ONLY reports assigned to the caller's
institution (scoped before the model sees anything).

Request: `{ "question": "Show open high-priority reports" }`

Response:

```json
{ "answer": "…", "referencedReportIds": ["<uuid>", "…"] }
```

## POST /api/institution/apply

Authenticated. Submits an institution application; rejects consumer email domains.
Body: `{ institution_name, official_email, category_coverage[], zone_coverage[] }`.

## POST /api/admin/applications/[id]

Admin-only. Body: `{ "action": "approve" | "reject" }`. Approving creates the
institution and links the applicant.

## Direct Supabase reads (mobile + web)

- `GET reports?select=*&order=created_at.desc` — public list.
- `GET categories`, `GET zones`, `GET institutions` — reference data.
- `INSERT report_supports { report_id, civilian_user_id }` — one per user (PK enforced).
