"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updateCourseSettingsAction } from "@/lib/admin/content-actions";

export function CourseSettingsForm({ courseId, workloadHours, minWatchRatio }: { courseId: string; workloadHours: number; minWatchRatio: number }) {
  const [hours, setHours] = useState(String(workloadHours));
  const [percent, setPercent] = useState(String(Math.round(minWatchRatio * 100)));
  const { pending, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => updateCourseSettingsAction({ courseId, workloadHours: hours, minWatchPercent: percent }));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Carga horária do certificado (h)" htmlFor="workload">
          <Input id="workload" type="number" min={1} max={1000} required value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
        <Field label="Tempo mínimo assistido para concluir (%)" htmlFor="ratio" hint="Aplicado no servidor a toda conclusão de aula.">
          <Input id="ratio" type="number" min={50} max={100} required value={percent} onChange={(e) => setPercent(e.target.value)} />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}
