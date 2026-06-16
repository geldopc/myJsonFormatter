export type ProcessResult = {
  value: string;
  error: string | null;
  unwrappedCount: number;
};

export type SanitizeResult = {
  value: string;
  removedCount: number;
};

function isFullyEscapedQuotes(input: string): boolean {
  let hasQuote = false;

  for (let i = 0; i < input.length; i++) {
    if (input[i] !== '"') continue;
    hasQuote = true;

    let backslashes = 0;
    let j = i - 1;
    while (j >= 0 && input[j] === "\\") {
      backslashes++;
      j--;
    }
    if (backslashes % 2 === 0) return false;
  }

  return hasQuote;
}

function unescapeQuotes(input: string): SanitizeResult {
  let result = "";
  let removedCount = 0;
  let i = 0;

  while (i < input.length) {
    if (input[i] === "\\" && input[i + 1] === '"') {
      result += '"';
      removedCount++;
      i += 2;
      continue;
    }
    result += input[i++];
  }

  return { value: result, removedCount };
}

export function sanitizeJson(input: string): SanitizeResult {
  let removedCount = 0;
  let workingInput = input;

  if (isFullyEscapedQuotes(input)) {
    const unescaped = unescapeQuotes(input);
    workingInput = unescaped.value;
    removedCount += unescaped.removedCount;
  }

  let result = "";
  let i = 0;

  while (i < workingInput.length) {
    if (workingInput[i] === '"') {
      result += workingInput[i++];
      while (i < workingInput.length) {
        if (workingInput[i] === "\\") {
          result += workingInput[i++];
          if (i < workingInput.length) result += workingInput[i++];
        } else if (workingInput[i] === '"') {
          result += workingInput[i++];
          break;
        } else {
          result += workingInput[i++];
        }
      }
      continue;
    }

    if (workingInput[i] === "/" && i + 1 < workingInput.length && workingInput[i + 1] === "/") {
      while (i < workingInput.length && workingInput[i] !== "\n") i++;
      removedCount++;
      continue;
    }

    if (workingInput[i] === "/" && i + 1 < workingInput.length && workingInput[i + 1] === "*") {
      i += 2;
      while (i < workingInput.length) {
        if (workingInput[i] === "*" && i + 1 < workingInput.length && workingInput[i + 1] === "/") {
          i += 2;
          break;
        }
        i++;
      }
      removedCount++;
      continue;
    }

    result += workingInput[i++];
  }

  result = result.replace(/,(\s*[}\]])/g, (_, p1) => {
    removedCount++;
    return p1;
  });

  return { value: result, removedCount };
}

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

  const isObjectOrArray =
    Array.isArray(current) || (current !== null && typeof current === "object");
  if (layers === 0 || !isObjectOrArray) {
    return { value: original, unwrappedCount: 0 };
  }

  const nested = deepUnwrapJsonStrings(current);
  return { value: nested.value, unwrappedCount: nested.unwrappedCount + layers };
}

export function prettifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    const { value, unwrappedCount } = deepUnwrapJsonStrings(parsed);
    return { value: JSON.stringify(value, null, 2), error: null, unwrappedCount };
  } catch (e) {
    return { value: "", error: (e as Error).message, unwrappedCount: 0 };
  }
}

export function minifyJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    const { value, unwrappedCount } = deepUnwrapJsonStrings(parsed);
    return { value: JSON.stringify(value), error: null, unwrappedCount };
  } catch (e) {
    return { value: "", error: (e as Error).message, unwrappedCount: 0 };
  }
}
