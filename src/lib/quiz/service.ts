import "server-only";
import type { CourseSnapshot } from "@/lib/access/snapshot";
import { recordAudit } from "@/lib/audit";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type QuizQuestionPublic = {
  id: string;
  prompt: string;
  options: string[];
  position: number;
  moduleId: string | null;
  imageUrl: string | null;
};

export type QuizAttemptSummary = {
  id: string;
  scorePercent: number;
  passed: boolean;
  submittedAt: string | null;
};

export type ModuleQuizView = {
  id: string;
  title: string;
  description: string;
  passRatio: number;
  maxAttempts: number;
  questionCount: number;
  moduleId: string;
  moduleSlug: string;
  moduleTitle: string;
  modulePosition: number;
  unlocked: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  bestScorePercent: number | null;
  passed: boolean;
  questions: QuizQuestionPublic[];
  attempts: QuizAttemptSummary[];
};

function asOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function isModuleQuizUnlocked(snapshot: CourseSnapshot, moduleId: string): boolean {
  const courseModule = snapshot.modules.find((m) => m.id === moduleId);
  if (!courseModule) return false;
  return courseModule.progress.totalRequired > 0 && courseModule.progress.percent === 100;
}

export async function hasPassedAllQuizzes(
  userId: string,
  courseId: string,
  /** Se informado, só exige provas desses módulos (ex.: lançamento v1). */
  moduleIds?: string[],
): Promise<boolean> {
  const db = getSupabaseAdmin();
  let query = db
    .from("course_quizzes")
    .select("id, module_id")
    .eq("course_id", courseId)
    .eq("is_published", true);

  if (moduleIds && moduleIds.length > 0) {
    query = query.in("module_id", moduleIds);
  }

  const { data: quizzes } = await query;

  if (!quizzes || quizzes.length === 0) return false;

  const quizIds = quizzes.map((q) => q.id);
  const { data: passes } = await db
    .from("quiz_attempts")
    .select("quiz_id")
    .eq("user_id", userId)
    .eq("passed", true)
    .not("submitted_at", "is", null)
    .in("quiz_id", quizIds);

  const passedIds = new Set((passes ?? []).map((row) => row.quiz_id));
  return quizIds.every((id) => passedIds.has(id));
}

/** @deprecated Use hasPassedAllQuizzes */
export async function hasPassedQuiz(userId: string, courseId: string): Promise<boolean> {
  return hasPassedAllQuizzes(userId, courseId);
}

async function loadAttemptsByQuiz(userId: string, quizIds: string[]) {
  if (quizIds.length === 0) return new Map<string, QuizAttemptSummary[]>();
  const { data } = await getSupabaseAdmin()
    .from("quiz_attempts")
    .select("id, quiz_id, score_percent, passed, submitted_at")
    .eq("user_id", userId)
    .not("submitted_at", "is", null)
    .in("quiz_id", quizIds)
    .order("submitted_at", { ascending: false });

  const map = new Map<string, QuizAttemptSummary[]>();
  for (const row of data ?? []) {
    const list = map.get(row.quiz_id) ?? [];
    list.push({
      id: row.id,
      scorePercent: row.score_percent,
      passed: row.passed,
      submittedAt: row.submitted_at,
    });
    map.set(row.quiz_id, list);
  }
  return map;
}

async function questionCounts(quizIds: string[]) {
  const counts = new Map<string, number>();
  if (quizIds.length === 0) return counts;
  const { data } = await getSupabaseAdmin().from("quiz_questions").select("quiz_id").in("quiz_id", quizIds);
  for (const row of data ?? []) {
    counts.set(row.quiz_id, (counts.get(row.quiz_id) ?? 0) + 1);
  }
  return counts;
}

function toView(args: {
  quiz: {
    id: string;
    title: string;
    description: string;
    pass_ratio: number;
    max_attempts: number;
    module_id: string;
  };
  moduleSlug: string;
  moduleTitle: string;
  modulePosition: number;
  unlocked: boolean;
  attempts: QuizAttemptSummary[];
  questionCount: number;
  questions: QuizQuestionPublic[];
}): ModuleQuizView {
  const attemptsUsed = args.attempts.length;
  const passed = args.attempts.some((row) => row.passed);
  const bestScorePercent =
    args.attempts.length > 0 ? Math.max(...args.attempts.map((row) => row.scorePercent)) : null;

  return {
    id: args.quiz.id,
    title: args.quiz.title,
    description: args.quiz.description,
    passRatio: Number(args.quiz.pass_ratio),
    maxAttempts: args.quiz.max_attempts,
    questionCount: args.questionCount,
    moduleId: args.quiz.module_id,
    moduleSlug: args.moduleSlug,
    moduleTitle: args.moduleTitle,
    modulePosition: args.modulePosition,
    unlocked: args.unlocked,
    attemptsUsed,
    attemptsRemaining: Math.max(0, args.quiz.max_attempts - attemptsUsed),
    bestScorePercent,
    passed,
    questions: args.questions,
    attempts: args.attempts,
  };
}

export async function loadModuleQuizzes(snapshot: CourseSnapshot, userId: string): Promise<ModuleQuizView[]> {
  const db = getSupabaseAdmin();
  const { data: quizzes } = await db
    .from("course_quizzes")
    .select("id, title, description, pass_ratio, max_attempts, module_id, is_published")
    .eq("course_id", snapshot.course.id)
    .eq("is_published", true);

  if (!quizzes || quizzes.length === 0) return [];

  const moduleById = new Map(snapshot.modules.map((m) => [m.id, m]));
  const quizIds = quizzes.map((q) => q.id);
  const [attemptsByQuiz, counts] = await Promise.all([loadAttemptsByQuiz(userId, quizIds), questionCounts(quizIds)]);

  const views = quizzes
    .map((quiz) => {
      const courseModule = moduleById.get(quiz.module_id);
      if (!courseModule) return null;
      return toView({
        quiz,
        moduleSlug: courseModule.slug,
        moduleTitle: courseModule.title,
        modulePosition: courseModule.position,
        unlocked: isModuleQuizUnlocked(snapshot, quiz.module_id),
        attempts: attemptsByQuiz.get(quiz.id) ?? [],
        questionCount: counts.get(quiz.id) ?? 5,
        questions: [],
      });
    })
    .filter((row): row is ModuleQuizView => row !== null)
    .sort((a, b) => a.modulePosition - b.modulePosition);

  return views;
}

export async function loadModuleQuiz(
  snapshot: CourseSnapshot,
  userId: string,
  moduleSlug: string,
): Promise<ModuleQuizView | null> {
  const courseModule = snapshot.modules.find((m) => m.slug === moduleSlug);
  if (!courseModule) return null;

  const db = getSupabaseAdmin();
  const { data: quiz } = await db
    .from("course_quizzes")
    .select("id, title, description, pass_ratio, max_attempts, module_id, is_published")
    .eq("course_id", snapshot.course.id)
    .eq("module_id", courseModule.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!quiz) return null;

  const unlocked = isModuleQuizUnlocked(snapshot, courseModule.id);
  const [attemptsByQuiz, counts, questionsRes] = await Promise.all([
    loadAttemptsByQuiz(userId, [quiz.id]),
    questionCounts([quiz.id]),
    unlocked
      ? db
          .from("quiz_questions")
          .select("id, prompt, options, position, module_id, image_url")
          .eq("quiz_id", quiz.id)
          .order("position", { ascending: true })
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            prompt: string;
            options: unknown;
            position: number;
            module_id: string | null;
            image_url: string | null;
          }>,
        }),
  ]);

  return toView({
    quiz,
    moduleSlug: courseModule.slug,
    moduleTitle: courseModule.title,
    modulePosition: courseModule.position,
    unlocked,
    attempts: attemptsByQuiz.get(quiz.id) ?? [],
    questionCount: counts.get(quiz.id) ?? questionsRes.data?.length ?? 5,
    questions: (questionsRes.data ?? []).map((row) => ({
      id: row.id,
      prompt: row.prompt,
      options: asOptions(row.options),
      position: row.position,
      moduleId: row.module_id,
      imageUrl: row.image_url,
    })),
  });
}

export type SubmitQuizResult =
  | {
      ok: true;
      scorePercent: number;
      passed: boolean;
      correctCount: number;
      total: number;
      attemptsRemaining: number;
      moduleId: string;
      moduleTitle: string;
    }
  | {
      ok: false;
      reason: "locked" | "exhausted" | "invalid" | "already_passed" | "error";
      message: string;
    };

/**
 * Corrige a tentativa no servidor. O cliente envia apenas { questionId: optionIndex }.
 */
export async function submitQuizAttempt(
  snapshot: CourseSnapshot,
  userId: string,
  quizId: string,
  answers: Record<string, number>,
): Promise<SubmitQuizResult> {
  const db = getSupabaseAdmin();
  const { data: quiz } = await db
    .from("course_quizzes")
    .select("id, pass_ratio, max_attempts, module_id, course_id, is_published")
    .eq("id", quizId)
    .eq("course_id", snapshot.course.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!quiz) {
    return { ok: false, reason: "error", message: "Prova indisponível no momento." };
  }

  if (!isModuleQuizUnlocked(snapshot, quiz.module_id)) {
    return {
      ok: false,
      reason: "locked",
      message: "A prova só libera depois de concluir todas as aulas obrigatórias deste módulo.",
    };
  }

  const { data: prior } = await db
    .from("quiz_attempts")
    .select("id, passed")
    .eq("quiz_id", quiz.id)
    .eq("user_id", userId)
    .not("submitted_at", "is", null);

  const priorRows = prior ?? [];
  if (priorRows.some((row) => row.passed)) {
    return { ok: false, reason: "already_passed", message: "Você já foi aprovado nesta prova." };
  }
  if (priorRows.length >= quiz.max_attempts) {
    return {
      ok: false,
      reason: "exhausted",
      message: "Você atingiu o limite de tentativas desta prova.",
    };
  }

  const { data: questions } = await db
    .from("quiz_questions")
    .select("id, correct_index, options, position")
    .eq("quiz_id", quiz.id)
    .order("position", { ascending: true });

  if (!questions || questions.length === 0) {
    return { ok: false, reason: "error", message: "A prova ainda não possui questões." };
  }

  let correctCount = 0;
  const normalized: Record<string, number> = {};
  for (const question of questions) {
    const chosen = answers[question.id];
    const optionCount = asOptions(question.options).length;
    if (typeof chosen !== "number" || !Number.isInteger(chosen) || chosen < 0 || chosen >= optionCount) {
      return {
        ok: false,
        reason: "invalid",
        message: "Responda todas as questões antes de enviar a prova.",
      };
    }
    normalized[question.id] = chosen;
    if (chosen === question.correct_index) correctCount += 1;
  }

  const total = questions.length;
  const scorePercent = Math.round((correctCount / total) * 100);
  const passed = scorePercent >= Math.round(Number(quiz.pass_ratio) * 100);

  const { data: created, error } = await db
    .from("quiz_attempts")
    .insert({
      quiz_id: quiz.id,
      user_id: userId,
      answers: normalized,
      score_percent: scorePercent,
      passed,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[quiz] falha ao salvar tentativa", error?.message);
    return { ok: false, reason: "error", message: "Não foi possível salvar sua tentativa agora." };
  }

  await recordAudit({
    actorId: userId,
    action: passed ? "quiz.passed" : "quiz.failed",
    entityType: "quiz_attempt",
    entityId: created.id,
    metadata: {
      quiz_id: quiz.id,
      module_id: quiz.module_id,
      course_id: snapshot.course.id,
      score_percent: scorePercent,
      correct_count: correctCount,
      total,
      app: getEnv().APP_URL,
    },
  });

  const courseModule = snapshot.modules.find((module) => module.id === quiz.module_id);

  return {
    ok: true,
    scorePercent,
    passed,
    correctCount,
    total,
    attemptsRemaining: Math.max(0, quiz.max_attempts - (priorRows.length + 1)),
    moduleId: quiz.module_id,
    moduleTitle: courseModule?.title ?? "Módulo",
  };
}
