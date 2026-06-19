import * as React from "react";

interface SuccessBurstProps {
  triggerKey: number;
  onDone: () => void;
}

const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const particles = PARTICLE_ANGLES.map((angle) => {
  const rad = (angle * Math.PI) / 180;
  return {
    angle,
    dx: Math.round(Math.cos(rad) * 52),
    dy: Math.round(Math.sin(rad) * 52),
  };
});

export function SuccessBurst({ triggerKey, onDone }: SuccessBurstProps) {
  React.useEffect(() => {
    if (triggerKey === 0) return;
    const t = window.setTimeout(onDone, 720);
    return () => window.clearTimeout(t);
  }, [triggerKey, onDone]);

  if (triggerKey === 0) return null;

  return (
    <div
      id="success-burst"
      key={triggerKey}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <span
        id="burst-icon"
        className="absolute font-mono text-4xl font-bold text-foreground/25"
        style={{ animation: "burst-icon 0.65s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {"{}"}
      </span>

      {particles.map(({ angle, dx, dy }, i) => (
        <span
          key={angle}
          id={`burst-p-${angle}`}
          aria-hidden="true"
          className="absolute h-2 w-2 rounded-full bg-foreground/30"
          style={
            {
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
              animation: "burst-particle 0.6s cubic-bezier(0.16,1,0.3,1) both",
              animationDelay: `${i * 18}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
