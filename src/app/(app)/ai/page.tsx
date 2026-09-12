import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getChatHistory } from "@/server/ai/ai.service";
import { serializeForClient } from "@/server/shared/serialize";
import AiClient from "./ai-client";

export default async function AiPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const messages = await getChatHistory(user.id);
  return <AiClient initialMessages={serializeForClient(messages)} />;
}
