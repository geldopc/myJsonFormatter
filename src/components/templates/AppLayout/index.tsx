import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div id="app-layout" className="grain min-h-screen bg-background text-foreground">
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
