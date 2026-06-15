import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "@hooks/Theme";
import { Button } from "@elements/Button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function handleToggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      id="theme-toggle"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className="relative"
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
  );
}
