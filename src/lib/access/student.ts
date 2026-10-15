import "server-only";
import { cache } from "react";
import { loadCourseSnapshot } from "@/lib/access/snapshot";
import { requireUser } from "@/lib/auth/session";
import { getBrokerIntegration } from "@/lib/broker/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Sessão + snapshot do curso do aluno autenticado (consultas sob RLS). Memoizado por requisição. */
export const getStudentContext = cache(async (nextPath = "/plataforma") => {
  const session = await requireUser(nextPath);
  const supabase = await createSupabaseServerClient();
  const snapshot = await loadCourseSnapshot(supabase, session.profile);
  return {
    session,
    snapshot,
    depositConfigured: getBrokerIntegration().isDepositConfigured(),
  };
});
