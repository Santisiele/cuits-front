import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router-dom"
import "./index.css"
import App from "./App.tsx"
import { QueryProvider } from "./providers/QueryProvider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryProvider>
  </StrictMode>
)