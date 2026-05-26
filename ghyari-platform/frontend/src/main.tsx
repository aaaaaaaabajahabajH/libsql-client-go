import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initWebVitals } from "./utils/webVitals";

initWebVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
