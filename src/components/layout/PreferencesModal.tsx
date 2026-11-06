"use client";

/* ─────────────────────────────────────────────────────────────────
   PreferencesModal
   ─────────────────────────────────────────────────────────────────
   Opens as a modal panel when the user clicks "LUMA Preferences"
   in the Header.

   Gmail section behaviour
   ───────────────────────
   • On open: calls GET /api/auth/gmail/status to learn whether the
     gmail_tokens cookie is set (it's HttpOnly — can't be read by JS).
   • Not connected: shows a "Connect Gmail" button that navigates to
     GET /api/auth/gmail (the OAuth consent redirect).
   • Connected: shows a "Gmail Connected" badge.
   • The component never reads or classifies Gmail messages — that is
     wired in a later session.
   ───────────────────────────────────────────────────────────────── */

import { useEffect, useState, useCallback } from "react";
import { X, Mail, CheckCircle2, Loader2 }   from "lucide-react";

type GmailStatus = "checking" | "connected" | "disconnected";

interface PreferencesModalProps {
  onClose: () => void;
}

export function PreferencesModal({ onClose }: PreferencesModalProps) {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>("checking");

  // Check connection status whenever the modal opens.
  const checkStatus = useCallback(async () => {
    setGmailStatus("checking");
    try {
      const res = await fetch("/api/auth/gmail/status");
      const { connected } = await res.json() as { connected: boolean };
      setGmailStatus(connected ? "connected" : "disconnected");
    } catch {
      setGmailStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.25)" }}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="LUMA Preferences"
        className="fixed z-50 rounded-[var(--radius-2xl)] shadow-xl"
        style={{
          top:        "4.5rem",
          right:      "1.5rem",
          width:      "22rem",
          background: "var(--luma-glass-raised)",
          border:     "1px solid var(--luma-glass-border)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--luma-glass-border)" }}
        >
          <h2
            className="text-[var(--text-base)] font-bold"
            style={{ color: "var(--luma-text-primary)" }}
          >
            LUMA Preferences
          </h2>
          <button
            type="button"
            aria-label="Close preferences"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-full)]
              transition-colors duration-100 hover:bg-[rgba(0,0,0,0.06)]
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-5">

          {/* ── Gmail section ──────────────────────────── */}
          <section aria-label="Gmail connection">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={14} strokeWidth={1.5} style={{ color: "var(--luma-text-tertiary)" }} aria-hidden="true" />
              <span
                className="text-[var(--text-xs)] font-semibold uppercase tracking-wide"
                style={{ color: "var(--luma-text-tertiary)", letterSpacing: "0.08em" }}
              >
                Email source
              </span>
            </div>

            {gmailStatus === "checking" && (
              <div className="flex items-center gap-2 py-2" aria-live="polite">
                <Loader2
                  size={15}
                  strokeWidth={1.5}
                  className="animate-spin"
                  style={{ color: "var(--luma-text-tertiary)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-[var(--text-sm)]"
                  style={{ color: "var(--luma-text-tertiary)" }}
                >
                  Checking connection…
                </span>
              </div>
            )}

            {gmailStatus === "connected" && (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-xl)]"
                style={{
                  background: "rgba(22,163,74,0.08)",
                  border:     "1px solid rgba(22,163,74,0.25)",
                }}
                aria-live="polite"
              >
                <CheckCircle2
                  size={15}
                  strokeWidth={1.5}
                  style={{ color: "#16a34a", flexShrink: 0 }}
                  aria-hidden="true"
                />
                <div className="flex flex-col leading-tight">
                  <span
                    className="text-[var(--text-sm)] font-semibold"
                    style={{ color: "#15803d" }}
                  >
                    Gmail Connected
                  </span>
                  <span
                    className="text-[var(--text-xs)] mt-0.5"
                    style={{ color: "var(--luma-text-tertiary)" }}
                  >
                    Read-only · Demo emails active
                  </span>
                </div>
              </div>
            )}

            {gmailStatus === "disconnected" && (
              <div className="flex flex-col gap-2" aria-live="polite">
                <p
                  className="text-[var(--text-sm)]"
                  style={{ color: "var(--luma-text-secondary)" }}
                >
                  Connect your Gmail inbox to let LUMA classify your real emails.
                </p>
                <a
                  href="/api/auth/gmail"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-xl)]
                    text-[var(--text-sm)] font-semibold transition-colors duration-100
                    hover:opacity-90 focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-[var(--luma-blue)]"
                  style={{
                    background: "var(--luma-blue)",
                    color:      "#fff",
                    textDecoration: "none",
                  }}
                >
                  <Mail size={14} strokeWidth={2} aria-hidden="true" />
                  Connect Gmail
                </a>
                <p
                  className="text-[var(--text-xs)] text-center"
                  style={{ color: "var(--luma-text-tertiary)" }}
                >
                  Gmail read-only · Demo emails stay active
                </p>
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
