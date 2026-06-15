# MyJsonFormatter — Design Spec

**Date:** 2026-06-15  
**Status:** Approved  
**Deploy:** https://geldopc.github.io/myJsonFormatter/

---

## Objetivo

Segundo projeto de portfólio: um formatter/minifier de JSON com a mesma qualidade visual e técnica do MyXmlFormatter. Mirror exacto do padrão já estabelecido, adaptado para JSON.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Estilos | Tailwind CSS v4 |
| Lint/Format | Biome 2 |
| Routing | react-router-dom v7 |
| Ícones | @phosphor-icons/react (sempre com sufixo `Icon`) |
| Componentes | shadcn/ui (Button, etc.) |
| Design pattern | Atomic: elements / widgets / modules / templates / pages |

---

## Configuração de Projecto

### vite.config.ts

```ts
base: "/myJsonFormatter/"
server: { port: 5300, strictPort: true }
```

Aliases:
```ts
"@"         → ./src
"@elements" → ./src/components/elements
"@widgets"  → ./src/components/widgets
"@modules"  → ./src/components/modules
"@templates"→ ./src/components/templates
"@pages"    → ./src/pages
"@utils"    → ./src/utils
"@hooks"    → ./src/hooks
```

### Router

```ts
createBrowserRouter([...], { basename: import.meta.env.BASE_URL })
```

### vite-env.d.ts

```ts
/// <reference types="vite/client" />
```

---

## Estrutura de Ficheiros

### Ficheiros a criar

```
src/utils/jsonHighlight.ts
src/utils/encoding.ts
src/vite-env.d.ts
.github/workflows/deploy.yml
```

### Ficheiros a reescrever

```
src/pages/Home/index.tsx      — reescrita completa (full-screen editor)
src/utils/json.ts             — novo sanitize com SanitizeResult + removedCount
vite.config.ts                — adicionar base + server.port
src/index.css                 — adicionar CSS variables JSON highlight
src/routes/index.tsx          — garantir basename: import.meta.env.BASE_URL
```

### Ficheiros a remover

```
src/components/modules/Navbar/index.tsx  — sem header/navbar no app
```

### Ficheiros que não mudam

```
src/App.tsx
src/main.tsx
src/components/elements/Button/index.tsx
src/components/templates/AppLayout/index.tsx
src/components/widgets/ThemeToggle/index.tsx
src/hooks/Theme/index.ts
src/providers/Theme/index.tsx
src/utils/css.ts
package.json, biome.json, tsconfig.*, components.json
```

---

## Home Page — Editor Full-Screen

### Layout

- Sem header/navbar — app ocupa 100% da viewport
- Div raiz `flex flex-1 overflow-hidden relative` com drag & drop handlers
- Editor area: gutter de números de linha (`gutterRef`) + divisor vertical `1px` + textarea/pre
- Gutter sincronizado com textarea/pre via `onScroll → syncGutterScroll`

### Modos de visualização

| Mode | Componente | Comportamento |
|------|-----------|--------------|
| `"edit"` | `<textarea>` | Input editável |
| `"formatted"` | `<pre>` com highlight | Clique → volta a edit |
| `"minified"` | `<pre>` com highlight | Clique → volta a edit |

### Floating Toolbar

Posição: `fixed bottom-6 left-1/2 -translate-x-1/2`, `rounded-full border backdrop-blur-xl`.

**Edit mode:**
```
ThemeToggle | sep | [Prettify] [Minify] | sep | [Clear] | sep | ⌘↵
```

**View mode:**
```
ThemeToggle | sep | [Edit] [Copy] [Share] | sep | [Clear] | sep | ⌘↵
```

### Status Badge

`fixed top-4 right-6 z-50` — ponto verde + "FORMATTED" ou "MINIFIED" (só visível em view mode).

### Toasts (bottom-center, slide-up animation)

- **Error toast:** `border-destructive/25 text-destructive` com `WarningCircleIcon`
- **Sanitize toast:** `text-foreground/60` com `BroomIcon` — "N patterns removed"

### Drag & Drop

Handlers na div raiz: `onDragOver`, `onDragLeave`, `onDragEnd`, `onDrop`.  
Overlay absoluto `z-40`: `UploadSimpleIcon` + "Drop JSON file to load".

### Atalhos Globais

Via `window.addEventListener("keydown")`:
- `⌘Enter` → prettify (em edit mode)
- `Escape` → volta ao edit (em view mode)

---

## JSON Utilities (`src/utils/json.ts`)

### Tipos

```ts
type ProcessResult = { value: string; error: string | null }
type SanitizeResult = { value: string; removedCount: number }
```

### Funções

**`sanitizeJson(input: string): SanitizeResult`**
- Remove comentários de linha: `// ...`
- Remove comentários de bloco: `/* ... */`
- Remove trailing commas antes de `}` e `]`
- Retorna `{ value, removedCount }` onde `removedCount` é o total de padrões removidos

**`prettifyJson(input: string): ProcessResult`**
- `JSON.parse(input)` + `JSON.stringify(parsed, null, 2)`

**`minifyJson(input: string): ProcessResult`**
- `JSON.stringify(JSON.parse(input))`

### Fluxo de processamento (Home)

```
input → sanitizeJson → se removedCount > 0: mostrar toast
      → prettifyJson ou minifyJson → se error: toast erro
      → setInput(result.value) → setViewMode("formatted" | "minified")
```

---

## JSON Syntax Highlight (`src/utils/jsonHighlight.ts`)

Tokenizador manual (sem dependência externa). Exporta `highlightJson(json: string): string`.

### Tokens e cores

| Token | Contexto | Light | Dark (Dracula) |
|-------|---------|-------|----------------|
| string-key | Chave de objecto `"key":` | `#1a8300` | `#50fa7b` |
| string-value | Valor string | `#c07000` | `#f1fa8c` |
| number | Número | `#0077cc` | `#8be9fd` |
| boolean/null | `true`, `false`, `null` | `#c026a5` | `#ff79c6` |
| punctuation | `{ } [ ] : ,` | `#c026a5` | `#ff79c6` |

**Distinção key/value:** uma string é `string-key` se, após ignorar whitespace, o próximo token não-whitespace for `:`. Caso contrário é `string-value`. O tokenizador faz lookahead após consumir a string.

**Segurança:** `escapeHtml()` antes de injectar qualquer string nos spans.  
**Performance:** resultado memoizado com `useMemo` na Home.  
**Injecção:** `dangerouslySetInnerHTML` no `<pre>`.

### CSS Variables (`index.css`)

```css
/* light */
:root {
  --json-color-key: #1a8300;
  --json-color-string: #c07000;
  --json-color-number: #0077cc;
  --json-color-boolean: #c026a5;
  --json-color-null: #c026a5;
  --json-color-punct: #c026a5;
}

/* dark */
.dark {
  --json-color-key: #50fa7b;
  --json-color-string: #f1fa8c;
  --json-color-number: #8be9fd;
  --json-color-boolean: #ff79c6;
  --json-color-null: #ff79c6;
  --json-color-punct: #ff79c6;
}
```

---

## URL Sharing (`src/utils/encoding.ts`)

Idêntico ao myXmlFormatter. Usa `CompressionStream("gzip")` nativo (sem npm).

```ts
export async function encodeForUrl(json: string): Promise<string>
export async function decodeFromUrl(param: string): Promise<string>
```

URL param: `?json=<gzip+base64url>`.

### Fluxo

1. **Mount:** `useEffect` lê `?json=`, decodifica, seta `input` e `viewMode("formatted")`
2. **urlLoaded guard:** `return null` enquanto não terminou de carregar (evita flash)
3. **Share:** `encodeForUrl(input)` → `replaceState` → `clipboard.writeText(url)`
4. **Back to edit / Clear:** chama `clearUrlParam()` → `replaceState` para pathname limpo

---

## CI/CD

### `.github/workflows/deploy.yml`

```yaml
on: push (main) + workflow_dispatch
permissions: contents: read, pages: write, id-token: write
jobs:
  build: checkout → setup-node@v4 (node 20) → npm ci → npm run build → upload-pages-artifact
  deploy: needs build → deploy-pages
```

### GitHub Pages

- Source: **GitHub Actions** (não branch)
- URL: `https://geldopc.github.io/myJsonFormatter/`

---

## Git & GitHub

- Repositório: `github.com/geldopc/myJsonFormatter` (público) — criado via `gh repo create`
- `git config user.name "Geldo Pina Costa"`
- `git config user.email "geldopc@gmail.com"`
- Sem `Co-Authored-By` em nenhum commit
- Commit inicial + push para `main`

---

## Ordem de Implementação

1. Ajustar `vite.config.ts` (base + port)
2. Criar `src/vite-env.d.ts`
3. Actualizar `src/routes/index.tsx` (basename)
4. Reescrever `src/utils/json.ts` (SanitizeResult + removedCount + remoção comentários)
5. Criar `src/utils/jsonHighlight.ts`
6. Criar `src/utils/encoding.ts`
7. Adicionar CSS variables JSON em `src/index.css`
8. Reescrever `src/pages/Home/index.tsx` (full-screen editor, toolbar, toasts, drag-drop, URL sharing)
9. Remover `src/components/modules/Navbar/index.tsx`
10. Criar `.github/workflows/deploy.yml`
11. `gh repo create geldopc/myJsonFormatter --public`
12. `git init` + `git config` + commit inicial + `git push`
