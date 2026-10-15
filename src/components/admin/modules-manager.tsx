"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Layers, ListChecks, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { RequirementsEditor, type StoredRequirement } from "@/components/admin/requirements-editor";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { deleteModuleAction, moveModuleAction, saveModuleAction, setModulePublishedAction } from "@/lib/admin/content-actions";

export type AdminModule = {
  id: string;
  title: string;
  slug: string;
  description: string;
  topics: string[];
  position: number;
  is_published: boolean;
  lessonCount: number;
  requirements: (StoredRequirement & { summary: string })[];
};

type DialogState = { kind: "edit"; module: AdminModule | null } | { kind: "rules"; module: AdminModule } | { kind: "delete"; module: AdminModule } | null;

function ModuleForm({ module, onDone }: { module: AdminModule | null; onDone: () => void }) {
  const [title, setTitle] = useState(module?.title ?? "");
  const [slug, setSlug] = useState(module?.slug ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [topics, setTopics] = useState((module?.topics ?? []).join("\n"));
  const [published, setPublished] = useState(module?.is_published ?? false);
  const { pending, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () =>
            saveModuleAction({
              id: module?.id,
              title,
              slug,
              description,
              topics: topics.split("\n").map((t) => t.trim()).filter(Boolean),
              isPublished: published,
            }),
          { onSuccess: onDone },
        );
      }}
    >
      <Field label="Título" htmlFor="m-title">
        <Input id="m-title" required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Slug (URL)" htmlFor="m-slug" hint="Deixe em branco para gerar a partir do título.">
        <Input id="m-slug" value={slug} maxLength={120} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
      </Field>
      <Field label="Descrição" htmlFor="m-desc">
        <Textarea id="m-desc" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Tópicos (um por linha, até 12)" htmlFor="m-topics">
        <Textarea id="m-topics" value={topics} onChange={(e) => setTopics(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2.5 text-sm text-mist-200">
        <Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publicado (visível para alunos)
      </label>
      {!module && <p className="text-xs text-mist-500">Novos módulos nascem exigindo a conclusão do módulo anterior. Ajuste em “Regras”.</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {module ? "Salvar alterações" : "Criar módulo"}
        </Button>
      </div>
    </form>
  );
}

function DeleteModule({ module, onDone }: { module: AdminModule; onDone: () => void }) {
  const { pending, run } = useAdminAction();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-mist-300">
        {module.lessonCount > 0
          ? `Este módulo possui ${module.lessonCount} aula(s). Mova ou exclua as aulas antes de excluí-lo.`
          : "Esta ação não pode ser desfeita."}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button variant="danger" disabled={pending || module.lessonCount > 0} onClick={() => run(() => deleteModuleAction({ id: module.id }), { onSuccess: onDone })}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Excluir módulo
        </Button>
      </div>
    </div>
  );
}

export function ModulesManager({ modules }: { modules: AdminModule[] }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const { pending, run } = useAdminAction();
  const close = () => setDialog(null);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setDialog({ kind: "edit", module: null })}>
          <Plus className="size-4" aria-hidden="true" /> Novo módulo
        </Button>
      </div>

      {modules.length === 0 ? (
        <EmptyState icon={<Layers className="size-6" />} title="Nenhum módulo" description="Crie o primeiro módulo da formação." />
      ) : (
        <ol className="flex flex-col gap-3" aria-busy={pending}>
          {modules.map((module, index) => (
            <li key={module.id} className="surface relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="absolute top-3 right-3 flex items-center gap-1 lg:static lg:flex-col">
                <button
                  type="button"
                  disabled={index === 0 || pending}
                  onClick={() => run(() => moveModuleAction({ id: module.id, direction: -1 }))}
                  className="grid size-8 place-items-center rounded-lg text-mist-400 hover:bg-white/5 hover:text-mist-50 disabled:opacity-30"
                  aria-label={`Mover ${module.title} para cima`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === modules.length - 1 || pending}
                  onClick={() => run(() => moveModuleAction({ id: module.id, direction: 1 }))}
                  className="grid size-8 place-items-center rounded-lg text-mist-400 hover:bg-white/5 hover:text-mist-50 disabled:opacity-30"
                  aria-label={`Mover ${module.title} para baixo`}
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1 max-lg:pr-18">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-mist-500">#{index + 1}</span>
                  <h2 className="max-w-full font-semibold text-mist-50 lg:truncate">{module.title}</h2>
                  <Badge tone={module.is_published ? "brand" : "neutral"}>{module.is_published ? "Publicado" : "Rascunho"}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-mist-500">/{module.slug}</p>
                <p className="mt-2 text-sm text-mist-400">
                  {module.lessonCount} aula(s) ·{" "}
                  {module.requirements.length ? module.requirements.map((r) => r.summary).join(" + ") : (
                    <span className="text-warning-400">sem regras (bloqueado)</span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 max-sm:[&>button:not(:last-child)]:flex-auto">
                <Button variant="secondary" size="sm" onClick={() => setDialog({ kind: "edit", module })}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDialog({ kind: "rules", module })}>
                  <ListChecks className="size-4" aria-hidden="true" /> Regras
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => setModulePublishedAction({ id: module.id, published: !module.is_published }))}
                >
                  {module.is_published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  {module.is_published ? "Despublicar" : "Publicar"}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDialog({ kind: "delete", module })} aria-label={`Excluir ${module.title}`}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={dialog?.kind === "edit"} onClose={close} title={dialog?.kind === "edit" && dialog.module ? "Editar módulo" : "Novo módulo"}>
        {dialog?.kind === "edit" && <ModuleForm module={dialog.module} onDone={close} />}
      </Dialog>
      <Dialog open={dialog?.kind === "rules"} onClose={close} title="Regras de liberação" description={dialog?.kind === "rules" ? dialog.module.title : undefined}>
        {dialog?.kind === "rules" && <RequirementsEditor moduleId={dialog.module.id} initial={dialog.module.requirements} onSaved={close} />}
      </Dialog>
      <Dialog open={dialog?.kind === "delete"} onClose={close} title="Excluir módulo" description={dialog?.kind === "delete" ? dialog.module.title : undefined}>
        {dialog?.kind === "delete" && <DeleteModule module={dialog.module} onDone={close} />}
      </Dialog>
    </>
  );
}
