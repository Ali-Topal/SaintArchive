"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";

type ImageUploaderListProps = {
  name: string;
  initialUrls?: string[];
};

export default function ImageUploaderList({
  name,
  initialUrls = [],
}: ImageUploaderListProps) {
  const [urls, setUrls] = useState(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed.");
      }

      setUrls((prev) => [...prev, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const removeImage = (url: string) => {
    setUrls((prev) => prev.filter((item) => item !== url));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload image"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onSelectFile}
          className="hidden"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {urls.length === 0 && (
          <p className="text-xs text-white/50">No images yet.</p>
        )}
        {urls.map((url) => (
          <div
            key={url}
            className="relative flex flex-col items-center gap-2 rounded-lg border border-neutral-800 p-3"
          >
            <input type="hidden" name={name} value={url} />
            <img
              src={url}
              alt="raffle"
              className="w-32 rounded-md object-cover"
              style={{ aspectRatio: "1 / 1" }}
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="text-xs uppercase text-white/60 hover:text-white"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

