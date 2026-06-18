import type { EditorView } from "@codemirror/view";
import { Button } from "@elements/Button";
import { Tooltip } from "@elements/Tooltip";
import { JsonEditor } from "@modules/JsonEditor";
import {
  BracketsCurlyIcon,
  CopyIcon,
  EraserIcon,
  LinkIcon,
  MinusCircleIcon,
  SmileyIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { decodeFromUrl, encodeForUrl } from "@utils/encoding";
import { minifyJson, prettifyJson, sanitizeJson } from "@utils/json";
import { isMac } from "@utils/platform";
import { ComicViewer } from "@widgets/ComicViewer";
import { FindReplace } from "@widgets/FindReplace";
import { SuccessBurst } from "@widgets/SuccessBurst";
import { ThemeToggle } from "@widgets/ThemeToggle";
import * as React from "react";
import { toast } from "sonner";

export function Home() {
  const [input, setInput] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [urlLoaded, setUrlLoaded] = React.useState(false);
  const [isFindOpen, setIsFindOpen] = React.useState(false);
  const [isComicOpen, setIsComicOpen] = React.useState(false);
  const [burst, setBurst] = React.useState(0);

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
      toast.error("That doesn't look like JSON", { description: result.error });
      return;
    }
    setInput(result.value);
    setBurst((b) => b + 1);
    const fixCount = removedCount + result.unwrappedCount;
    const fixNote =
      fixCount > 0
        ? `Tidied up ${fixCount} thing${fixCount === 1 ? "" : "s"} along the way.`
        : undefined;
    toast.success(fmt === "pretty" ? "Prettified" : "Minified", {
      description: fixNote ?? (fmt === "pretty" ? "Looking sharp." : "Every byte counts."),
    });
  }

  function clearUrlParam() {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  function handleClear() {
    clearUrlParam();
    setInput("");
    toast("Cleared", { description: "Fresh start." });
  }

  function handleFindClose() {
    setIsFindOpen(false);
  }

  async function handleShare() {
    const encoded = await encodeForUrl(input);
    const url = `${window.location.origin}${window.location.pathname}?json=${encoded}`;
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied", {
      description: "Paste it anywhere — the JSON travels with it.",
    });
  }

  async function handleCopy() {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    toast.success("Copied", { description: "The JSON is on your clipboard." });
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
        toast.success("File loaded", { description: file.name });
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
          onChange={setInput}
          onCreateEditor={(view) => {
            viewRef.current = view;
          }}
        />
        {isFindOpen && <FindReplace view={viewRef.current} onClose={handleFindClose} />}
        <SuccessBurst triggerKey={burst} onDone={() => setBurst(0)} />
      </div>

      <div
        id="floating-toolbar"
        className="-translate-x-1/2 fixed bottom-6 left-1/2 z-50 flex items-center gap-0.5 rounded-full border border-border bg-background/80 px-1.5 py-1.5 shadow-2xl backdrop-blur-xl"
        style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <ThemeToggle />
        <Tooltip label="Comic break">
          <Button
            id="btn-comic"
            variant="ghost"
            size="icon"
            onClick={() => setIsComicOpen(true)}
            className="rounded-full"
          >
            <SmileyIcon weight="bold" />
          </Button>
        </Tooltip>

        <div className="mx-1 h-4 w-px bg-border/70" />

        <Button
          id="btn-pretty"
          size="sm"
          onClick={() => process("pretty")}
          disabled={!input.trim()}
          className="h-8 rounded-full pl-4 pr-2 text-xs"
        >
          <BracketsCurlyIcon weight="bold" />
          Prettify
          <kbd
            id="kbd-pretty"
            className="ml-1 select-none rounded border border-primary-foreground/25 bg-primary-foreground/10 px-1.5 py-0.5 font-mono text-primary-foreground/70 text-xs tracking-tight"
          >
            {isMac() ? "⌘↵" : "Ctrl+↵"}
          </kbd>
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
            <Tooltip label="Copy JSON">
              <Button
                id="btn-copy"
                size="icon"
                variant="ghost"
                onClick={handleCopy}
                className="h-8 w-8 rounded-full"
              >
                <CopyIcon weight="bold" />
              </Button>
            </Tooltip>
            <Tooltip label="Copy share link">
              <Button
                id="btn-share"
                size="icon"
                variant="ghost"
                onClick={handleShare}
                className="h-8 w-8 rounded-full"
              >
                <LinkIcon weight="bold" />
              </Button>
            </Tooltip>
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
          {isMac() ? "⌘F" : "Ctrl+F"}
        </span>
      </div>

      {isComicOpen && <ComicViewer onClose={() => setIsComicOpen(false)} />}
    </div>
  );
}
