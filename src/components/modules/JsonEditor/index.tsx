import { json } from "@codemirror/lang-json";
import { search } from "@codemirror/search";
import type { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { editorTheme } from "@/utils/codemirror/theme";

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
        extensions={[json(), search({ top: true }), editorTheme]}
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
