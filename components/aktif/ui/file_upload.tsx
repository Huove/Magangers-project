"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 10,
    y: -10,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    if (!newFiles.length) return;

    const file = newFiles[0];

    setFiles([file]);
    onChange?.([file]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onChange?.([]);
  };

  const { getRootProps, isDragActive } = useDropzone({
  multiple: false,
  noClick: true,

  accept: {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "application/zip": [".zip"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },

  onDrop: handleFileChange,

  onDropRejected: (error) => {
    console.log(error);
  },
});

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-blue-200 md:p-8"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
          onChange={(e) =>
            handleFileChange(Array.from(e.target.files || []))
          }
          className="hidden"
        />

        {/* Background Pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]">
          <GridPattern />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Icon */}
          <motion.div
            variants={mainVariant}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className={cn(
              "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600",
              "shadow-sm transition-colors group-hover/file:bg-blue-100"
            )}
          >
            {isDragActive ? (
              <IconUpload size={28} stroke={1.8} />
            ) : (
              <IconUpload size={28} stroke={1.8} />
            )}
          </motion.div>

          {/* Title */}
          <p className="relative z-20 text-base font-semibold text-neutral-800">
            {isDragActive ? "Lepaskan file di sini" : "Upload file tugas"}
          </p>

          {/* Description */}
          <p className="relative z-20 mt-2 max-w-md text-center text-sm leading-relaxed text-neutral-400">
            {isDragActive
              ? "Lepaskan file untuk mengunggah tugas"
              : "Drag & drop file ke area ini atau klik untuk memilih file dari perangkat"}
          </p>

          {/* File Format */}
          <p className="relative z-20 mt-3 text-xs text-neutral-400">
            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, JPG, PNG
            <span className="mx-1">•</span>
            Maks. 10 MB
          </p>

          {/* File Preview */}
          <div className="relative mx-auto mt-7 w-full max-w-xl">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                  }}
                  className="relative z-40 mx-auto flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  {/* File Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <IconFile size={21} stroke={1.8} />
                  </div>

                  {/* File Information */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {file.name}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                      <span>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>

                      <span>•</span>

                      <span>
                        {file.type || "File"}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Hapus file"
                  >
                    <IconX size={17} />
                  </button>
                </motion.div>
              ))}

            {/* Empty Upload Box */}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={secondaryVariant}
                className={cn(
                  "relative z-30 mx-auto flex h-24 w-full max-w-sm",
                  "items-center justify-center rounded-xl",
                  "border border-dashed border-blue-200",
                  "bg-blue-50/30",
                  "transition-colors",
                  "group-hover/file:border-blue-300",
                  "group-hover/file:bg-blue-50/60"
                )}
              >
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <IconUpload size={17} />
                  <span>
                    {isDragActive
                      ? "Drop file di sini"
                      : "Pilih atau drop file"}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;

  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-px bg-neutral-50">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;

          return (
            <div
              key={`${col}-${row}`}
              className={cn(
                "flex h-10 w-10 shrink-0 rounded-[2px]",
                index % 2 === 0
                  ? "bg-white"
                  : "bg-neutral-50"
              )}
            />
          );
        })
      )}
    </div>
  );
}