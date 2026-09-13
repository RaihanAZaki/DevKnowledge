"use client";

import {
  Archive,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileText,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
  X,
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

function isImage(
  file: StoredFile,
) {
  return (
    file.contentType ===
      "image/jpeg" ||
    file.contentType ===
      "image/png"
  );
}

function isPdf(
  file: StoredFile,
) {
  return (
    file.contentType ===
    "application/pdf"
  );
}

function isZip(
  file: StoredFile,
) {
  return (
    file.contentType ===
      "application/zip" ||
    file.contentType ===
      "application/x-zip-compressed"
  );
}

function canPreview(
  file: StoredFile,
) {
  return (
    isImage(file) ||
    isPdf(file)
  );
}

function getFileTypeLabel(
  file: StoredFile,
) {
  if (isPdf(file)) {
    return "PDF";
  }

  if (
    file.contentType ===
    "image/png"
  ) {
    return "PNG";
  }

  if (
    file.contentType ===
    "image/jpeg"
  ) {
    return "JPG";
  }

  if (isZip(file)) {
    return "ZIP";
  }

  return "FILE";
}

function FileIcon({
  file,
  large = false,
}: {
  file: StoredFile;
  large?: boolean;
}) {
  const iconClass =
    large
      ? "h-5 w-5"
      : "h-4 w-4";

  if (isPdf(file)) {
    return (
      <div
        className={`
          grid
          shrink-0
          place-items-center
          rounded-xl
          bg-red-50
          text-red-500

          ${
            large
              ? "h-10 w-10"
              : "h-9 w-9"
          }
        `}
      >
        <FileText
          className={iconClass}
        />
      </div>
    );
  }

  if (isImage(file)) {
    return (
      <div
        className={`
          grid
          shrink-0
          place-items-center
          rounded-xl
          bg-blue-50
          text-blue-500

          ${
            large
              ? "h-10 w-10"
              : "h-9 w-9"
          }
        `}
      >
        <FileImage
          className={iconClass}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        grid
        shrink-0
        place-items-center
        rounded-xl
        bg-[var(--primary-soft)]
        text-[var(--primary)]

        ${
          large
            ? "h-10 w-10"
            : "h-9 w-9"
        }
      `}
    >
      <FileArchive
        className={iconClass}
      />
    </div>
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

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<StoredFile | null>(
      null,
    );

  const [
    previewTarget,
    setPreviewTarget,
  ] =
    useState<StoredFile | null>(
      null,
    );

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
    const extension =
      file.name
        .toLowerCase()
        .slice(
          file.name
            .lastIndexOf("."),
        );

    const allowed =
      new Set([
        ".zip",
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
      ]);

    if (
      !allowed.has(extension)
    ) {
      setError(
        "Only ZIP, PDF, JPG, JPEG, and PNG files are allowed.",
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

      setDeleteTarget(
        null,
      );

      if (
        previewTarget?.id ===
        id
      ) {
        setPreviewTarget(
          null,
        );
      }

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
      setDeletingId(
        null,
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* HEADER */}
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
            Private ZIP, PDF,
            JPG and PNG storage
            visible only to your
            account.
          </p>
        </div>

        <button
          type="button"
          disabled={
            uploading
          }
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

            hover:border-[var(--primary)]
            hover:bg-[var(--primary)]
            hover:text-white
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
            : "Upload file"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="
            .zip,
            .pdf,
            .jpg,
            .jpeg,
            .png,
            application/zip,
            application/pdf,
            image/jpeg,
            image/png
          "
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

      {/* ERROR */}
      {error ? (
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
      ) : null}

      {/* EMPTY */}
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
            min-h-[300px]
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
            Upload your first
            file
          </h2>

          <p
            className="
              mt-1
              max-w-sm
              text-sm
              leading-6
              text-[var(--text-muted)]
            "
          >
            Store ZIP archives,
            PDF documents and
            images privately.
          </p>

          <p
            className="
              mt-2
              text-xs
              text-[var(--text-muted)]
            "
          >
            ZIP, PDF, JPG,
            JPEG or PNG
          </p>
        </button>
      ) : (
        /* FILE LIST */
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
              px-4
              py-4

              sm:px-5
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

              Private files

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
                  key={
                    file.id
                  }
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                    px-3
                    py-3.5
                    transition
                    hover:bg-[var(--surface-soft)]

                    sm:gap-4
                    sm:px-5
                    sm:py-4
                  "
                >
                  {/* THUMBNAIL */}
                  {isImage(
                    file,
                  ) ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewTarget(
                          file,
                        )
                      }
                      className="
                        h-11
                        w-11
                        shrink-0
                        overflow-hidden
                        rounded-xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-soft)]

                        sm:h-12
                        sm:w-12
                      "
                    >
                      <img
                        src={`/api/files/${file.id}/preview`}
                        alt={
                          file.originalName
                        }
                        className="
                          h-full
                          w-full
                          object-cover
                        "
                      />
                    </button>
                  ) : (
                    <FileIcon
                      file={
                        file
                      }
                      large
                    />
                  )}

                  {/* INFO */}
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
                        min-w-0
                        flex-wrap
                        items-center
                        gap-x-2
                        gap-y-1
                        text-xs
                        text-[var(--text-muted)]
                      "
                    >
                      <span
                        className="
                          rounded-md
                          bg-[var(--surface-soft)]
                          px-1.5
                          py-0.5
                          text-[10px]
                          font-medium
                        "
                      >
                        {getFileTypeLabel(
                          file,
                        )}
                      </span>

                      <span>
                        {formatBytes(
                          file.size,
                        )}
                      </span>

                      <span>
                        ·
                      </span>

                      <span className="truncate">
                        {formatDate(
                          file.createdAt,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div
                    className="
                      flex
                      shrink-0
                      items-center
                      gap-1

                      sm:gap-2
                    "
                  >
                    {canPreview(
                      file,
                    ) ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewTarget(
                            file,
                          )
                        }
                        className="
                          inline-flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-[var(--border)]
                          transition
                          hover:bg-[var(--surface-soft)]

                          sm:w-auto
                          sm:gap-2
                          sm:px-3
                        "
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />

                        <span className="hidden sm:inline">
                          Preview
                        </span>
                      </button>
                    ) : null}

                    <a
                      href={`/api/files/${file.id}/download`}
                      className="
                        inline-flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-[var(--border)]
                        transition
                        hover:bg-[var(--surface-soft)]

                        sm:w-auto
                        sm:gap-2
                        sm:px-3
                      "
                      title="Download"
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
                        setDeleteTarget(
                          file,
                        )
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
                      title="Delete"
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

      {/* PREVIEW MODAL */}
      {previewTarget ? (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/60
            p-3
            backdrop-blur-sm

            sm:p-6
          "
          onClick={() =>
            setPreviewTarget(
              null,
            )
          }
        >
          <div
            className="
              flex
              max-h-[90dvh]
              w-full
              max-w-5xl
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              shadow-2xl
            "
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            {/* PREVIEW HEADER */}
            <div
              className="
                flex
                h-14
                shrink-0
                items-center
                gap-3
                border-b
                border-[var(--border)]
                px-4
              "
            >
              <FileIcon
                file={
                  previewTarget
                }
              />

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {
                    previewTarget.originalName
                  }
                </div>

                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                  {getFileTypeLabel(
                    previewTarget,
                  )}{" "}
                  ·{" "}
                  {formatBytes(
                    previewTarget.size,
                  )}
                </div>
              </div>

              <a
                href={`/api/files/${previewTarget.id}/download`}
                className="
                  grid
                  h-9
                  w-9
                  shrink-0
                  place-items-center
                  rounded-xl
                  transition
                  hover:bg-[var(--surface-soft)]
                "
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() =>
                  setPreviewTarget(
                    null,
                  )
                }
                className="
                  grid
                  h-9
                  w-9
                  shrink-0
                  place-items-center
                  rounded-xl
                  transition
                  hover:bg-[var(--surface-soft)]
                "
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* PREVIEW CONTENT */}
            <div
              className="
                min-h-0
                flex-1
                overflow-auto
                bg-[var(--surface-soft)]
                p-3

                sm:p-4
              "
            >
              {isImage(
                previewTarget,
              ) ? (
                <div
                  className="
                    flex
                    min-h-full
                    items-center
                    justify-center
                  "
                >
                  <img
                    src={`/api/files/${previewTarget.id}/preview`}
                    alt={
                      previewTarget.originalName
                    }
                    className="
                      max-h-[75dvh]
                      max-w-full
                      rounded-xl
                      object-contain
                    "
                  />
                </div>
              ) : isPdf(
                  previewTarget,
                ) ? (
                <iframe
                  src={`/api/files/${previewTarget.id}/preview`}
                  title={
                    previewTarget.originalName
                  }
                  className="
                    h-[72dvh]
                    w-full
                    rounded-xl
                    bg-white
                  "
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* DELETE MODAL */}
      {deleteTarget ? (
        <div
          className="
            fixed
            inset-0
            z-[110]
            flex
            items-center
            justify-center
            bg-black/40
            px-4
            backdrop-blur-sm
          "
          onClick={() => {
            if (
              !deletingId
            ) {
              setDeleteTarget(
                null,
              );
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
            onClick={(
              event,
            ) =>
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
                Delete file?
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-[var(--text-muted)]
                "
              >
                Are you sure
                you want to
                delete
                <span className="font-medium text-[var(--text)]">
                  {" "}
                  {
                    deleteTarget.originalName
                  }
                </span>
                ? This action
                cannot be
                undone.
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
                  <FileIcon
                    file={
                      deleteTarget
                    }
                    large
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {
                        deleteTarget.originalName
                      }
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {getFileTypeLabel(
                        deleteTarget,
                      )}{" "}
                      ·{" "}
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
                  deletingId !==
                  null
                }
                onClick={() =>
                  setDeleteTarget(
                    null,
                  )
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
                  deletingId !==
                  null
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
      ) : null}
    </div>
  );
}