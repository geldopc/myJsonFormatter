import { json } from "@codemirror/lang-json";
import { codeFolding, foldGutter, foldKeymap } from "@codemirror/language";
import { search } from "@codemirror/search";
import { type EditorView, keymap, placeholder } from "@codemirror/view";
import { CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import CodeMirror from "@uiw/react-codemirror";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { editorTheme } from "@/utils/codemirror/theme";

const PLACEHOLDER = '{\n  "paste": "your JSON here"\n}';

const markerOpen = renderToStaticMarkup(createElement(CaretDownIcon, { size: 12, weight: "bold" }));
const markerClosed = renderToStaticMarkup(
  createElement(CaretRightIcon, { size: 12, weight: "bold" })
);

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCreateEditor: (view: EditorView) => void;
}

export function JsonEditor({ value, onChange, onCreateEditor }: JsonEditorProps) {
  return (
    <div id="json-editor" className="flex-1 overflow-hidden">
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        theme="none"
        extensions={[
          json(),
          search({ top: true }),
          placeholder(PLACEHOLDER),
          editorTheme,
          codeFolding(),
          foldGutter({
            markerDOM(open) {
              const span = document.createElement("span");
              span.innerHTML = open ? markerOpen : markerClosed;
              return span;
            },
          }),
          keymap.of(foldKeymap),
        ]}
        basicSetup={{
          searchKeymap: false,
          highlightSelectionMatches: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: true,
          lineNumbers: true,
        }}
        height="100%"
        className="h-full"
      />
    </div>
  );
}
