"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { attachUploadedVideoAction, createVideoUploadAction } from "@/lib/admin/content-actions";

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

function putWithProgress(url: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/** Envia o vídeo direto ao bucket privado usando URL assinada de uso único emitida pelo servidor. */
export function VideoUpload({ lessonId, onUploaded }: { lessonId: string; onUploaded: (path: string, duration: number) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function handleFile(file: File) {
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      toast.error("Envie um arquivo MP4 ou WebM.");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("O arquivo excede o limite de 500 MB.");
      return;
    }
    setProgress(0);
    try {
      const duration = await readDuration(file);
      const prepared = await createVideoUploadAction({ lessonId, fileName: file.name, contentType: file.type });
      if (!prepared.ok || !prepared.data) throw new Error(prepared.ok ? "Falha ao preparar upload." : prepared.error);
      await putWithProgress(prepared.data.uploadUrl, file, setProgress);
      const attached = await attachUploadedVideoAction({ lessonId, path: prepared.data.path, durationSeconds: duration });
      if (!attached.ok) throw new Error(attached.error);
      toast.success(attached.message ?? "Vídeo enviado.");
      onUploaded(prepared.data.path, duration);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.message.length > 6 ? error.message : "Falha no envio do vídeo. Tente novamente.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        id={`upload-${lessonId}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button variant="secondary" size="sm" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
        {progress !== null ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {progress !== null ? `Enviando… ${progress}%` : "Enviar vídeo (MP4/WebM)"}
      </Button>
      {progress !== null && (
        <progress value={progress} max={100} className="h-1.5 w-40 accent-brand-500" aria-label="Progresso do envio" />
      )}
    </div>
  );
}
