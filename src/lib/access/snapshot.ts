import "server-only";
import {
  computeModuleProgress,
  evaluateModuleAccess,
  type AccessContext,
  type EligibilityRecord,
  type ManualGrant,
  type ModuleAccessResult,
  type ModuleProgress,
} from "@/lib/access/engine";
import { parseRequirement, type ParsedRequirement } from "@/lib/access/requirements";
import { getBrokerIntegration } from "@/lib/broker/service";
import { getEnv } from "@/lib/env";
import type { AppSupabaseClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase/database.types";

export const LESSON_PUBLIC_COLUMNS =
  "id, module_id, title, description, objectives, topics, materials, thumbnail_url, duration_seconds, position, is_required";

export type LessonMaterial = { title: string; url: string };

export type LessonView = Pick<
  Tables<"lessons">,
  | "id"
  | "module_id"
  | "title"
  | "description"
  | "objectives"
  | "topics"
  | "thumbnail_url"
  | "duration_seconds"
  | "position"
  | "is_required"
> & { materials: LessonMaterial[] };

export type LessonProgressView = Pick<
  Tables<"lesson_progress">,
  "lesson_id" | "status" | "last_position_seconds" | "watched_seconds" | "completed_at" | "updated_at" | "started_at"
>;

export type LessonStatus = "available" | "in_progress" | "completed" | "locked";

export type ModuleView = Pick<Tables<"modules">, "id" | "slug" | "title" | "description" | "topics" | "position"> & {
  lessons: LessonView[];
  progress: ModuleProgress;
  access: ModuleAccessResult;
  totalDurationSeconds: number;
};

export type CourseSnapshot = {
  course: Pick<Tables<"courses">, "id" | "title" | "slug" | "description" | "workload_hours" | "completion_min_watch_ratio">;
  modules: ModuleView[];
  progressByLesson: Map<string, LessonProgressView>;
  overall: {
    completedRequired: number;
    totalRequired: number;
    percent: number;
    completedLessons: number;
    totalLessons: number;
    unlockedModules: number;
  };
  resume: { lessonId: string; title: string; moduleTitle: string } | null;
  broker: { linked: boolean; mode: string; available: boolean };
  eligibility: Map<string, EligibilityRecord>;
};

function toMaterials(value: Json): LessonMaterial[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const title = typeof item.title === "string" ? item.title : null;
      const url = typeof item.url === "string" ? item.url : null;
      if (title && url && /^https:\/\//i.test(url)) return [{ title, url }];
    }
    return [];
  });
}

/**
 * Carrega o estado completo do curso para um perfil.
 * `db` pode ser o cliente do próprio aluno (RLS) ou o cliente administrativo (visão do admin).
 * Em ambos os casos apenas conteúdo publicado é considerado.
 */
export async function loadCourseSnapshot(
  db: AppSupabaseClient,
  profile: { id: string; broker_user_id: string | null },
): Promise<CourseSnapshot | null> {
  const env = getEnv();
  const broker = getBrokerIntegration();

  const { data: course } = await db
    .from("courses")
    .select("id, title, slug, description, workload_hours, completion_min_watch_ratio")
    .eq("slug", env.PRIMARY_COURSE_SLUG)
    .eq("is_published", true)
    .maybeSingle();
  if (!course) return null;

  const { data: modules } = await db
    .from("modules")
    .select("id, slug, title, description, topics, position")
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("position");

  const moduleRows = modules ?? [];
  const moduleIds = moduleRows.map((m) => m.id);

  const [lessonsRes, requirementsRes, progressRes, eligibilityRes, grantsRes] = await Promise.all([
    moduleIds.length
      ? db.from("lessons").select(LESSON_PUBLIC_COLUMNS).in("module_id", moduleIds).eq("is_published", true).order("position")
      : Promise.resolve({ data: [] }),
    moduleIds.length
      ? db.from("module_requirements").select("id, module_id, requirement_type, config_json").in("module_id", moduleIds).order("created_at")
      : Promise.resolve({ data: [] }),
    db
      .from("lesson_progress")
      .select("lesson_id, status, last_position_seconds, watched_seconds, completed_at, updated_at, started_at")
      .eq("user_id", profile.id),
    db.from("broker_eligibility").select("requirement_key, eligibility_status, source, checked_at, expires_at").eq("user_id", profile.id),
    db.from("module_access").select("module_id, status, expires_at").eq("user_id", profile.id),
  ]);

  const lessons: LessonView[] = (lessonsRes.data ?? []).map((lesson) => ({
    ...lesson,
    materials: toMaterials(lesson.materials),
  }));

  const progressByLesson = new Map<string, LessonProgressView>(
    (progressRes.data ?? []).map((row) => [row.lesson_id, row]),
  );
  const completedIds = new Set(
    [...progressByLesson.values()].filter((p) => p.status === "completed").map((p) => p.lesson_id),
  );

  const requirementsByModule = new Map<string, ParsedRequirement[]>();
  for (const row of requirementsRes.data ?? []) {
    const list = requirementsByModule.get(row.module_id) ?? [];
    list.push(parseRequirement(row));
    requirementsByModule.set(row.module_id, list);
  }

  const lessonsByModule = new Map<string, LessonView[]>();
  for (const lesson of lessons) {
    const list = lessonsByModule.get(lesson.module_id) ?? [];
    list.push(lesson);
    lessonsByModule.set(lesson.module_id, list);
  }

  const progressByModule = new Map<string, ModuleProgress>(
    moduleRows.map((m) => [m.id, computeModuleProgress(lessonsByModule.get(m.id) ?? [], completedIds)]),
  );

  const eligibility = new Map<string, EligibilityRecord>(
    (eligibilityRes.data ?? []).map((row) => [
      row.requirement_key,
      { status: row.eligibility_status, source: row.source, checkedAt: row.checked_at, expiresAt: row.expires_at },
    ]),
  );

  const manualGrants = new Map<string, ManualGrant>(
    (grantsRes.data ?? []).map((row) => [row.module_id, { status: row.status, expiresAt: row.expires_at }]),
  );

  const ctx: AccessContext = {
    modules: moduleRows.map(({ id, slug, title, position }) => ({ id, slug, title, position })),
    progress: progressByModule,
    eligibility,
    manualGrants,
    brokerLinked: Boolean(profile.broker_user_id),
    integrationAvailable: broker.isAvailable(),
    acceptMockEligibility: broker.acceptsMockEligibility,
    now: new Date(),
  };

  const moduleViews: ModuleView[] = moduleRows.map((m) => {
    const moduleLessons = lessonsByModule.get(m.id) ?? [];
    return {
      ...m,
      lessons: moduleLessons,
      progress: progressByModule.get(m.id)!,
      access: evaluateModuleAccess(m.id, requirementsByModule.get(m.id) ?? [], ctx),
      totalDurationSeconds: moduleLessons.reduce((sum, l) => sum + l.duration_seconds, 0),
    };
  });

  const totals = moduleViews.reduce(
    (acc, m) => {
      acc.completedRequired += m.progress.completedRequired;
      acc.totalRequired += m.progress.totalRequired;
      acc.totalLessons += m.lessons.length;
      acc.completedLessons += m.lessons.filter((l) => completedIds.has(l.id)).length;
      if (m.access.unlocked) acc.unlockedModules += 1;
      return acc;
    },
    { completedRequired: 0, totalRequired: 0, totalLessons: 0, completedLessons: 0, unlockedModules: 0 },
  );

  return {
    course,
    modules: moduleViews,
    progressByLesson,
    overall: {
      ...totals,
      percent: totals.totalRequired === 0 ? 0 : Math.floor((totals.completedRequired / totals.totalRequired) * 100),
    },
    resume: findResumeLesson(moduleViews, progressByLesson),
    broker: { linked: Boolean(profile.broker_user_id), mode: broker.mode, available: broker.isAvailable() },
    eligibility,
  };
}

function findResumeLesson(
  modules: ModuleView[],
  progress: Map<string, LessonProgressView>,
): CourseSnapshot["resume"] {
  const unlocked = modules.filter((m) => m.access.unlocked);

  let latest: { lesson: LessonView; module: ModuleView; updatedAt: string } | null = null;
  for (const m of unlocked) {
    for (const lesson of m.lessons) {
      const p = progress.get(lesson.id);
      if (p && p.status === "in_progress" && (!latest || p.updated_at > latest.updatedAt)) {
        latest = { lesson, module: m, updatedAt: p.updated_at };
      }
    }
  }
  if (latest) return { lessonId: latest.lesson.id, title: latest.lesson.title, moduleTitle: latest.module.title };

  for (const m of unlocked) {
    const next = m.lessons.find((l) => progress.get(l.id)?.status !== "completed");
    if (next) return { lessonId: next.id, title: next.title, moduleTitle: m.title };
  }
  return null;
}

export function lessonStatus(snapshot: CourseSnapshot, module: ModuleView, lessonId: string): LessonStatus {
  if (!module.access.unlocked) return "locked";
  const p = snapshot.progressByLesson.get(lessonId);
  if (!p) return "available";
  return p.status === "completed" ? "completed" : "in_progress";
}

export function findLesson(snapshot: CourseSnapshot, lessonId: string) {
  for (const courseModule of snapshot.modules) {
    const index = courseModule.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) {
      return {
        module: courseModule,
        lesson: courseModule.lessons[index]!,
        index,
        previous: courseModule.lessons[index - 1] ?? null,
        next: courseModule.lessons[index + 1] ?? null,
      };
    }
  }
  return null;
}

export function isCourseComplete(snapshot: CourseSnapshot): boolean {
  return snapshot.overall.totalRequired > 0 && snapshot.overall.completedRequired === snapshot.overall.totalRequired;
}
