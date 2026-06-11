# Screenshot Guide

Use this checklist when adding portfolio screenshots for Support RAG Evaluator. Do not commit placeholder images; only add real screenshots captured from the local demo.

## Recommended Screenshots

- [ ] Dashboard overview
- [ ] Setup actions after the API is reachable
- [ ] Successful chat answer with citations
- [ ] Refusal answer for an unsupported question
- [ ] Query logs list
- [ ] Eval runs list
- [ ] Eval run details
- [ ] OpenAPI docs at `/docs`

## Recommended Filenames

Store screenshots under `docs/assets/` or `assets/` when real images are ready.

- `dashboard-overview.png`
- `chat-citations.png`
- `query-logs.png`
- `eval-runs.png`
- `openapi-docs.png`

If you capture both successful and refused chat states, use:

- `chat-citations.png`
- `chat-refusal.png`

## Capture Guidance

- Use local demo data from the bundled sample docs.
- Use the deterministic provider unless the screenshot is intentionally showing Groq behavior.
- Keep API keys, local `.env` values, terminal secrets, and browser autofill hidden.
- Crop browser chrome if it improves readability, but keep enough context to show the page or workflow.
- Prefer a clean desktop background and a consistent browser width across screenshots.
- Capture after running setup actions so chat, query logs, and eval runs show real local state.
- Do not include fake screenshots, mock performance numbers, or edited response data.

## Suggested Demo States

- For a grounded answer screenshot, ask `Can I export billing history?` and show the answer plus citation metadata.
- For a refusal screenshot, ask an unsupported question such as `How do I configure SSO?`.
- For query logs, open the detail page for a recent chat request so retrieved chunks and citation-use metadata are visible.
- For eval runs, run the baseline eval once and capture both the list and the newest run detail page.
