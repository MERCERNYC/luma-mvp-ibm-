import {
  ArrowLeft,
  Archive,
  Trash2,
  Clock,
  Folder,
  MoreHorizontal,
  Star,
  Paperclip,
  Download,
  Send,
  Bold,
  Italic,
  List,
  Link2,
  Smile,
} from "lucide-react";
import type { Task } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   EmailPane
   The right-side email reading panel.
   Matches the reference image:
   — Toolbar: back / archive / trash / snooze / folder / more
   — Sender avatar + name + email + time + star
   — Subject (large, bold)
   — Body text
   — Attachment chip (optional)
   — Reply box with formatting toolbar + Send

   Static — no real sending or navigation.
   ───────────────────────────────────────────── */

const AVATAR_BG: Record<Task["avatarColor"], string> = {
  blue:   "rgba(37,99,235,0.12)",
  purple: "rgba(124,58,237,0.12)",
  green:  "rgba(22,163,74,0.12)",
  orange: "rgba(234,88,12,0.12)",
};

const AVATAR_COLOR: Record<Task["avatarColor"], string> = {
  blue:   "var(--luma-blue)",
  purple: "var(--luma-purple)",
  green:  "var(--luma-later)",
  orange: "#ea580c",
};

interface EmailPaneProps {
  task: Task;
  onClose: () => void;
}

function ToolbarBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)]
        hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
      style={{ color: "var(--luma-text-secondary)" }}
    >
      {children}
    </button>
  );
}

export function EmailPane({ task, onClose }: EmailPaneProps) {
  const bodyParagraphs = task.body.split("\n\n");

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-1 px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--luma-glass-border)" }}
      >
        <ToolbarBtn label="Back"><ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <div className="w-px h-5 mx-1" style={{ background: "var(--luma-glass-border)" }} aria-hidden="true" />
        <ToolbarBtn label="Archive"><Archive  size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="Delete" ><Trash2   size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="Snooze" ><Clock    size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="Move"   ><Folder   size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="More"   ><MoreHorizontal size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
      </div>

      {/* ── Email content — scrollable ── */}
      <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">

        {/* Sender row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center
                text-[var(--text-sm)] font-bold select-none"
              style={{
                background: AVATAR_BG[task.avatarColor],
                color: AVATAR_COLOR[task.avatarColor],
              }}
              aria-hidden="true"
            >
              {task.senderInitial}
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[var(--text-sm)] font-bold"
                style={{ color: "var(--luma-text-primary)" }}
              >
                {task.sender}
              </span>
              <span
                className="text-[var(--text-xs)]"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {task.senderEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[var(--text-xs)] tabular-nums"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              {task.time}
            </span>
            <button
              type="button"
              aria-label="Star email"
              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)]
                hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              <Star size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Subject */}
        <h1
          className="text-[var(--text-xl)] font-bold leading-snug"
          style={{ color: "var(--luma-text-primary)" }}
        >
          {task.subject}
        </h1>

        {/* Body */}
        <div className="flex flex-col gap-3">
          {bodyParagraphs.map((para, i) => (
            <p
              key={i}
              className="text-[var(--text-sm)] leading-[var(--leading-relaxed)]"
              style={{ color: "var(--luma-text-primary)" }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Attachment chip */}
        {task.attachment && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)]"
            style={{
              background: "var(--luma-blue-soft)",
              border: "1px solid var(--luma-glass-border)",
            }}
          >
            <div
              className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{ background: "rgba(37,99,235,0.12)", color: "var(--luma-blue)" }}
              aria-hidden="true"
            >
              <Paperclip size={16} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span
                className="text-[var(--text-xs)] font-semibold truncate"
                style={{ color: "var(--luma-text-primary)" }}
              >
                {task.attachment.name}
              </span>
              <span
                className="text-[var(--text-2xs)]"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {task.attachment.meta}
              </span>
            </div>
            <button
              type="button"
              aria-label="Download attachment"
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)]
                hover:bg-[rgba(37,99,235,0.10)] transition-colors duration-100"
              style={{ color: "var(--luma-blue)" }}
            >
              <Download size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Reply box */}
        <div
          className="rounded-[var(--radius-xl)] overflow-hidden mt-2"
          style={{
            border: "1px solid var(--luma-glass-border)",
            background: "var(--luma-glass-raised)",
          }}
        >
          <div
            className="px-4 py-3 text-[var(--text-sm)]"
            style={{ color: "var(--luma-text-tertiary)", minHeight: "56px" }}
            role="textbox"
            aria-label="Write a reply"
            aria-multiline="true"
          >
            Write a reply…
          </div>

          {/* Formatting toolbar + Send */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderTop: "1px solid var(--luma-glass-border)" }}
          >
            <div className="flex items-center gap-1" style={{ color: "var(--luma-text-tertiary)" }}>
              <ToolbarBtn label="Attachment"><Paperclip size={15} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
              <ToolbarBtn label="Bold"><Bold      size={15} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
              <ToolbarBtn label="Italic"><Italic    size={15} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
              <ToolbarBtn label="List"><List      size={15} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
              <ToolbarBtn label="Link"><Link2     size={15} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
              <ToolbarBtn label="Emoji"><Smile     size={15} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
                text-[var(--text-sm)] font-semibold text-white transition-all duration-100
                hover:opacity-90 active:scale-[0.98]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
              style={{ background: "var(--luma-blue)" }}
            >
              <Send size={14} strokeWidth={1.5} aria-hidden="true" />
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
