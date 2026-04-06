import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const savedTheme = window.localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

document.documentElement.classList.toggle("dark", shouldUseDark);
document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";

createRoot(document.getElementById("root")!).render(<App />);
