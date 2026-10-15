import { NextResponse, type NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth/session";
import { getBrokerIntegration } from "@/lib/broker/service";

/** Redireciona exclusivamente para o destino oficial de depósito configurado no backend. */
export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.redirect(new URL("/login?next=/plataforma", request.nextUrl.origin));

  const url = await getBrokerIntegration().getOfficialDepositUrl(session.profile.id);
  if (!url) return NextResponse.redirect(new URL("/plataforma?erro=deposito-indisponivel", request.nextUrl.origin));

  await recordAudit({ actorId: session.profile.id, action: "broker.deposit_redirect", entityType: "profile", entityId: session.profile.id });
  return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
