import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import * as React from "react";

const SUN_PARTICLES = [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
  const rad = (angle * Math.PI) / 180;
  return { angle, dx: Math.round(Math.cos(rad) * 65), dy: Math.round(Math.sin(rad) * 65) };
});

const MOON_STARS = [
  { id: 0, dx: 58, dy: -42, delay: 0, size: 8 },
  { id: 1, dx: 72, dy: 10, delay: 50, size: 5 },
  { id: 2, dx: 44, dy: 64, delay: 100, size: 7 },
  { id: 3, dx: -6, dy: 70, delay: 60, size: 4 },
  { id: 4, dx: 68, dy: -12, delay: 30, size: 6 },
];

interface ThemeOverlayProps {
  triggerKey: number;
  variant: "sun" | "moon";
  onDone: () => void;
}

export function ThemeOverlay({ triggerKey, variant, onDone }: ThemeOverlayProps) {
  React.useEffect(() => {
    if (triggerKey === 0) return;
    const t = window.setTimeout(onDone, 1100);
    return () => window.clearTimeout(t);
  }, [triggerKey, onDone]);

  if (triggerKey === 0) return null;

  const isSun = variant === "sun";

  return (
    <div
      id="theme-overlay"
      key={triggerKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        id="theme-overlay-stage"
        className="relative flex items-center justify-center"
        style={{ width: 180, height: 180 }}
      >
        <span
          id="theme-overlay-icon"
          className="absolute"
          style={{ animation: "theme-icon 1.0s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {isSun ? (
            <SunIcon size={72} weight="fill" color="#FBBF24" />
          ) : (
            <MoonIcon size={72} weight="fill" color="#818CF8" />
          )}
        </span>

        {isSun
          ? SUN_PARTICLES.map(({ angle, dx, dy }, i) => (
              <span
                key={angle}
                id={`sun-p-${angle}`}
                aria-hidden="true"
                className="absolute h-2 w-2 rounded-full"
                style={
                  {
                    backgroundColor: "#FBBF24",
                    "--dx": `${dx}px`,
                    "--dy": `${dy}px`,
                    animation: "burst-particle 0.85s cubic-bezier(0.16,1,0.3,1) both",
                    animationDelay: `${i * 18}ms`,
                  } as React.CSSProperties
                }
              />
            ))
          : MOON_STARS.map(({ id, dx, dy, delay, size }) => (
              <span
                key={id}
                id={`moon-s-${id}`}
                aria-hidden="true"
                className="absolute rounded-full"
                style={
                  {
                    width: size,
                    height: size,
                    backgroundColor: "#C7D2FE",
                    "--dx": `${dx}px`,
                    "--dy": `${dy}px`,
                    animation: "burst-particle 0.85s cubic-bezier(0.16,1,0.3,1) both",
                    animationDelay: `${delay}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
      </div>
    </div>
  );
}
