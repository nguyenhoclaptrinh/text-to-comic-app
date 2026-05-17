# Text-to-Comic App

Text-to-Comic App is a Next.js prototype for converting story text into an editable comic/webtoon workflow. The current project is optimized for final-project demonstration: create a project, analyze text into storyboard panels, generate/regenerate panel artwork through a typed mock AI service, edit characters and speech bubbles, persist progress locally, and export a vertical PNG.

## Current MVP

- Project dashboard and text import flow.
- Storyboard editor with editable scene prompt, dialogue, panel status, and character chips.
- Editable character casting sidebar for name, role, and visual description.
- Mock AI service layer for storyboard analysis and panel image generation.
- Per-panel generate/regenerate and Generate All.
- Speech bubble add/edit/delete/drag.
- Local snapshot persistence through `localStorage`.
- Vertical PNG export with missing-image warning.
- Unit tests, coverage thresholds, lint, format, build, and audit gates.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest with V8 coverage
- ESLint and Prettier

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality Gates

```bash
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run build
npm audit --audit-level=moderate
```

## Demo Flow

1. Open Dashboard or Text Import.
2. Enter a title and story text.
3. Analyze the story to create storyboard panels.
4. Edit a scene prompt, dialogue, and character description.
5. Generate one panel or run Generate All.
6. Open Comic Editor, add or drag a speech bubble.
7. Export PNG from the top bar.
8. Reload the browser to show local persistence.

## Known Scope Boundary

The AI layer is currently a typed mock provider. It is structured so Gemini/storyboard and image backend providers can replace the mock service without rewriting the editor flow. Supabase Auth/DB/Storage and real external AI credentials are the next integration step.
