import { useTheme } from "@hooks/Theme";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      offset="5.5rem"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-popover/90 !text-popover-foreground !font-mono !text-xs !shadow-lg !backdrop-blur-xl",
          description: "!text-muted-foreground !font-mono",
          icon: "!text-foreground/70",
        },
      }}
    />
  );
}
