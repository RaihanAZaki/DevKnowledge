"use client";

import {
  Archive,
  Download,
  FileArchive,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type StoredFile = {
  id: string;
  name: string;
  originalName: string;
  pathname: string;
  contentType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialFiles: StoredFile[];
};

function formatBytes(
  bytes: number,
) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    );

  return `${(
    bytes /
    Math.pow(
      1024,
      index,
    )
  ).toFixed(1)} ${
    units[index]
  }`;
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function FilesClient({
  initialFiles,
}: Props) {
  const router =
    useRouter();

  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    files,
    setFiles,
  ] =
    useState<StoredFile[]>(
      initialFiles,
    );

  const [deleteTarget, setDeleteTarget] = useState<StoredFile | null>(null);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  async function handleFile(
    file: File,
  ) {
    if (
      !file.name
        .toLowerCase()
        .endsWith(".zip")
    ) {
      setError(
        "Only ZIP files are allowed.",
      );

      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/files",
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Upload failed.",
        );
      }

      setFiles(
        (current) => [
          {
            ...data.file,

            createdAt:
              new Date(
                data.file
                  .createdAt,
              ).toISOString(),

            updatedAt:
              new Date(
                data.file
                  .updatedAt,
              ).toISOString(),
          },

          ...current,
        ],
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed.",
      );
    } finally {
      setUploading(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }

  async function deleteFile(
  id: string,
) {
  try {
    setDeletingId(id);
    setError(null);

    const response =
      await fetch(
        `/api/files/${id}`,
        {
          method: "DELETE",
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `Delete failed (${response.status}).`,
      );
    }

    setFiles(
      (current) =>
        current.filter(
          (file) =>
            file.id !== id,
        ),
    );

    setDeleteTarget(null);

    router.refresh();
  } catch (error) {
    console.error(
      "DELETE FILE ERROR:",
      error,
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to delete file.",
    );
  } finally {
    setDeletingId(null);
  }
}

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h1
            className="
              text-2xl
              font-semibold
              tracking-[-0.03em]
            "
          >
            My Files
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-[var(--text-muted)]
            "
          >
            Private ZIP storage
            visible only to your
            account.
          </p>
        </div>

        <button
  type="button"
  disabled={uploading}
  onClick={() =>
    inputRef.current?.click()
  }
  className="
    inline-flex
    h-10
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-[var(--border)]
    bg-white
    px-4
    text-sm
    font-medium
    text-[var(--text)]
    shadow-sm
    transition-all
    hover:border-[var(--primary)
    hover:shadow-md
    disabled:cursor-not-allowed
    disabled:opacity-50
  "
>
  {uploading ? (
    <LoaderCircle className="h-4 w-4 animate-spin" />
  ) : (
    <Plus className="h-4 w-4" />
  )}

  {uploading
    ? "Uploading..."
    : "Upload ZIP"}
</button>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(
            event,
          ) => {
            const file =
              event.target
                .files?.[0];

            if (file) {
              void handleFile(
                file,
              );
            }
          }}
        />
      </div>

      {error && (
        <div
          className="
            mt-5
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {files.length ===
      0 ? (
        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          className="
            mt-8
            flex
            min-h-[320px]
            w-full
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-[var(--border-strong)]
            bg-[var(--surface)]
            p-8
            text-center
            transition
            hover:bg-[var(--surface-soft)]
          "
        >
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
            <UploadCloud className="h-6 w-6" />
          </div>

          <h2 className="mt-4 font-semibold">
            Upload your first ZIP
          </h2>

          <p
            className="
              mt-1
              max-w-sm
              text-sm
              text-[var(--text-muted)]
            "
          >
            Store project source
            files privately and
            download them whenever
            you need.
          </p>
        </button>
      ) : (
        <div
          className="
            mt-7
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
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
              "
            >
              <Archive className="h-4 w-4 text-[var(--primary)]" />

              Private archives

              <span
                className="
                  ml-1
                  text-xs
                  font-normal
                  text-[var(--text-muted)]
                "
              >
                {files.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {files.map(
              (file) => (
                <div
                  key={file.id}
                  className="
                    flex
                    items-center
                    gap-4
                    px-5
                    py-4
                    transition
                    hover:bg-[var(--surface-soft)]
                  "
                >
                  <div
                    className="
                      grid
                      h-10
                      w-10
                      shrink-0
                      place-items-center
                      rounded-xl
                      bg-[var(--primary-soft)]
                      text-[var(--primary)]
                    "
                  >
                    <FileArchive className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        truncate
                        text-sm
                        font-medium
                      "
                    >
                      {
                        file.originalName
                      }
                    </div>

                    <div
                      className="
                        mt-1
                        flex
                        flex-wrap
                        items-center
                        gap-2
                        text-xs
                        text-[var(--text-muted)]
                      "
                    >
                      <span>
                        {formatBytes(
                          file.size,
                        )}
                      </span>

                      <span>·</span>

                      <span>
                        {formatDate(
                          file.createdAt,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/api/files/${file.id}/download`}
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-[var(--border)]
                        px-3
                        text-sm
                        transition
                        hover:bg-[var(--surface-soft)]
                      "
                    >
                      <Download className="h-4 w-4" />

                      <span className="hidden sm:inline">
                        Download
                      </span>
                    </a>

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        file.id
                      }
                     onClick={() =>
                        setDeleteTarget(file)
                    }
                      className="
                        inline-flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        text-red-500
                        transition
                        hover:bg-red-50
                        disabled:opacity-50
                      "
                    >
                      {deletingId ===
                      file.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
      {deleteTarget && (
  <div
    className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/40
      px-4
      backdrop-blur-sm
    "
    onClick={() => {
      if (!deletingId) {
        setDeleteTarget(null);
      }
    }}
  >
    <div
      className="
        w-full
        max-w-md
        overflow-hidden
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        shadow-2xl
      "
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="p-6">
        <div
          className="
            grid
            h-12
            w-12
            place-items-center
            rounded-xl
            bg-red-50
            text-red-500
          "
        >
          <Trash2 className="h-5 w-5" />
        </div>

        <h2
          className="
            mt-5
            text-lg
            font-semibold
            tracking-[-0.02em]
          "
        >
          Delete ZIP file?
        </h2>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[var(--text-muted)]
          "
        >
          Are you sure you want to delete
          <span className="font-medium text-[var(--text)]">
            {" "}
            {deleteTarget.originalName}
          </span>
          ? This action cannot be undone.
        </p>

        <div
          className="
            mt-6
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface-soft)]
            p-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                grid
                h-10
                w-10
                shrink-0
                place-items-center
                rounded-lg
                bg-[var(--primary-soft)]
                text-[var(--primary)]
              "
            >
              <FileArchive className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {deleteTarget.originalName}
              </p>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {formatBytes(
                  deleteTarget.size,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="
          flex
          justify-end
          gap-2
          border-t
          border-[var(--border)]
          bg-[var(--surface-soft)]
          px-6
          py-4
        "
      >
        <button
          type="button"
          disabled={
            deletingId !== null
          }
          onClick={() =>
            setDeleteTarget(null)
          }
          className="
            h-9
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-4
            text-sm
            font-medium
            transition
            hover:bg-[var(--surface-hover)]
            disabled:opacity-50
          "
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            deletingId !== null
          }
          onClick={() =>
            deleteFile(
              deleteTarget.id,
            )
          }
          className="
            inline-flex
            h-9
            items-center
            gap-2
            rounded-lg
            bg-red-500
            px-4
            text-sm
            font-medium
            text-white
            transition
            hover:bg-red-600
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {deletingId ===
          deleteTarget.id ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete file
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}