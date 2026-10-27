import {
  AlertCircle,
  Clock,
  Mail,
  Newspaper,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, Divider } from "@/components/ui";

/* ─────────────────────────────────────────────
   /design — LUMA Design System Preview
   Development reference only.
   ───────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <p
          className="text-[var(--text-xs)] font-semibold tracking-[var(--tracking-wider)] uppercase"
          style={{ color: "var(--luma-text-tertiary)" }}
        >
          {title}
        </p>
        <Divider className="mt-2" />
      </div>
      {children}
    </section>
  );
}

function Swatch({
  label,
  token,
  bg,
  textDark = false,
}: {
  label: string;
  token: string;
  bg: string;
  textDark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-12 rounded-[var(--radius-md)] border border-[var(--luma-glass-border)]"
        style={{ background: bg }}
      />
      <p
        className="text-[var(--text-xs)] font-medium leading-tight"
        style={{ color: "var(--luma-text-primary)" }}
      >
        {label}
      </p>
      <p
        className="text-[var(--text-2xs)] font-mono"
        style={{ color: "var(--luma-text-tertiary)" }}
      >
        {token}
      </p>
    </div>
  );
}

export default function DesignPage() {
  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ color: "var(--luma-text-primary)" }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-16">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-[var(--text-2xl)] font-semibold tracking-[var(--tracking-tight)]"
          >
            LUMA Design System
          </h1>
          <p
            className="text-[var(--text-base)]"
            style={{ color: "var(--luma-text-secondary)" }}
          >
            Token and component reference · v0.4
          </p>
        </div>

        {/* ── Background & Glass ── */}
        <Section title="Background & Glass">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div
                className="h-20 rounded-[var(--radius-xl)]"
                style={{ background: "var(--luma-bg-gradient)" }}
              />
              <p className="text-[var(--text-xs)] font-medium" style={{ color: "var(--luma-text-primary)" }}>Background</p>
              <p className="text-[var(--text-2xs)] font-mono" style={{ color: "var(--luma-text-tertiary)" }}>--luma-bg-gradient</p>
            </div>
            <div className="flex flex-col gap-2">
              <div
                className="glass h-20 rounded-[var(--radius-xl)]"
              />
              <p className="text-[var(--text-xs)] font-medium" style={{ color: "var(--luma-text-primary)" }}>Glass</p>
              <p className="text-[var(--text-2xs)] font-mono" style={{ color: "var(--luma-text-tertiary)" }}>--luma-glass</p>
            </div>
            <div className="flex flex-col gap-2">
              <div
                className="glass-raised h-20 rounded-[var(--radius-xl)]"
              />
              <p className="text-[var(--text-xs)] font-medium" style={{ color: "var(--luma-text-primary)" }}>Glass Raised</p>
              <p className="text-[var(--text-2xs)] font-mono" style={{ color: "var(--luma-text-tertiary)" }}>--luma-glass-raised</p>
            </div>
          </div>
        </Section>

        {/* ── Brand Colors ── */}
        <Section title="Brand Colors">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Swatch label="Blue" token="--luma-blue" bg="var(--luma-blue)" />
            <Swatch label="Blue Soft" token="--luma-blue-soft" bg="var(--luma-blue-soft)" />
            <Swatch label="Purple" token="--luma-purple" bg="var(--luma-purple)" />
            <Swatch label="Purple Soft" token="--luma-purple-soft" bg="var(--luma-purple-soft)" />
          </div>
        </Section>

        {/* ── Email Priority ── */}
        <Section title="Email Priority (Semantic)">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Swatch label="Urgent" token="--luma-urgent" bg="var(--luma-urgent)" />
            <Swatch label="Urgent Soft" token="--luma-urgent-soft" bg="var(--luma-urgent-soft)" />
            <Swatch label="Action" token="--luma-action" bg="var(--luma-action)" />
            <Swatch label="Action Soft" token="--luma-action-soft" bg="var(--luma-action-soft)" />
            <Swatch label="Later" token="--luma-later" bg="var(--luma-later)" />
            <Swatch label="Later Soft" token="--luma-later-soft" bg="var(--luma-later-soft)" />
            <Swatch label="News" token="--luma-news" bg="var(--luma-news)" />
            <Swatch label="News Soft" token="--luma-news-soft" bg="var(--luma-news-soft)" />
          </div>
        </Section>

        {/* ── Text ── */}
        <Section title="Text">
          <Card variant="glass" padding="md">
            <div className="flex flex-col gap-3">
              {[
                { label: "Primary", token: "--luma-text-primary", color: "var(--luma-text-primary)", note: "14.5:1 AAA" },
                { label: "Secondary", token: "--luma-text-secondary", color: "var(--luma-text-secondary)", note: "7.2:1 AA" },
                { label: "Tertiary", token: "--luma-text-tertiary", color: "var(--luma-text-tertiary)", note: "4.6:1 AA large" },
                { label: "Disabled", token: "--luma-text-disabled", color: "var(--luma-text-disabled)", note: "decorative only" },
              ].map(({ label, token, color, note }) => (
                <div key={token} className="flex items-baseline justify-between">
                  <span
                    className="text-[var(--text-base)] font-medium"
                    style={{ color }}
                  >
                    {label} — The quick brown fox
                  </span>
                  <span
                    className="text-[var(--text-2xs)] font-mono ml-4 shrink-0"
                    style={{ color: "var(--luma-text-tertiary)" }}
                  >
                    {note}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── Typography ── */}
        <Section title="Typography Scale">
          <Card variant="glass" padding="md">
            <div className="flex flex-col gap-4">
              {[
                { label: "3xl — 36px", size: "var(--text-3xl)", weight: "600", tracking: "var(--tracking-tight)" },
                { label: "2xl — 28px", size: "var(--text-2xl)", weight: "600", tracking: "var(--tracking-tight)" },
                { label: "xl — 22px",  size: "var(--text-xl)",  weight: "600", tracking: "var(--tracking-snug)" },
                { label: "lg — 18px",  size: "var(--text-lg)",  weight: "500", tracking: "var(--tracking-normal)" },
                { label: "base — 15px",size: "var(--text-base)",weight: "400", tracking: "var(--tracking-normal)" },
                { label: "sm — 13px",  size: "var(--text-sm)",  weight: "400", tracking: "var(--tracking-normal)" },
                { label: "xs — 12px",  size: "var(--text-xs)",  weight: "500", tracking: "var(--tracking-wide)" },
              ].map(({ label, size, weight, tracking }) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <span style={{ fontSize: size, fontWeight: weight, letterSpacing: tracking, color: "var(--luma-text-primary)" }}>
                    LUMA
                  </span>
                  <span
                    className="text-[var(--text-2xs)] font-mono shrink-0"
                    style={{ color: "var(--luma-text-tertiary)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button disabled>Disabled</Button>
              <Button variant="primary">
                <Mail size={16} strokeWidth={1.5} />
                With icon
              </Button>
            </div>
          </div>
        </Section>

        {/* ── Badges ── */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="blue">Blue</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="urgent">
              <AlertCircle size={10} strokeWidth={2} />
              Urgent
            </Badge>
            <Badge variant="action">
              <Zap size={10} strokeWidth={2} />
              Action
            </Badge>
            <Badge variant="later">
              <Clock size={10} strokeWidth={2} />
              Later
            </Badge>
            <Badge variant="news">
              <Newspaper size={10} strokeWidth={2} />
              News
            </Badge>
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Cards">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["flat", "glass", "raised"] as const).map((v) => (
              <Card key={v} variant={v} padding="md">
                <p
                  className="text-[var(--text-sm)] font-semibold mb-1"
                  style={{ color: "var(--luma-text-primary)" }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </p>
                <p
                  className="text-[var(--text-xs)]"
                  style={{ color: "var(--luma-text-secondary)" }}
                >
                  Card variant="{v}"
                </p>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── Icons ── */}
        <Section title="Icons (lucide-react)">
          <Card variant="glass" padding="md">
            <div className="flex gap-6 flex-wrap items-center">
              {[Mail, AlertCircle, Clock, Newspaper, Zap].map((Icon, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    style={{ color: "var(--luma-text-secondary)" }}
                  />
                  <span
                    className="text-[var(--text-2xs)] font-mono"
                    style={{ color: "var(--luma-text-tertiary)" }}
                  >
                    20px 1.5
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── Radius ── */}
        <Section title="Border Radius">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {[
              { label: "xs", token: "--radius-xs", r: "var(--radius-xs)" },
              { label: "sm", token: "--radius-sm", r: "var(--radius-sm)" },
              { label: "md", token: "--radius-md", r: "var(--radius-md)" },
              { label: "lg", token: "--radius-lg", r: "var(--radius-lg)" },
              { label: "xl", token: "--radius-xl", r: "var(--radius-xl)" },
              { label: "full", token: "--radius-full", r: "var(--radius-full)" },
            ].map(({ label, token, r }) => (
              <div key={token} className="flex flex-col gap-2 items-center">
                <div
                  className="w-12 h-12 border-2 border-[var(--luma-blue)]"
                  style={{ borderRadius: r, background: "var(--luma-blue-soft)" }}
                />
                <p className="text-[var(--text-2xs)] font-mono text-center" style={{ color: "var(--luma-text-tertiary)" }}>{label}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
