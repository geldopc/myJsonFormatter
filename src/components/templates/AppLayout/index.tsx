import { Outlet } from "react-router-dom";
import { Navbar } from "@modules/Navbar";

type AppLayoutProps = {
  title?: string;
};

export function AppLayout({ title }: AppLayoutProps) {
  return (
    <div id="app-layout" className="grain min-h-screen bg-background text-foreground">
      <Navbar title={title} />
      <main id="main-content" className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
