"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Pencil, Check } from "lucide-react";

/* ─────────────────────────────────────────────
   FocusTimer — v3
   Countdown timer for the left sidebar.
   Default: 25:00. User can set any duration.

   Visual
   ──────
   Light glassmorphism card, soft blue/lavender
   gradient. Animated "neural pulse" SVG rings
   breathe outward while the timer is running.
   No dark background, no photography.

   Sound: YouTube IFrame Player API
   Track: "Eyes To The Sky" — High Neural Effect
          Grooves · 90 BPM (ID: n0nEhFAiorg)
   Audio only (hidden 1×1 iframe), looped.
   Sound is OFF by default. Volume slider shown
   only when sound is on.

   Controls
   ────────
   Start / Pause    — toggle countdown
   Reset            — back to the last-set duration
   Edit duration    — click the clock (when paused)
                       inline MM:SS inputs + Set
   Sound toggle     — OFF by default
   Volume slider    — 0–100
   ───────────────────────────────────────────── */

const DEFAULT_SECONDS = 25 * 60;
const YT_VIDEO_ID     = "n0nEhFAiorg"; // Eyes To The Sky — High Neural Effect Grooves

/* ── Helpers ──────────────────────────────── */

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ── YouTube postMessage helper ───────────── */

function ytCmd(iframe: HTMLIFrameElement, func: string, args?: (string | number)[]) {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args: args ?? [] }),
    "*",
  );
}

/* ── Component ────────────────────────────── */

export function FocusTimer() {
  const [total,     setTotal]     = useState(DEFAULT_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running,   setRunning]   = useState(false);
  const [soundOn,   setSoundOn]   = useState(false);
  const [volume,    setVolume]    = useState(35);

  const [editing,  setEditing]  = useState(false);
  const [editMins, setEditMins] = useState("25");
  const [editSecs, setEditSecs] = useState("00");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const minsRef   = useRef<HTMLInputElement>(null);

  // ── Tick ──────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // ── Sound ─────────────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (soundOn) {
      ytCmd(iframe, "playVideo");
      ytCmd(iframe, "setVolume", [volume]);
    } else {
      ytCmd(iframe, "pauseVideo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !soundOn) return;
    ytCmd(iframe, "setVolume", [volume]);
  }, [volume, soundOn]);

  // ── Handlers ──────────────────────────────
  const toggleRunning = useCallback(() => setRunning((r) => !r), []);

  const reset = useCallback(() => {
    setRemaining(total);
    setRunning(false);
    setEditing(false);
  }, [total]);

  const toggleSound = useCallback(() => setSoundOn((on) => !on), []);

  function openEdit() {
    if (running) return;
    setEditMins(String(Math.floor(total / 60)).padStart(2, "0"));
    setEditSecs(String(total % 60).padStart(2, "0"));
    setEditing(true);
    setTimeout(() => minsRef.current?.focus(), 0);
  }

  function commitEdit() {
    const m        = clamp(parseInt(editMins || "0", 10), 0, 99);
    const s        = clamp(parseInt(editSecs || "0", 10), 0, 59);
    const newTotal = m * 60 + s;
    const clamped  = newTotal < 60 ? 60 : newTotal;
    setTotal(clamped);
    setRemaining(clamped);
    setRunning(false);
    setEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter")  { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") { setEditing(false); }
  }

  // ── Derived ───────────────────────────────
  const progress      = total > 0 ? 1 - remaining / total : 0;
  const ringRadius    = 44;
  const circumference = 2 * Math.PI * ringRadius;
  const dash          = circumference * progress;
  const isDone        = remaining === 0;
  const canEdit       = !running;

  const ytSrc = `https://www.youtube-nocookie.com/embed/${YT_VIDEO_ID}?enablejsapi=1&autoplay=0&controls=0&loop=1&playlist=${YT_VIDEO_ID}&rel=0&modestbranding=1&iv_load_policy=3&fs=0`;

  return (
    <div
      className="rounded-[var(--radius-2xl)] flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(219,234,254,0.72) 0%, rgba(237,233,254,0.68) 55%, rgba(224,231,255,0.65) 100%)",
        border:     "1px solid rgba(148,187,255,0.35)",
        boxShadow:  "0 4px 24px 0 rgba(99,102,241,0.07), 0 1px 4px 0 rgba(99,102,241,0.05)",
      }}
    >
      {/* ── Scoped keyframe animations ── */}
      <style>{`
        @keyframes luma-pulse-ring {
          0%   { transform: scale(1);    opacity: 0.55; }
          60%  { transform: scale(1.22); opacity: 0.18; }
          100% { transform: scale(1.38); opacity: 0;    }
        }
        @keyframes luma-pulse-ring-2 {
          0%   { transform: scale(1);    opacity: 0.35; }
          60%  { transform: scale(1.18); opacity: 0.12; }
          100% { transform: scale(1.32); opacity: 0;    }
        }
        @keyframes luma-brain-dot {
          0%, 100% { opacity: 0.5;  r: 2.5; }
          50%      { opacity: 1.0;  r: 3.5; }
        }
        @keyframes luma-brain-arc {
          0%, 100% { stroke-opacity: 0.3; }
          50%      { stroke-opacity: 0.8; }
        }
        @media (prefers-reduced-motion: reduce) {
          .luma-pulse-ring, .luma-pulse-ring-2,
          .luma-brain-dot, .luma-brain-arc { animation: none !important; }
        }
      `}</style>

      {/* ── Hidden YouTube iframe ── */}
      <iframe
        ref={iframeRef}
        src={ytSrc}
        allow="autoplay"
        title="Eyes To The Sky — focus music"
        aria-hidden="true"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />

      {/* ── Top section: header + ring ── */}
      <div
        className="flex flex-col items-center px-4 pt-5 pb-4 gap-3"
        style={{ borderBottom: "1px solid rgba(148,187,255,0.22)" }}
      >

        {/* Header row */}
        <div className="w-full flex items-center justify-between">
          <p
            className="text-[var(--text-2xs)] font-bold uppercase"
            style={{ color: "rgba(99,102,241,0.7)", letterSpacing: "0.12em" }}
          >
            Focus Timer
          </p>
          {isDone && !editing && (
            <span
              className="text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded-[var(--radius-full)]"
              style={{ background: "rgba(99,102,241,0.12)", color: "rgb(99,102,241)" }}
            >
              Done ✓
            </span>
          )}
          {running && !isDone && (
            <span
              className="text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded-[var(--radius-full)]"
              style={{ background: "rgba(59,130,246,0.10)", color: "var(--luma-blue)" }}
            >
              Focusing…
            </span>
          )}
        </div>

        {/* ── Ring + animation ── */}
        <div className="relative flex items-center justify-center" style={{ width: 116, height: 116 }}>

          {/* Neural pulse rings — only animate while running */}
          {running && (
            <>
              <div
                className="luma-pulse-ring absolute rounded-full"
                style={{
                  width: 96, height: 96,
                  background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                  animation: "luma-pulse-ring 2.4s ease-out infinite",
                }}
              />
              <div
                className="luma-pulse-ring-2 absolute rounded-full"
                style={{
                  width: 96, height: 96,
                  background: "radial-gradient(circle, rgba(147,197,253,0.22) 0%, transparent 70%)",
                  animation: "luma-pulse-ring-2 2.4s ease-out infinite 1.2s",
                }}
              />
            </>
          )}

          {/* Progress ring SVG */}
          <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden="true">
            {/* Track */}
            <circle
              cx="58" cy="58" r={ringRadius}
              fill="none"
              stroke="rgba(148,187,255,0.22)"
              strokeWidth="5"
            />
            {/* Fill arc */}
            <circle
              cx="58" cy="58" r={ringRadius}
              fill="none"
              stroke={isDone
                ? "rgba(167,139,250,0.75)"
                : "url(#timerGradient)"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 58 58)"
              style={{ transition: "stroke-dasharray 1s linear" }}
            />
            {/* Gradient def */}
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="rgba(99,102,241,0.85)" />
                <stop offset="100%" stopColor="rgba(147,197,253,0.85)" />
              </linearGradient>
            </defs>

            {/* ── Subtle brain / neural SVG — visible while running ── */}
            {running && (
              <g transform="translate(58,58)">
                {/* Left hemisphere arc */}
                <path
                  d="M-9,-8 Q-18,-16 -12,-24 Q-4,-30 4,-24 Q10,-18 8,-10"
                  fill="none"
                  stroke="rgba(99,102,241,0.55)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  className="luma-brain-arc"
                  style={{ animation: "luma-brain-arc 2.2s ease-in-out infinite" }}
                />
                {/* Right hemisphere arc */}
                <path
                  d="M9,-8 Q18,-16 12,-24 Q4,-30 -4,-24 Q-10,-18 -8,-10"
                  fill="none"
                  stroke="rgba(147,197,253,0.65)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  className="luma-brain-arc"
                  style={{ animation: "luma-brain-arc 2.2s ease-in-out infinite 0.4s" }}
                />
                {/* Centre stem */}
                <line
                  x1="0" y1="-8" x2="0" y2="10"
                  stroke="rgba(99,102,241,0.35)"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                {/* Neural dots */}
                {[[-14,-6],[-6,-20],[6,-20],[14,-6],[0,10]].map(([cx,cy], i) => (
                  <circle
                    key={i}
                    cx={cx} cy={cy} r={2.5}
                    fill="rgba(99,102,241,0.50)"
                    className="luma-brain-dot"
                    style={{
                      animation: `luma-brain-dot 1.8s ease-in-out infinite ${i * 0.28}s`,
                    }}
                  />
                ))}
                {/* Connecting lines */}
                <line x1="-14" y1="-6"  x2="-6"  y2="-20" stroke="rgba(147,197,253,0.35)" strokeWidth="0.8" />
                <line x1="-6"  y1="-20" x2="6"   y2="-20" stroke="rgba(147,197,253,0.35)" strokeWidth="0.8" />
                <line x1="6"   y1="-20" x2="14"  y2="-6"  stroke="rgba(147,197,253,0.35)" strokeWidth="0.8" />
                <line x1="-14" y1="-6"  x2="0"   y2="10"  stroke="rgba(147,197,253,0.35)" strokeWidth="0.8" />
                <line x1="14"  y1="-6"  x2="0"   y2="10"  stroke="rgba(147,197,253,0.35)" strokeWidth="0.8" />
              </g>
            )}
          </svg>

          {/* Centre: clock or editor */}
          {editing ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              role="group"
              aria-label="Set timer duration"
            >
              <div className="flex items-center gap-0.5">
                <input
                  ref={minsRef}
                  type="number" min={0} max={99}
                  value={editMins}
                  onChange={(e) => setEditMins(e.target.value.slice(-2))}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEditKeyDown}
                  aria-label="Minutes"
                  className="w-8 text-center bg-transparent font-bold tabular-nums focus:outline-none border-b-2"
                  style={{ fontSize: "var(--text-lg)", color: "var(--luma-text-primary)", borderColor: "rgb(99,102,241)" }}
                />
                <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--luma-text-primary)", lineHeight: 1 }}>:</span>
                <input
                  type="number" min={0} max={59}
                  value={editSecs}
                  onChange={(e) => setEditSecs(e.target.value.slice(-2))}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEditKeyDown}
                  aria-label="Seconds"
                  className="w-8 text-center bg-transparent font-bold tabular-nums focus:outline-none border-b-2"
                  style={{ fontSize: "var(--text-lg)", color: "var(--luma-text-primary)", borderColor: "rgb(99,102,241)" }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openEdit}
              disabled={!canEdit}
              aria-label={canEdit ? "Edit timer duration" : "Pause timer to edit duration"}
              title={canEdit ? "Click to set duration" : undefined}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1
                rounded-full group focus-visible:outline focus-visible:outline-2
                focus-visible:outline-[var(--luma-blue)] disabled:cursor-default"
            >
              <span
                className="font-bold tabular-nums leading-none"
                style={{
                  fontSize:    "1.6rem",
                  color:       "var(--luma-text-primary)",
                  letterSpacing: "-0.02em",
                }}
                aria-live="off"
              >
                {fmt(remaining)}
              </span>
              {canEdit && !isDone && (
                <Pencil
                  size={9} strokeWidth={2}
                  aria-hidden="true"
                  className="opacity-0 group-hover:opacity-50 transition-opacity duration-100"
                  style={{ color: "rgb(99,102,241)" }}
                />
              )}
            </button>
          )}
        </div>

        {/* Hint under ring */}
        <p
          className="text-[var(--text-2xs)] transition-opacity duration-150"
          style={{
            color:         "rgba(99,102,241,0.45)",
            opacity:       editing || !canEdit || isDone ? 0 : 1,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          tap to set time
        </p>

        {/* Screen-reader live region */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {running
            ? `Focus timer: ${fmt(remaining)} remaining`
            : isDone
              ? "Focus session complete"
              : `Focus timer paused at ${fmt(remaining)}`}
        </span>
      </div>

      {/* ── Bottom section: controls + sound ── */}
      <div className="flex flex-col gap-3 px-4 py-4">

        {/* Start/Pause · Confirm · Reset */}
        <div className="flex items-center justify-center gap-2">
          {editing ? (
            <button
              type="button"
              onClick={commitEdit}
              aria-label="Confirm duration"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-full)]
                text-[var(--text-xs)] font-semibold transition-all duration-100
                hover:opacity-90 active:scale-[0.97]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
              style={{ background: "rgba(99,102,241,0.14)", color: "rgb(99,102,241)" }}
            >
              <Check size={12} strokeWidth={2.5} aria-hidden="true" />
              Set
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleRunning}
              disabled={isDone}
              aria-label={running ? "Pause timer" : "Start timer"}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-full)]
                text-[var(--text-xs)] font-semibold transition-all duration-100
                hover:opacity-90 active:scale-[0.97] disabled:opacity-40
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
              style={{
                background: running
                  ? "rgba(167,139,250,0.18)"
                  : "rgba(99,102,241,0.14)",
                color: running
                  ? "rgb(139,92,246)"
                  : "rgb(99,102,241)",
              }}
            >
              {running
                ? <Pause size={12} strokeWidth={2} aria-hidden="true" />
                : <Play  size={12} strokeWidth={2} aria-hidden="true" />}
              {running ? "Pause" : "Start"}
            </button>
          )}

          <button
            type="button"
            onClick={reset}
            aria-label={`Reset timer to ${fmt(total)}`}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-full)]
              transition-colors duration-100 hover:bg-[rgba(99,102,241,0.10)]
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
            style={{ color: "rgba(99,102,241,0.55)" }}
          >
            <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(148,187,255,0.25)" }} aria-hidden="true" />

        {/* Sound row */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[var(--text-2xs)] font-semibold"
                style={{ color: "rgba(99,102,241,0.70)" }}
              >
                Focus music
              </span>
              <span
                className="text-[var(--text-2xs)]"
                style={{ color: "rgba(99,102,241,0.40)" }}
              >
                Eyes To The Sky
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundOn}
              aria-label={soundOn ? "Turn music off" : "Turn music on"}
              onClick={toggleSound}
              className="luma-toggle-track focus-visible:outline focus-visible:outline-2
                focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-2"
              data-checked={soundOn ? "true" : "false"}
            >
              <span className="luma-toggle-thumb" />
            </button>
          </div>

          {soundOn && (
            <div className="flex items-center gap-2">
              <VolumeX size={11} strokeWidth={2} style={{ color: "rgba(99,102,241,0.45)", flexShrink: 0 }} aria-hidden="true" />
              <input
                type="range" min={0} max={100} step={5}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Music volume"
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "rgb(99,102,241)",
                  background:  `linear-gradient(to right, rgb(99,102,241) ${volume}%, rgba(148,187,255,0.30) ${volume}%)`,
                }}
              />
              <Volume2 size={11} strokeWidth={2} style={{ color: "rgba(99,102,241,0.45)", flexShrink: 0 }} aria-hidden="true" />
            </div>
          )}

          {!soundOn && (
            <p className="text-[var(--text-2xs)]" style={{ color: "rgba(99,102,241,0.35)" }}>
              Sound off · 90 BPM
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
