"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";

interface CheckResult {
  status?: string;
  id?: string;
  details?: {
    matchId?: number | string;
    distance?: number;
    score?: number;
    uploaderDiscordId?: string;
  } | null;
}

export function ImageChecker() {
  const [result, setResult] = useState<string | null>(null);
  const [details, setDetails] = useState<CheckResult["details"]>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const checkPose = api.emp.checkAndStorePose.useMutation({
    onSuccess: (data) => {
      setResult(data.status ?? null);
      if ("details" in data) {
        setDetails(data.details as CheckResult["details"]);
      } else if (data.status === "new" && "id" in data) {
        setDetails({ matchId: data.id });
      }
    },
    onError: (error) => {
      setResult("Error: " + error.message);
      setDetails(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      checkPose.mutate({ image: base64String });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-6">
          <label className="block">
            <div className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-12 text-center transition-colors duration-200 hover:border-slate-400 hover:bg-slate-50/50 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <svg
                className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-medium text-slate-900 dark:text-white">
                Click to upload an image
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                or drag and drop
              </p>
            </div>
          </label>
        </div>

        {preview && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
              Preview
            </p>
            <div className="relative h-64 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        )}

        {checkPose.isPending && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900 dark:border-white"></div>
            <span className="ml-3 text-slate-600 dark:text-zinc-400">
              Analyzing image...
            </span>
          </div>
        )}

        {result && (
          <div
            className={`mt-6 rounded-lg p-6 ${
              result === "new"
                ? "border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30"
                : "border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {result === "new" ? (
                <svg
                  className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${result === "new" ? "text-emerald-900 dark:text-emerald-200" : "text-red-900 dark:text-red-200"}`}
                >
                  {result === "new" ? "New Image" : "Duplicate Found"}
                </p>
                {details && (
                  <div
                    className={`mt-3 space-y-2 text-sm ${result === "new" ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}
                  >
                    {details.uploaderDiscordId && (
                      <p>
                        <span className="opacity-75">Uploader:</span>{" "}
                        <span className="font-medium">
                          {details.uploaderDiscordId}
                        </span>
                      </p>
                    )}
                    <p>
                      <span className="opacity-75">Match ID:</span>{" "}
                      <span className="font-mono">{details.matchId}</span>
                    </p>
                    {details.distance !== undefined && (
                      <p>
                        <span className="opacity-75">Distance:</span>{" "}
                        {details.distance.toFixed(2)}
                      </p>
                    )}
                    {details.score !== undefined && (
                      <p>
                        <span className="opacity-75">Score:</span>{" "}
                        {(details.score * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
