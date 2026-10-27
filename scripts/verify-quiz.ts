import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data: quizzes, count: quizCount } = await db
    .from("course_quizzes")
    .select("id, title, module_id, pass_ratio, max_attempts", { count: "exact" })
    .order("title");
  const { count: questionCount } = await db.from("quiz_questions").select("*", { count: "exact", head: true });

  console.log("quizzes:", quizCount, "| questions:", questionCount);
  if (!quizzes || quizzes.length < 1) throw new Error("nenhuma prova encontrada");
  if ((questionCount ?? 0) !== quizzes.length * 5) {
    throw new Error(`esperava ${quizzes.length * 5} questões, veio ${questionCount}`);
  }

  const quiz = quizzes[0]!;
  console.log("sample:", quiz.title, "| pass:", quiz.pass_ratio, "| max:", quiz.max_attempts);

  const { data: aluno } = await db.from("profiles").select("id").eq("email", "aluno@bullacademy.local").single();
  if (!aluno) throw new Error("aluno não encontrado");

  await db.from("quiz_attempts").delete().eq("user_id", aluno.id);

  const { data: questions } = await db
    .from("quiz_questions")
    .select("id, correct_index")
    .eq("quiz_id", quiz.id)
    .order("position");
  if (!questions || questions.length !== 5) throw new Error("esperava 5 questões no módulo de amostra");

  const wrong = Object.fromEntries(questions.map((q) => [q.id, (q.correct_index + 1) % 4]));
  const failInsert = await db.from("quiz_attempts").insert({
    quiz_id: quiz.id,
    user_id: aluno.id,
    answers: wrong,
    score_percent: 0,
    passed: false,
    submitted_at: new Date().toISOString(),
  });
  console.log("fail insert:", failInsert.error?.message ?? "ok");

  const right = Object.fromEntries(questions.map((q) => [q.id, q.correct_index]));
  const passInsert = await db.from("quiz_attempts").insert({
    quiz_id: quiz.id,
    user_id: aluno.id,
    answers: right,
    score_percent: 100,
    passed: true,
    submitted_at: new Date().toISOString(),
  });
  console.log("pass insert:", passInsert.error?.message ?? "ok");

  const { data: passed } = await db
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", aluno.id)
    .eq("quiz_id", quiz.id)
    .eq("passed", true)
    .limit(1)
    .maybeSingle();
  console.log("hasPassed module sample:", Boolean(passed));

  await db.from("quiz_attempts").delete().eq("user_id", aluno.id);
  console.log("cleanup ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
