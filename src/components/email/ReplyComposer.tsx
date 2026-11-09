"use client";

/* ─────────────────────────────────────────────────────────────────
   ReplyComposer
   ─────────────────────────────────────────────────────────────────
   AI-assisted reply composer shown at the bottom of EmailPane.

   States
   ──────
   closed     → "Reply ↩" button only
   open       → prompt field + Polish button visible
   generating → spinner while API call runs
   draft      → editable draft area + Regenerate / Copy Reply

   V2 constraint: Gmail is read-only.  No email is ever sent.
   The final action is "Copy Reply" (writes to clipboard) or
   the user can simply edit and copy manually.
   ───────────────────────────────────────────────────────────────── */

import { useState, useRef, useCallback } from "react";
import {
  CornerUpLeft,
  Sparkles,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────

type ComposerState = "closed" | "open" | "generating" | "draft";

export interface ReplyComposerProps {
  /** Subject of the email being replied to */
  subject:     string;
  /** Body of the email being replied to */
  body:        string;
  /** Display name of the original sender */
  sender:      string;
}

// ── Small sub-components ─────────────────────────────────────────

function PillBtn({
  onClick,
  children,
  label,
  variant = "ghost",
  disabled,
}: {
  onClick:  () => void;
  children: React.ReactNode;
  label:    string;
  variant?: "ghost" | "primary" | "outline";
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    ghost:   { background: "transparent", color: "var(--luma-text-secondary)", border: "none" },
    primary: { background: "var(--luma-blue)", color: "#fff", border: "none" },
    outline: {
      background: "var(--luma-glass-raised)",
      color:      "var(--luma-text-secondary)",
      border:     "1px solid var(--luma-glass-border)",
    },
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)]
        text-[var(--text-xs)] font-semibold transition-all duration-100
        hover:opacity-85 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────

export function ReplyComposer({ subject, body, sender }: ReplyComposerProps) {
  const [state,       setState]       = useState<ComposerState>("closed");
  const [instruction, setInstruction] = useState("");
  const [draft,       setDraft]       = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  const instructionRef = useRef<HTMLTextAreaElement>(null);

  // ── API call ───────────────────────────────────────────────────

  const generate = useCallback(async (inst: string) => {
    setState("generating");
    setError(null);

    try {
      const res = await fetch("/api/agent/compose-reply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, sender, instruction: inst }),
      });

      const data = await res.json() as { draft?: string; error?: string };

      if (!res.ok || !data.draft) {
        throw new Error(data.error ?? "Generation failed.");
      }

      setDraft(data.draft);
      setState("draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("open");
    }
  }, [subject, body, sender]);

  // ── Handlers ───────────────────────────────────────────────────

  function handleOpen() {
    setState("open");
    // Focus the instruction textarea on next tick
    setTimeout(() => instructionRef.current?.focus(), 50);
  }

  function handlePolish() {
    generate(instruction);
  }

  function handleRegenerate() {
    generate(instruction);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — no-op
    }
  }

  function handleClose() {
    setState("closed");
    setInstruction("");
    setDraft("");
    setError(null);
    setCopied(false);
  }

  // ── Render: closed ─────────────────────────────────────────────

  if (state === "closed") {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
            text-[var(--text-sm)] font-semibold transition-all duration-100
            hover:opacity-85 active:scale-[0.97]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
          style={{
            background: "var(--luma-glass-raised)",
            border:     "1px solid var(--luma-glass-border)",
            color:      "var(--luma-text-secondary)",
          }}
        >
          <CornerUpLeft size={14} strokeWidth={2} aria-hidden="true" />
          Reply
        </button>
      </div>
    );
  }

  // ── Render: open / generating / draft ─────────────────────────

  return (
    <div
      className="mt-2 rounded-[var(--radius-xl)] overflow-hidden flex flex-col"
      style={{
        border:     "1px solid var(--luma-glass-border)",
        background: "var(--luma-glass-raised)",
      }}
    >
      {/* Section header */}
      <div
        className="flex items-center justify-between px-4 pt-3.5 pb-2"
        style={{ borderBottom: "1px solid var(--luma-glass-border)" }}
      >
        <div className="flex items-center gap-1.5">
          <CornerUpLeft
            size={13}
            strokeWidth={2}
            style={{ color: "var(--luma-text-tertiary)" }}
            aria-hidden="true"
          />
          <span
            className="text-[var(--text-xs)] font-bold uppercase tracking-wide"
            style={{ color: "var(--luma-text-tertiary)", letterSpacing: "0.07em" }}
          >
            Reply
          </span>
        </div>
        <button
          type="button"
          aria-label="Close reply composer"
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-full)]
            hover:bg-[rgba(0,0,0,0.06)] transition-colors duration-100"
          style={{ color: "var(--luma-text-tertiary)" }}
        >
          <X size={13} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* ── Prompt row ─────────────────────────────────────────── */}
      <div
        className="flex items-end gap-2 px-4 py-3"
        style={{ borderBottom: draft ? "1px solid var(--luma-glass-border)" : undefined }}
      >
        <textarea
          ref={instructionRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePolish();
          }}
          placeholder="Describe your reply…"
          rows={3}
          aria-label="Describe your reply"
          className="flex-1 resize-none bg-transparent text-[var(--text-sm)] outline-none
            placeholder:text-[var(--luma-text-tertiary)] leading-[var(--leading-relaxed)]"
          style={{ color: "var(--luma-text-primary)", minHeight: "80px" }}
          disabled={state === "generating"}
        />

        {/* Polish button — aligned to textarea bottom edge */}
        <button
          type="button"
          onClick={handlePolish}
          disabled={state === "generating"}
          aria-label="Polish reply with AI"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)]
            text-[var(--text-xs)] font-semibold transition-all duration-100
            hover:opacity-85 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
          style={{
            background:  "rgba(124,92,216,0.12)",
            color:       "var(--luma-purple, #7c5cd8)",
            border:      "1px solid rgba(124,92,216,0.22)",
            flexShrink:  0,
            marginBottom: "2px",
          }}
        >
          {state === "generating" ? (
            <Loader2 size={12} strokeWidth={2} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles size={12} strokeWidth={2} aria-hidden="true" />
          )}
          {state === "generating" ? "Polishing…" : "Polish"}
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <p
          className="px-4 py-2 text-[var(--text-xs)]"
          style={{ color: "#b91c1c" }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ── Draft area ─────────────────────────────────────────── */}
      {state === "draft" && (
        <>
          {/* Draft label */}
          <div
            className="flex items-center gap-1.5 px-4 pt-3 pb-1"
          >
            <Sparkles
              size={11}
              strokeWidth={1.5}
              style={{ color: "var(--luma-purple, #7c5cd8)" }}
              aria-hidden="true"
            />
            <span
              className="text-[var(--text-2xs)] font-semibold uppercase tracking-wide"
              style={{ color: "var(--luma-purple, #7c5cd8)", letterSpacing: "0.07em" }}
            >
              Draft reply (AI)
            </span>
          </div>

          {/* Editable draft */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="AI draft reply — edit before copying"
            rows={6}
            className="mx-4 mb-3 rounded-[var(--radius-lg)] resize-none
              text-[var(--text-sm)] leading-[var(--leading-relaxed)] outline-none px-3 py-2.5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
            style={{
              background: "rgba(255,255,255,0.6)",
              border:     "1px solid var(--luma-glass-border)",
              color:      "var(--luma-text-primary)",
            }}
          />

          {/* Action row */}
          <div
            className="flex items-center justify-between gap-2 px-4 pb-3"
          >
            <PillBtn
              onClick={handleRegenerate}
              label="Regenerate draft"
              variant="outline"
              disabled={state !== "draft"}
            >
              <RotateCcw size={12} strokeWidth={2} aria-hidden="true" />
              Regenerate
            </PillBtn>

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy reply to clipboard"
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
                text-[var(--text-sm)] font-semibold transition-all duration-100
                hover:opacity-90 active:scale-[0.98]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
              style={{
                background: copied ? "rgba(22,163,74,0.12)" : "var(--luma-blue)",
                color:      copied ? "rgb(22,163,74)"       : "#fff",
                border:     copied ? "1px solid rgba(22,163,74,0.3)" : "none",
                minWidth:   "7.5rem",
                justifyContent: "center",
              }}
            >
              {copied ? (
                <>
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={1.5} aria-hidden="true" />
                  Copy Reply
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
