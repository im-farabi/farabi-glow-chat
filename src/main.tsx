import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Auto-update service worker instantly — no prompt, like Discord
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-reload without asking — users always get latest version
    updateSW(true);
  },
  onOfflineReady() {
    console.log('FARABI is ready to work offline!');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
