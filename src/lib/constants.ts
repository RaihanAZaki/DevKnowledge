export const APP_NAME = "DevKnowledge";
export const AUTH_COOKIE = "devknowledge_token";
export const CATEGORY_OPTIONS = ["BACKEND", "FRONTEND", "DATABASE", "DEVOPS", "TESTING", "GENERAL"] as const;
export type CategoryValue = (typeof CATEGORY_OPTIONS)[number];

export const CATEGORY_LABEL: Record<CategoryValue, string> = {
  BACKEND: "Backend",
  FRONTEND: "Frontend",
  DATABASE: "Database",
  DEVOPS: "DevOps",
  TESTING: "Testing",
  GENERAL: "General",
};
