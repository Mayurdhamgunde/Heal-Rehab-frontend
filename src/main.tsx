// src/main.tsx
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import "./i18n"; // Must be imported before App renders!

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Suspense catches the app while i18next fetches the JSON files */}
    <Suspense 
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0d9488' }}>
          Loading application...
        </div>
      }
    >
      <App />
    </Suspense>
  </StrictMode>
);