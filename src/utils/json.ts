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
  let result = "";
  let i = 0;

  while (i < input.length) {
    if (input[i] === '"') {
      result += input[i++];
      while (i < input.length) {
        if (input[i] === "\\") {
          result += input[i++];
          if (i < input.length) result += input[i++];
        } else if (input[i] === '"') {
          result += input[i++];
          break;
        } else {
          result += input[i++];
        }
      }
      continue;
    }

    if (input[i] === "/" && i + 1 < input.length && input[i + 1] === "/") {
      while (i < input.length && input[i] !== "\n") i++;
      removedCount++;
      continue;
    }

    if (input[i] === "/" && i + 1 < input.length && input[i + 1] === "*") {
      i += 2;
      while (i < input.length) {
        if (input[i] === "*" && i + 1 < input.length && input[i + 1] === "/") {
          i += 2;
          break;
        }
        i++;
      }
      removedCount++;
      continue;
    }

    result += input[i++];
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
