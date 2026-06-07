# Slice 1 — provider-types-and-registry — תוכנית

> **תאריך**: 2026-06-07
> **סטטוס**: הושלם
> **Complexity**: 2/10 (verifier: light)
> **תלויות (`depends_on`)**: [] — בנוי ישירות על dev
> **Base**: dev
> **Dev tip**: `7f431aba8b55ca11f3f550f85626d8bfad7677bf`

---

## §0 — Pre-flight

### תלויות (חובה!)

slice זה **מבוסס על**:
- אין תלויות (בנוי ישירות על dev)

### Worktree

```bash
cd /home/user/projects/CodeNomad
git worktree add .worktrees/slice-1-provider-types-and-registry -b slice-1-provider-types-and-registry dev
cd .worktrees/slice-1-provider-types-and-registry
npm ci --workspaces --include=optional
```

### איך להריץ

- Server dev: `npm run dev --workspace @neuralnomads/codenomad` (uses `packages/server/package.json`)
- Server typecheck: `npm run typecheck --workspace @neuralnomads/codenomad`
- Targeted provider tests: `node --import tsx --test packages/server/src/providers/__tests__/registry.test.ts`

### Browser

לא רלוונטי — slice זה server-side only ואין שינוי UI.

### OneCLI agent

לא רלוונטי.

### Reading list

**must-read** (לפני שמתחילים):
- `docs/design/provider-layer-mvp-execution-plan.md` — Steps 1-2 מגדירים את scope ה-slice.
- `docs/design/provider-layer-compatibility-notes.md` — למה חייבים validation ולא לזהות כל stdio JSON כ-ACP.
- `docs/research/provider-protocols/analysis/api-action-matrix.md` — למה provider lifecycle חייב להיות explicit.
- `docs/research/provider-protocols/analysis/existing-abstractions.md` — למה Slice 1 צריך לכלול `ProviderSession.start()` לפני deeper ACP slices.
- `docs/decisions/codenomad.md` — החלטת `ProviderSession.start()` המעודכנת.
- `packages/server/package.json` — שם ה-workspace הוא `@neuralnomads/codenomad`; אין `test` script.
- `packages/server/src/workspaces/opencode-auth.test.ts` — דוגמה ל-tests קיימים עם `node:test` ו-`node:assert/strict`.

**reference** (בזמן עבודה):
- `packages/server/src/providers/types.ts` — קיים כרגע כ-untracked draft; מותר להשתמש בו כבסיס אם התוכן תואם ל-API skeleton.
- `packages/server/src/providers/registry.ts` — קיים כרגע כ-untracked draft; מותר להשתמש בו כבסיס אם התוכן תואם ל-API skeleton.
- `packages/server/src/workspaces/spawn.ts` — reference לסגנון TypeScript server-side ולשגיאות descriptive.

---

## §1 — מטרה

אחרי slice זה, ל-server יש מודול `providers` רשמי, קטן ו-greenfield, שמגדיר חוזה MVP קנוני של CodeNomad ל-provider definitions, provider events, provider sessions, ו-registry פנימי. זה לא facade של OpenCode HTTP: OpenCode הוא רק provider built-in שנרשם ב-registry. אין שינוי runtime: OpenCode ממשיך לעבוד בדיוק כמו קודם, והמודול החדש עדיין לא מחובר ל-`WorkspaceManager`.

---

## §2 — Scope

| פיצ'ר | כן/לא | לאן |
|------|------|------|
| `ProviderType` union: `opencode-http` / `acp-stdio` | ✅ | ב-slice הזה |
| `ProviderDefinition` | ✅ | ב-slice הזה |
| `ProviderEvent` מינימלי ל-MVP | ✅ | ב-slice הזה |
| `ProviderSession` מינימלי ל-MVP כולל `start()` | ✅ | ב-slice הזה |
| `BUILT_IN_OPENCODE_PROVIDER` | ✅ | ב-slice הזה |
| `ProviderRegistry` עם `list/get/require/resolve` | ✅ | ב-slice הזה |
| validation: provider id pattern + `acp-stdio` requires `command` | ✅ | ב-slice הזה |
| barrel export ב-`providers/index.ts` | ✅ | ב-slice הזה |
| unit tests ל-registry validation/default resolution | ✅ | ב-slice הזה |
| שינוי `WorkspaceManager` / runtime קיים | ❌ | slice מאוחר יותר |
| ייבוא OpenCode endpoint/header/SSE payload shapes לתוך ה-contract | ❌ | אסור ב-slice הזה |
| `OpenCodeHttpProvider` wrapper | ❌ | slice 4 |
| `JsonRpcStdioTransport` | ❌ | slice 2 |
| `AcpStdioProvider` | ❌ | slice 3 |
| config schema / UI provider selector | ❌ | slice 5+ |

---

## §3 — Architecture diagram

```text
┌──────────────────────────────────────────┐
│ packages/server/src/providers/           │ ← חדש
│                                          │
│  ┌────────────────┐   ┌───────────────┐  │
│  │ types.ts       │   │ registry.ts   │  │
│  │                │   │               │  │
│  │ ProviderType   │   │ ProviderRegistry│ │
│  │ ProviderDef    │   │ .list()       │  │
│  │ ProviderEvent  │   │ .get()        │  │
│  │ ProviderSession│   │ .require()    │  │
│  └────────────────┘   │ .resolve()    │  │
│                       │ validate...   │  │
│  ┌────────────────┐   └───────────────┘  │
│  │ __tests__/     │                      │
│  │ registry.test  │ ← חדש                │
│  └────────────────┘                      │
│  ┌────────────────┐                      │
│  │ index.ts       │ ← barrel export      │
│  └────────────────┘                      │
└──────────────────────────────────────────┘
          │
          │ no call sites yet
          ▼
┌──────────────────────────────────────────┐
│ packages/server/src/workspaces/          │ ← קיים, לא משתנה
└──────────────────────────────────────────┘
```

---

## §4 — Commits בסדר

### Commit 0 — Provider types + registry + tests (approach: tdd)

**קבצים חדשים**:
- `packages/server/src/providers/types.ts`
- `packages/server/src/providers/registry.ts`
- `packages/server/src/providers/index.ts`
- `packages/server/src/providers/__tests__/registry.test.ts`

**קבצים שמשתנים**:
- אין. אסור לחבר ל-`WorkspaceManager` ב-slice הזה.

**API skeleton**:

ה-skeleton להלן הוא provider-neutral. לא להוסיף אליו `opencode` endpoint names, `x-opencode-*` headers, או OpenCode SSE payload variants.

```ts
// packages/server/src/providers/types.ts
export type ProviderType = "opencode-http" | "acp-stdio"

export interface ProviderDefinition {
  id: string
  type: ProviderType
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
}

export type ProviderEvent =
  | { type: "session.ready"; sessionId: string }
  | { type: "message.delta"; role: "assistant"; text: string }
  | { type: "session.done"; reason: string }
  | { type: "session.cancelled" }
  | { type: "session.error"; message: string }
  | { type: "log"; level: "debug" | "info" | "warn" | "error"; message: string }

export interface ProviderSession {
  providerId: string
  sessionId: string
  start(): Promise<void>
  sendPrompt(prompt: string): Promise<void>
  cancel(): Promise<void>
  stop(): Promise<void>
  onEvent(handler: (event: ProviderEvent) => void): () => void
}
```

```ts
// packages/server/src/providers/registry.ts
export const BUILT_IN_OPENCODE_PROVIDER_ID = "opencode"
export const BUILT_IN_OPENCODE_PROVIDER: ProviderDefinition

export interface ProviderRegistryOptions {
  providers?: ProviderDefinition[]
  defaultProviderId?: string
}

export function isValidProviderId(providerId: string): boolean
export function validateProviderDefinition(provider: ProviderDefinition): void

export class ProviderRegistry {
  constructor(options?: ProviderRegistryOptions)
  list(): ProviderDefinition[]
  get(providerId: string): ProviderDefinition | undefined
  require(providerId: string): ProviderDefinition
  resolve(providerId?: string): ProviderDefinition
}
```

```ts
// packages/server/src/providers/index.ts
export * from "./types"
export * from "./registry"
```

**Tests to add** (`registry.test.ts`):
- default registry contains built-in `opencode` provider.
- `resolve()` without id returns `opencode`.
- custom `acp-stdio` provider with `command` is accepted.
- duplicate provider id throws.
- invalid provider id throws.
- `acp-stdio` provider without `command` throws.
- unknown default provider id throws.
- `require("missing")` throws.

**Verification**:

```bash
npm run typecheck --workspace @neuralnomads/codenomad
node --import tsx --test packages/server/src/providers/__tests__/registry.test.ts
```

---

## §5 — DoD verifiable

| # | בדיקה | איך |
|---|------|------|
| 1 | server typecheck עובר | `npm run typecheck --workspace @neuralnomads/codenomad` |
| 2 | provider registry tests עוברים | `node --import tsx --test packages/server/src/providers/__tests__/registry.test.ts` |
| 3 | אין שינוי runtime קיים | `git diff --name-only HEAD` כולל רק `packages/server/src/providers/**` + docs/plans אם executor מעדכן brief deviations |
| 4 | registry resolves opencode default | covered by `registry.test.ts` |
| 5 | acp-stdio בלי command נכשל | covered by `registry.test.ts` |
| 6 | אין hardcoded user-visible strings ב-UI | אין קבצי UI ב-slice הזה |

---

## §6 — Risks + mitigations

| סיכון | מקור | מיטיגציה |
|------|------|----------|
| API רחב מדי מוקדם מדי | provider layer עדיין לא מחובר | לשמור רק על fields ו-methods שמופיעים ב-MVP execution plan Steps 1-2 |
| `start()` נראה מיותר ל-OpenCode | OpenCode HTTP כבר רץ היום מאחורי WorkspaceManager | להשאיר אותו ב-contract כ-no-op/health/session setup עתידי; ACP לא יכול לעבוד נכון בלי explicit startup |
| registry validation נועל אותנו לפורמט שגוי | ACP providers עתידיים | validation מינימלי בלבד: id תקין ו-command ל-`acp-stdio`; לא לאמת args/env semantics |
| tests לא רצים דרך npm script | `packages/server/package.json` אין `test` script | להריץ `node --import tsx --test ...` במפורש |
| import cycle דרך barrel | common TS issue | `index.ts` עושה export בלבד; `types.ts` לא מייבא כלום; `registry.ts` מייבא type-only מ-`types.ts` |
| package manager שגוי | הפרויקט משתמש npm workspaces | להשתמש רק ב-`npm`, לא `pnpm`/`bun` |

> 3 שתמיד נשכחים:
> 1. Hardcoded strings → לא UI; error messages באנגלית פנימית בלבד.
> 2. Reactivity gotchas → לא UI.
> 3. OneCLI placeholder → לא רלוונטי.

---

## §7 — Escalation triggers

> אם X — עצור ושאל את Tama:

- צריך לשנות קובץ מחוץ ל-`packages/server/src/providers/**` כדי לגרום ל-typecheck לעבור.
- ה-existing draft ב-`types.ts`/`registry.ts` סותר את API skeleton לעיל.
- רוצים להפריד כבר עכשיו בין `ProviderRuntime.start()` לבין `ProviderSession.start()`. ברירת מחדל: לא מפרידים ב-Slice 1; מוסיפים רק `ProviderSession.start()` כדי לסגור את lifecycle gap.
- רוצים להכניס config schema או workspace API כבר עכשיו.

---

## §8 — Complexity score + verifier tier

| פרמטר | ניקוד |
|------|------|
| Greenfield, אין call sites קיימים | -1 |
| Pure logic, אין IO | -2 |
| <5 files ב-package אחד | +1 |
| TDD מלא ל-registry | -1 |
| API surface חדש שישמש slices עתידיים | +2 |

**Score**: 2 / 10

**Tier**: 0-3 → `verifier-slice-light`

**Verifier-phase אחרי commit/phase**: none

---

## §9 — שאלות פתוחות

| # | שאלה | ברירת מחדל | חוסם? |
|---|------|----------|------|
| 1 | האם `ProviderSession` צריך `start()` כבר עכשיו? | כן. זו החלטת תכנון אחרי חקירת ACP/existing abstractions; זה עדיין מינימלי כי אין call sites ב-Slice 1. | ✅ נפתר |
| 2 | האם להוסיף config schema עכשיו? | לא. זה slice נפרד אחרי provider runtime בסיסי. | ❌ |

---

## סטיות מהתכנון (מתעדכן ע"י executor תוך כדי)

- אין סטיות מהותיות מה-brief.
- תפעולית: ניקוי `~/.npm` נדרש לפני `npm ci` בגלל חוסר מקום בדיסק.
- תפעולית: ה-brief היה untracked ב-checkout הראשי ולכן נוסף ל-worktree כדי לאפשר סטטוס סיום ו-verification self-contained.
