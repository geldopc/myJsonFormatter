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
