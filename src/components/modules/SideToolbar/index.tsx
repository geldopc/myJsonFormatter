import { Button } from "@elements/Button";
import { Tooltip } from "@elements/Tooltip";
import { useTheme } from "@hooks/Theme";
import { InfoIcon, SmileyIcon } from "@phosphor-icons/react";
import { BorderGlow } from "@widgets/BorderGlow";
import { ThemeToggle } from "@widgets/ThemeToggle";

interface SideToolbarProps {
  onInfoOpen: () => void;
  onComicOpen: () => void;
}

export function SideToolbar({ onInfoOpen, onComicOpen }: SideToolbarProps) {
  const { theme } = useTheme();
  const isDark =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";

  return (
    <div
      id="side-toolbar-pos"
      className="fixed right-3 top-1/2 z-50 -translate-y-1/2"
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
        <div id="side-toolbar" className="flex flex-col items-center gap-0.5 px-1.5 py-1.5">
          <ThemeToggle />

          <Tooltip label="wait, what does this do?" side="left">
            <Button
              id="btn-info"
              variant="ghost"
              size="icon"
              onClick={onInfoOpen}
              className="rounded-full"
            >
              <InfoIcon weight="bold" />
            </Button>
          </Tooltip>

          <Tooltip label="stall for time" side="left">
            <Button
              id="btn-comic"
              variant="ghost"
              size="icon"
              onClick={onComicOpen}
              className="rounded-full"
            >
              <SmileyIcon weight="bold" />
            </Button>
          </Tooltip>
        </div>
      </BorderGlow>
    </div>
  );
}
