# Nested JSON-String Unwrapping — Design Spec

**Date:** 2026-06-16
**Status:** Approved

---

## Problema

Hoje, quando o input é (ou contém) uma string que, por sua vez, é JSON válido — ex:

```
"{\"nome\":\"Ana\",\"idade\":28,\"ativo\":true,\"habilidades\":[\"JavaScript\",\"React\"]}"
```

o `JSON.parse` interpreta isso como uma **string comum**. `Prettify`/`Minify` então devolvem
o mesmo valor escapado em uma linha, sem desembrulhar o objeto real que está codificado
dentro da string. O mesmo problema ocorre quando o valor de um campo dentro de um objeto/array
é, por sua vez, uma string JSON-encoded (ex: `{"data": "{\"a\":1}"}`).

## Objetivo

Depois que o input já é JSON sintaticamente válido (após `sanitizeJson` + `JSON.parse`),
percorrer o valor resultante e desembrulhar automaticamente qualquer string cujo conteúdo
também seja JSON válido — recursivamente, em qualquer profundidade, tanto no nível raiz
quanto em campos internos de objetos/arrays.

### Fora de escopo

- Detecção de JSON "quase válido" dentro de uma string (ex: JSON5/comentários dentro do
  texto desembrulhado) — se a string desembrulhada não for JSON estritamente válido, ela
  permanece como string normal.
- Desembrulhar strings cujo conteúdo parseado seja `number`, `boolean`, `null` ou outra
  `string` — só desembrulha quando o resultado for objeto (`{}`) ou array (`[]`). Isso evita
  transformar campos como `"123"` ou `"true"` (strings legítimas que coincidentemente
  parseiam como outro tipo primitivo) em algo diferente do que o usuário colou.
- Qualquer prompt de confirmação — o desembrulhamento é automático, sem pergunta ao usuário.

## Arquitetura

Tudo em [`src/utils/json.ts`](../../../src/utils/json.ts).

### Novo helper privado

```ts
function deepUnwrapJsonStrings(value: unknown): { value: unknown; unwrappedCount: number }
```

- `value` é array (`Array.isArray`) → mapeia cada item recursivamente, soma os counts.
- `value` é objeto plano (`typeof === "object"`, não nulo, não array) → mapeia cada
  propriedade recursivamente, soma os counts.
- `value` é string → tenta `JSON.parse(value)` dentro de um `try/catch`:
  - sucesso **e** resultado é objeto plano ou array → chama `deepUnwrapJsonStrings` no
    resultado (cobre múltiplas camadas de encoding) e soma `1 + count` interno.
  - qualquer outro caso (parse falha, ou resultado é number/boolean/null/string) → mantém a
    string original, count `0`.
- qualquer outro tipo (`number`, `boolean`, `null`) → retorna como está, count `0`.

### Integração em `prettifyJson` / `minifyJson`

Ambas já fazem `JSON.parse(input)`. Passo extra entre o parse e o `JSON.stringify`:

```ts
const parsed = JSON.parse(input);
const { value: unwrapped, unwrappedCount } = deepUnwrapJsonStrings(parsed);
return { value: JSON.stringify(unwrapped, null, 2), error: null, unwrappedCount };
```

`ProcessResult` ganha um campo novo, sempre presente (sem opcional, mesmo padrão de
`SanitizeResult.removedCount`):

```ts
export type ProcessResult = {
  value: string;
  error: string | null;
  unwrappedCount: number;
};
```

### UI (`src/pages/Home/index.tsx`)

`process()` hoje soma só `removedCount` (do `sanitizeJson`) para decidir se mostra o toast.
Passa a somar `removedCount + result.unwrappedCount` num único contador exibido no mesmo
toast (`sanitizedCount`/`sanitize-toast`). O texto do toast deixa de ser
`"{n} invalid pattern(s) removed"` e passa a ser mais neutro, cobrindo os dois casos:

```
"{n} fix(es) applied"
```

Não há toast separado — um único contador e uma única mensagem para qualquer ajuste
automático (comentários, vírgulas finais, aspas sobre-escapadas, ou strings JSON
desembrulhadas).

## Casos de teste (verificação manual via script, sem framework de teste no projeto)

1. Input inteiro é uma string JSON-encoded (exemplo do usuário) → objeto desembrulhado e
   formatado.
2. Campo interno é string JSON-encoded (`{"data": "{\"a\":1}"}`) → campo `data` se torna
   objeto aninhado.
3. Múltiplas camadas (string dentro de string dentro de objeto) → desembrulha todas.
4. Array de strings, algumas JSON-encoded e outras texto comum → só as JSON-encoded (que
   resultam em objeto/array) são desembrulhadas; o resto permanece string.
5. String que parseia para number/boolean/null (`"123"`, `"true"`) → permanece string,
   sem desembrulhar.
6. JSON normal, sem nenhuma string encoded → `unwrappedCount` é `0`, comportamento idêntico
   ao atual.
7. Minify segue a mesma lógica (mesmo helper compartilhado).
