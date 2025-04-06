import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { TauriProvider } from "./context/TauriContext";

import "@tauri-apps/api";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TauriProvider>
      <App />
    </TauriProvider>
  </React.StrictMode>,
);
