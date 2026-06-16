# Nested JSON-String Unwrapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When formatted/minified JSON contains a string value that is itself JSON-encoded (an object or array serialized as a string), automatically decode it in place — recursively, at any depth, anywhere in the structure (including when the entire input is such a string).

**Architecture:** A new private helper `deepUnwrapJsonStrings` in `src/utils/json.ts` walks the value returned by `JSON.parse` (arrays/objects recursively, strings by repeatedly re-parsing until the result stops being a string). It commits to replacing a string only if the chain bottoms out in a plain object or array; otherwise the original string is kept untouched. `prettifyJson`/`minifyJson` call it between `JSON.parse` and `JSON.stringify` and report how many layers were unwrapped via a new `unwrappedCount` field on `ProcessResult`. The UI (`src/pages/Home/index.tsx`) folds that count into the existing sanitize toast and generalizes its wording.

**Tech Stack:** TypeScript, React 19, Vite. No test framework is configured in this project (`package.json` has no `vitest`/`jest`) — verification is done with throwaway Node scripts under `/tmp` (mirroring the plain-JS logic, since the functions have no JSX/React dependencies) plus `npx tsc -b --noEmit` and `npx biome check src`.

---

### Task 1: Add `deepUnwrapJsonStrings` to `src/utils/json.ts`

**Files:**
- Modify: `src/utils/json.ts:1-9` (the `ProcessResult` type) and after line 106 (end of `sanitizeJson`, before `prettifyJson`)
- Verify: throwaway script at `/tmp/verify-unwrap.mjs` (not committed)

- [ ] **Step 1: Write the verification script first (acts as the failing test)**

Create `/tmp/verify-unwrap.mjs`:

```js
function deepUnwrapJsonStrings(value) {
  if (Array.isArray(value)) {
    let unwrappedCount = 0;
    const mapped = value.map((item) => {
      const result = deepUnwrapJsonStrings(item);
      unwrappedCount += result.unwrappedCount;
      return result.value;
    });
    return { value: mapped, unwrappedCount };
  }

  if (value !== null && typeof value === "object") {
    let unwrappedCount = 0;
    const mapped = {};
    for (const [key, item] of Object.entries(value)) {
      const result = deepUnwrapJsonStrings(item);
      unwrappedCount += result.unwrappedCount;
      mapped[key] = result.value;
    }
    return { value: mapped, unwrappedCount };
  }

  if (typeof value === "string") {
    return unwrapEncodedString(value);
  }

  return { value, unwrappedCount: 0 };
}

function unwrapEncodedString(original) {
  let current = original;
  let layers = 0;

  while (typeof current === "string") {
    let parsed;
    try {
      parsed = JSON.parse(current);
    } catch {
      break;
    }
    current = parsed;
    layers++;
  }

  const isObjectOrArray = Array.isArray(current) || (current !== null && typeof current === "object");
  if (layers === 0 || !isObjectOrArray) {
    return { value: original, unwrappedCount: 0 };
  }

  const nested = deepUnwrapJsonStrings(current);
  return { value: nested.value, unwrappedCount: nested.unwrappedCount + layers };
}

function check(label, raw, expectedCount, expectedValue) {
  const parsed = JSON.parse(raw);
  const { value, unwrappedCount } = deepUnwrapJsonStrings(parsed);
  const got = JSON.stringify(value);
  const want = JSON.stringify(expectedValue);
  const pass = unwrappedCount === expectedCount && got === want;
  console.log(pass ? "PASS" : "FAIL", "-", label, "| count:", unwrappedCount, "(want", expectedCount + ")", "| value:", got);
  if (!pass) process.exitCode = 1;
}

// Whole input is a JSON-encoded string (the user's reported example)
check(
  "whole-input string",
  '"{\\"nome\\":\\"Ana\\",\\"idade\\":28,\\"ativo\\":true,\\"habilidades\\":[\\"JavaScript\\",\\"React\\"]}"',
  1,
  { nome: "Ana", idade: 28, ativo: true, habilidades: ["JavaScript", "React"] }
);

// Nested field is a JSON-encoded string
check("nested field", '{"data": "{\\"a\\":1}"}', 1, { data: { a: 1 } });

// Multiple layers: string of string of object
const innerObj = JSON.stringify({ a: 1 });
const doubleEncoded = JSON.stringify(innerObj);
const tripleEncoded = JSON.stringify(doubleEncoded);
check("triple layers", tripleEncoded, 2, { a: 1 });

// Array with one encoded element and one plain string
check("array mixed", '["{\\"a\\":1}", "plain text"]', 1, [{ a: 1 }, "plain text"]);

// Strings that parse to scalars must NOT be unwrapped
check("scalar number string", '{"code": "123"}', 0, { code: "123" });
check("scalar bool string", '{"flag": "true"}', 0, { flag: "true" });

// Plain JSON with no encoded strings at all
check("plain json", '{"a":1,"b":[1,2,3]}', 0, { a: 1, b: [1, 2, 3] });

// String of string of a plain (non-JSON) word must NOT unwrap
const stringOfStringOfWord = JSON.stringify(JSON.stringify("hello"));
check("string-of-string-of-word", stringOfStringOfWord, 0, JSON.parse(stringOfStringOfWord));
```

- [ ] **Step 2: Run it to confirm the logic is correct in isolation**

Run: `node /tmp/verify-unwrap.mjs`

Expected: every line printed starts with `PASS`, exit code `0`. (This logic was already validated during design; this step re-confirms it before it's copied into the TypeScript source.)

- [ ] **Step 3: Add the typed implementation to `src/utils/json.ts`**

First, update the `ProcessResult` type at the top of the file (currently lines 1-4):

```ts
export type ProcessResult = {
  value: string;
  error: string | null;
  unwrappedCount: number;
};
```

Then insert the following two functions after `sanitizeJson` (i.e. right after its closing `}` and blank line, before `export function prettifyJson`):

```ts
function deepUnwrapJsonStrings(value: unknown): { value: unknown; unwrappedCount: number } {
  if (Array.isArray(value)) {
    let unwrappedCount = 0;
    const mapped = value.map((item) => {
      const result = deepUnwrapJsonStrings(item);
      unwrappedCount += result.unwrappedCount;
      return result.value;
    });
    return { value: mapped, unwrappedCount };
  }

  if (value !== null && typeof value === "object") {
    let unwrappedCount = 0;
    const mapped: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const result = deepUnwrapJsonStrings(item);
      unwrappedCount += result.unwrappedCount;
      mapped[key] = result.value;
    }
    return { value: mapped, unwrappedCount };
  }

  if (typeof value === "string") {
    return unwrapEncodedString(value);
  }

  return { value, unwrappedCount: 0 };
}

function unwrapEncodedString(original: string): { value: unknown; unwrappedCount: number } {
  let current: unknown = original;
  let layers = 0;

  while (typeof current === "string") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(current);
    } catch {
      break;
    }
    current = parsed;
    layers++;
  }

  const isObjectOrArray = Array.isArray(current) || (current !== null && typeof current === "object");
  if (layers === 0 || !isObjectOrArray) {
    return { value: original, unwrappedCount: 0 };
  }

  const nested = deepUnwrapJsonStrings(current);
  return { value: nested.value, unwrappedCount: nested.unwrappedCount + layers };
}
```

- [ ] **Step 4: Run TypeScript build to confirm types are correct**

Run: `npx tsc -b --noEmit`

Expected: no output, exit code `0`. (`prettifyJson`/`minifyJson` will fail to compile at this point because `ProcessResult` now requires `unwrappedCount` but they don't return it yet — that's expected and fixed in Task 2. If Task 2's edits aren't applied yet, this step will show exactly those two errors; that's fine, just confirm there are no *other* type errors in the new functions themselves before moving on.)

- [ ] **Step 5: Commit**

```bash
git add src/utils/json.ts
git commit -m "feat: add deepUnwrapJsonStrings helper for nested JSON-encoded strings"
```

(This commit leaves the build red until Task 2 lands — that's expected for this incremental step. If you'd rather keep main green at every commit, squash Task 1 and Task 2 into one commit instead.)

---

### Task 2: Wire the helper into `prettifyJson` and `minifyJson`

**Files:**
- Modify: `src/utils/json.ts` (the `prettifyJson` and `minifyJson` functions)

- [ ] **Step 1: Update `prettifyJson`**

Current code:

```ts
export function prettifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    return { value: JSON.stringify(parsed, null, 2), error: null };
  } catch (e) {
    return { value: "", error: (e as Error).message };
  }
}
```

Replace with:

```ts
export function prettifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    const { value, unwrappedCount } = deepUnwrapJsonStrings(parsed);
    return { value: JSON.stringify(value, null, 2), error: null, unwrappedCount };
  } catch (e) {
    return { value: "", error: (e as Error).message, unwrappedCount: 0 };
  }
}
```

- [ ] **Step 2: Update `minifyJson`**

Current code:

```ts
export function minifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    return { value: JSON.stringify(parsed), error: null };
  } catch (e) {
    return { value: "", error: (e as Error).message };
  }
}
```

Replace with:

```ts
export function minifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    const { value, unwrappedCount } = deepUnwrapJsonStrings(parsed);
    return { value: JSON.stringify(value), error: null, unwrappedCount };
  } catch (e) {
    return { value: "", error: (e as Error).message, unwrappedCount: 0 };
  }
}
```

- [ ] **Step 3: Run TypeScript build**

Run: `npx tsc -b --noEmit`

Expected: no output, exit code `0`.

- [ ] **Step 4: Run Biome lint/format check**

Run: `npx biome check src/utils/json.ts`

Expected: `Checked 1 file in ...ms. No fixes applied.`

- [ ] **Step 5: End-to-end verification with a throwaway script against the real pipeline behavior**

Create `/tmp/verify-pipeline.mjs` — this re-implements `sanitizeJson` + the now-updated `prettifyJson`/`minifyJson` exactly (copy from `src/utils/json.ts`, strip TS types) and runs the user's original reported example through the full path:

```js
// ... paste deepUnwrapJsonStrings + unwrapEncodedString from Step 3 of Task 1 ...
// ... paste prettifyJson logic (as plain JS) ...

const input = '"{\\"nome\\":\\"Ana\\",\\"idade\\":28,\\"ativo\\":true,\\"habilidades\\":[\\"JavaScript\\",\\"React\\"]}"';
const parsed = JSON.parse(input);
const { value, unwrappedCount } = deepUnwrapJsonStrings(parsed);
console.log("unwrappedCount:", unwrappedCount);
console.log(JSON.stringify(value, null, 2));
```

Run: `node /tmp/verify-pipeline.mjs`

Expected output:

```
unwrappedCount: 1
{
  "nome": "Ana",
  "idade": 28,
  "ativo": true,
  "habilidades": [
    "JavaScript",
    "React"
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/json.ts
git commit -m "feat: unwrap nested JSON-encoded strings in prettify/minify output"
```

---

### Task 3: Surface the combined count in the UI

**Files:**
- Modify: `src/pages/Home/index.tsx:60-76` (the `process` function)
- Modify: `src/pages/Home/index.tsx:249-260` (the `sanitize-toast` JSX)

- [ ] **Step 1: Update `process()` to combine both counts**

Current code (`src/pages/Home/index.tsx:60-76`):

```tsx
  function process(fmt: "pretty" | "minify") {
    if (!input.trim()) return;
    const { value: sanitized, removedCount } = sanitizeJson(input);
    const result = fmt === "pretty" ? prettifyJson(sanitized) : minifyJson(sanitized);
    if (result.error) {
      setError(result.error);
      setViewMode("edit");
    } else {
      setInput(result.value);
      setError(null);
      if (removedCount > 0) {
        setSanitizedCount(removedCount);
        setTimeout(() => setSanitizedCount(0), 4000);
      }
      setViewMode(fmt === "pretty" ? "formatted" : "minified");
    }
  }
```

Replace with:

```tsx
  function process(fmt: "pretty" | "minify") {
    if (!input.trim()) return;
    const { value: sanitized, removedCount } = sanitizeJson(input);
    const result = fmt === "pretty" ? prettifyJson(sanitized) : minifyJson(sanitized);
    if (result.error) {
      setError(result.error);
      setViewMode("edit");
    } else {
      setInput(result.value);
      setError(null);
      const fixCount = removedCount + result.unwrappedCount;
      if (fixCount > 0) {
        setSanitizedCount(fixCount);
        setTimeout(() => setSanitizedCount(0), 4000);
      }
      setViewMode(fmt === "pretty" ? "formatted" : "minified");
    }
  }
```

- [ ] **Step 2: Generalize the toast wording**

Current code (`src/pages/Home/index.tsx:249-260`):

```tsx
      {sanitizedCount > 0 && (
        <div
          id="sanitize-toast"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-border bg-background/90 backdrop-blur-xl px-4 py-3 text-foreground/60 text-xs max-w-sm shadow-lg"
          style={{ animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <BroomIcon weight="duotone" className="shrink-0" size={13} />
          <span className="font-mono leading-relaxed">
            {sanitizedCount} invalid {sanitizedCount === 1 ? "pattern" : "patterns"} removed
          </span>
        </div>
      )}
```

Replace the `<span>` text with:

```tsx
          <span className="font-mono leading-relaxed">
            {sanitizedCount} fix{sanitizedCount === 1 ? "" : "es"} applied
          </span>
```

(Leave the rest of the block — `id`, classes, animation, icon — unchanged.)

- [ ] **Step 3: Run TypeScript build**

Run: `npx tsc -b --noEmit`

Expected: no output, exit code `0`.

- [ ] **Step 4: Run Biome check**

Run: `npx biome check src/pages/Home/index.tsx`

Expected: `Checked 1 file in ...ms. No fixes applied.`

- [ ] **Step 5: Manual smoke test in the running app**

Run: `npm run dev`

Open the printed local URL, paste the user's example into the editor:

```
"{\"nome\":\"Ana\",\"idade\":28,\"ativo\":true,\"habilidades\":[\"JavaScript\",\"React\"]}"
```

Click **Prettify**. Expected:
- The output pane shows the formatted object (`nome`, `idade`, `ativo`, `habilidades` as real fields, not a single escaped line).
- A toast reading `1 fix applied` appears bottom-center and disappears after ~4s.

Click **Edit** to go back, paste the same input again, and click **Minify** instead. Expected:
- The output is the single-line minified object (`{"nome":"Ana","idade":28,"ativo":true,"habilidades":["JavaScript","React"]}`), confirming `minifyJson` unwraps the same way as `prettifyJson`.
- The same `1 fix applied` toast appears.

Also test a plain valid JSON object (e.g. `{"a": 1}`) and confirm Prettify still works with **no** toast (since `fixCount` is `0`).

- [ ] **Step 6: Commit**

```bash
git add src/pages/Home/index.tsx
git commit -m "feat: report unwrapped nested JSON strings in the sanitize toast"
```

---

## Post-implementation checklist

- [ ] All three commits are in place and `npx tsc -b --noEmit` / `npx biome check ./src` are clean on the final state.
- [ ] Delete the throwaway scripts under `/tmp` (`verify-unwrap.mjs`, `verify-pipeline.mjs`) — they are not part of the repo.
- [ ] Re-read `docs/superpowers/specs/2026-06-16-nested-json-string-unwrapping-design.md` test-case list (7 cases) and confirm each one was exercised either by the Task 1 verification script or the Task 3 manual smoke test.
