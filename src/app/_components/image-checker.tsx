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
  const [details, setDetails] = useState<CheckResult['details']>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const checkPose = api.emp.checkAndStorePose.useMutation({
    onSuccess: (data) => {
      setResult(data.status ?? null);
      if ('details' in data) {
          setDetails(data.details as CheckResult['details']);
      } else if (data.status === 'new' && 'id' in data) {
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
    <div className="w-full max-w-md rounded-xl bg-white/10 p-6 text-white shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">Cat Pose Checker</h2>
      
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">
          Upload Cat Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full cursor-pointer rounded-lg border border-gray-600 bg-gray-700 text-sm text-gray-400 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {preview && (
        <div className="mb-4 flex justify-center relative h-48 w-full">
          <Image 
            src={preview} 
            alt="Preview" 
            fill
            className="rounded-lg object-contain"
            unoptimized
          />
        </div>
      )}

      {checkPose.isPending && (
        <div className="text-center text-yellow-400">Processing image...</div>
      )}

      {result && (
        <div className={`mt-4 rounded p-4 text-center font-bold ${
          result === "new" ? "bg-green-600" : "bg-red-600"
        }`}>
          <p className="text-lg uppercase">{result}</p>
          {details && (
            <div className="mt-2 text-left text-sm font-normal">
              {details.uploaderDiscordId && (
                <p className="mb-1 text-yellow-300 font-bold">
                  Uploader: <span className="text-white">{details.uploaderDiscordId}</span>
                </p>
              )}
              <p className="opacity-80">Match ID: {details.matchId}</p>
              {details.distance !== undefined && <p className="opacity-80">Distance: {details.distance}</p>}
              {details.score !== undefined && <p className="opacity-80">Score: {(details.score * 100).toFixed(2)}%</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
