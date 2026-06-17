import type { EditorView } from "@codemirror/view";
import { Button } from "@elements/Button";
import { JsonEditor } from "@modules/JsonEditor";
import {
  BracketsCurlyIcon,
  BroomIcon,
  CheckIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  MinusCircleIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { decodeFromUrl, encodeForUrl } from "@utils/encoding";
import { minifyJson, prettifyJson, sanitizeJson } from "@utils/json";
import { isMac } from "@utils/platform";
import { FindReplace } from "@widgets/FindReplace";
import { ThemeToggle } from "@widgets/ThemeToggle";
import * as React from "react";

export function Home() {
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [sharedCopied, setSharedCopied] = React.useState(false);
  const [sanitizedCount, setSanitizedCount] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [urlLoaded, setUrlLoaded] = React.useState(false);
  const [isFindOpen, setIsFindOpen] = React.useState(false);

  const viewRef = React.useRef<EditorView | null>(null);

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("json");
    if (!param) {
      setUrlLoaded(true);
      return;
    }
    decodeFromUrl(param)
      .then((json) => setInput(json))
      .catch(() => {})
      .finally(() => setUrlLoaded(true));
  }, []);

  function process(fmt: "pretty" | "minify") {
    if (!input.trim()) return;
    const { value: sanitized, removedCount } = sanitizeJson(input);
    const result = fmt === "pretty" ? prettifyJson(sanitized) : minifyJson(sanitized);
    if (result.error) {
      setError(result.error);
      return;
    }
    setInput(result.value);
    setError(null);
    const fixCount = removedCount + result.unwrappedCount;
    if (fixCount > 0) {
      setSanitizedCount(fixCount);
      setTimeout(() => setSanitizedCount(0), 4000);
    }
  }

  function clearUrlParam() {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function handleClear() {
    clearUrlParam();
    setInput("");
    setError(null);
  }

  function handleFindClose() {
    setIsFindOpen(false);
  }

  function handleEditorChange(value: string) {
    setInput(value);
    if (error) setError(null);
  }

  async function handleShare() {
    const encoded = await encodeForUrl(input);
    const url = `${window.location.origin}${window.location.pathname}?json=${encoded}`;
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url);
    setSharedCopied(true);
    setTimeout(() => setSharedCopied(false), 2000);
  }

  async function handleCopy() {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setInput(text);
        setError(null);
      }
    };
    reader.readAsText(file);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: process is stable per render; input is its captured dep
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        process("pretty");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsFindOpen((v) => !v);
      }
      if (e.key === "Escape" && isFindOpen) {
        setIsFindOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input, isFindOpen]);

  if (!urlLoaded) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop container needs native drag events
    <div
      id="home"
      className="relative flex flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          id="drag-overlay"
          aria-hidden="true"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 border-2 border-foreground/20 border-dashed bg-background/85 backdrop-blur-sm pointer-events-none"
          style={{ animation: "fade-in 0.15s ease forwards" }}
        >
          <UploadSimpleIcon weight="thin" size={48} className="opacity-40" />
          <span className="select-none font-mono text-muted-foreground/60 text-xs uppercase tracking-widest">
            Drop JSON file to load
          </span>
        </div>
      )}

      <div
        id="editor-area"
        className="relative flex flex-1 overflow-hidden font-mono text-sm leading-relaxed"
      >
        <JsonEditor
          value={input}
          onChange={handleEditorChange}
          onCreateEditor={(view) => {
            viewRef.current = view;
          }}
        />
        {isFindOpen && <FindReplace view={viewRef.current} onClose={handleFindClose} />}
      </div>

      {sanitizedCount > 0 && (
        <div
          id="sanitize-toast"
          className="-translate-x-1/2 fixed bottom-24 left-1/2 z-50 flex max-w-sm items-center gap-2 rounded-xl border border-border bg-background/90 px-4 py-3 text-foreground/60 text-xs shadow-lg backdrop-blur-xl"
          style={{ animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <BroomIcon weight="duotone" className="shrink-0" size={13} />
          <span className="font-mono leading-relaxed">
            {sanitizedCount} fix{sanitizedCount === 1 ? "" : "es"} applied
          </span>
        </div>
      )}

      {error && (
        <div
          id="error-toast"
          className="-translate-x-1/2 fixed bottom-24 left-1/2 z-50 flex max-w-sm items-start gap-2 rounded-xl border border-destructive/25 bg-background/90 px-4 py-3 text-destructive text-xs shadow-lg backdrop-blur-xl"
          style={{ animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <WarningCircleIcon weight="fill" className="mt-0.5 shrink-0" size={13} />
          <span className="break-all font-mono leading-relaxed">{error}</span>
        </div>
      )}

      <div
        id="floating-toolbar"
        className="-translate-x-1/2 fixed bottom-6 left-1/2 z-50 flex items-center gap-0.5 rounded-full border border-border bg-background/80 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl"
        style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <ThemeToggle />

        <div className="mx-1 h-4 w-px bg-border/70" />

        <Button
          id="btn-pretty"
          size="sm"
          onClick={() => process("pretty")}
          disabled={!input.trim()}
          className="h-8 rounded-full px-4 text-xs"
        >
          <BracketsCurlyIcon weight="bold" />
          Prettify
        </Button>
        <Button
          id="btn-minify"
          size="sm"
          variant="ghost"
          onClick={() => process("minify")}
          disabled={!input.trim()}
          className="h-8 rounded-full px-4 text-xs"
        >
          <MinusCircleIcon weight="bold" />
          Minify
        </Button>

        {input && (
          <>
            <div className="mx-1 h-4 w-px bg-border/70" />
            <Button
              id="btn-copy"
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8 rounded-full px-4 text-xs"
            >
              {copied ? (
                <>
                  <CheckIcon weight="bold" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon weight="bold" />
                  Copy
                </>
              )}
            </Button>
            <Button
              id="btn-share"
              size="sm"
              variant="ghost"
              onClick={handleShare}
              className="h-8 rounded-full px-4 text-xs"
            >
              {sharedCopied ? (
                <>
                  <CheckIcon weight="bold" />
                  Shared!
                </>
              ) : (
                <>
                  <LinkIcon weight="bold" />
                  Share
                </>
              )}
            </Button>
            <Button
              id="btn-clear"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-8 rounded-full px-4 text-xs"
            >
              <EraserIcon weight="bold" />
              Clear
            </Button>
          </>
        )}

        <div className="mx-1 h-4 w-px bg-border/70" />
        <span className="select-none px-3 font-mono text-muted-foreground/50 text-xs tracking-wider">
          {isMac() ? "⌘↵  ·  ⌘F" : "Ctrl+↵  ·  Ctrl+F"}
        </span>
      </div>
    </div>
  );
}
