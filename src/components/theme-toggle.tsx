"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { GhostButton } from "@/components/ui";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("devknowledge-theme");
    const next = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("devknowledge-theme", next ? "dark" : "light");
  }

  return (
    <GhostButton className="h-9 w-9 p-0" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </GhostButton>
  );
}
