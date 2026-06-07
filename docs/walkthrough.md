# CodeNomad Walkthrough

## 2026-06-07 17:57

### Slice 1 — תשתית provider types ו-registry

בוצע Slice 1 של provider layer בצד ה-server בלבד, ללא חיבור ל-runtime הקיים וללא שינוי UI.

#### מה בוצע?

**1. מודול providers חדש**

- נוסף `packages/server/src/providers/types.ts` עם טיפוסי MVP ל-`ProviderDefinition`, `ProviderEvent`, ו-`ProviderSession` כולל `start()`.
- נוסף `packages/server/src/providers/registry.ts` עם provider מובנה של OpenCode ו-`ProviderRegistry` קטן.
- נוסף `packages/server/src/providers/index.ts` כ-barrel export.

**2. בדיקות registry**

- נוסף `packages/server/src/providers/__tests__/registry.test.ts` עם בדיקות ל-default provider, resolve, provider מותאם, כפילויות, ids לא תקינים, `acp-stdio` בלי command, default לא מוכר, ו-`require` לא מוכר.

#### חריגות ומעקפים

- אין script של `lint`/`check` בפרויקט ואין eslint/biome config; לכן בוצעו typecheck ו-targeted tests לפי ה-brief.
- ה-worktree נוצר אחרי ניקוי cache של npm כי הדיסק היה מלא בתחילת העבודה.

#### בדיקות

- `npm run typecheck --workspace @neuralnomads/codenomad`
- `node --import tsx --test packages/server/src/providers/__tests__/registry.test.ts`
