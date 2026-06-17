import { Toaster } from "@elements/Toaster";
import { TooltipProvider } from "@elements/Tooltip";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/providers/Theme";
import "./index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider delayDuration={300}>
        <App />
      </TooltipProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);
