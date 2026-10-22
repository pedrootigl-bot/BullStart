"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, PlayCircle, Plus, Trash2, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { ThumbnailUpload } from "@/components/admin/thumbnail-upload";
import { VideoUpload } from "@/components/admin/video-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { deleteLessonAction, moveLessonAction, saveLessonAction, setLessonPublishedAction } from "@/lib/admin/content-actions";
import { formatDuration } from "@/lib/format";

export type AdminLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  objectives: string[];
  topics: string[];
  materials: { title: string; url: string }[];
  thumbnail_url: string | null;
  video_provider: "supabase_storage" | "external_url";
  video_asset_id: string | null;
  duration_seconds: number;
  position: number;
  is_required: boolean;
  is_published: boolean;
};

export type ModuleOption = { id: string; title: string; position: number };

type DialogState = { kind: "edit"; lesson: AdminLesson | null } | { kind: "delete"; lesson: AdminLesson } | null;

const lines = (value: string) => value.split("\n").map((v) => v.trim()).filter(Boolean);

function parseMaterials(value: string) {
  return lines(value).map((line) => {
    const [title, ...rest] = line.split("|");
    return { title: (title ?? "").trim(), url: rest.join("|").trim() };
  });
}

function LessonForm({ lesson, modules, defaultModuleId, onDone }: { lesson: AdminLesson | null; modules: ModuleOption[]; defaultModuleId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    moduleId: lesson?.module_id ?? defaultModuleId,
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    objectives: (lesson?.objectives ?? []).join("\n"),
    topics: (lesson?.topics ?? []).join("\n"),
    materials: (lesson?.materials ?? []).map((m) => `${m.title} | ${m.url}`).join("\n"),
    thumbnailUrl: lesson?.thumbnail_url ?? "",
    videoProvider: lesson?.video_provider ?? "supabase_storage",
    videoAssetId: lesson?.video_asset_id ?? "",
    durationSeconds: String(lesson?.duration_seconds ?? 0),
    isRequired: lesson?.is_required ?? true,
    isPublished: lesson?.is_published ?? false,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const { pending, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () =>
            saveLessonAction({
              id: lesson?.id,
              moduleId: form.moduleId,
              title: form.title,
              description: form.description,
              objectives: lines(form.objectives),
              topics: lines(form.topics),
              materials: parseMaterials(form.materials),
              thumbnailUrl: form.thumbnailUrl,
              videoProvider: form.videoProvider,
              videoAssetId: form.videoAssetId,
              durationSeconds: form.durationSeconds,
              isRequired: form.isRequired,
              isPublished: form.isPublished,
            }),
          { onSuccess: onDone },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Módulo" htmlFor="l-module">
          <Select id="l-module" value={form.moduleId} onChange={(e) => set("moduleId", e.target.value)} required>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.position}. {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Título" htmlFor="l-title">
          <Input id="l-title" required minLength={3} maxLength={140} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
      </div>
      <Field label="Descrição (Sobre esta aula)" htmlFor="l-desc">
        <Textarea id="l-desc" maxLength={4000} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Objetivos (um por linha)" htmlFor="l-obj">
          <Textarea id="l-obj" value={form.objectives} onChange={(e) => set("objectives", e.target.value)} />
        </Field>
        <Field label="Tópicos (um por linha)" htmlFor="l-top">
          <Textarea id="l-top" value={form.topics} onChange={(e) => set("topics", e.target.value)} />
        </Field>
      </div>
      <Field label="Materiais complementares" htmlFor="l-mat" hint="Um por linha no formato: Título | https://endereco">
        <Textarea id="l-mat" value={form.materials} onChange={(e) => set("materials", e.target.value)} />
      </Field>

      <fieldset className="surface-raised flex flex-col gap-4 p-4">
        <legend className="px-1 text-sm font-semibold text-mist-100">Vídeo</legend>
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <Field label="Origem" htmlFor="l-provider">
            <Select id="l-provider" value={form.videoProvider} onChange={(e) => set("videoProvider", e.target.value === "external_url" ? "external_url" : "supabase_storage")}>
              <option value="supabase_storage">Storage privado</option>
              <option value="external_url">URL externa autorizada</option>
            </Select>
          </Field>
          <Field
            label={form.videoProvider === "external_url" ? "URL https do vídeo" : "Caminho no bucket lesson-videos"}
            htmlFor="l-asset"
            hint={form.videoProvider === "external_url" ? "O host deve constar em VIDEO_EXTERNAL_ALLOWED_HOSTS." : "Preenchido automaticamente pelo envio."}
          >
            <Input id="l-asset" value={form.videoAssetId} maxLength={1024} onChange={(e) => set("videoAssetId", e.target.value)} className="font-mono text-xs" />
          </Field>
        </div>
        {lesson && form.videoProvider === "supabase_storage" && (
          <VideoUpload
            lessonId={lesson.id}
            onUploaded={(path, duration) => setForm((f) => ({ ...f, videoAssetId: path, durationSeconds: duration > 0 ? String(duration) : f.durationSeconds }))}
          />
        )}
        {!lesson && <p className="text-xs text-mist-500">Salve a aula para habilitar o envio de vídeo e miniatura.</p>}
        <Field label="Duração (segundos)" htmlFor="l-dur" hint="Usada no cálculo do tempo mínimo assistido.">
          <Input id="l-dur" type="number" min={0} max={86400} value={form.durationSeconds} onChange={(e) => set("durationSeconds", e.target.value)} />
        </Field>
        <Field label="Miniatura (opcional)" htmlFor="l-thumb" hint="Arraste uma imagem ou informe uma URL https.">
          {lesson ? (
            <ThumbnailUpload
              lessonId={lesson.id}
              currentUrl={form.thumbnailUrl}
              onUploaded={(url) => set("thumbnailUrl", url)}
              onCleared={() => set("thumbnailUrl", "")}
            />
          ) : null}
          <Input
            id="l-thumb"
            value={form.thumbnailUrl}
            maxLength={1024}
            placeholder="https://… ou caminho /images/…"
            onChange={(e) => set("thumbnailUrl", e.target.value)}
            className={lesson ? "mt-3 font-mono text-xs" : undefined}
          />
        </Field>
      </fieldset>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2.5 text-sm text-mist-200">
          <Checkbox checked={form.isRequired} onChange={(e) => set("isRequired", e.target.checked)} /> Obrigatória para conclusão
        </label>
        <label className="flex items-center gap-2.5 text-sm text-mist-200">
          <Checkbox checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Publicada
        </label>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {lesson ? "Salvar alterações" : "Criar aula"}
        </Button>
      </div>
    </form>
  );
}

export function LessonsManager({ lessons, modules, selectedModuleId }: { lessons: AdminLesson[]; modules: ModuleOption[]; selectedModuleId: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const { pending, run } = useAdminAction();
  const close = () => setDialog(null);
  const deleting = useAdminAction();

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Filtrar por módulo" htmlFor="filter-module" className="sm:w-96">
          <Select id="filter-module" value={selectedModuleId} onChange={(e) => router.push(`/admin/aulas?modulo=${e.target.value}`)}>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.position}. {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={() => setDialog({ kind: "edit", lesson: null })} disabled={modules.length === 0}>
          <Plus className="size-4" aria-hidden="true" /> Nova aula
        </Button>
      </div>

      {lessons.length === 0 ? (
        <EmptyState icon={<PlayCircle className="size-6" />} title="Nenhuma aula neste módulo" description="Crie uma aula e envie o vídeo correspondente." />
      ) : (
        <ol className="flex flex-col gap-3" aria-busy={pending}>
          {lessons.map((lesson, index) => (
            <li key={lesson.id} className="surface relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="absolute top-3 right-3 flex items-center gap-1 lg:static lg:flex-col">
                <button
                  type="button"
                  disabled={index === 0 || pending}
                  onClick={() => run(() => moveLessonAction({ id: lesson.id, direction: -1 }))}
                  className="grid size-8 place-items-center rounded-lg text-mist-400 hover:bg-white/5 hover:text-mist-50 disabled:opacity-30"
                  aria-label={`Mover ${lesson.title} para cima`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === lessons.length - 1 || pending}
                  onClick={() => run(() => moveLessonAction({ id: lesson.id, direction: 1 }))}
                  className="grid size-8 place-items-center rounded-lg text-mist-400 hover:bg-white/5 hover:text-mist-50 disabled:opacity-30"
                  aria-label={`Mover ${lesson.title} para baixo`}
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1 max-lg:pr-18">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-mist-500">Aula {index + 1}</span>
                  <h2 className="max-w-full font-semibold text-mist-50 lg:truncate">{lesson.title}</h2>
                  <Badge tone={lesson.is_published ? "brand" : "neutral"}>{lesson.is_published ? "Publicada" : "Rascunho"}</Badge>
                  {!lesson.is_required && <Badge tone="gold">Opcional</Badge>}
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist-500">
                  <span>{formatDuration(lesson.duration_seconds)}</span>
                  {lesson.video_asset_id ? (
                    <span className="max-w-full truncate font-mono">
                      {lesson.video_provider === "external_url" ? "externo" : "storage"}: {lesson.video_asset_id}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning-400">
                      <VideoOff className="size-3.5" aria-hidden="true" /> sem vídeo
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 max-sm:[&>button:not(:last-child)]:flex-auto">
                <Button variant="secondary" size="sm" onClick={() => setDialog({ kind: "edit", lesson })}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => setLessonPublishedAction({ id: lesson.id, published: !lesson.is_published }))}
                >
                  {lesson.is_published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  {lesson.is_published ? "Despublicar" : "Publicar"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDialog({ kind: "delete", lesson })} aria-label={`Excluir ${lesson.title}`}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={dialog?.kind === "edit"}
        onClose={close}
        title={dialog?.kind === "edit" && dialog.lesson ? "Editar aula" : "Nova aula"}
        className="w-[min(100vw-2rem,52rem)]"
      >
        {dialog?.kind === "edit" && <LessonForm lesson={dialog.lesson} modules={modules} defaultModuleId={selectedModuleId} onDone={close} />}
      </Dialog>
      <Dialog open={dialog?.kind === "delete"} onClose={close} title="Excluir aula" description={dialog?.kind === "delete" ? dialog.lesson.title : undefined}>
        {dialog?.kind === "delete" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-mist-300">Aulas com progresso de alunos não podem ser excluídas — despublique-as. Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={deleting.pending}
                onClick={() => deleting.run(() => deleteLessonAction({ id: dialog.lesson.id }), { onSuccess: close })}
              >
                {deleting.pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Excluir aula
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
