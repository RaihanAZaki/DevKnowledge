import {
  Trophy,
} from "lucide-react";

type ReputationCardProps = {
  score: number;
  threads: number;
  replies: number;
  solved: number;
};

export default function ReputationCard({
  score,
  threads,
  replies,
  solved,
}: ReputationCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-5
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="
              text-sm
              text-[var(--text-muted)]
            "
          >
            Reputation
          </p>

          <div
            className="
              mt-1
              flex
              items-center
              gap-2
            "
          >
            <span className="text-3xl">
              ⭐
            </span>

            <h2
              className="
                text-3xl
                font-semibold
                tracking-tight
              "
            >
              {score}
            </h2>
          </div>
        </div>

        <div
          className="
            grid
            h-14
            w-14
            place-items-center
            rounded-2xl
            bg-[var(--primary-soft)]
            text-[var(--primary)]
          "
        >
          <Trophy className="h-5 w-5" />
        </div>
      </div>

      <div
        className="
          mt-6
          grid
          grid-cols-3
          gap-3
        "
      >
        <div>
          <p
            className="
              text-xs
              text-[var(--text-muted)]
            "
          >
            Threads
          </p>

          <strong
            className="
              mt-1
              block
              text-sm
            "
          >
            {threads}
          </strong>
        </div>

        <div>
          <p
            className="
              text-xs
              text-[var(--text-muted)]
            "
          >
            Replies
          </p>

          <strong
            className="
              mt-1
              block
              text-sm
            "
          >
            {replies}
          </strong>
        </div>

        <div>
          <p
            className="
              text-xs
              text-[var(--text-muted)]
            "
          >
            Solved
          </p>

          <strong
            className="
              mt-1
              block
              text-sm
            "
          >
            {solved}
          </strong>
        </div>
      </div>
    </div>
  );
}