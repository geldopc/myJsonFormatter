import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div id="app-layout" className="grain h-screen bg-background text-foreground flex flex-col">
      <main id="main-content" className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
