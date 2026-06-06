---
id: DEL-002
type: setup-guide
status: draft
created: 2026-05-18
updated: 2026-05-18
---

# Supabase Setup Guide

Supabase is an optional upgrade for the final project. The production demo baseline is local-first (`localStorage` + IndexedDB). Only enable Supabase after the Gemini/storyboard, image fallback, export, backup/restore, and E2E flow are stable.

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Only expose `NEXT_PUBLIC_*` values to the browser. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

## Setup Steps

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Create a storage bucket named `comic-panels` if not created by SQL.
5. Add environment variables to `.env.local`.
6. Implement a Supabase repository adapter beside the current localStorage repository.
7. Keep localStorage fallback until DB save/load is verified.

## Tables

- `projects`: project title, original text, status.
- `pages`: page order and title for each project.
- `characters`: character casting data.
- `panels`: prompts, dialogue, image URL, status, speech bubbles JSON.

## RLS Strategy

Each authenticated user can manage only projects where `projects.user_id = auth.uid()`. Characters and panels are accessible through ownership of their parent project.

## When To Use In Demo

Use Supabase live only if:

- Login and DB save/load were tested before the defense.
- Generated image URLs load correctly.
- PNG export works with those image URLs.
- Backup JSON still works as a fallback recovery path.

Otherwise, use localStorage baseline and explain Supabase as the production-ready extension.
