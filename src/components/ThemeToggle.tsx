"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("salon-theme", theme);
  } catch {}
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
  }

  return (
    <button
      onClick={toggle}
      className={`theme-toggle ${className}`}
      aria-label={theme === "dark" ? "روشن کردن تم" : "تیره کردن تم"}
      title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
      suppressHydrationWarning
    >
      {mounted && theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
