"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageSquare,
  MonitorSmartphone,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";

import {
  Badge,
  Button,
  GhostButton,
  Input,
  Label,
  Textarea,
} from "@/components/ui";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string | null;
};

type Theme =
  | "SYSTEM"
  | "LIGHT"
  | "DARK";

type Preferences = {
  id: string;

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

  createdAt: string;
  updatedAt: string;
};

type Session = {
  id: string;
  browser: string;
  device: string;
  ipAddress?: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

type SettingsTab =
  | "account"
  | "appearance"
  | "notifications"
  | "messages";

type PreferenceKey =
  | "theme"
  | "compactMode"
  | "notifyFriendRequests"
  | "notifyMentions"
  | "notifyGroupMessages"
  | "notifyForumReplies"
  | "notifyAcceptedAnswers"
  | "notifyReputation"
  | "showOnlineStatus"
  | "readReceipts"
  | "messageSounds"
  | "desktopNotifications";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div>
      <Label>{label}</Label>

      <div className="relative">
        <Input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          autoComplete={autoComplete}
          className="pr-11"
        />

        <button
          type="button"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
          onClick={() =>
            setVisible(
              (current) =>
                !current,
            )
          }
          className="
            absolute right-2 top-1/2
            grid h-8 w-8
            -translate-y-1/2
            place-items-center
            rounded-lg
            text-[var(--text-muted)]
            transition
            hover:bg-[var(--surface-hover)]
            hover:text-[var(--text)]
          "
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center
        justify-center
        bg-black/50
        p-4
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          max-h-[88vh]
          w-full
          max-w-lg
          overflow-y-auto
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-2xl
        "
      >
        <div
          className="
            flex items-start
            justify-between
            gap-4
            border-b
            border-[var(--border)]
            px-5 py-4
          "
        >
          <div>
            <h2
              className="
                text-base
                font-semibold
                text-[var(--text)]
              "
            >
              {title}
            </h2>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-[var(--text-muted)]
              "
            >
              {description}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="
              grid h-8 w-8
              shrink-0
              place-items-center
              rounded-lg
              text-[var(--text-muted)]
              transition
              hover:bg-[var(--surface-hover)]
              hover:text-[var(--text)]
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() =>
        onChange(!checked)
      }
      className={`
        relative
        h-6 w-11
        shrink-0
        rounded-full
        border
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50

        ${
          checked
            ? `
              border-[var(--primary)]
              bg-[var(--primary)]
            `
            : `
              border-[var(--border)]
              bg-[var(--surface-soft)]
            `
        }
      `}
    >
      <span
        className={`
          absolute top-1/2
          h-4 w-4
          -translate-y-1/2
          rounded-full
          bg-white
          shadow-sm
          transition-all

          ${
            checked
              ? "left-[22px]"
              : "left-[3px]"
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
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      className="
        flex items-center
        justify-between
        gap-6
        border-b
        border-[var(--border)]
        px-5 py-4
        last:border-b-0
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-sm
            font-medium
            text-[var(--text)]
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-[var(--text-muted)]
          "
        >
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
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
          flex items-center
          gap-3
          border-b
          border-[var(--border)]
          px-5 py-4
        "
      >
        <span
          className="
            grid h-10 w-10
            shrink-0
            place-items-center
            rounded-xl
            bg-[var(--primary-soft)]
            text-[var(--primary)]
          "
        >
          {icon}
        </span>

        <div>
          <h2
            className="
              text-sm
              font-semibold
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-0.5
              text-xs
              text-[var(--text-muted)]
            "
          >
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function SettingsClient({
  initialUser,
  initialPreferences,
}: {
  initialUser: User;
  initialPreferences: Preferences;
}) {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>(
      "account",
    );

  const [user, setUser] =
    useState<User>(
      initialUser,
    );

  const [
    preferences,
    setPreferences,
  ] = useState<Preferences>(
    initialPreferences,
  );

  const [
    preferenceSaving,
    setPreferenceSaving,
  ] = useState<
    PreferenceKey | null
  >(null);

  const [
    preferenceError,
    setPreferenceError,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    passwordOpen,
    setPasswordOpen,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  const [
    sessionsOpen,
    setSessionsOpen,
  ] = useState(false);

  const [sessions, setSessions] =
    useState<Session[]>([]);

  const [
    sessionsLoading,
    setSessionsLoading,
  ] = useState(false);

  const [
    sessionError,
    setSessionError,
  ] = useState("");

  const [
    sessionAction,
    setSessionAction,
  ] = useState<
    string | null
  >(null);

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "account",
      label: "Account",
      icon: (
        <UserRound className="h-4 w-4" />
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: (
        <Palette className="h-4 w-4" />
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (
        <Bell className="h-4 w-4" />
      ),
    },
    {
      id: "messages",
      label:
        "Messages & Security",
      icon: (
        <MessageSquare className="h-4 w-4" />
      ),
    },
  ];

  useEffect(() => {
    applyTheme(
      preferences.theme,
    );
  }, [preferences.theme]);

  useEffect(() => {
    document.documentElement.dataset.compact =
      preferences.compactMode
        ? "true"
        : "false";
  }, [
    preferences.compactMode,
  ]);

  function applyTheme(
    theme: Theme,
  ) {
    const root =
      document.documentElement;

    if (theme === "DARK") {
      root.classList.add("dark");
      root.dataset.theme =
        "dark";

      return;
    }

    if (theme === "LIGHT") {
      root.classList.remove(
        "dark",
      );

      root.dataset.theme =
        "light";

      return;
    }

    const dark =
      window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

    root.classList.toggle(
      "dark",
      dark,
    );

    root.dataset.theme =
      dark
        ? "dark"
        : "light";
  }

  async function updatePreference<
    K extends PreferenceKey,
  >(
    key: K,
    value: Preferences[K],
  ) {
    const previous =
      preferences[key];

    setPreferenceError("");

    setPreferences(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );

    setPreferenceSaving(key);

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
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to save preference.",
        );
      }

      if (data.preferences) {
        setPreferences(
          data.preferences,
        );
      }
    } catch (err) {
      setPreferences(
        (current) => ({
          ...current,
          [key]: previous,
        }),
      );

      setPreferenceError(
        err instanceof Error
          ? err.message
          : "Unable to save preference.",
      );
    } finally {
      setPreferenceSaving(
        null,
      );
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const response =
        await fetch(
          "/api/users/me",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: user.name,
              bio: user.bio,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to save profile.",
        );
      }

      setUser(data.user);

      setSaved(true);

      window.setTimeout(
        () =>
          setSaved(false),
        2200,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetPasswordForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  }

  async function submitPassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New password and confirmation do not match.",
      );

      return;
    }

    if (
      newPassword.length < 8
    ) {
      setPasswordError(
        "New password must be at least 8 characters.",
      );

      return;
    }

    setPasswordLoading(true);

    try {
      const response =
        await fetch(
          "/api/security/password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to update password.",
        );
      }

      setPasswordSuccess(
        "Password updated. Other active sessions were signed out.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : "Unable to update password.",
      );
    } finally {
      setPasswordLoading(
        false,
      );
    }
  }

  const loadSessions =
    useCallback(async () => {
      setSessionsLoading(
        true,
      );

      setSessionError("");

      try {
        const response =
          await fetch(
            "/api/security/sessions",
            {
              cache:
                "no-store",
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Unable to load active sessions.",
          );
        }

        setSessions(
          data.sessions ?? [],
        );
      } catch (err) {
        setSessionError(
          err instanceof Error
            ? err.message
            : "Unable to load active sessions.",
        );
      } finally {
        setSessionsLoading(
          false,
        );
      }
    }, []);

  useEffect(() => {
    if (sessionsOpen) {
      void loadSessions();
    }
  }, [
    sessionsOpen,
    loadSessions,
  ]);

  async function revokeSession(
    id: string,
  ) {
    setSessionAction(id);
    setSessionError("");

    try {
      const response =
        await fetch(
          `/api/security/sessions/${id}`,
          {
            method:
              "DELETE",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to sign out this session.",
        );
      }

      setSessions(
        (current) =>
          current.filter(
            (session) =>
              session.id !== id,
          ),
      );
    } catch (err) {
      setSessionError(
        err instanceof Error
          ? err.message
          : "Unable to sign out this session.",
      );
    } finally {
      setSessionAction(
        null,
      );
    }
  }

  async function revokeOtherSessions() {
    setSessionAction(
      "others",
    );

    setSessionError("");

    try {
      const response =
        await fetch(
          "/api/security/sessions/revoke-others",
          {
            method:
              "POST",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to sign out other sessions.",
        );
      }

      setSessions(
        (current) =>
          current.filter(
            (session) =>
              session.current,
          ),
      );
    } catch (err) {
      setSessionError(
        err instanceof Error
          ? err.message
          : "Unable to sign out other sessions.",
      );
    } finally {
      setSessionAction(
        null,
      );
    }
  }

  const otherSessionCount =
    useMemo(
      () =>
        sessions.filter(
          (session) =>
            !session.current,
        ).length,
      [sessions],
    );

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your account, appearance, notifications, messaging preferences, and security."
      />

      {/* TABS */}
      <div
        className="
          mb-5
          flex
          overflow-x-auto
          border-b
          border-[var(--border)]
        "
      >
        {tabs.map((tab) => {
          const active =
            activeTab ===
            tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id,
                )
              }
              className={`
                relative
                flex shrink-0
                items-center
                gap-2
                px-4 py-3
                text-sm
                font-medium
                transition

                ${
                  active
                    ? `
                      text-[var(--text)]
                    `
                    : `
                      text-[var(--text-muted)]
                      hover:text-[var(--text)]
                    `
                }
              `}
            >
              {tab.icon}

              {tab.label}

              {active ? (
                <span
                  className="
                    absolute
                    inset-x-3
                    bottom-0
                    h-0.5
                    rounded-full
                    bg-[var(--primary)]
                  "
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {preferenceError ? (
        <div
          className="
            mb-4
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4 py-3
            text-sm
            text-red-700
            dark:border-red-900/50
            dark:bg-red-950/20
            dark:text-red-300
          "
        >
          {preferenceError}
        </div>
      ) : null}

      {/* ACCOUNT */}
      {activeTab ===
      "account" ? (
        <div
          className="
            grid
            gap-4
            lg:grid-cols-[minmax(0,1fr)_300px]
          "
        >
          <form
            onSubmit={
              saveProfile
            }
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
                border-b
                border-[var(--border)]
                px-5 py-4
              "
            >
              <h2
                className="
                  text-sm
                  font-semibold
                "
              >
                Profile
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                Manage your
                account information
                and workspace
                profile.
              </p>
            </div>

            <div
              className="
                space-y-4
                p-5
              "
            >
              <div>
                <Label>
                  Name
                </Label>

                <Input
                  value={
                    user.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setUser({
                      ...user,
                      name: event
                        .target
                        .value,
                    })
                  }
                />
              </div>

              <div>
                <Label>
                  Email
                </Label>

                <Input
                  value={
                    user.email
                  }
                  disabled
                  className="
                    cursor-not-allowed
                    opacity-65
                  "
                />

                <p
                  className="
                    mt-1.5
                    text-xs
                    text-[var(--text-muted)]
                  "
                >
                  Email changes
                  are currently
                  disabled.
                </p>
              </div>

              <div>
                <Label>
                  Bio
                </Label>

                <Textarea
                  value={
                    user.bio ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setUser({
                      ...user,
                      bio: event
                        .target
                        .value,
                    })
                  }
                  placeholder="Backend developer focused on..."
                />
              </div>

              {error ? (
                <div
                  className="
                    rounded-xl
                    bg-red-50
                    p-3
                    text-sm
                    text-red-700
                    dark:bg-red-950/20
                    dark:text-red-300
                  "
                >
                  {error}
                </div>
              ) : null}

              <div
                className="
                  flex
                  justify-end
                "
              >
                <Button
                  disabled={
                    loading
                  }
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : null}

                  {saved
                    ? "Saved"
                    : "Save profile"}
                </Button>
              </div>
            </div>

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                border-t
                border-[var(--border)]
                px-5 py-4
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Password
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--text-muted)]
                  "
                >
                  Update the
                  password used to
                  sign in.
                </p>
              </div>

              <GhostButton
                type="button"
                className="shrink-0"
                onClick={() => {
                  resetPasswordForm();
                  setPasswordOpen(
                    true,
                  );
                }}
              >
                <LockKeyhole className="h-4 w-4" />
                Change
              </GhostButton>
            </div>
          </form>

          <aside
            className="
              h-fit
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-5
            "
          >
            <span
              className="
                grid h-10 w-10
                place-items-center
                rounded-xl
                bg-[var(--primary-soft)]
                text-[var(--primary)]
              "
            >
              <ShieldCheck className="h-[18px] w-[18px]" />
            </span>

            <h2
              className="
                mt-4
                text-sm
                font-semibold
              "
            >
              Access role
            </h2>

            <div className="mt-3">
              <Badge tone="primary">
                {user.role}
              </Badge>
            </div>

            <p
              className="
                mt-3
                text-xs
                leading-5
                text-[var(--text-muted)]
              "
            >
              Your workspace
              permissions are
              managed by
              administrators.
            </p>
          </aside>
        </div>
      ) : null}

      {/* APPEARANCE */}
      {activeTab ===
      "appearance" ? (
        <div className="space-y-4">
          <Section
            icon={
              <Palette className="h-[18px] w-[18px]" />
            }
            title="Appearance"
            description="Customize how DevKnowledge looks on this device."
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
                  preferenceSaving ===
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
                  min-w-[140px]
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  px-3
                  text-sm
                  text-[var(--text)]
                  outline-none
                  transition
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
              description="Reduce spacing in lists, cards, controls, and page sections."
            >
              <Toggle
                checked={
                  preferences.compactMode
                }
                disabled={
                  preferenceSaving ===
                  "compactMode"
                }
                onChange={(
                  value,
                ) =>
                  void updatePreference(
                    "compactMode",
                    value,
                  )
                }
              />
            </SettingRow>
          </Section>

          <div
            className="
              grid
              gap-3
              sm:grid-cols-3
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-4
              "
            >
              <Sun
                className="
                  h-5 w-5
                  text-[var(--primary)]
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                "
              >
                Light
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                Bright interface
                for daytime use.
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-4
              "
            >
              <Moon
                className="
                  h-5 w-5
                  text-[var(--primary)]
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                "
              >
                Dark
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                Reduced brightness
                for darker
                environments.
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                p-4
              "
            >
              <MonitorSmartphone
                className="
                  h-5 w-5
                  text-[var(--primary)]
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                "
              >
                System
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                Follow your device
                appearance.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* NOTIFICATIONS */}
      {activeTab ===
      "notifications" ? (
        <Section
          icon={
            <Bell className="h-[18px] w-[18px]" />
          }
          title="Notifications"
          description="Choose which workspace activity should notify you."
        >
          <SettingRow
            title="Friend requests"
            description="Notify me when someone sends a friend request."
          >
            <Toggle
              checked={
                preferences.notifyFriendRequests
              }
              disabled={
                preferenceSaving ===
                "notifyFriendRequests"
              }
              onChange={(
                value,
              ) =>
                void updatePreference(
                  "notifyFriendRequests",
                  value,
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Mentions"
            description="Notify me when someone mentions me."
          >
            <Toggle
              checked={
                preferences.notifyMentions
              }
              disabled={
                preferenceSaving ===
                "notifyMentions"
              }
              onChange={(
                value,
              ) =>
                void updatePreference(
                  "notifyMentions",
                  value,
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Group messages"
            description="Notify me when new group messages arrive."
          >
            <Toggle
              checked={
                preferences.notifyGroupMessages
              }
              disabled={
                preferenceSaving ===
                "notifyGroupMessages"
              }
              onChange={(
                value,
              ) =>
                void updatePreference(
                  "notifyGroupMessages",
                  value,
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Forum replies"
            description="Notify me when someone replies to my discussion."
          >
            <Toggle
              checked={
                preferences.notifyForumReplies
              }
              disabled={
                preferenceSaving ===
                "notifyForumReplies"
              }
              onChange={(
                value,
              ) =>
                void updatePreference(
                  "notifyForumReplies",
                  value,
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Accepted answers"
            description="Notify me when an answer is marked as accepted."
          >
            <Toggle
              checked={
                preferences.notifyAcceptedAnswers
              }
              disabled={
                preferenceSaving ===
                "notifyAcceptedAnswers"
              }
              onChange={(
                value,
              ) =>
                void updatePreference(
                  "notifyAcceptedAnswers",
                  value,
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Reputation"
            description="Notify me when my reputation changes."
          >
            <Toggle
              checked={
                preferences.notifyReputation
              }
              disabled={
                preferenceSaving ===
                "notifyReputation"
              }
              onChange={(
                value,
              ) =>
                void updatePreference(
                  "notifyReputation",
                  value,
                )
              }
            />
          </SettingRow>
        </Section>
      ) : null}

      {/* MESSAGES + SECURITY */}
      {activeTab ===
      "messages" ? (
        <div className="space-y-4">
          <Section
            icon={
              <MessageSquare className="h-[18px] w-[18px]" />
            }
            title="Messages"
            description="Manage chat presence, receipts, sounds, and desktop alerts."
          >
            <SettingRow
              title="Online status"
              description="Allow other users to see when you are online."
            >
              <Toggle
                checked={
                  preferences.showOnlineStatus
                }
                disabled={
                  preferenceSaving ===
                  "showOnlineStatus"
                }
                onChange={(
                  value,
                ) =>
                  void updatePreference(
                    "showOnlineStatus",
                    value,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Read receipts"
              description="Let people know when you have read their messages."
            >
              <Toggle
                checked={
                  preferences.readReceipts
                }
                disabled={
                  preferenceSaving ===
                  "readReceipts"
                }
                onChange={(
                  value,
                ) =>
                  void updatePreference(
                    "readReceipts",
                    value,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Message sounds"
              description="Play a sound when new messages arrive."
            >
              <Toggle
                checked={
                  preferences.messageSounds
                }
                disabled={
                  preferenceSaving ===
                  "messageSounds"
                }
                onChange={(
                  value,
                ) =>
                  void updatePreference(
                    "messageSounds",
                    value,
                  )
                }
              />
            </SettingRow>

            <SettingRow
              title="Desktop notifications"
              description="Allow browser notifications for message activity."
            >
              <Toggle
                checked={
                  preferences.desktopNotifications
                }
                disabled={
                  preferenceSaving ===
                  "desktopNotifications"
                }
                onChange={(
                  value,
                ) =>
                  void updatePreference(
                    "desktopNotifications",
                    value,
                  )
                }
              />
            </SettingRow>
          </Section>

          <Section
            icon={
              <ShieldCheck className="h-[18px] w-[18px]" />
            }
            title="Security"
            description="Manage your password and devices currently signed in."
          >
            <SettingRow
              title="Password"
              description="Change your account password. Other sessions will be signed out."
            >
              <GhostButton
                type="button"
                onClick={() => {
                  resetPasswordForm();
                  setPasswordOpen(
                    true,
                  );
                }}
              >
                <LockKeyhole className="h-4 w-4" />
                Change
              </GhostButton>
            </SettingRow>

            <SettingRow
              title="Active sessions"
              description="Review browsers and devices signed in to your account."
            >
              <GhostButton
                type="button"
                onClick={() =>
                  setSessionsOpen(
                    true,
                  )
                }
              >
                <Laptop className="h-4 w-4" />
                Manage
              </GhostButton>
            </SettingRow>
          </Section>
        </div>
      ) : null}

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        open={passwordOpen}
        title="Change password"
        description="Choose a strong password you do not use elsewhere. Updating it will sign out your other active sessions."
        onClose={() => {
          if (
            !passwordLoading
          ) {
            setPasswordOpen(
              false,
            );

            resetPasswordForm();
          }
        }}
      >
        <form
          onSubmit={
            submitPassword
          }
          className="
            space-y-4
            p-5
          "
        >
          <PasswordInput
            label="Current password"
            value={
              currentPassword
            }
            onChange={
              setCurrentPassword
            }
            autoComplete="current-password"
          />

          <PasswordInput
            label="New password"
            value={
              newPassword
            }
            onChange={
              setNewPassword
            }
            autoComplete="new-password"
          />

          <PasswordInput
            label="Confirm new password"
            value={
              confirmPassword
            }
            onChange={
              setConfirmPassword
            }
            autoComplete="new-password"
          />

          <p
            className="
              text-xs
              text-[var(--text-muted)]
            "
          >
            Password must
            contain at least 8
            characters.
          </p>

          {passwordError ? (
            <div
              className="
                rounded-xl
                bg-red-50
                p-3
                text-sm
                text-red-700
                dark:bg-red-950/20
                dark:text-red-300
              "
            >
              {passwordError}
            </div>
          ) : null}

          {passwordSuccess ? (
            <div
              className="
                rounded-xl
                bg-emerald-50
                p-3
                text-sm
                text-emerald-700
                dark:bg-emerald-950/20
                dark:text-emerald-300
              "
            >
              {passwordSuccess}
            </div>
          ) : null}

          <div
            className="
              flex
              justify-end
              gap-2
              border-t
              border-[var(--border)]
              pt-4
            "
          >
            <GhostButton
              type="button"
              disabled={
                passwordLoading
              }
              onClick={() => {
                setPasswordOpen(
                  false,
                );

                resetPasswordForm();
              }}
            >
              Cancel
            </GhostButton>

            <Button
              type="submit"
              disabled={
                passwordLoading ||
                !currentPassword ||
                newPassword.length <
                  8 ||
                newPassword !==
                  confirmPassword
              }
            >
              {passwordLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}

              Update password
            </Button>
          </div>
        </form>
      </Modal>

      {/* SESSIONS MODAL */}
      <Modal
        open={sessionsOpen}
        title="Active sessions"
        description="These are the devices currently signed in to your DevKnowledge account."
        onClose={() => {
          if (
            !sessionAction
          ) {
            setSessionsOpen(
              false,
            );
          }
        }}
      >
        <div className="p-5">
          {sessionsLoading ? (
            <div
              className="
                flex min-h-32
                items-center
                justify-center
                gap-2
                text-sm
                text-[var(--text-muted)]
              "
            >
              <LoaderCircle className="h-4 w-4 animate-spin" />

              Loading
              sessions...
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(
                (session) => (
                  <div
                    key={
                      session.id
                    }
                    className="
                      rounded-xl
                      border
                      border-[var(--border)]
                      bg-[var(--surface-soft)]
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          min-w-0
                          gap-3
                        "
                      >
                        <span
                          className="
                            grid
                            h-9 w-9
                            shrink-0
                            place-items-center
                            rounded-lg
                            bg-[var(--surface)]
                            text-[var(--text-soft)]
                          "
                        >
                          <Laptop className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                            "
                          >
                            <p
                              className="
                                truncate
                                text-sm
                                font-medium
                              "
                            >
                              {
                                session.browser
                              }{" "}
                              on{" "}
                              {
                                session.device
                              }
                            </p>

                            {session.current ? (
                              <Badge tone="primary">
                                Current
                              </Badge>
                            ) : null}
                          </div>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-[var(--text-muted)]
                            "
                          >
                            {session.current
                              ? "Active now"
                              : `Last active ${formatDate(
                                  session.lastSeenAt,
                                )}`}

                            {session.ipAddress
                              ? ` · ${session.ipAddress}`
                              : ""}
                          </p>

                          <p
                            className="
                              mt-1
                              text-[11px]
                              text-[var(--text-muted)]
                            "
                          >
                            Signed in{" "}
                            {formatDate(
                              session.createdAt,
                            )}
                          </p>
                        </div>
                      </div>

                      {!session.current ? (
                        <button
                          type="button"
                          disabled={
                            sessionAction ===
                            session.id
                          }
                          onClick={() =>
                            void revokeSession(
                              session.id,
                            )
                          }
                          className="
                            inline-flex
                            h-8
                            shrink-0
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-[var(--border)]
                            bg-[var(--surface)]
                            px-2.5
                            text-xs
                            font-medium
                            text-[var(--text-soft)]
                            transition
                            hover:bg-[var(--surface-hover)]
                            hover:text-[var(--danger)]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {sessionAction ===
                          session.id ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <LogOut className="h-3.5 w-3.5" />
                          )}

                          Sign out
                        </button>
                      ) : null}
                    </div>
                  </div>
                ),
              )}

              {!sessions.length ? (
                <div
                  className="
                    rounded-xl
                    border
                    border-dashed
                    border-[var(--border)]
                    p-6
                    text-center
                    text-sm
                    text-[var(--text-muted)]
                  "
                >
                  No active
                  sessions found.
                </div>
              ) : null}
            </div>
          )}

          {sessionError ? (
            <div
              className="
                mt-4
                rounded-xl
                bg-red-50
                p-3
                text-sm
                text-red-700
                dark:bg-red-950/20
                dark:text-red-300
              "
            >
              {sessionError}
            </div>
          ) : null}

          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              gap-3
              border-t
              border-[var(--border)]
              pt-4
            "
          >
            <p
              className="
                text-xs
                text-[var(--text-muted)]
              "
            >
              {otherSessionCount
                ? `${otherSessionCount} other active session${
                    otherSessionCount ===
                    1
                      ? ""
                      : "s"
                  }`
                : "No other active sessions"}
            </p>

            <GhostButton
              type="button"
              disabled={
                !otherSessionCount ||
                Boolean(
                  sessionAction,
                )
              }
              onClick={() =>
                void revokeOtherSessions()
              }
              className="text-[var(--danger)]"
            >
              {sessionAction ===
              "others" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              Sign out others
            </GhostButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}