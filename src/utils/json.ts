export type ProcessResult = {
  value: string;
  error: string | null;
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
