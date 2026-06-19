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
    scrollbarWidth: "thin",
    scrollbarColor: "color-mix(in oklab, var(--foreground) 22%, transparent) transparent",
  },
  ".cm-scroller::-webkit-scrollbar": { width: "10px", height: "10px" },
  ".cm-scroller::-webkit-scrollbar-track": { backgroundColor: "transparent" },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 22%, transparent)",
    borderRadius: "9999px",
    border: "2px solid transparent",
    backgroundClip: "content-box",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 38%, transparent)",
  },
  ".cm-scroller::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
  ".cm-placeholder": {
    color: "color-mix(in oklab, var(--muted-foreground) 60%, transparent)",
    whiteSpace: "pre",
    lineHeight: "1.625",
  },
  ".cm-content": {
    padding: "0 1.5rem 7rem 1rem",
    caretColor: "var(--foreground)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "var(--background)",
    border: "none",
    color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 0.75rem 0 1rem" },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 7%, transparent)",
    color: "var(--foreground)",
  },
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
