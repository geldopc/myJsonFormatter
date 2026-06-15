export type ProcessResult = {
  value: string;
  error: string | null;
};

export function formatJson(input: string): ProcessResult {
  try {
    const parsed = JSON.parse(input);
    return { value: JSON.stringify(parsed, null, 2), error: null };
  } catch (e) {
    return { value: "", error: (e as Error).message };
  }
}

export function sanitizeJson(input: string): ProcessResult {
  let cleaned = input.trim();

  // Unwrap stringified JSON (common when JSON is double-serialized)
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    try {
      const unwrapped = JSON.parse(cleaned);
      if (typeof unwrapped === "string") {
        cleaned = unwrapped;
      }
    } catch {}
  }

  // Normalize double-escaped sequences: \\n → \n, \\t → \t, \\\" → \"
  cleaned = cleaned
    .replace(/\\\\n/g, "\\n")
    .replace(/\\\\t/g, "\\t")
    .replace(/\\\\r/g, "\\r")
    .replace(/\\\\"/g, '\\"')
    .replace(/\\\\\//g, "\\/");

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Remove non-printable control characters (except \n \t \r)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return formatJson(cleaned);
}
