"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { attachUploadedThumbnailAction, createThumbnailUploadAction } from "@/lib/admin/content-actions";
import { cn } from "@/lib/cn";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

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

/** Envia a miniatura ao bucket público via URL assinada; aceita clique ou arrastar e soltar. */
export function ThumbnailUpload({
  lessonId,
  currentUrl,
  onUploaded,
  onCleared,
}: {
  lessonId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
  onCleared: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null;

  async function handleFile(file: File) {
    if (!ACCEPTED.has(file.type)) {
      toast.error("Envie uma imagem JPEG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("A imagem excede o limite de 5 MB.");
      return;
    }
    setProgress(0);
    try {
      const prepared = await createThumbnailUploadAction({ lessonId, fileName: file.name, contentType: file.type });
      if (!prepared.ok || !prepared.data) throw new Error(prepared.ok ? "Falha ao preparar upload." : prepared.error);
      await putWithProgress(prepared.data.uploadUrl, file, setProgress);
      const attached = await attachUploadedThumbnailAction({ lessonId, path: prepared.data.path });
      if (!attached.ok || !attached.data) throw new Error(attached.ok ? "Falha ao associar miniatura." : attached.error);
      toast.success(attached.message ?? "Miniatura enviada.");
      onUploaded(attached.data.url);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.message.length > 6 ? error.message : "Falha no envio da miniatura. Tente novamente.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        aria-label="Área para enviar miniatura por arrastar e soltar ou clique"
        onKeyDown={(event) => {
          if (busy) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
          dragging ? "border-brand-400 bg-brand-500/10" : "border-white/15 bg-ink-900/40 hover:border-white/25 hover:bg-ink-900/70",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {currentUrl ? (
          // Miniatura enviada pelo admin; URL validada no servidor.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        ) : null}
        <div className="relative z-10 flex flex-col items-center gap-2">
          {busy ? (
            <Loader2 className="size-6 animate-spin text-brand-400" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-6 text-mist-400" aria-hidden="true" />
          )}
          <p className="text-sm font-medium text-mist-100">
            {busy ? `Enviando… ${progress}%` : dragging ? "Solte a imagem aqui" : "Arraste a miniatura ou clique para selecionar"}
          </p>
          <p className="text-xs text-mist-500">JPEG, PNG, WebP ou GIF · até 5 MB</p>
          {busy && <progress value={progress ?? 0} max={100} className="mt-1 h-1.5 w-40 accent-brand-500" aria-label="Progresso do envio" />}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          id={`thumb-upload-${lessonId}`}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {currentUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-mist-500" title={currentUrl}>
            {currentUrl}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              onCleared();
            }}
          >
            <X className="size-4" aria-hidden="true" />
            Remover
          </Button>
        </div>
      ) : null}
    </div>
  );
}
