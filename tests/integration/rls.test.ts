import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

config({ path: ".env.local" });

const url = process.env.SUPABASE_URL ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const enabled = process.env.RUN_INTEGRATION === "1" && Boolean(url && anonKey);

const STUDENT = { email: "aluno@bullacademy.local", password: "BullexAluno2026" };
const NEW_STUDENT = { email: "novo@bullacademy.local", password: "BullexNovo2026" };

function client(): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedIn(credentials: { email: string; password: string }) {
  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw new Error(`login falhou: ${error.message}`);
  return supabase;
}

describe.skipIf(!enabled)("RLS e grants (Supabase local)", () => {
  let student: SupabaseClient<Database>;
  let anon: SupabaseClient<Database>;
  let studentProfileId: string;

  beforeAll(async () => {
    student = await signedIn(STUDENT);
    anon = client();
    const { data } = await student.from("profiles").select("id").single();
    studentProfileId = data!.id;
  });

  it("aluno lê apenas o próprio perfil", async () => {
    const { data } = await student.from("profiles").select("id, email");
    expect(data).toHaveLength(1);
    expect(data![0]!.email).toBe(STUDENT.email);
  });

  it("aluno não lê progresso, elegibilidade ou certificados de outro aluno", async () => {
    const other = await signedIn(NEW_STUDENT);
    const { data: otherProfile } = await other.from("profiles").select("id").single();
    const [progress, eligibility, certificates] = await Promise.all([
      student.from("lesson_progress").select("id").eq("user_id", otherProfile!.id),
      student.from("broker_eligibility").select("id").eq("user_id", otherProfile!.id),
      student.from("certificates").select("id").eq("user_id", otherProfile!.id),
    ]);
    expect(progress.data ?? []).toHaveLength(0);
    expect(eligibility.data ?? []).toHaveLength(0);
    expect(certificates.data ?? []).toHaveLength(0);
  });

  it("aluno não consegue alterar o próprio papel nem o vínculo com a corretora", async () => {
    const { error } = await student.from("profiles").update({ role: "admin", broker_user_id: "FAKE" }).eq("id", studentProfileId);
    expect(error).not.toBeNull();
    const { data } = await student.from("profiles").select("role, broker_user_id").single();
    expect(data!.role).toBe("student");
    expect(data!.broker_user_id).toBe("DEV-LOCAL-0001");
  });

  it("aluno não grava progresso, elegibilidade, liberações ou certificados diretamente", async () => {
    const { data: lesson } = await student.from("lessons").select("id").limit(1).single();
    const attempts = await Promise.all([
      student.from("lesson_progress").insert({ user_id: studentProfileId, lesson_id: lesson!.id, status: "completed", completed_at: new Date().toISOString() }),
      student.from("broker_eligibility").insert({ user_id: studentProfileId, requirement_key: "account_funding_confirmed", eligibility_status: "eligible", source: "webhook" }),
      student.from("module_access").insert({ user_id: studentProfileId, module_id: "d0000000-0000-4000-8000-000000000003", status: "granted", reason: "tentativa indevida" }),
      student.from("certificates").insert({ user_id: studentProfileId, course_id: "c0000000-0000-4000-8000-000000000001", holder_name: "X", verification_code: "BXS-AAAA-BBBB-CCCC", completed_at: new Date().toISOString(), workload_hours: 1 }),
    ]);
    for (const attempt of attempts) expect(attempt.error).not.toBeNull();
  });

  it("aluno não executa funções privilegiadas", async () => {
    const { data: lesson } = await student.from("lessons").select("id").limit(1).single();
    const heartbeat = await student.rpc("apply_lesson_heartbeat", { p_user_id: studentProfileId, p_lesson_id: lesson!.id, p_position: 999, p_claimed_seconds: 120 });
    const complete = await student.rpc("complete_lesson", { p_user_id: studentProfileId, p_lesson_id: lesson!.id });
    const move = await student.rpc("move_module", { p_module_id: "d0000000-0000-4000-8000-000000000001", p_direction: 1 });
    expect(heartbeat.error).not.toBeNull();
    expect(complete.error).not.toBeNull();
    expect(move.error).not.toBeNull();
  });

  it("referência de vídeo não é legível pelo aluno (column grants)", async () => {
    const { error } = await student.from("lessons").select("id, video_asset_id").limit(1);
    expect(error).not.toBeNull();
  });

  it("aluno não acessa objetos do bucket privado de vídeos", async () => {
    const { error } = await student.storage.from("lesson-videos").createSignedUrl("demo/aula-demo-a.mp4", 60);
    expect(error).not.toBeNull();
  });

  it("anônimo não lê tabelas, mas acessa catálogo público e verificação de certificado", async () => {
    const [profiles, lessons, catalog, verify] = await Promise.all([
      anon.from("profiles").select("id"),
      anon.from("lessons").select("id"),
      anon.rpc("public_catalog", { p_course_slug: "formacao-trader-bullex" }),
      anon.rpc("verify_certificate", { p_code: "BXS-0000-0000-0000" }),
    ]);
    expect(profiles.error !== null || (profiles.data ?? []).length === 0).toBe(true);
    expect(lessons.error !== null || (lessons.data ?? []).length === 0).toBe(true);
    expect(catalog.error).toBeNull();
    expect((catalog.data ?? []).length).toBeGreaterThan(0);
    expect(verify.error).toBeNull();
    expect(verify.data ?? []).toHaveLength(0);
  });

  it("anônimo não lê a tabela de eventos nem a de auditoria", async () => {
    const [events, audit] = await Promise.all([anon.from("broker_events").select("id"), anon.from("audit_logs").select("id")]);
    expect(events.error !== null || (events.data ?? []).length === 0).toBe(true);
    expect(audit.error !== null || (audit.data ?? []).length === 0).toBe(true);
  });
});
