import {
  closeSearchPanel,
  findNext,
  findPrevious,
  openSearchPanel,
  replaceAll,
  replaceNext,
  SearchQuery,
  setSearchQuery,
} from "@codemirror/search";
import type { EditorView } from "@codemirror/view";
import { Button } from "@elements/Button";
import { Tooltip } from "@elements/Tooltip";
import {
  ArrowDownIcon,
  ArrowsClockwiseIcon,
  ArrowUpIcon,
  AsteriskIcon,
  SwapIcon,
  TextAaIcon,
  TextTIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as React from "react";

interface FindReplaceProps {
  view: EditorView | null;
  onClose: () => void;
}

export function FindReplace({ view, onClose }: FindReplaceProps) {
  const [findText, setFindText] = React.useState("");
  const [replaceText, setReplaceText] = React.useState("");
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [wholeWord, setWholeWord] = React.useState(false);
  const [regexp, setRegexp] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [invalid, setInvalid] = React.useState(false);
  const findInputRef = React.useRef<HTMLInputElement>(null);
  const searchKeyRef = React.useRef("");

  const query = React.useMemo(
    () =>
      new SearchQuery({
        search: findText,
        replace: replaceText,
        caseSensitive,
        wholeWord,
        regexp,
      }),
    [findText, replaceText, caseSensitive, wholeWord, regexp]
  );

  const recount = React.useCallback(() => {
    if (!view || !findText || !query.valid) {
      setTotal(0);
      setCurrent(0);
      return;
    }
    const cursor = query.getCursor(view.state);
    const sel = view.state.selection.main;
    let count = 0;
    let idx = 0;
    for (let next = cursor.next(); !next.done; next = cursor.next()) {
      count++;
      if (next.value.from === sel.from && next.value.to === sel.to) idx = count;
    }
    setTotal(count);
    setCurrent(idx);
  }, [view, findText, query]);

  React.useEffect(() => {
    if (!view) return;
    openSearchPanel(view);
    findInputRef.current?.focus();
    return () => {
      closeSearchPanel(view);
    };
  }, [view]);

  React.useEffect(() => {
    if (!view) return;
    view.dispatch({ effects: setSearchQuery.of(query) });
    setInvalid(findText.length > 0 && !query.valid);

    const key = JSON.stringify([findText, caseSensitive, wholeWord, regexp]);
    if (key !== searchKeyRef.current && findText && query.valid) {
      searchKeyRef.current = key;
      findNext(view);
    }
    recount();
  }, [view, query, findText, caseSensitive, wholeWord, regexp, recount]);

  function navigate(dir: "next" | "prev") {
    if (!view || !query.valid) return;
    if (dir === "next") findNext(view);
    else findPrevious(view);
    recount();
    findInputRef.current?.focus();
  }

  function handleReplaceOne() {
    if (!view || !query.valid) return;
    replaceNext(view);
    recount();
    findInputRef.current?.focus();
  }

  function handleReplaceAll() {
    if (!view || !query.valid) return;
    replaceAll(view);
    recount();
  }

  function handleFindKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(e.shiftKey ? "prev" : "next");
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

  const hasMatches = total > 0;
  const counter = findText ? `${current}/${total}` : "";

  return (
    <div
      id="find-replace"
      className="absolute top-14 right-4 z-50 flex flex-col gap-1.5 rounded-xl border border-border bg-background/80 px-3 py-2.5 shadow-2xl backdrop-blur-xl min-w-68"
    >
      <div id="find-row" className="flex items-center gap-1.5">
        <input
          id="find-input"
          ref={findInputRef}
          // biome-ignore lint/a11y/noAutofocus: find input must steal focus when panel opens
          autoFocus
          type="text"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          onKeyDown={handleFindKeyDown}
          placeholder="buscar..."
          className={`flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/50 ${
            invalid ? "text-destructive" : ""
          }`}
        />
        <span className="w-10 shrink-0 select-none text-right font-mono text-xs tabular-nums text-muted-foreground/40">
          {counter}
        </span>
        <Tooltip label="Diferenciar maiúsculas">
          <Button
            id="find-case"
            variant={caseSensitive ? "muted" : "ghost"}
            size="icon-sm"
            onClick={() => setCaseSensitive((v) => !v)}
            className="rounded-md"
          >
            <TextAaIcon weight="bold" />
          </Button>
        </Tooltip>
        <Tooltip label="Palavra inteira">
          <Button
            id="find-word"
            variant={wholeWord ? "muted" : "ghost"}
            size="icon-sm"
            onClick={() => setWholeWord((v) => !v)}
            className="rounded-md"
          >
            <TextTIcon weight="bold" />
          </Button>
        </Tooltip>
        <Tooltip label="Expressão regular">
          <Button
            id="find-regex"
            variant={regexp ? "muted" : "ghost"}
            size="icon-sm"
            onClick={() => setRegexp((v) => !v)}
            className="rounded-md"
          >
            <AsteriskIcon weight="bold" />
          </Button>
        </Tooltip>
        <Tooltip label="Anterior (⇧⏎)">
          <Button
            id="find-prev"
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate("prev")}
            disabled={!hasMatches}
            className="rounded-md"
          >
            <ArrowUpIcon weight="bold" />
          </Button>
        </Tooltip>
        <Tooltip label="Próximo (⏎)">
          <Button
            id="find-next"
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate("next")}
            disabled={!hasMatches}
            className="rounded-md"
          >
            <ArrowDownIcon weight="bold" />
          </Button>
        </Tooltip>
        <Tooltip label="Fechar (Esc)">
          <Button
            id="find-close"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-md"
          >
            <XIcon weight="bold" />
          </Button>
        </Tooltip>
      </div>

      <div id="replace-row" className="flex items-center gap-1.5">
        <input
          id="replace-input"
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          onKeyDown={handleReplaceKeyDown}
          placeholder="substituir..."
          className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/50"
        />
        <Tooltip label="Substituir">
          <Button
            id="find-replace-one"
            variant="ghost"
            size="icon-sm"
            onClick={handleReplaceOne}
            disabled={!hasMatches}
            className="rounded-md"
          >
            <SwapIcon weight="bold" />
          </Button>
        </Tooltip>
        <Tooltip label="Substituir tudo">
          <Button
            id="find-replace-all"
            variant="ghost"
            size="icon-sm"
            onClick={handleReplaceAll}
            disabled={!hasMatches}
            className="rounded-md"
          >
            <ArrowsClockwiseIcon weight="bold" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
