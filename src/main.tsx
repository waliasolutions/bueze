import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class RootRenderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    const message = error.message.toLowerCase();
    const isReactDispatcherError = message.includes("dispatcher.use");

    if (isReactDispatcherError && sessionStorage.getItem("root-react-runtime-reload") !== "1") {
      sessionStorage.setItem("root-react-runtime-reload", "1");
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Seite konnte nicht geladen werden</h1>
          <p className="text-muted-foreground">Bitte laden Sie die Seite erneut.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Erneut laden
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootRenderErrorBoundary>
      <App />
    </RootRenderErrorBoundary>
  </React.StrictMode>
);
