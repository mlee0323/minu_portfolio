import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles/index.css"

const enableReactDevTools =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_REACT_DEVTOOLS === "1"

if (enableReactDevTools) {
  void import("react-grab")
  void import("react-scan")
}

const rootElement = document.getElementById("root")

if (rootElement === null) {
  throw new Error("React root element was not found")
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
