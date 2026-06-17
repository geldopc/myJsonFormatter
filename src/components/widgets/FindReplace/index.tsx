import { Button } from "@elements/Button";
import { ArrowDownIcon, ArrowUpIcon, XIcon } from "@phosphor-icons/react";
import * as React from "react";

interface FindReplaceProps {
  value: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (newValue: string) => void;
  onClose: () => void;
}

function computeMatches(text: string, query: string): number[] {
  if (!query) return [];
  const result: number[] = [];
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let i = 0;
  while (i < lower.length) {
    const idx = lower.indexOf(lowerQuery, i);
    if (idx === -1) break;
    result.push(idx);
    i = idx + lowerQuery.length;
  }
  return result;
}

export function FindReplace({ value, textareaRef, onChange, onClose }: FindReplaceProps) {
  const [findQuery, setFindQuery] = React.useState("");
  const [replaceQuery, setReplaceQuery] = React.useState("");
  const [matches, setMatches] = React.useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const nextIndexRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const newMatches = computeMatches(value, findQuery);
    setMatches(newMatches);
    if (nextIndexRef.current !== null) {
      setCurrentIndex(Math.min(nextIndexRef.current, Math.max(0, newMatches.length - 1)));
      nextIndexRef.current = null;
    } else {
      setCurrentIndex(0);
    }
  }, [findQuery, value]);

  React.useEffect(() => {
    if (matches.length === 0 || !textareaRef.current || !findQuery) return;
    const start = matches[currentIndex];
    const end = start + findQuery.length;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(start, end);
  }, [matches, currentIndex, findQuery, textareaRef]);

  function goNext() {
    if (matches.length === 0) return;
    setCurrentIndex((i) => (i + 1) % matches.length);
  }

  function goPrev() {
    if (matches.length === 0) return;
    setCurrentIndex((i) => (i - 1 + matches.length) % matches.length);
  }

  function handleReplace() {
    if (matches.length === 0 || !findQuery) return;
    const start = matches[currentIndex];
    const newValue = value.slice(0, start) + replaceQuery + value.slice(start + findQuery.length);
    nextIndexRef.current = currentIndex < matches.length - 1 ? currentIndex : 0;
    onChange(newValue);
  }

  function handleReplaceAll() {
    if (matches.length === 0 || !findQuery) return;
    let newValue = value;
    for (let i = matches.length - 1; i >= 0; i--) {
      const start = matches[i];
      newValue = newValue.slice(0, start) + replaceQuery + newValue.slice(start + findQuery.length);
    }
    onChange(newValue);
    onClose();
  }

  function handleFindKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) goPrev();
      else goNext();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  }

  function handleReplaceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  }

  function handleFindChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFindQuery(e.target.value);
  }

  function handleReplaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setReplaceQuery(e.target.value);
  }

  const hasMatches = matches.length > 0;
  const noResults = findQuery.length > 0 && !hasMatches;

  return (
    <div
      id="find-replace"
      className="absolute top-14 right-4 z-50 flex flex-col gap-1.5 rounded-xl border border-border bg-background/80 backdrop-blur-xl px-3 py-2.5 shadow-2xl min-w-68"
    >
      <div id="find-row" className="flex items-center gap-1.5">
        <input
          id="find-input"
          // biome-ignore lint/a11y/noAutofocus: find input must steal focus when panel opens
          autoFocus
          type="text"
          value={findQuery}
          onChange={handleFindChange}
          onKeyDown={handleFindKeyDown}
          placeholder="buscar..."
          className={`flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/50 ${
            noResults ? "text-destructive" : ""
          }`}
        />
        <span className="font-mono text-xs text-muted-foreground/40 tabular-nums select-none w-10 text-right shrink-0">
          {findQuery ? `${hasMatches ? currentIndex + 1 : 0}/${matches.length}` : ""}
        </span>
        <Button
          id="find-prev"
          variant="ghost"
          size="icon"
          onClick={goPrev}
          disabled={!hasMatches}
          className="h-6 w-6 rounded-md"
        >
          <ArrowUpIcon weight="bold" />
        </Button>
        <Button
          id="find-next"
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={!hasMatches}
          className="h-6 w-6 rounded-md"
        >
          <ArrowDownIcon weight="bold" />
        </Button>
        <Button
          id="find-close"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 rounded-md"
        >
          <XIcon weight="bold" />
        </Button>
      </div>

      <div id="replace-row" className="flex items-center gap-1.5">
        <input
          id="replace-input"
          type="text"
          value={replaceQuery}
          onChange={handleReplaceChange}
          onKeyDown={handleReplaceKeyDown}
          placeholder="substituir..."
          className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/50"
        />
        <Button
          id="find-replace-one"
          variant="ghost"
          size="sm"
          onClick={handleReplace}
          disabled={!hasMatches}
          className="h-6 px-2 text-xs rounded-md"
        >
          Rep
        </Button>
        <Button
          id="find-replace-all"
          variant="ghost"
          size="sm"
          onClick={handleReplaceAll}
          disabled={!hasMatches}
          className="h-6 px-2 text-xs rounded-md"
        >
          Tudo
        </Button>
      </div>
    </div>
  );
}
