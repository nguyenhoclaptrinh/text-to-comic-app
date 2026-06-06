---
id: QA-PLAN-001
type: qa-plan
status: draft
created: 2026-05-17
---

# QA Test Plan: Text-to-Comic App

## Source Requirements

- PRD: storyboard must be saved before image generation, panel regeneration must affect only one panel, and speech bubbles must survive reload.
- SDD: client-side sequential generation is used to avoid serverless timeout; speech bubbles are persisted per panel; PNG export warns when panels are missing images.
- Rewrite plan: studio flow is Vietnamese-first, status labels are user-facing, and mobile storyboard must remain usable.
- Implementation Plan: Definition of Done requires important data to be saved and reload-safe.

## Current Automated Scope

### Unit Tests

| ID          | Module                        | Coverage                                                                                                 |
| ----------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| TC-UNIT-001 | `lib/studio/utils.ts`         | Text-to-panel mock generation, dialogue extraction, coordinate clamping, character/bubble update helpers |
| TC-UNIT-002 | `lib/studio/factories.ts`     | Project, character, bubble, generated bubble creation                                                    |
| TC-UNIT-003 | `lib/studio/persistence.ts`   | Save/load/clear local snapshots, invalid JSON handling, version guard, interrupted generation recovery   |
| TC-UNIT-004 | `lib/studio/export-plan.ts`   | PNG filename, panel ordering, missing image count, empty export guard                                    |
| TC-UNIT-005 | `lib/studio/ai-services.ts`   | Storyboard validation, mock panel generation, image backend error mapping                                |
| TC-UNIT-006 | `lib/studio/api-contracts.ts` | API request/response validation, fallback storyboard normalization, cached image URL generation          |
| TC-UNIT-007 | `lib/studio/domain.ts`        | Panel status transitions, queued/generating state, failed regeneration preserving old image              |

### Manual Acceptance Checks

| ID         | Flow                                   | Expected Result                                                                                |
| ---------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| TC-UAT-001 | Create project -> edit panel -> reload | Project and panels remain available                                                            |
| TC-UAT-002 | Add bubble -> drag -> reload           | Bubble text and coordinates remain available                                                   |
| TC-UAT-003 | Panel missing image -> export          | Export modal shows warning and return-to-storyboard action                                     |
| TC-UAT-004 | Delete a non-final storyboard panel    | Panel is removed and project panel count updates                                               |
| TC-UAT-005 | Mobile storyboard viewport             | Header, bottom navigation, panel editor and character drawer remain usable without overlapping |

### E2E Tests

| ID         | Module                       | Coverage                                                                                      |
| ---------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| TC-E2E-001 | Playwright demo happy path   | Import story, analyze storyboard, edit panel, generate image fallback, add bubble, export PNG |
| TC-E2E-002 | Playwright mobile smoke path | Storyboard workflow remains visible and navigable at 390px width                              |

## Quality Gates

```text
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --audit-level=moderate
```
