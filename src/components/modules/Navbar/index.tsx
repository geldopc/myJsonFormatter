import { ThemeToggle } from "@widgets/ThemeToggle";

type NavItem = {
  label: string;
  href: string;
};

type NavbarProps = {
  title?: string;
  items?: NavItem[];
};

export function Navbar({ title = "Portfolio", items = [] }: NavbarProps) {
  return (
    <header
      id="navbar"
      className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 border-b border-border/60 bg-background/75 backdrop-blur-md"
    >
      <span className="font-heading font-bold text-sm tracking-widest uppercase select-none">
        {title}
      </span>

      {items.length > 0 && (
        <nav id="navbar-nav" className="ml-8 hidden md:flex items-center gap-6">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
