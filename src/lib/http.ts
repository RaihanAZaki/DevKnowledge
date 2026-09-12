import { AppError } from "@/server/shared/app-error";
import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function safeError(error: unknown) {
  if (error instanceof AppError) {
    return jsonError(error.message, error.status, error.details);
  }

  console.error(error);
  return jsonError("Something went wrong on the server.", 500);
}
