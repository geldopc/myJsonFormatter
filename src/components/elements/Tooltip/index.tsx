import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@utils/css";
import type * as React from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({ label, children, side }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          id="tooltip-content"
          sideOffset={6}
          side={side}
          className={cn(
            "z-50 select-none rounded-md border border-border bg-popover px-2 py-1 font-mono text-xs text-popover-foreground shadow-md"
          )}
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
