# n8n automation

One lightweight automation for the MVP: notify a shared channel when an institution
application is submitted or a new report is created. Core product logic stays in the
app/database — n8n only handles the notification side effect.

## How the app calls it

If `N8N_WEBHOOK_URL` is set in the web app env, these routes POST a JSON payload
(fire-and-forget; failures never block the user):

- On institution application (`/api/institution/apply`):

  ```json
  { "type": "institution_application", "institution_name": "…", "official_email": "…" }
  ```

- On new report (`/api/reports`):

  ```json
  { "type": "new_report", "report_id": "…", "title": "…", "category": "…", "assigned_institution_id": "…" }
  ```

## Building the workflow

1. In n8n, add a **Webhook** node (POST). Copy its production URL into
   `N8N_WEBHOOK_URL` in the web app env.
2. Add an **IF/Switch** node on `{{$json.type}}` to branch application vs report.
3. Add a notification node:
   - **Email** (SMTP) to a shared inbox, or
   - **Slack/Discord** message to a channel, or
   - **HTTP Request** to any other webhook.
4. Optionally filter reports to high priority only:
   `{{$json.type === 'new_report'}}` + a later check once priority is added to the
   payload (or look it up via Supabase REST inside n8n).
5. Activate the workflow.

## Testing

```bash
curl -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"type":"institution_application","institution_name":"Test Dept","official_email":"ops@city.gov"}'
```

You should receive the notification in your configured channel.

## Scope note

Do not build core workflows (routing, assignment, AI) in n8n for the MVP — those live
in the app and database so they remain testable and versioned.
