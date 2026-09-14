import {
  ForumForm,
} from "@/components/forum-form";

import {
  PageHeader,
} from "@/components/page-header";

export default function NewForumPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Forum"
        title="Start a discussion"
        description="Give enough context so another developer can reproduce the problem or understand the trade-off."
      />

      <ForumForm />
    </div>
  );
}