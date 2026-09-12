import { listForumThreads } from "@/server/forum/forum.service";
import { serializeForClient } from "@/server/shared/serialize";
import ForumClient from "./forum-client";

export default async function ForumPage() {
  const threads = await listForumThreads({});
  return <ForumClient initialItems={serializeForClient(threads)} />;
}
