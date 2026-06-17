import * as React from "react";
import {
  BracketsCurlyIcon,
  BroomIcon,
  CheckIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  MinusCircleIcon,
  PencilSimpleIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@elements/Button";
import { ThemeToggle } from "@widgets/ThemeToggle";
import { FindReplace } from "@widgets/FindReplace";
import { prettifyJson, minifyJson, sanitizeJson } from "@utils/json";
import { highlightJson } from "@utils/jsonHighlight";
import { decodeFromUrl, encodeForUrl } from "@utils/encoding";
import { isMac } from "@utils/platform";

type ViewMode = "edit" | "formatted" | "minified";

export function Home() {
  const [input, setInput] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("edit");
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [sharedCopied, setSharedCopied] = React.useState(false);
  const [sanitizedCount, setSanitizedCount] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [urlLoaded, setUrlLoaded] = React.useState(false);
  const [isFindOpen, setIsFindOpen] = React.useState(false);

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("json");
    if (!param) {
      setUrlLoaded(true);
      return;
    }
    decodeFromUrl(param)
      .then((json) => {
        setInput(json);
        setViewMode("formatted");
      })
      .catch(() => {})
      .finally(() => setUrlLoaded(true));
  }, []);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);

  const lineCount = React.useMemo(
    () => Math.max(1, input.split("\n").length),
    [input]
  );

  const highlightedJson = React.useMemo(
    () => (viewMode !== "edit" ? highlightJson(input) : ""),
    [input, viewMode]
  );

  function process(fmt: "pretty" | "minify") {
    if (!input.trim()) return;
    const { value: sanitized, removedCount } = sanitizeJson(input);
    const result = fmt === "pretty" ? prettifyJson(sanitized) : minifyJson(sanitized);
    if (result.error) {
      setError(result.error);
      setViewMode("edit");
    } else {
      setInput(result.value);
      setError(null);
      const fixCount = removedCount + result.unwrappedCount;
      if (fixCount > 0) {
        setSanitizedCount(fixCount);
        setTimeout(() => setSanitizedCount(0), 4000);
      }
      setViewMode(fmt === "pretty" ? "formatted" : "minified");
    }
  }

  function clearUrlParam() {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function handleBackToEdit() {
    clearUrlParam();
    setViewMode("edit");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleClear() {
    clearUrlParam();
    setInput("");
    setError(null);
    setViewMode("edit");
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
        setViewMode("edit");
      }
    };
    reader.readAsText(file);
  }

  function handleFindClose() {
    setIsFindOpen(false);
  }

  function syncGutterScroll(scrollTop: number) {
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (viewMode === "edit") process("pretty");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        if (isFindOpen) {
          setIsFindOpen(false);
          return;
        }
        if (viewMode !== "edit") handleBackToEdit();
        setIsFindOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && viewMode !== "edit") {
        e.preventDefault();
        if (preRef.current) window.getSelection()?.selectAllChildren(preRef.current);
      }
      if (e.key === "Escape") {
        if (isFindOpen) {
          setIsFindOpen(false);
          return;
        }
        if (viewMode !== "edit") handleBackToEdit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode, input, isFindOpen]);

  if (!urlLoaded) return null;

  return (
    <div
      id="home"
      className="flex flex-1 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          id="drag-overlay"
          aria-hidden="true"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm border-2 border-dashed border-foreground/20 pointer-events-none"
          style={{ animation: "fade-in 0.15s ease forwards" }}
        >
          <UploadSimpleIcon weight="thin" size={48} className="opacity-40" />
          <span className="font-mono text-xs text-muted-foreground/60 tracking-widest uppercase select-none">
            Drop JSON file to load
          </span>
        </div>
      )}

      <div
        id="editor-area"
        className="relative flex flex-1 overflow-hidden font-mono text-sm leading-relaxed"
      >
        <div
          ref={gutterRef}
          id="line-gutter"
          aria-hidden="true"
          className="shrink-0 select-none text-right text-muted-foreground/25 overflow-hidden pt-8 pb-28 pr-3 pl-4 min-w-12"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are stable positional indices
            <div key={i + 1} className="leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>

        <div className="w-px bg-border/25 shrink-0" />

        {viewMode === "edit" ? (
          <textarea
            ref={textareaRef}
            id="json-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onScroll={(e) => syncGutterScroll(e.currentTarget.scrollTop)}
            placeholder={"{\n  \"paste\": \"your JSON here\"\n}"}
            spellCheck={false}
            wrap="off"
            className="flex-1 resize-none bg-transparent outline-none text-foreground dark:text-white dark:subpixel-antialiased placeholder:text-muted-foreground/60 pt-8 pb-28 pl-4 pr-6 overflow-auto"
          />
        ) : (
          <pre
            ref={preRef}
            id="json-output"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: pre acts as a focusable read-only editor pane
            tabIndex={0}
            onClick={handleBackToEdit}
            onScroll={(e) => syncGutterScroll(e.currentTarget.scrollTop)}
            className="flex-1 overflow-auto pt-8 pb-28 pl-4 pr-6 cursor-text focus:outline-none whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlightedJson }}
          />
        )}
        {isFindOpen && (
          <FindReplace
            value={input}
            textareaRef={textareaRef}
            onChange={setInput}
            onClose={handleFindClose}
          />
        )}
      </div>

      {viewMode !== "edit" && (
        <div
          id="status-badge"
          className="fixed top-4 right-6 z-50 flex items-center gap-1.5 select-none pointer-events-none"
          style={{ animation: "fade-in 0.2s ease forwards" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
          <span className="font-mono text-xs text-muted-foreground/40 tracking-widest uppercase">
            {viewMode}
          </span>
        </div>
      )}

      {sanitizedCount > 0 && (
        <div
          id="sanitize-toast"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-border bg-background/90 backdrop-blur-xl px-4 py-3 text-foreground/60 text-xs max-w-sm shadow-lg"
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
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-start gap-2 rounded-xl border border-destructive/25 bg-background/90 backdrop-blur-xl px-4 py-3 text-destructive text-xs max-w-sm shadow-lg"
          style={{ animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <WarningCircleIcon weight="fill" className="mt-0.5 shrink-0" size={13} />
          <span className="font-mono break-all leading-relaxed">{error}</span>
        </div>
      )}

      <div
        id="floating-toolbar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 rounded-full border border-border bg-background/80 backdrop-blur-xl px-1.5 py-1.5 shadow-2xl"
        style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <ThemeToggle />

        <div className="w-px h-4 bg-border/70 mx-1" />

        {viewMode === "edit" ? (
          <>
            <Button
              id="btn-pretty"
              size="sm"
              onClick={() => process("pretty")}
              disabled={!input.trim()}
              className="rounded-full h-8 px-4 text-xs"
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
              className="rounded-full h-8 px-4 text-xs"
            >
              <MinusCircleIcon weight="bold" />
              Minify
            </Button>
            {input && (
              <>
                <div className="w-px h-4 bg-border/70 mx-1" />
                <Button
                  id="btn-clear"
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="rounded-full h-8 px-4 text-xs"
                >
                  <EraserIcon weight="bold" />
                  Clear
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button
              id="btn-edit"
              size="sm"
              variant="ghost"
              onClick={handleBackToEdit}
              className="rounded-full h-8 px-4 text-xs"
            >
              <PencilSimpleIcon weight="bold" />
              Edit
            </Button>
            <Button
              id="btn-copy"
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="rounded-full h-8 px-4 text-xs"
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
              className="rounded-full h-8 px-4 text-xs"
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
            <div className="w-px h-4 bg-border/70 mx-1" />
            <Button
              id="btn-clear"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="rounded-full h-8 px-4 text-xs"
            >
              <EraserIcon weight="bold" />
              Clear
            </Button>
          </>
        )}

        <div className="w-px h-4 bg-border/70 mx-1" />
        <span className="font-mono text-xs text-muted-foreground/50 px-3 select-none tracking-wider">
          {isMac() ? "⌘↵  ·  ⌘F" : "Ctrl+↵  ·  Ctrl+F"}
        </span>
      </div>
    </div>
  );
}
