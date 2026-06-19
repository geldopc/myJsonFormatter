import { Button } from "@elements/Button";
import { Tooltip } from "@elements/Tooltip";
import { useTheme } from "@hooks/Theme";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function handleToggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <Tooltip label={theme === "dark" ? "get some sunlight" : "go full vampire"}>
      <Button
        id="theme-toggle"
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        aria-label="Toggle theme"
        className="relative rounded-full"
      >
        <SunIcon
          weight="regular"
          className="absolute rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"
        />
        <MoonIcon
          weight="regular"
          className="absolute rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100"
        />
      </Button>
    </Tooltip>
  );
}
