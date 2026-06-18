import Lottie from "lottie-react";
import { burst } from "@/assets/lottie/burst";

interface SuccessBurstProps {
  triggerKey: number;
  onDone: () => void;
}

export function SuccessBurst({ triggerKey, onDone }: SuccessBurstProps) {
  if (triggerKey === 0) return null;

  return (
    <div
      id="success-burst"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <Lottie
        key={triggerKey}
        animationData={burst}
        loop={false}
        autoplay
        onComplete={onDone}
        className="size-40 opacity-70"
      />
    </div>
  );
}
