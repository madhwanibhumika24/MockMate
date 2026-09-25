import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "mockmate-theme";

const ThemeContext = createContext(null);

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (privacy mode, etc.) -- fall through to the
    // OS preference below.
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

// App-wide light/dark mode. A tiny inline script in index.html already
// applies the right class before React mounts (so there's no flash of the
// wrong theme) -- this provider takes over from there, keeps localStorage
// and the <html> class in sync, and exposes the toggle to every page.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getPreferredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore -- theme still applies for this page load, it just won't
      // persist across visits.
    }
  }, [theme]);

  // Follow the OS setting live, but only until the person picks a theme of
  // their own -- once they've chosen, that choice sticks regardless of what
  // the OS does afterward.
  useEffect(() => {
    let hasStoredChoice = false;
    try {
      hasStoredChoice = localStorage.getItem(STORAGE_KEY) != null;
    } catch {
      hasStoredChoice = false;
    }
    if (hasStoredChoice) return undefined;

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const handleChange = (event) => setThemeState(event.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (next) => setThemeState(next === "dark" ? "dark" : "light");
  const toggleTheme = () => setThemeState((current) => (current === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
