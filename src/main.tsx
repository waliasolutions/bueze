import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Add console log to verify React is loading properly
console.log("React version:", React.version);
console.log("React object:", React);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
