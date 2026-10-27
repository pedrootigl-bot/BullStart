"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./mobile-bottom-nav.css";

const ORB_MS = 520;
const PRESS_LOCK_MS = 900;

/** Fora do render: o lint de pureza do React não permite Date.now no corpo do componente. */
function nowMs() {
  return Date.now();
}

type TabKey = "sobre" | "formacao" | "home" | "certificado";

type MobileBottomNavProps = {
  activeSection?: string | null;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function IconInfo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v6M12 7.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconGraduation() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m12 4 10 5-10 5L2 9l10-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 11.5v4.2c0 .7 2.7 2.3 6 2.3s6-1.6 6-2.3v-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M22 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAward() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isModifiedClick(event: MouseEvent<HTMLElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function sectionToKey(section: string | null | undefined): TabKey {
  if (section === "sobre" || section === "formacao" || section === "certificado") {
    return section;
  }
  return "home";
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function MobileBottomNav({ activeSection = null }: MobileBottomNavProps) {
  const reducedMotion = usePrefersReducedMotion();
  const barInnerRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const activeKeyRef = useRef<TabKey>("home");
  const activeSectionRef = useRef(activeSection);
  const reducedRef = useRef(reducedMotion);
  const pressLockUntilRef = useRef(0);
  const pressTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [activeKey, setActiveKey] = useState<TabKey>("home");
  const [orbReady, setOrbReady] = useState(false);

  activeKeyRef.current = activeKey;
  activeSectionRef.current = activeSection;
  reducedRef.current = reducedMotion;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Scroll só atualiza o destaque depois que o toque “solta” o orbe.
  // Debounce leve evita o orbe “piscar” entre seções no meio do scroll.
  useEffect(() => {
    if (nowMs() < pressLockUntilRef.current) return;
    const next = sectionToKey(activeSection);
    const timer = window.setTimeout(() => {
      if (nowMs() < pressLockUntilRef.current) return;
      setActiveKey((prev) => (prev === next ? prev : next));
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeSection]);

  const positionOrb = (instant: boolean) => {
    const nav = barInnerRef.current;
    const orb = orbRef.current;
    const line = indicatorRef.current;
    if (!nav || !orb || !line) return;

    if (nav.clientWidth < 8) return;

    const target = nav.querySelector<HTMLElement>(
      `[data-nav-key="${activeKeyRef.current}"]`,
    );
    if (!target) return;

    // offsetLeft/Width evitam jitter causado por getBoundingClientRect durante transforms dos ícones.
    const center = target.offsetLeft + target.offsetWidth / 2;
    const orbWidth = orb.offsetWidth || 37.6;
    const lineWidth = line.offsetWidth || 20;
    const maxOrb = Math.max(0, nav.clientWidth - orbWidth);
    const maxLine = Math.max(0, nav.clientWidth - lineWidth);
    const duration = instant || reducedRef.current ? "0ms" : `${ORB_MS}ms`;

    nav.style.setProperty("--orb-duration", duration);
    nav.style.setProperty("--orb-x", `${Math.min(maxOrb, Math.max(0, center - orbWidth / 2))}px`);
    nav.style.setProperty("--indicator-x", `${Math.min(maxLine, Math.max(0, center - lineWidth / 2))}px`);

    if (!readyRef.current) {
      readyRef.current = true;
      setOrbReady(true);
    }
  };

  const schedulePosition = (instant: boolean) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        positionOrb(instant);
      });
    });
  };

  useLayoutEffect(() => {
    if (!mounted) return;
    schedulePosition(!readyRef.current);
  }, [mounted, reducedMotion]);

  useEffect(() => {
    if (!mounted) return;
    schedulePosition(false);
  }, [activeKey, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const shell = barInnerRef.current;
    if (!shell) return;

    const observer = new ResizeObserver(() => {
      schedulePosition(true);
    });
    observer.observe(shell);

    const onResize = () => schedulePosition(true);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [mounted]);

  function scrollToHash(href: string) {
    if (href === "#") {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }

  function handleTabNav(event: MouseEvent<HTMLAnchorElement>, href: string, tab: TabKey) {
    if (isModifiedClick(event)) return;
    event.preventDefault();

    pressLockUntilRef.current = nowMs() + PRESS_LOCK_MS;
    if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(() => {
      pressLockUntilRef.current = 0;
      const next = sectionToKey(activeSectionRef.current);
      setActiveKey((prev) => (prev === next ? prev : next));
    }, PRESS_LOCK_MS);

    setActiveKey(tab);
    scrollToHash(href);
  }

  function renderTab(key: TabKey, label: string, icon: ReactNode, href: string) {
    const isActive = activeKey === key;

    return (
      <a
        key={key}
        className={cx("mba-tab", isActive && "mba-tabActive")}
        data-nav-key={key}
        href={href}
        onClick={(event) => handleTabNav(event, href, key)}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="mba-tabIcon">{icon}</span>
        <span className="mba-tabLabel">{label}</span>
      </a>
    );
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <nav
      className={cx("mba-bar", !reducedMotion && "mba-barEnter")}
      aria-label="Navegação inferior"
      data-orb-ready={orbReady ? "true" : "false"}
      data-reduced={reducedMotion ? "true" : "false"}
    >
      <div
        ref={barInnerRef}
        className={cx("mba-barInner", reducedMotion && "mba-motionStatic")}
      >
        <div ref={orbRef} className="mba-orb" aria-hidden="true" />
        <div className="mba-orbGlow" aria-hidden="true" />
        <div ref={indicatorRef} className="mba-indicator" aria-hidden="true" />

        {renderTab("sobre", "Sobre", <IconInfo />, "#sobre")}
        {renderTab("formacao", "Formação", <IconGraduation />, "#formacao")}
        {renderTab("home", "Início", <IconHome />, "#")}
        {renderTab("certificado", "Certificado", <IconAward />, "#certificado")}
      </div>
    </nav>,
    document.body,
  );
}
