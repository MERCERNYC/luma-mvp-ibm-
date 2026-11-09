"use client";

/* ═══════════════════════════════════════════════════════════════
   WelcomePage — LUMA V2 entrance screen
   ───────────────────────────────────────────────────────────────
   Shown when Gmail is NOT connected.

   Animations (GSAP):
     • Logo: soft reveal → continuous slow rotation + float
     • Text: staggered fade-up with blur
     • Background blobs: slow drifting
     • Enter (demo): logo expands + page fades, then calls onDemo()
     • Enter (Google): logo expands + page fades, then navigates
   ═══════════════════════════════════════════════════════════════ */

import { useRef, useState }       from "react";
import { useGSAP }                from "@gsap/react";
import gsap                       from "gsap";
import { Manrope }                from "next/font/google";

gsap.registerPlugin(useGSAP);

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

/* ─── Google wordmark ──────────────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Props ────────────────────────────────────────────────────── */
interface WelcomePageProps {
  /** Called after the exit animation completes — switches gate to "dashboard" */
  onDemo: () => void;
}

/* ─── Component ────────────────────────────────────────────────── */
export function WelcomePage({ onDemo }: WelcomePageProps) {
  const pageRef  = useRef<HTMLElement>(null);
  const logoRef  = useRef<HTMLSpanElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  /* ── Entrance animations ─────────────────────────────────────── */
  useGSAP(
    () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      // 1. Wordmark reveal
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: 18, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.8, ease: "power2.out" },
      );

      // 2. Text stagger fade-up with blur
      gsap.fromTo(
        ".luma-text",
        { opacity: 0, y: 25, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 2.2,
          stagger: 0.45,
          delay: 0.5,
          ease: "power2.out",
        },
      );

      // 5. Slow drifting blobs
      gsap.to(".luma-blob-one", {
        x: 110, y: -65, scale: 1.15,
        duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      gsap.to(".luma-blob-two", {
        x: -100, y: 85, scale: 1.2,
        duration: 17, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      gsap.to(".luma-blob-three", {
        x: 65, y: 100, scale: 1.1,
        duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
    },
    { scope: pageRef },
  );

  /* ── Exit animation → dashboard ─────────────────────────────── */
  function runExitThen(callback: () => void) {
    if (isEntering) return;
    setIsEntering(true);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) { callback(); return; }

    gsap.timeline({ onComplete: callback })
      .to(logoRef.current, {
        opacity: 0,
        y: -12,
        duration: 0.6,
        ease: "power2.in",
      })
      .to(pageRef.current, {
        opacity: 0,
        duration: 0.7,
        ease: "power2.inOut",
      }, "-=0.2");
  }

  /* ── Google OAuth: animate out then navigate ─────────────────── */
  function handleGoogleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    runExitThen(() => { window.location.href = "/api/auth/gmail"; });
  }

  return (
    <main
      ref={pageRef}
      className={`${manrope.className} relative flex min-h-screen items-center justify-center overflow-hidden px-6`}
      style={{
        background: "linear-gradient(135deg, #FFFDFC 0%, #F6F3FC 45%, #EFF8FC 100%)",
      }}
    >
      {/* ── Drifting background blobs ─────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="luma-blob-one absolute -left-40 -top-40 h-[650px] w-[650px] rounded-full opacity-60 blur-[100px]"
          style={{ background: "radial-gradient(circle, #E6D8F7 0%, transparent 70%)" }}
        />
        <div
          className="luma-blob-two absolute -bottom-48 -right-40 h-[750px] w-[750px] rounded-full opacity-70 blur-[100px]"
          style={{ background: "radial-gradient(circle, #CFEAF8 0%, transparent 70%)" }}
        />
        <div
          className="luma-blob-three absolute left-1/3 top-1/3 h-[550px] w-[550px] rounded-full opacity-40 blur-[110px]"
          style={{ background: "radial-gradient(circle, #F8DFD5 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* LUMA wordmark */}
        <span
          ref={logoRef}
          className="luma-text font-medium tracking-[0.2em] text-[#22212B]"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          LUMA
        </span>

        {/* Tagline */}
        <p
          className="luma-text mt-3 text-center font-light tracking-[0.035em] text-[#131414]"
          style={{ fontSize: "clamp(1.1rem, 2.5vw, 2rem)" }}
        >
          Less inbox. More life.
        </p>

        {/* Sub-copy */}
        <p
          className="luma-text mt-4 text-center text-[0.9rem] tracking-wide"
          style={{ color: "#6b7280", maxWidth: "320px", lineHeight: 1.6 }}
        >
          Let LUMA find what needs your attention.
        </p>

        {/* Continue with Google */}
        <a
          href="/api/auth/gmail"
          onClick={handleGoogleClick}
          className="luma-text mt-10 inline-flex items-center gap-[10px] rounded-full px-7 py-3.5 text-[0.9375rem] font-medium text-[#22212B] transition-all duration-150 hover:shadow-lg hover:scale-[1.02] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8A0E3]"
          style={{
            background:  "rgba(255,255,255,0.92)",
            border:      "1px solid rgba(160,195,240,0.55)",
            boxShadow:   "0 2px 14px rgba(100,120,220,0.10)",
            textDecoration: "none",
          }}
        >
          <GoogleLogo />
          Continue with Google
        </a>

        {/* Disclaimer */}
        <p
          className="luma-text mt-3 text-center text-[0.72rem] tracking-wide"
          style={{ color: "#9ca3af", maxWidth: "300px", lineHeight: 1.55 }}
        >
          Read-only access. LUMA will never send or delete email without your permission.
        </p>

        {/* Demo fallback */}
        <button
          type="button"
          onClick={() => runExitThen(onDemo)}
          disabled={isEntering}
          className="luma-text mt-6 bg-transparent border-none p-0 cursor-pointer text-[0.8rem] underline underline-offset-[3px] transition-colors duration-150 hover:text-[#6b7280] disabled:cursor-wait"
          style={{ color: "#9ca3af" }}
        >
          Try LUMA with demo emails
        </button>

      </div>
    </main>
  );
}
