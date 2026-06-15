# MyJsonFormatter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicar o padrão visual e técnico do MyXmlFormatter adaptado para JSON: editor full-screen, syntax highlight, toolbar flutuante, URL sharing, drag-and-drop e CI/CD no GitHub Pages.

**Architecture:** Mirror exacto do MyXmlFormatter — single-page app sem header, editor full-screen com gutter de linhas sincronizado, três modos (edit/formatted/minified) com syntax highlight próprio, floating toolbar centralizada. Todos os ficheiros de infra/UI são reescritos para JSON; a única lógica nova é o tokenizador `jsonHighlight.ts` e o `json.ts` actualizado.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Biome 2, react-router-dom v7, @phosphor-icons/react, shadcn/ui Button.

**Working directory:** `/Users/geldopc/Documents/nerdzilla/front/my-json-formatter`

---

## File Map

| Acção | Ficheiro |
|-------|---------|
| Modify | `vite.config.ts` |
| Create | `src/vite-env.d.ts` |
| Modify | `src/routes/index.tsx` |
| Modify | `src/utils/json.ts` |
| Create | `src/utils/jsonHighlight.ts` |
| Create | `src/utils/encoding.ts` |
| Modify | `src/index.css` |
| Modify | `src/pages/Home/index.tsx` |
| Delete | `src/components/modules/Navbar/index.tsx` |
| Create | `.github/workflows/deploy.yml` |

---

## Task 1: Vite config + vite-env.d.ts + routes

**Files:**
- Modify: `vite.config.ts`
- Create: `src/vite-env.d.ts`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Rewrite vite.config.ts**

```ts
// vite.config.ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/myJsonFormatter/",
  server: {
    port: 5300,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@elements": path.resolve(__dirname, "./src/components/elements"),
      "@widgets": path.resolve(__dirname, "./src/components/widgets"),
      "@modules": path.resolve(__dirname, "./src/components/modules"),
      "@templates": path.resolve(__dirname, "./src/components/templates"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
    },
  },
});
```

- [ ] **Step 2: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 3: Rewrite src/routes/index.tsx**

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@templates/AppLayout";
import { Home } from "@pages/Home";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [{ index: true, element: <Home /> }],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

export function Router() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: zero errors (or only errors from files not yet updated — aceitável nesta fase).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/vite-env.d.ts src/routes/index.tsx
git commit -m "feat: configure vite base path, port 5300 and router basename"
```

---

## Task 2: Rewrite src/utils/json.ts

**Files:**
- Modify: `src/utils/json.ts`

- [ ] **Step 1: Rewrite json.ts com novos tipos e funções**

```ts
// src/utils/json.ts
export type ProcessResult = {
  value: string;
  error: string | null;
};

export type SanitizeResult = {
  value: string;
  removedCount: number;
};

export function sanitizeJson(input: string): SanitizeResult {
  let removedCount = 0;

  let cleaned = input.replace(/\/\/[^\n]*/g, () => {
    removedCount++;
    return "";
  });

  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, () => {
    removedCount++;
    return "";
  });

  cleaned = cleaned.replace(/,(\s*[}\]])/g, (_, p1) => {
    removedCount++;
    return p1;
  });

  return { value: cleaned, removedCount };
}

export function prettifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    return { value: JSON.stringify(parsed, null, 2), error: null };
  } catch (e) {
    return { value: "", error: (e as Error).message };
  }
}

export function minifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    return { value: JSON.stringify(parsed), error: null };
  } catch (e) {
    return { value: "", error: (e as Error).message };
  }
}
```

- [ ] **Step 2: Verificar manualmente as funções no console do browser**

Após `npm run dev`, abrir http://localhost:5300 e no console do browser executar:

```js
// Esperado: { value: '{\n  "a": 1\n}', error: null }
// (testar depois do Home estar feito — por agora verificar build)
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: sem erros relativos a `json.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/utils/json.ts
git commit -m "feat: rewrite json utils with SanitizeResult, prettifyJson and minifyJson"
```

---

## Task 3: Create src/utils/jsonHighlight.ts

**Files:**
- Create: `src/utils/jsonHighlight.ts`

- [ ] **Step 1: Create the tokenizer**

```ts
// src/utils/jsonHighlight.ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function span(cssVar: string, content: string): string {
  return `<span style="color:var(${cssVar})">${content}</span>`;
}

export function highlightJson(json: string): string {
  let result = "";
  let i = 0;

  while (i < json.length) {
    const ch = json[i];

    if (/\s/.test(ch)) {
      result += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      const start = i;
      i++;
      while (i < json.length) {
        if (json[i] === "\\") {
          i += 2;
        } else if (json[i] === '"') {
          i++;
          break;
        } else {
          i++;
        }
      }
      const raw = json.slice(start, i);

      let j = i;
      while (j < json.length && /\s/.test(json[j])) j++;
      const isKey = json[j] === ":";

      result += span(isKey ? "--json-color-key" : "--json-color-string", escapeHtml(raw));
      continue;
    }

    if (ch === "-" || /[0-9]/.test(ch)) {
      const start = i;
      if (json[i] === "-") i++;
      while (i < json.length && /[0-9]/.test(json[i])) i++;
      if (i < json.length && json[i] === ".") {
        i++;
        while (i < json.length && /[0-9]/.test(json[i])) i++;
      }
      if (i < json.length && (json[i] === "e" || json[i] === "E")) {
        i++;
        if (i < json.length && (json[i] === "+" || json[i] === "-")) i++;
        while (i < json.length && /[0-9]/.test(json[i])) i++;
      }
      result += span("--json-color-number", escapeHtml(json.slice(start, i)));
      continue;
    }

    if (json.startsWith("true", i)) {
      result += span("--json-color-boolean", "true");
      i += 4;
      continue;
    }
    if (json.startsWith("false", i)) {
      result += span("--json-color-boolean", "false");
      i += 5;
      continue;
    }
    if (json.startsWith("null", i)) {
      result += span("--json-color-null", "null");
      i += 4;
      continue;
    }

    if ("{}[]:,".includes(ch)) {
      result += span("--json-color-punct", escapeHtml(ch));
      i++;
      continue;
    }

    result += escapeHtml(ch);
    i++;
  }

  return result;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: sem erros relativos a `jsonHighlight.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/utils/jsonHighlight.ts
git commit -m "feat: add JSON syntax highlight tokenizer with key/value/number/boolean/null/punct tokens"
```

---

## Task 4: Create src/utils/encoding.ts

**Files:**
- Create: `src/utils/encoding.ts`

- [ ] **Step 1: Create encoding.ts (gzip + base64, nativo)**

```ts
// src/utils/encoding.ts
async function compress(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const stream = new Response(encoder.encode(input))
    .body!
    .pipeThrough(new CompressionStream("gzip"));
  const compressed = await new Response(stream).arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(compressed)));
}

async function decompress(encoded: string): Promise<string> {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const stream = new Response(bytes)
    .body!
    .pipeThrough(new DecompressionStream("gzip"));
  const decompressed = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(decompressed);
}

export async function encodeForUrl(json: string): Promise<string> {
  return encodeURIComponent(await compress(json));
}

export async function decodeFromUrl(param: string): Promise<string> {
  return decompress(decodeURIComponent(param));
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/utils/encoding.ts
git commit -m "feat: add URL encoding/decoding with native gzip compression"
```

---

## Task 5: Add JSON syntax highlight CSS variables to index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Append JSON highlight variables ao final de index.css**

Adicionar no final do ficheiro (após o bloco de grain overlay existente):

```css
/* ── JSON syntax highlight — light mode ──────────────── */
:root {
  --json-color-key: #1a8300;
  --json-color-string: #c07000;
  --json-color-number: #0077cc;
  --json-color-boolean: #c026a5;
  --json-color-null: #c026a5;
  --json-color-punct: #c026a5;
}

/* ── JSON syntax highlight — dark mode (Dracula) ─────── */
.dark {
  --json-color-key: #50fa7b;
  --json-color-string: #f1fa8c;
  --json-color-number: #8be9fd;
  --json-color-boolean: #ff79c6;
  --json-color-null: #ff79c6;
  --json-color-punct: #ff79c6;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add JSON syntax highlight CSS variables for light and dark modes"
```

---

## Task 6: Rewrite src/pages/Home/index.tsx

**Files:**
- Modify: `src/pages/Home/index.tsx`

- [ ] **Step 1: Rewrite Home com full-screen editor, toolbar, toasts, drag-drop e URL sharing**

```tsx
// src/pages/Home/index.tsx
import * as React from "react";
import {
  BracketsIcon,
  BroomIcon,
  CheckIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  MinusCircleIcon,
  PencilSimpleIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@elements/Button";
import { ThemeToggle } from "@widgets/ThemeToggle";
import { prettifyJson, minifyJson, sanitizeJson } from "@utils/json";
import { highlightJson } from "@utils/jsonHighlight";
import { decodeFromUrl, encodeForUrl } from "@utils/encoding";

type ViewMode = "edit" | "formatted" | "minified";

export function Home() {
  const [input, setInput] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("edit");
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [sharedCopied, setSharedCopied] = React.useState(false);
  const [sanitizedCount, setSanitizedCount] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [urlLoaded, setUrlLoaded] = React.useState(false);

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("json");
    if (!param) {
      setUrlLoaded(true);
      return;
    }
    decodeFromUrl(param)
      .then((json) => {
        setInput(json);
        setViewMode("formatted");
      })
      .catch(() => {})
      .finally(() => setUrlLoaded(true));
  }, []);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);

  const lineCount = React.useMemo(
    () => Math.max(1, input.split("\n").length),
    [input]
  );

  const highlightedJson = React.useMemo(
    () => (viewMode !== "edit" ? highlightJson(input) : ""),
    [input, viewMode]
  );

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

  function clearUrlParam() {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function handleBackToEdit() {
    clearUrlParam();
    setViewMode("edit");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleClear() {
    clearUrlParam();
    setInput("");
    setError(null);
    setViewMode("edit");
  }

  async function handleShare() {
    const encoded = await encodeForUrl(input);
    const url = `${window.location.origin}${window.location.pathname}?json=${encoded}`;
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url);
    setSharedCopied(true);
    setTimeout(() => setSharedCopied(false), 2000);
  }

  async function handleCopy() {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setInput(text);
        setError(null);
        setViewMode("edit");
      }
    };
    reader.readAsText(file);
  }

  function syncGutterScroll(scrollTop: number) {
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (viewMode === "edit") process("pretty");
      }
      if (e.key === "Escape" && viewMode !== "edit") {
        handleBackToEdit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode, input]);

  if (!urlLoaded) return null;

  return (
    <div
      id="home"
      className="flex flex-1 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          id="drag-overlay"
          aria-hidden="true"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm border-2 border-dashed border-foreground/20 pointer-events-none"
          style={{ animation: "fade-in 0.15s ease forwards" }}
        >
          <UploadSimpleIcon weight="thin" size={48} className="opacity-40" />
          <span className="font-mono text-xs text-muted-foreground/60 tracking-widest uppercase select-none">
            Drop JSON file to load
          </span>
        </div>
      )}

      <div
        id="editor-area"
        className="flex flex-1 overflow-hidden font-mono text-sm leading-relaxed"
      >
        <div
          ref={gutterRef}
          id="line-gutter"
          aria-hidden="true"
          className="shrink-0 select-none text-right text-muted-foreground/25 overflow-hidden pt-8 pb-28 pr-3 pl-4 min-w-12"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are stable positional indices
            <div key={i + 1} className="leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>

        <div className="w-px bg-border/25 shrink-0" />

        {viewMode === "edit" ? (
          <textarea
            ref={textareaRef}
            id="json-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onScroll={(e) => syncGutterScroll(e.currentTarget.scrollTop)}
            placeholder={"{\n  \"paste\": \"your JSON here\"\n}"}
            spellCheck={false}
            wrap="off"
            className="flex-1 resize-none bg-transparent outline-none placeholder:text-muted-foreground/20 pt-8 pb-28 pl-4 pr-6 overflow-auto"
          />
        ) : (
          <pre
            id="json-output"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: pre acts as a focusable read-only editor pane
            tabIndex={0}
            onClick={handleBackToEdit}
            onScroll={(e) => syncGutterScroll(e.currentTarget.scrollTop)}
            className="flex-1 overflow-auto pt-8 pb-28 pl-4 pr-6 cursor-text focus:outline-none whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlightedJson }}
          />
        )}
      </div>

      {viewMode !== "edit" && (
        <div
          id="status-badge"
          className="fixed top-4 right-6 z-50 flex items-center gap-1.5 select-none pointer-events-none"
          style={{ animation: "fade-in 0.2s ease forwards" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
          <span className="font-mono text-xs text-muted-foreground/40 tracking-widest uppercase">
            {viewMode}
          </span>
        </div>
      )}

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

      {error && (
        <div
          id="error-toast"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-start gap-2 rounded-xl border border-destructive/25 bg-background/90 backdrop-blur-xl px-4 py-3 text-destructive text-xs max-w-sm shadow-lg"
          style={{ animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <WarningCircleIcon weight="fill" className="mt-0.5 shrink-0" size={13} />
          <span className="font-mono break-all leading-relaxed">{error}</span>
        </div>
      )}

      <div
        id="floating-toolbar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 rounded-full border border-border bg-background/80 backdrop-blur-xl px-1.5 py-1.5 shadow-2xl"
        style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <ThemeToggle />

        <div className="w-px h-4 bg-border/70 mx-1" />

        {viewMode === "edit" ? (
          <>
            <Button
              id="btn-pretty"
              size="sm"
              onClick={() => process("pretty")}
              disabled={!input.trim()}
              className="rounded-full h-8 px-4 text-xs"
            >
              <BracketsIcon weight="bold" />
              Prettify
            </Button>
            <Button
              id="btn-minify"
              size="sm"
              variant="ghost"
              onClick={() => process("minify")}
              disabled={!input.trim()}
              className="rounded-full h-8 px-4 text-xs"
            >
              <MinusCircleIcon weight="bold" />
              Minify
            </Button>
            {input && (
              <>
                <div className="w-px h-4 bg-border/70 mx-1" />
                <Button
                  id="btn-clear"
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="rounded-full h-8 px-4 text-xs"
                >
                  <EraserIcon weight="bold" />
                  Clear
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button
              id="btn-edit"
              size="sm"
              variant="ghost"
              onClick={handleBackToEdit}
              className="rounded-full h-8 px-4 text-xs"
            >
              <PencilSimpleIcon weight="bold" />
              Edit
            </Button>
            <Button
              id="btn-copy"
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="rounded-full h-8 px-4 text-xs"
            >
              {copied ? (
                <>
                  <CheckIcon weight="bold" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon weight="bold" />
                  Copy
                </>
              )}
            </Button>
            <Button
              id="btn-share"
              size="sm"
              variant="ghost"
              onClick={handleShare}
              className="rounded-full h-8 px-4 text-xs"
            >
              {sharedCopied ? (
                <>
                  <CheckIcon weight="bold" />
                  Shared!
                </>
              ) : (
                <>
                  <LinkIcon weight="bold" />
                  Share
                </>
              )}
            </Button>
            <div className="w-px h-4 bg-border/70 mx-1" />
            <Button
              id="btn-clear"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="rounded-full h-8 px-4 text-xs"
            >
              <EraserIcon weight="bold" />
              Clear
            </Button>
          </>
        )}

        <div className="w-px h-4 bg-border/70 mx-1" />
        <span className="font-mono text-xs text-muted-foreground/50 px-3 select-none tracking-wider">
          ⌘↵
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: zero erros.

- [ ] **Step 3: Iniciar dev server e verificar visualmente**

```bash
npm run dev
```

Abrir http://localhost:5300 e verificar:
- Editor full-screen, sem header/navbar
- Gutter de linhas visível à esquerda com linha separadora
- Toolbar flutuante centrada no bottom com ThemeToggle + Prettify + Minify
- Colar `{"name":"test","value":42}` e clicar Prettify → JSON formatado com syntax highlight (chaves em verde, strings em amarelo, números em ciano)
- Clicar em qualquer parte do `<pre>` → volta ao modo edit
- Clicar Minify → JSON numa linha com syntax highlight
- Status badge "FORMATTED" / "MINIFIED" top-right
- ThemeToggle alterna entre light/dark (cores Dracula em dark)
- ⌘Enter em edit mode → prettify
- Escape em view mode → volta ao edit
- Arrastar ficheiro JSON → overlay "Drop JSON file to load"
- Botão Share → URL com `?json=` na barra + copiado para clipboard
- Colar URL com `?json=` → carrega e formata automaticamente
- JSON inválido → error toast vermelho bottom-center
- JSON com comentários `//` → sanitize toast "N patterns removed"

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home/index.tsx
git commit -m "feat: full-screen JSON editor with toolbar, syntax highlight, drag-drop and URL sharing"
```

---

## Task 7: Cleanup — remove Navbar

**Files:**
- Delete: `src/components/modules/Navbar/index.tsx`

- [ ] **Step 1: Remover o ficheiro Navbar**

```bash
rm src/components/modules/Navbar/index.tsx
```

- [ ] **Step 2: Verificar que nenhum ficheiro importa Navbar**

```bash
grep -r "Navbar" src/ --include="*.tsx" --include="*.ts"
```

Expected: zero resultados.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused Navbar component"
```

---

## Task 8: CI/CD — GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create .github/workflows directory e workflow file**

```bash
mkdir -p .github/workflows
```

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

---

## Task 9: GitHub repo + initial push

**Files:** nenhum (operações git/gh)

- [ ] **Step 1: Criar repositório público no GitHub**

```bash
gh repo create geldopc/myJsonFormatter --public --description "JSON formatter and minifier — portfolio project"
```

Expected: URL do repositório criado, ex: `https://github.com/geldopc/myJsonFormatter`

- [ ] **Step 2: Adicionar remote e fazer initial push**

```bash
git remote add origin https://github.com/geldopc/myJsonFormatter.git
git push -u origin main
```

Expected: push bem-sucedido, todos os commits enviados.

- [ ] **Step 3: Configurar GitHub Pages para usar GitHub Actions**

```bash
gh api repos/geldopc/myJsonFormatter/pages \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -f "build_type=workflow" \
  -f "source[branch]=main" \
  -f "source[path]=/" 2>/dev/null || \
gh api repos/geldopc/myJsonFormatter/pages \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -f "build_type=workflow"
```

Expected: GitHub Pages configurado com source = workflow.

- [ ] **Step 4: Verificar que o deploy foi disparado**

```bash
gh run list --repo geldopc/myJsonFormatter --limit 3
```

Expected: workflow "Deploy to GitHub Pages" aparece com status `in_progress` ou `queued`.

- [ ] **Step 5: Aguardar deploy e verificar URL final**

```bash
gh run watch --repo geldopc/myJsonFormatter
```

Expected: workflow completa com sucesso. Deploy URL: https://geldopc.github.io/myJsonFormatter/

---

## Checklist de verificação final

Após o deploy no GitHub Pages:

- [ ] https://geldopc.github.io/myJsonFormatter/ carrega sem erros
- [ ] Prettify funciona com syntax highlight (light + dark)
- [ ] Minify funciona
- [ ] Share cria URL `?json=` funcional
- [ ] Drag & drop carrega ficheiro JSON
- [ ] ⌘Enter → prettify; Escape → edit
- [ ] Error toast aparece em JSON inválido
- [ ] Sanitize toast aparece ao formatar JSON com comentários JS ou trailing commas
