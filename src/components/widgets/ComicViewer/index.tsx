import { Button } from "@elements/Button";
import { Tooltip } from "@elements/Tooltip";
import { ArrowSquareOutIcon, ShuffleIcon, SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import * as React from "react";
import { comics } from "@/assets/comics";

interface ComicViewerProps {
  onClose: () => void;
}

function randomIndex(exclude: number): number {
  if (comics.length <= 1) return 0;
  const n = Math.floor(Math.random() * comics.length);
  return n === exclude ? (n + 1) % comics.length : n;
}

export function ComicViewer({ onClose }: ComicViewerProps) {
  const [index, setIndex] = React.useState(() => Math.floor(Math.random() * comics.length));
  const [loading, setLoading] = React.useState(true);
  const comic = comics[index];

  const shuffle = React.useCallback(() => {
    setLoading(true);
    setIndex((i) => randomIndex(i));
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        shuffle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, shuffle]);

  return (
    <div
      id="comic-viewer"
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 60, animation: "fade-in 0.2s ease forwards" }}
    >
      <button
        id="comic-backdrop"
        type="button"
        aria-label="Close comic"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/85 backdrop-blur-xl"
      />

      <div id="comic-stage" className="relative z-10 flex flex-col items-center gap-3">
        {loading && (
          <div
            id="comic-spinner"
            className="absolute inset-0 flex items-center justify-center text-muted-foreground"
          >
            <SpinnerGapIcon weight="bold" size={28} className="animate-spin" />
          </div>
        )}

        <img
          id="comic-img"
          src={comic.src}
          alt={comic.title}
          onLoad={() => setLoading(false)}
          onError={() => setIndex((i) => randomIndex(i))}
          className="rounded-xl border border-border shadow-2xl"
          style={{
            maxHeight: "78vh",
            maxWidth: "90vw",
            objectFit: "contain",
            opacity: loading ? 0 : 1,
            transition: "opacity 0.2s ease",
          }}
        />

        <div id="comic-bar" className="flex w-full items-center justify-between gap-3 px-1">
          <a
            id="comic-link"
            href={comic.page}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 truncate font-mono text-muted-foreground/70 text-xs transition-colors hover:text-foreground"
          >
            <span id="comic-title" className="truncate">
              {comic.title || "developerslife"}
            </span>
            <ArrowSquareOutIcon weight="bold" className="shrink-0" />
          </a>

          <div id="comic-actions" className="flex shrink-0 items-center gap-1">
            <Tooltip label="Next comic (→)">
              <Button
                id="comic-shuffle"
                size="icon-sm"
                variant="ghost"
                onClick={shuffle}
                className="rounded-md"
              >
                <ShuffleIcon weight="bold" />
              </Button>
            </Tooltip>
            <Tooltip label="Close (Esc)">
              <Button
                id="comic-close"
                size="icon-sm"
                variant="ghost"
                onClick={onClose}
                className="rounded-md"
              >
                <XIcon weight="bold" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
