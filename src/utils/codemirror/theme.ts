import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "0.875rem",
  },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    lineHeight: "1.625",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "2rem 1.5rem 7rem 1rem",
    caretColor: "var(--foreground)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 0.75rem 0 1rem" },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 15%, transparent)",
  },
  ".cm-searchMatch": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 12%, transparent)",
    borderRadius: "2px",
  },
  ".cm-searchMatch-selected": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 30%, transparent)",
  },
  ".cm-panels": { display: "none" },
});

const highlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: "var(--json-color-key)" },
  { tag: t.string, color: "var(--json-color-string)" },
  { tag: t.number, color: "var(--json-color-number)" },
  { tag: t.bool, color: "var(--json-color-boolean)" },
  { tag: t.null, color: "var(--json-color-null)" },
  {
    tag: [t.separator, t.squareBracket, t.brace],
    color: "var(--json-color-punct)",
  },
]);

export const editorTheme: Extension = [baseTheme, syntaxHighlighting(highlightStyle)];
