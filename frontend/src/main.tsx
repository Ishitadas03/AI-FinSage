import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./registerServiceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA installability on Android Chrome & iOS
registerServiceWorker();
