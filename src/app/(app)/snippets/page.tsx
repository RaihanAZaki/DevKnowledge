import { listSnippets } from "@/server/snippets/snippet.service";
import { serializeForClient } from "@/server/shared/serialize";
import SnippetsClient from "./snippets-client";

export default async function SnippetsPage() {
  const snippets = await listSnippets({});
  return <SnippetsClient initialItems={serializeForClient(snippets)} />;
}
