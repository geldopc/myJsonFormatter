import * as React from "react";
import {
  BracketsIcon,
  CheckIcon,
  CopyIcon,
  EraserIcon,
  MagicWandIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@elements/Button";
import { formatJson, sanitizeJson } from "@utils/json";

type Status = "idle" | "success" | "error";

export function Home() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [copied, setCopied] = React.useState(false);

  function handleFormat() {
    if (!input.trim()) return;
    const result = formatJson(input);
    if (result.error) {
      setError(result.error);
      setOutput("");
      setStatus("error");
    } else {
      setOutput(result.value);
      setError(null);
      setStatus("success");
    }
  }

  function handleSanitize() {
    if (!input.trim()) return;
    const result = sanitizeJson(input);
    if (result.error) {
      setError(result.error);
      setOutput("");
      setStatus("error");
    } else {
      setInput(result.value);
      setOutput(result.value);
      setError(null);
      setStatus("success");
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError(null);
    setStatus("idle");
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
      e.preventDefault();
      handleFormat();
    }
  }

  const hasOutput = output.length > 0;

  return (
    <div id="home" className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed top-1/3 left-1/2 w-96 h-96 rounded-full bg-foreground opacity-5 blur-3xl -translate-x-1/2 -translate-y-1/2"
      />

      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-6">
        <div
          className="text-center"
          style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <BracketsIcon weight="thin" className="mx-auto mb-4 opacity-40" size={40} />
          <h1 className="font-heading text-3xl font-bold mb-2">MyJsonFormatter</h1>
          <p className="text-muted-foreground text-sm">
            Paste, clean and format your JSON.{" "}
            <kbd className="text-xs border border-border rounded px-1 py-0.5">⌘⇧F</kbd> to format.
          </p>
        </div>

        <div
          className="relative"
          style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
        >
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus("idle");
            }}
            onKeyDown={handleKeyDown}
            placeholder='{ "paste": "your JSON here" }'
            spellCheck={false}
            rows={12}
            className="w-full rounded-xl border border-border bg-card px-4 py-4 font-mono text-sm resize-none outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40"
          />

          {status === "error" && error && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-destructive text-xs">
              <WarningCircleIcon weight="fill" className="mt-0.5 shrink-0" size={14} />
              <span className="font-mono break-all">{error}</span>
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-2 flex-wrap"
          style={{ animation: "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}
        >
          <Button id="btn-format" onClick={handleFormat} disabled={!input.trim()}>
            <BracketsIcon weight="bold" />
            Format
          </Button>
          <Button
            id="btn-sanitize"
            variant="outline"
            onClick={handleSanitize}
            disabled={!input.trim()}
          >
            <MagicWandIcon weight="bold" />
            Sanitize
          </Button>
          <Button id="btn-clear" variant="ghost" onClick={handleClear} disabled={!input && !output}>
            <EraserIcon weight="bold" />
            Clear
          </Button>

          {hasOutput && (
            <Button id="btn-copy" variant="ghost" onClick={handleCopy} className="ml-auto">
              {copied ? (
                <><CheckIcon weight="bold" />Copied</>
              ) : (
                <><CopyIcon weight="bold" />Copy</>
              )}
            </Button>
          )}
        </div>

        {hasOutput && (
          <div
            id="json-output"
            className="rounded-xl border border-border bg-card overflow-hidden"
            style={{ animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Output</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500/70" />
                <span className="text-xs text-muted-foreground">valid</span>
              </div>
            </div>
            <pre className="px-4 py-4 font-mono text-sm overflow-x-auto whitespace-pre text-foreground/90 leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
