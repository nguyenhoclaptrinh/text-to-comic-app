---
id: DEL-001
type: delivery
status: draft
created: 2026-05-17
updated: 2026-05-17
---

# Demo Runbook: Text-to-Comic App

## Demo Goal

Show an end-to-end AI-assisted comic creation workflow:

```text
Text import -> storyboard -> edit -> generate panels -> edit bubbles -> export PNG
```

## Pre-Demo Checklist

- Run `npm install`.
- Run `npm run dev`.
- Open `http://localhost:3000`.
- Keep one browser tab ready with the app loaded.
- Prepare a short story paragraph of 300-1,000 words.
- Run quality gates before final submission:

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run build
npm audit --audit-level=moderate
```

## Demo Script

1. Start from the Dashboard and open the existing project.
2. Navigate to Text Import and create a new comic from a story paragraph.
3. Explain that the storyboard service is currently a typed mock provider that can be replaced by Gemini.
4. Edit one panel prompt and one dialogue line to demonstrate human-in-the-loop control.
5. Edit one character name/role/visual description in Casting.
6. Generate one panel, then use Generate All.
7. Open Comic Editor and add or drag a speech bubble.
8. Reload the page to show local persistence.
9. Export PNG and explain missing-image warning behavior.

## Acceptance Evidence

| Requirement | Current Evidence |
| --- | --- |
| Create project from text | Text Import creates a new project and panels |
| Storyboard editing | Panel prompt/dialogue fields are editable |
| Character consistency support | Character casting data is editable and persisted |
| Generate/regenerate panel | Per-panel button and Generate All update panel status |
| Bubble editing | Bubble text, add/delete, and drag are available |
| Reload safety | Studio snapshot persists in localStorage |
| Export PNG | Export modal renders vertical PNG through canvas |
| Error handling | Typed AI errors, missing-image warnings, interrupted generation recovery |

## Current Limitations

- Gemini and real image generation are not wired to external credentials yet.
- Supabase Auth/DB/Storage is documented as target architecture but not implemented in the prototype.
- PNG export renders the current generated-style prototype artwork, not externally generated image files.
- Reference image upload is shown as a future control.

## Next Integration Tasks

1. Add real text-to-storyboard provider behind `lib/studio/ai-services.ts`.
2. Add real image generation provider and storage upload.
3. Replace localStorage repository with Supabase repository after schema setup.
4. Add Playwright E2E test for the demo happy path.

For the full remaining roadmap, see `docs/040-implementation/FinalProjectCompletionPlan.md`.
