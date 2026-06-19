import { foldAll, unfoldAll } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { Button } from "@elements/Button";
import { Tooltip } from "@elements/Tooltip";
import { useTheme } from "@hooks/Theme";
import { JsonEditor } from "@modules/JsonEditor";
import {
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  BracketsCurlyIcon,
  CopyIcon,
  EraserIcon,
  InfoIcon,
  LinkIcon,
  MinusCircleIcon,
  SmileyIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { decodeFromUrl, encodeForUrl } from "@utils/encoding";
import { minifyJson, prettifyJson, sanitizeJson } from "@utils/json";
import { isMac } from "@utils/platform";
import { BorderGlow } from "@widgets/BorderGlow";
import { FindReplace } from "@widgets/FindReplace";
import { ThemeToggle } from "@widgets/ThemeToggle";
import * as React from "react";
import { toast } from "sonner";

const ComicViewer = React.lazy(() =>
  import("@widgets/ComicViewer").then((m) => ({ default: m.ComicViewer }))
);
const InfoModal = React.lazy(() =>
  import("@widgets/InfoModal").then((m) => ({ default: m.InfoModal }))
);
const SuccessBurst = React.lazy(() =>
  import("@widgets/SuccessBurst").then((m) => ({ default: m.SuccessBurst }))
);

export function Home() {
  const [input, setInput] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [urlLoaded, setUrlLoaded] = React.useState(false);
  const [isFindOpen, setIsFindOpen] = React.useState(false);
  const [isComicOpen, setIsComicOpen] = React.useState(false);
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);
  const [burst, setBurst] = React.useState(0);

  const { theme } = useTheme();
  const isDark =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";

  const viewRef = React.useRef<EditorView | null>(null);
  const inputRef = React.useRef(input);
  inputRef.current = input;

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
    const input = inputRef.current;
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

  function handleFoldAll() {
    if (!viewRef.current) return;
    foldAll(viewRef.current);
  }

  function handleUnfoldAll() {
    if (!viewRef.current) return;
    unfoldAll(viewRef.current);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: process reads input via inputRef; only isFindOpen affects the handler
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
  }, [isFindOpen]);

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
          className="z-40 absolute inset-0 flex flex-col justify-center items-center gap-3 bg-background/85 backdrop-blur-sm border-2 border-foreground/20 border-dashed pointer-events-none"
          style={{ animation: "fade-in 0.15s ease forwards" }}
        >
          <UploadSimpleIcon weight="thin" size={48} className="opacity-40" />
          <span className="font-mono text-muted-foreground/60 text-xs uppercase tracking-widest select-none">
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
        <React.Suspense fallback={null}>
          <SuccessBurst triggerKey={burst} onDone={() => setBurst(0)} />
        </React.Suspense>
      </div>

      <div
        id="floating-toolbar-pos"
        className="bottom-6 left-1/2 z-50 fixed -translate-x-1/2"
        style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <BorderGlow
          borderRadius={9999}
          backgroundColor="color-mix(in oklch, var(--background) 85%, transparent)"
          glowColor={isDark ? "0 0 90" : "38 65 28"}
          glowRadius={10}
          glowIntensity={0.5}
          coneSpread={10}
          edgeSensitivity={10}
          colors={isDark ? ["#D4A853", "#B8B8C0", "#B07D5A"] : ["#1a1a1a", "#8B6914", "#7A4522"]}
          borderColor={isDark ? undefined : "rgb(0 0 0 / 12%)"}
          fillOpacity={0.08}
          className="backdrop-blur-xl"
          animated
        >
          <div id="floating-toolbar" className="flex items-center gap-0.5 px-1.5 py-1.5">
            <ThemeToggle />

            <Tooltip label="wait, what does this do?">
              <Button
                id="btn-info"
                variant="ghost"
                size="icon"
                onClick={() => setIsInfoOpen(true)}
                className="rounded-full"
              >
                <InfoIcon weight="bold" />
              </Button>
            </Tooltip>

            <Tooltip label="stall for time">
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

            <div className="mx-1 bg-border/70 w-px h-4" />

            <Button
              id="btn-pretty"
              size="sm"
              onClick={() => process("pretty")}
              disabled={!input.trim()}
              className="px-2 sm:pr-2 sm:pl-4 rounded-full h-8 text-xs"
            >
              <BracketsCurlyIcon weight="bold" />
              <span className="hidden sm:inline">Prettify</span>
              <span id="kbd-pretty" className="hidden sm:inline-flex items-center gap-0.5 ml-1">
                {isMac() ? (
                  <>
                    <kbd className="bg-primary-foreground/10 px-1 py-0.5 border border-primary-foreground/25 rounded font-mono text-primary-foreground/70 text-xs select-none">
                      ⌘
                    </kbd>
                    <span className="font-mono text-primary-foreground/40 text-xs">+</span>
                    <kbd className="bg-primary-foreground/10 px-1 py-0.5 border border-primary-foreground/25 rounded font-mono text-primary-foreground/70 text-xs select-none">
                      ↵
                    </kbd>
                  </>
                ) : (
                  <>
                    <kbd className="bg-primary-foreground/10 px-1 py-0.5 border border-primary-foreground/25 rounded font-mono text-primary-foreground/70 text-xs select-none">
                      Ctrl
                    </kbd>
                    <span className="font-mono text-primary-foreground/40 text-xs">+</span>
                    <kbd className="bg-primary-foreground/10 px-1 py-0.5 border border-primary-foreground/25 rounded font-mono text-primary-foreground/70 text-xs select-none">
                      ↵
                    </kbd>
                  </>
                )}
              </span>
            </Button>

            <Tooltip label="bye, whitespace">
              <Button
                id="btn-minify"
                size="icon"
                variant="ghost"
                onClick={() => process("minify")}
                disabled={!input.trim()}
                className="rounded-full"
              >
                <MinusCircleIcon weight="bold" />
              </Button>
            </Tooltip>

            <div className="mx-1 bg-border/70 w-px h-4" />

            <Tooltip label="fold all">
              <Button
                id="btn-fold-all"
                size="icon"
                variant="ghost"
                onClick={handleFoldAll}
                disabled={!input.trim()}
                className="rounded-full"
              >
                <ArrowsInSimpleIcon weight="bold" />
              </Button>
            </Tooltip>

            <Tooltip label="unfold all">
              <Button
                id="btn-unfold-all"
                size="icon"
                variant="ghost"
                onClick={handleUnfoldAll}
                disabled={!input.trim()}
                className="rounded-full"
              >
                <ArrowsOutSimpleIcon weight="bold" />
              </Button>
            </Tooltip>

            {input && (
              <>
                <div className="mx-1 bg-border/70 w-px h-4" />
                <Tooltip label="yoink">
                  <Button
                    id="btn-copy"
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="rounded-full w-8 h-8"
                  >
                    <CopyIcon weight="bold" />
                  </Button>
                </Tooltip>
                <Tooltip label="spread the JSON">
                  <Button
                    id="btn-share"
                    size="icon"
                    variant="ghost"
                    onClick={handleShare}
                    className="rounded-full w-8 h-8"
                  >
                    <LinkIcon weight="bold" />
                  </Button>
                </Tooltip>
                <Tooltip label="burn it all">
                  <Button
                    id="btn-clear"
                    size="icon"
                    variant="ghost"
                    onClick={handleClear}
                    className="rounded-full"
                  >
                    <EraserIcon weight="bold" />
                  </Button>
                </Tooltip>
              </>
            )}

            <div className="hidden sm:block mx-1 bg-border/70 w-px h-4" />
            <span id="kbd-find-hint" className="hidden sm:inline-flex items-center gap-0.5 px-2">
              {isMac() ? (
                <>
                  <kbd className="bg-muted px-1 py-0.5 border border-border rounded font-mono text-muted-foreground text-xs select-none">
                    ⌘
                  </kbd>
                  <span className="font-mono text-muted-foreground/40 text-xs">+</span>
                  <kbd className="bg-muted px-1 py-0.5 border border-border rounded font-mono text-muted-foreground text-xs select-none">
                    F
                  </kbd>
                </>
              ) : (
                <>
                  <kbd className="bg-muted px-1 py-0.5 border border-border rounded font-mono text-muted-foreground text-xs select-none">
                    Ctrl
                  </kbd>
                  <span className="font-mono text-muted-foreground/40 text-xs">+</span>
                  <kbd className="bg-muted px-1 py-0.5 border border-border rounded font-mono text-muted-foreground text-xs select-none">
                    F
                  </kbd>
                </>
              )}
            </span>
          </div>
        </BorderGlow>
      </div>

      {isComicOpen && (
        <React.Suspense fallback={null}>
          <ComicViewer onClose={() => setIsComicOpen(false)} />
        </React.Suspense>
      )}

      {isInfoOpen && (
        <React.Suspense fallback={null}>
          <InfoModal onClose={() => setIsInfoOpen(false)} />
        </React.Suspense>
      )}
    </div>
  );
}
