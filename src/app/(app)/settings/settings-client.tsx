"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  MessageCircleMore,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

type Theme =
  | "SYSTEM"
  | "LIGHT"
  | "DARK";

type Preferences = {
  theme: Theme;

  compactMode: boolean;

  notifyFriendRequests: boolean;
  notifyMentions: boolean;
  notifyGroupMessages: boolean;
  notifyForumReplies: boolean;
  notifyAcceptedAnswers: boolean;
  notifyReputation: boolean;

  showOnlineStatus: boolean;
  readReceipts: boolean;
  messageSounds: boolean;
  desktopNotifications: boolean;
};

type SettingsClientProps = {
  initialData: {
    account: {
      email: string;
      role: string;
    };

    preferences: Preferences;
  };
};

type ToggleProps = {
  checked: boolean;

  disabled?: boolean;

  onChange: (
    checked: boolean,
  ) => void;
};

function Toggle({
  checked,
  disabled = false,
  onChange,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() =>
        onChange(!checked)
      }
      className={`
        relative
        inline-flex
        h-6
        w-11
        shrink-0
        rounded-full
        transition

        ${
          checked
            ? "bg-[var(--primary)]"
            : "bg-[var(--border-strong)]"
        }

        disabled:cursor-not-allowed
        disabled:opacity-50
      `}
    >
      <span
        className={`
          absolute
          top-0.5
          h-5
          w-5
          rounded-full
          bg-[var(--surface)]
          shadow-sm
          transition-transform

          ${
            checked
              ? "translate-x-[22px]"
              : "translate-x-0.5"
          }
        `}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-[var(--space-card-sm)]
        border-b
        border-[var(--border)]
        px-[var(--space-inline)]
        py-[var(--space-row-y)]
        last:border-b-0

        sm:px-[var(--space-card)]
      "
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">
          {title}
        </div>

        {description ? (
          <div className="mt-1 max-w-lg text-xs leading-5 text-[var(--text-muted)]">
            {description}
          </div>
        ) : null}
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
          border-b
          border-[var(--border)]
          px-[var(--space-inline)]
          py-[var(--space-row-y)]

          sm:px-[var(--space-card)]
        "
      >
        <div
          className="
            grid
            h-9
            w-9
            shrink-0
            place-items-center
            rounded-xl
            bg-[var(--primary-soft)]
            text-[var(--primary)]
          "
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

async function readJsonSafe<T>(
  response: Response,
): Promise<T | null> {
  const text =
    await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      text,
    ) as T;
  } catch {
    return null;
  }
}

export default function SettingsClient({
  initialData,
}: SettingsClientProps) {
  const [
    preferences,
    setPreferences,
  ] = useState<Preferences>(
    initialData.preferences,
  );

  const [
    savingKey,
    setSavingKey,
  ] =
    useState<
      keyof Preferences | null
    >(null);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  /*
  |--------------------------------------------------------------------------
  | Update preference
  |--------------------------------------------------------------------------
  */

  async function updatePreference<
    K extends keyof Preferences,
  >(
    key: K,
    value: Preferences[K],
  ) {
    const previousValue =
      preferences[key];

    /*
    |--------------------------------------------------------------------------
    | Optimistic UI
    |--------------------------------------------------------------------------
    */

    setPreferences(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );

    setSavingKey(key);
    setError(null);
    setSaved(false);

    try {
      const response =
        await fetch(
          "/api/settings",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              [key]: value,
            }),
          },
        );

      const data =
        await readJsonSafe<{
          success?: boolean;

          error?: string;

          preferences?: Preferences;
        }>(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Unable to save setting (${response.status}).`,
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Use server state when available
      |--------------------------------------------------------------------------
      */

      if (data?.preferences) {
        setPreferences(
          data.preferences,
        );
      }

      setSaved(true);

      window.setTimeout(
        () => {
          setSaved(false);
        },
        1800,
      );

      /*
      |--------------------------------------------------------------------------
      | Notify the rest of the app
      |--------------------------------------------------------------------------
      |
      | Nanti AppShell / ChatWidget / Notification dapat listen event ini.
      |
      */

      window.dispatchEvent(
        new CustomEvent(
          "devknowledge:settings-changed",
          {
            detail: {
              key,
              value,
            },
          },
        ),
      );
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Rollback optimistic update
      |--------------------------------------------------------------------------
      */

      setPreferences(
        (current) => ({
          ...current,
          [key]:
            previousValue,
        }),
      );

      console.error(
        "UPDATE SETTINGS ERROR:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save setting.",
      );
    } finally {
      setSavingKey(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Desktop notification
  |--------------------------------------------------------------------------
  */

  async function changeDesktopNotifications(
    enabled: boolean,
  ) {
    if (
      enabled &&
      typeof window !==
        "undefined" &&
      "Notification" in window
    ) {
      const permission =
        await Notification.requestPermission();

      if (
        permission !==
        "granted"
      ) {
        setError(
          "Browser notification permission was not granted.",
        );

        return;
      }
    }

    await updatePreference(
      "desktopNotifications",
      enabled,
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* HEADER */}
      <div
        className="
          mb-[var(--space-section)]
          flex
          flex-col
          gap-[var(--space-card-sm)]

          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              font-semibold
              uppercase
              tracking-[0.18em]
              text-[var(--primary)]
            "
          >
            <Sparkles className="h-4 w-4" />

            Preferences
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Customize how
            DevKnowledge works for
            your account,
            notifications, chat,
            and appearance.
          </p>
        </div>

        {/* SAVE STATUS */}
        <div className="h-7">
          {savingKey ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />

              Saving...
            </div>
          ) : saved ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" />

              Saved
            </div>
          ) : null}
        </div>
      </div>

      {/* ERROR */}
      {error ? (
        <div
          className="
            mb-[var(--space-section-small)]
            flex
            items-start
            justify-between
            gap-[var(--space-card-sm)]
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-[var(--space-inline)]
            py-[var(--space-row-y)]
            text-sm
            text-red-600
          "
        >
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="shrink-0 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div
        className="
          grid
          gap-[var(--space-section)]

          xl:grid-cols-[minmax(0,1fr)_300px]
        "
      >
        {/* LEFT */}
        <div className="space-y-[var(--space-section)]">
          {/* ACCOUNT */}
          <Section
            icon={UserRound}
            title="Account"
            description="Manage your account and profile access."
          >
            <Link
              href="/profile"
              className="
                flex
                items-center
                justify-between
                gap-[var(--space-card-sm)]
                border-b
                border-[var(--border)]
                px-[var(--space-inline)]
                py-[var(--space-row-y)]
                transition

                hover:bg-[var(--surface-soft)]

                sm:px-[var(--space-card)]
              "
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  Profile
                </div>

                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  Change your name,
                  bio, and profile
                  photo.
                </div>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </Link>

            <SettingRow
              title="Email"
              description="Email changes are currently disabled."
            >
              <span
                className="
                  block
                  max-w-[160px]
                  truncate
                  text-right
                  text-xs
                  text-[var(--text-muted)]

                  sm:max-w-[240px]
                "
                title={
                  initialData
                    .account.email
                }
              >
                {
                  initialData
                    .account.email
                }
              </span>
            </SettingRow>

            <SettingRow
              title="Password"
              description="Password management can be added to account security."
            >
              <button
                type="button"
                disabled
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[var(--border)]
                  px-3
                  text-xs
                  font-medium
                  opacity-50
                "
                title="Coming soon"
              >
                <LockKeyhole className="h-3.5 w-3.5" />

                Change
              </button>
            </SettingRow>
          </Section>

          {/* APPEARANCE */}
          <Section
            icon={MonitorCog}
            title="Appearance"
            description="Control how DevKnowledge looks on this device."
          >
            <SettingRow
              title="Theme"
              description="Choose your preferred interface theme."
            >
              <select
                value={
                  preferences.theme
                }
                disabled={
                  savingKey ===
                  "theme"
                }
                onChange={(
                  event,
                ) =>
                  void updatePreference(
                    "theme",
                    event.target
                      .value as Theme,
                  )
                }
                className="
                  h-9
                  rounded-lg
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  px-3
                  text-xs
                  outline-none

                  focus:border-[var(--primary)]
                  disabled:opacity-50
                "
              >
                <option value="SYSTEM">
                  System
                </option>

                <option value="LIGHT">
                  Light
                </option>

                <option value="DARK">
                  Dark
                </option>
              </select>
            </SettingRow>

            <SettingRow
              title="Compact layout"
              description="Reduce spacing in lists and cards."
            >
              <Toggle
                checked={
                  preferences.compactMode
                }
                disabled={
                  savingKey ===
                  "compactMode"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "compactMode",
                    checked,
                  )
                }
              />
            </SettingRow>
          </Section>

          {/* NOTIFICATIONS */}
          <Section
            icon={Bell}
            title="Notifications"
            description="Choose which activity should notify you."
          >
            <SettingRow
              title="Friend requests"
              description="Notify when someone sends you a friend request."
            >
              <Toggle
                checked={
                  preferences.notifyFriendRequests
                }
                disabled={
                  savingKey ===
                  "notifyFriendRequests"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "notifyFriendRequests",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Mentions"
              description="Notify when someone mentions you."
            >
              <Toggle
                checked={
                  preferences.notifyMentions
                }
                disabled={
                  savingKey ===
                  "notifyMentions"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "notifyMentions",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Group messages"
              description="Notify about new group chat activity."
            >
              <Toggle
                checked={
                  preferences.notifyGroupMessages
                }
                disabled={
                  savingKey ===
                  "notifyGroupMessages"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "notifyGroupMessages",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Forum replies"
              description="Notify when someone replies to your discussion."
            >
              <Toggle
                checked={
                  preferences.notifyForumReplies
                }
                disabled={
                  savingKey ===
                  "notifyForumReplies"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "notifyForumReplies",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Accepted answers"
              description="Notify when your reply is accepted as a solution."
            >
              <Toggle
                checked={
                  preferences.notifyAcceptedAnswers
                }
                disabled={
                  savingKey ===
                  "notifyAcceptedAnswers"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "notifyAcceptedAnswers",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Reputation updates"
              description="Notify about badges and reputation activity."
            >
              <Toggle
                checked={
                  preferences.notifyReputation
                }
                disabled={
                  savingKey ===
                  "notifyReputation"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "notifyReputation",
                    checked,
                  )
                }
              />
            </SettingRow>
          </Section>

          {/* CHAT */}
          <Section
            icon={MessageCircleMore}
            title="Chat & presence"
            description="Control messaging behavior and online presence."
          >
            <SettingRow
              title="Show online status"
              description="Allow friends to see when you are online."
            >
              <Toggle
                checked={
                  preferences.showOnlineStatus
                }
                disabled={
                  savingKey ===
                  "showOnlineStatus"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "showOnlineStatus",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Read receipts"
              description="Let others know when you have read their messages."
            >
              <Toggle
                checked={
                  preferences.readReceipts
                }
                disabled={
                  savingKey ===
                  "readReceipts"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "readReceipts",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Message sounds"
              description="Play a sound for new messages."
            >
              <Toggle
                checked={
                  preferences.messageSounds
                }
                disabled={
                  savingKey ===
                  "messageSounds"
                }
                onChange={(
                  checked,
                ) =>
                  void updatePreference(
                    "messageSounds",
                    checked,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Desktop notifications"
              description="Allow browser notifications for new messages."
            >
              <Toggle
                checked={
                  preferences.desktopNotifications
                }
                disabled={
                  savingKey ===
                  "desktopNotifications"
                }
                onChange={(
                  checked,
                ) =>
                  void changeDesktopNotifications(
                    checked,
                  )
                }
              />
            </SettingRow>
          </Section>
        </div>

        {/* RIGHT */}
        <aside className="space-y-[var(--space-section)]">
          {/* ROLE */}
          <section
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-[var(--space-card)]
            "
          >
            <div
              className="
                grid
                h-[var(--control-height-lg)]
                w-11
                place-items-center
                rounded-xl
                bg-[var(--primary-soft)]
                text-[var(--primary)]
              "
            >
              <ShieldCheck className="h-5 w-5" />
            </div>

            <h2 className="mt-[var(--space-section-small)] text-sm font-semibold">
              Access role
            </h2>

            <span
              className="
                mt-3
                inline-flex
                rounded-full
                bg-[var(--primary-soft)]
                px-3
                py-1
                text-xs
                font-medium
                text-[var(--primary)]
              "
            >
              {
                initialData
                  .account.role
              }
            </span>

            <p className="mt-[var(--space-section-small)] text-xs leading-6 text-[var(--text-muted)]">
              Your workspace
              permissions are managed
              by administrators.
            </p>
          </section>

          {/* SECURITY */}
          <section
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-[var(--space-card)]
            "
          >
            <div
              className="
                grid
                h-[var(--control-height-lg)]
                w-11
                place-items-center
                rounded-xl
                bg-[var(--primary-soft)]
                text-[var(--primary)]
              "
            >
              <Laptop className="h-5 w-5" />
            </div>

            <h2 className="mt-[var(--space-section-small)] text-sm font-semibold">
              Security
            </h2>

            <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
              Active session
              management can be added
              here when multi-session
              authentication is
              implemented.
            </p>

            <button
              type="button"
              disabled
              className="
                mt-[var(--space-section-small)]
                h-9
                w-full
                rounded-lg
                border
                border-[var(--border)]
                text-xs
                font-medium
                opacity-50
              "
              title="Coming soon"
            >
              Manage sessions
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}