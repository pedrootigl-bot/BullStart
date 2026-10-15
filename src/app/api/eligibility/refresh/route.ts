import { NextResponse } from "next/server";
import { z } from "zod";
import { brokerKeysOf, parseRequirement } from "@/lib/access/requirements";
import { getSessionUser } from "@/lib/auth/session";
import { getBrokerIntegration } from "@/lib/broker/service";
import { consumeRateLimit, isSameOrigin, jsonError } from "@/lib/http/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({ moduleId: z.uuid() });

/**
 * Nova consulta de elegibilidade junto à corretora para os requisitos de um módulo.
 * Nenhum dado de elegibilidade é aceito do navegador: apenas o id do módulo.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "invalid_origin", "Origem da requisição não autorizada.");

  const session = await getSessionUser();
  if (!session) return jsonError(401, "unauthenticated", "Sessão expirada. Entre novamente.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid_body", "Requisição inválida.");

  if (!(await consumeRateLimit(`eligibility:${session.profile.id}`, 5, 600))) {
    return jsonError(429, "rate_limited", "Você já solicitou verificações recentemente. Aguarde alguns minutos.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("module_requirements")
    .select("id, requirement_type, config_json")
    .eq("module_id", parsed.data.moduleId);

  const keys = [
    ...new Set(
      (rows ?? []).flatMap((row) => {
        const requirement = parseRequirement(row);
        return requirement.ok ? brokerKeysOf(requirement.requirement) : [];
      }),
    ),
  ];
  if (keys.length === 0) return NextResponse.json({ ok: true, results: [] });

  if (!session.profile.broker_user_id) {
    return jsonError(409, "unlinked", "Sua conta ainda não possui vínculo verificado com a corretora.");
  }

  const broker = getBrokerIntegration();
  const results = [];
  for (const key of keys) {
    const lookup = await broker.getBrokerEligibility(session.profile.id, key, { refresh: true });
    results.push({ key, status: lookup.status });
  }

  return NextResponse.json({ ok: true, results }, { headers: { "Cache-Control": "no-store" } });
}
