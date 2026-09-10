import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function safeError(error: unknown) {
  console.error(error);
  return jsonError("Something went wrong on the server.", 500);
}
