# OS-Aware Keyboard Shortcut Display

**Written against commit:** `bdb1e73`

## Context

The floating toolbar in `src/pages/Home/index.tsx` displays a hardcoded `⌘↵` hint to remind users of the Cmd+Enter shortcut. On Windows, the correct shortcut is Ctrl+Enter — the keyboard listener already handles both via `(e.ctrlKey || e.metaKey) && e.key === "Enter"`, but the displayed label is always the Mac symbol.

**Goal:** Detect the user's OS at runtime and display `⌘↵` on macOS or `Ctrl+↵` on all other platforms.

## Files

| File | Action |
|------|--------|
| `src/utils/platform.ts` | Create — exports `isMac()` |
| `src/pages/Home/index.tsx` | Modify — import `isMac`, conditionally render shortcut label |

## Step 1 — Create `src/utils/platform.ts`

Create the file with this exact content (no comments, no default exports, per CLAUDE.md):

```ts
export function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);
}
```

**Why `navigator.userAgent` and not `navigator.platform`:** `navigator.platform` is deprecated (MDN) and scheduled for removal. `userAgent` is the current standard for platform sniffing in a client-only SPA.

**Why `typeof navigator !== "undefined"`:** Defensive guard for any future SSR/test environments where `navigator` is not defined.

## Step 2 — Update `src/pages/Home/index.tsx`

### 2a — Add import

Locate the existing imports block at the top of the file. The last import currently ends around line 18. Add:

```ts
import { isMac } from "@utils/platform";
```

Place it after the other `@utils/` imports (`@utils/json`, `@utils/jsonHighlight`, `@utils/encoding`), keeping the group together.

### 2b — Replace the hardcoded shortcut span

Locate this exact span near the bottom of the `return` (around line 387–389):

```tsx
        <span className="font-mono text-xs text-muted-foreground/50 px-3 select-none tracking-wider">
          ⌘↵
        </span>
```

Replace with:

```tsx
        <span className="font-mono text-xs text-muted-foreground/50 px-3 select-none tracking-wider">
          {isMac() ? "⌘↵" : "Ctrl+↵"}
        </span>
```

No other changes to the file.

## Step 3 — Typecheck

```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
```

Expected: zero errors.

**Important:** Do NOT use `npm run build` or `tsc -b` — these use incremental builds and can deadlock if another process holds the tsbuildinfo file. Use the command above.

## Step 4 — Lint

```bash
./node_modules/.bin/biome check src/utils/platform.ts src/pages/Home/index.tsx
```

Expected: no errors or warnings introduced. If there are pre-existing issues in `Home/index.tsx`, do NOT fix them — only confirm the new lines are clean.

## Step 5 — Commit

```bash
git add src/utils/platform.ts src/pages/Home/index.tsx
git commit -m "feat: show OS-aware keyboard shortcut in floating toolbar"
```

## Done Criteria

- `src/utils/platform.ts` exists and exports `isMac(): boolean`
- `Home/index.tsx` imports `isMac` via `@utils/platform`
- The shortcut span renders `⌘↵` when `isMac()` is true, `Ctrl+↵` otherwise
- `tsc --noEmit` exits 0
- `biome check` on the two touched files exits 0

## Out of Scope

- Changing the keyboard listener (it already handles both `metaKey` and `ctrlKey`)
- Detecting Linux separately from Windows (both show `Ctrl+↵`)
- Adding unit tests (no test framework in this project)
- Touching any other file
