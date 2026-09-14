"use client";

import {
  useEffect,
  useState,
} from "react";

type Theme =
  | "SYSTEM"
  | "LIGHT"
  | "DARK";

type PreferenceSyncProps = {
  initialPreferences: {
    theme: Theme;
    compactMode: boolean;
  };
};

export default function PreferenceSync({
  initialPreferences,
}: PreferenceSyncProps) {
  const [
    preferences,
    setPreferences,
  ] = useState(initialPreferences);

  useEffect(() => {
    function applyTheme(
      theme: Theme,
    ) {
      const root =
        document.documentElement;

      if (theme === "DARK") {
        root.classList.add("dark");

        root.style.colorScheme =
          "dark";

        return;
      }

      if (theme === "LIGHT") {
        root.classList.remove(
          "dark",
        );

        root.style.colorScheme =
          "light";

        return;
      }

      const media =
        window.matchMedia(
          "(prefers-color-scheme: dark)",
        );

      root.classList.toggle(
        "dark",
        media.matches,
      );

      root.style.colorScheme =
        media.matches
          ? "dark"
          : "light";
    }

    applyTheme(
      preferences.theme,
    );
  }, [preferences.theme]);

  useEffect(() => {
    const root =
      document.documentElement;

    if (
      preferences.compactMode
    ) {
      root.setAttribute(
        "data-compact",
        "true",
      );
    } else {
      root.removeAttribute(
        "data-compact",
      );
    }
  }, [
    preferences.compactMode,
  ]);

  useEffect(() => {
    function handleSettingsChanged(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<{
          key: string;
          value: unknown;
        }>;

      const {
        key,
        value,
      } =
        customEvent.detail;

      if (
        key === "theme" &&
        (
          value === "SYSTEM" ||
          value === "LIGHT" ||
          value === "DARK"
        )
      ) {
        setPreferences(
          (current) => ({
            ...current,
            theme: value,
          }),
        );
      }

      if (
        key ===
          "compactMode" &&
        typeof value ===
          "boolean"
      ) {
        setPreferences(
          (current) => ({
            ...current,
            compactMode:
              value,
          }),
        );
      }
    }

    window.addEventListener(
      "devknowledge:settings-changed",
      handleSettingsChanged,
    );

    return () => {
      window.removeEventListener(
        "devknowledge:settings-changed",
        handleSettingsChanged,
      );
    };
  }, []);

  return null;
}