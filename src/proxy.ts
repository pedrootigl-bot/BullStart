import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions } from "@/lib/supabase/cookies";

const PROTECTED_PREFIXES = ["/plataforma", "/admin"];
const GUEST_ONLY = ["/login", "/cadastro"];

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function contentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const supabase = originOf(process.env.SUPABASE_PUBLIC_URL) ?? "";
  const externalVideo = (process.env.VIDEO_EXTERNAL_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)
    .map((host) => `https://${host}`)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    `media-src 'self' blob: ${supabase} ${externalVideo}`.trim(),
    `connect-src 'self' ${supabase}${isDev ? " ws: wss:" : ""}`.trim(),
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (process.env.APP_URL?.startsWith("https://")) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;

  if (!supabaseUrl || !supabaseKey) {
    if (matchesPrefix(path, PROTECTED_PREFIXES)) {
      return withSecurityHeaders(new NextResponse("Serviço indisponível", { status: 503 }));
    }
    return withSecurityHeaders(response);
  }

  const cookieOptions = authCookieOptions(process.env.APP_URL ?? request.nextUrl.origin);
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, { ...options, httpOnly: true, secure: cookieOptions.secure });
        }
      },
    },
  });

  // Renova a sessão (quando necessário) e valida o JWT.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const redirectTo = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return withSecurityHeaders(redirect);
  };

  if (!isAuthenticated && matchesPrefix(path, PROTECTED_PREFIXES)) {
    const next = `${path}${request.nextUrl.search}`;
    return redirectTo("/login", `?next=${encodeURIComponent(next)}`);
  }

  if (isAuthenticated && matchesPrefix(path, GUEST_ONLY) && !request.nextUrl.searchParams.has("erro")) {
    return redirectTo("/plataforma");
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:png|jpg|jpeg|svg|webp|ico|mp4|webm)$).*)"],
};
