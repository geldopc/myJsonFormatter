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
