import type { CookieOptionsWithName } from "@supabase/ssr";

export const AUTH_COOKIE_NAME = "bxs-auth";

export function authCookieOptions(appUrl: string): CookieOptionsWithName {
  return {
    name: AUTH_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: appUrl.startsWith("https://"),
  };
}
