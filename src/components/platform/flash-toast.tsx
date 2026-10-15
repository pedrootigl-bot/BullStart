"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Exibe uma única notificação vinda de parâmetro de URL (ex.: após redirecionamento). */
export function FlashToast({ tone, message }: { tone: "success" | "error" | "info"; message: string }) {
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    if (tone === "success") toast.success(message);
    else if (tone === "error") toast.error(message);
    else toast.info(message);
    const url = new URL(window.location.href);
    if (url.search) {
      url.search = "";
      window.history.replaceState(null, "", url.toString());
    }
  }, [tone, message]);
  return null;
}
