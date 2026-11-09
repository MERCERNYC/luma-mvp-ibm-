"use client";

/* ═══════════════════════════════════════════════════════════════
   /debug — Gmail Classification Debug View
   ───────────────────────────────────────────────────────────────
   DEVELOPMENT ONLY.
   Shows every normalised Gmail message alongside its agent
   classification result so you can diagnose misclassifications.

   Not linked from the main UI. Access at: /debug
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────────

interface DebugRow {
  // Input sent to agent
  id:           string;
  sender:       string;
  senderEmail:  string;
  subject:      string;
  preview:      string;
  bodyPreview:  string;
  receivedAt:   number;
  receivedDate: string;
  // Agent result
  priority:          "action-needed" | "for-later" | "news-updates";
  emailType:         string;
  requiresAction:    boolean;
  reason:            string;
  recommendedAction: string | null;
  confidence:        number;
}

interface DebugResponse {
  source: "gmail" | "not_connected";
  rows:   DebugRow[];
  error?: string;
}

// ── Priority colours ─────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  "action-needed": { bg: "#f3f0ff", color: "#7c3aed", label: "Action Needed" },
  "for-later":     { bg: "#fffbeb", color: "#b45309", label: "For Later"     },
  "news-updates":  { bg: "#eff6ff", color: "#1d4ed8", label: "News & Updates"},
};

function PriorityBadge({ value }: { value: string }) {
  const s = PRIORITY_STYLE[value] ?? { bg: "#f1f5f9", color: "#475569", label: value };
  return (
    <span
      style={{
        background:   s.bg,
        color:        s.color,
        padding:      "2px 8px",
        borderRadius: 99,
        fontSize:     11,
        fontWeight:   600,
        whiteSpace:   "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: "#57606a", minWidth: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ── Expandable cell ──────────────────────────────────────────────

function ExpandableText({ text, maxLen = 80 }: { text: string; maxLen?: number }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span style={{ color: "#aab" }}>—</span>;
  if (text.length <= maxLen) return <span style={{ fontSize: 12 }}>{text}</span>;
  return (
    <span style={{ fontSize: 12 }}>
      {open ? text : text.slice(0, maxLen) + "…"}
      {" "}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ fontSize: 11, color: "#3b7de8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        {open ? "less" : "more"}
      </button>
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────

export default function DebugPage() {
  const [data,    setData]    = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>("all");
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<keyof DebugRow>("receivedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/debug/gmail-classify")
      .then(r => r.json() as Promise<DebugResponse>)
      .then(setData)
      .catch(() => setData({ source: "not_connected", rows: [], error: "Fetch failed." }))
      .finally(() => setLoading(false));
  }, []);

  function reload() {
    setLoading(true);
    setData(null);
    fetch("/api/debug/gmail-classify")
      .then(r => r.json() as Promise<DebugResponse>)
      .then(setData)
      .catch(() => setData({ source: "not_connected", rows: [], error: "Fetch failed." }))
      .finally(() => setLoading(false));
  }

  function toggleSort(key: keyof DebugRow) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const rows = (data?.rows ?? [])
    .filter(r => filter === "all" || r.priority === filter)
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.sender.toLowerCase().includes(q)      ||
        r.senderEmail.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q)     ||
        r.reason.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  const counts = {
    action:  data?.rows.filter(r => r.priority === "action-needed").length ?? 0,
    later:   data?.rows.filter(r => r.priority === "for-later").length ?? 0,
    news:    data?.rows.filter(r => r.priority === "news-updates").length ?? 0,
    lowConf: data?.rows.filter(r => r.confidence < 0.6).length ?? 0,
  };

  // ── Column header ──────────────────────────────────────────────

  function Th({ k, label, width }: { k: keyof DebugRow; label: string; width?: number }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => toggleSort(k)}
        style={{
          padding:       "8px 10px",
          textAlign:     "left",
          fontSize:      11,
          fontWeight:    600,
          color:         active ? "#3b7de8" : "#57606a",
          background:    "#f7f8fa",
          borderBottom:  "2px solid #e5e7eb",
          whiteSpace:    "nowrap",
          cursor:        "pointer",
          userSelect:    "none",
          width:         width ?? "auto",
        }}
      >
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif", minHeight: "100dvh", background: "#f0f4f8", padding: "24px 20px" }}>

      {/* ── Header ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, border: "1px solid #fcd34d" }}>
                DEV ONLY
              </span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1f2328" }}>
                Gmail Classification Debug
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#57606a" }}>
              Normalised input → agent classification · not visible in production
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a
              href="/"
              style={{ fontSize: 12, color: "#57606a", textDecoration: "none", padding: "6px 12px", border: "1px solid #d0d7de", borderRadius: 6, background: "#fff" }}
            >
              ← Dashboard
            </a>
            <button
              type="button"
              onClick={reload}
              disabled={loading}
              style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#3b7de8", border: "none", borderRadius: 6, padding: "6px 14px", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Loading…" : "↻ Reload"}
            </button>
          </div>
        </div>

        {/* ── Status / error ── */}
        {loading && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "40px 24px", textAlign: "center", color: "#57606a", fontSize: 14 }}>
            Fetching Gmail inbox and running classification…
          </div>
        )}

        {!loading && data?.source === "not_connected" && (
          <div style={{ background: "#fff8f0", border: "1px solid #fcd34d", borderRadius: 10, padding: "20px 24px", color: "#92400e", fontSize: 13 }}>
            <strong>Gmail not connected.</strong> Connect Gmail from the dashboard first, then reload this page.
          </div>
        )}

        {!loading && data?.error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "16px 24px", color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
            Error: {data.error}
          </div>
        )}

        {!loading && data?.source === "gmail" && (
          <>
            {/* ── Summary stats ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Total",        value: data.rows.length,  color: "#1f2328", bg: "#fff"    },
                { label: "Action Needed", value: counts.action,     color: "#7c3aed", bg: "#f3f0ff" },
                { label: "For Later",    value: counts.later,      color: "#b45309", bg: "#fffbeb" },
                { label: "News",         value: counts.news,       color: "#1d4ed8", bg: "#eff6ff" },
                { label: "Low Confidence (<60%)", value: counts.lowConf, color: "#dc2626", bg: "#fff1f2" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", minWidth: 90 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#57606a", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Filters ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "all",            label: `All (${data.rows.length})` },
                  { key: "action-needed",  label: `Action (${counts.action})` },
                  { key: "for-later",      label: `Later (${counts.later})`   },
                  { key: "news-updates",   label: `News (${counts.news})`     },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: "5px 12px",
                      borderRadius: 20, cursor: "pointer",
                      background: filter === f.key ? "#3b7de8" : "#fff",
                      color:      filter === f.key ? "#fff"    : "#57606a",
                      border:     filter === f.key ? "1px solid #3b7de8" : "1px solid #d0d7de",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                placeholder="Search sender, subject, reason…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #d0d7de", borderRadius: 20, outline: "none", width: 260 }}
              />
              <span style={{ fontSize: 11, color: "#57606a", marginLeft: "auto" }}>
                {rows.length} of {data.rows.length} shown
              </span>
            </div>

            {/* ── Table ── */}
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: 12 }}>
                <thead>
                  <tr>
                    <Th k="receivedDate" label="Received" width={120} />
                    <Th k="sender"       label="Sender"   width={150} />
                    <Th k="subject"      label="Subject"  width={220} />
                    <Th k="priority"     label="Priority" width={130} />
                    <Th k="emailType"    label="Type"     width={110} />
                    <Th k="requiresAction" label="Action?" width={70} />
                    <Th k="confidence"   label="Confidence" width={100} />
                    <th style={{ padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#57606a", background: "#f7f8fa", borderBottom: "2px solid #e5e7eb" }}>
                      Reason / Recommended
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "32px 20px", textAlign: "center", color: "#57606a", fontSize: 13 }}>
                        No rows match the current filter.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, i) => {
                    const isExpanded = expanded === row.id;
                    const bg = i % 2 === 0 ? "#fff" : "#fafbfc";
                    const date = new Date(row.receivedAt);
                    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                    return (
                      <>
                        <tr
                          key={row.id}
                          style={{ background: bg, borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}
                          onClick={() => setExpanded(isExpanded ? null : row.id)}
                        >
                          {/* Received */}
                          <td style={{ padding: "10px 10px", whiteSpace: "nowrap", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 600, color: "#1f2328" }}>{dateStr}</div>
                            <div style={{ color: "#57606a" }}>{timeStr}</div>
                          </td>

                          {/* Sender */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 600, color: "#1f2328", maxWidth: 145, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.sender || "—"}</div>
                            <div style={{ color: "#57606a", maxWidth: 145, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.senderEmail}</div>
                          </td>

                          {/* Subject */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 500, color: "#1f2328", maxWidth: 215, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.subject}</div>
                            <div style={{ color: "#57606a", maxWidth: 215, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.preview}</div>
                          </td>

                          {/* Priority */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top" }}>
                            <PriorityBadge value={row.priority} />
                          </td>

                          {/* Type */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top", color: "#57606a" }}>
                            {row.emailType}
                          </td>

                          {/* Requires action */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top", textAlign: "center" }}>
                            <span style={{ fontSize: 14 }}>{row.requiresAction ? "✓" : "—"}</span>
                          </td>

                          {/* Confidence */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top" }}>
                            <ConfidenceBar value={row.confidence} />
                          </td>

                          {/* Reason / recommended */}
                          <td style={{ padding: "10px 10px", verticalAlign: "top", minWidth: 240 }}>
                            <ExpandableText text={row.reason} maxLen={100} />
                            {row.recommendedAction && (
                              <div style={{ marginTop: 4, color: "#7c3aed", fontSize: 11 }}>
                                → <ExpandableText text={row.recommendedAction} maxLen={80} />
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* ── Expanded detail row ── */}
                        {isExpanded && (
                          <tr key={`${row.id}-detail`} style={{ background: "#f0f4ff", borderBottom: "2px solid #c7d7ff" }}>
                            <td colSpan={8} style={{ padding: "16px 20px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                                {/* Input sent to agent */}
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#57606a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                                    Normalised input sent to agent
                                  </div>
                                  <table style={{ fontSize: 12, borderCollapse: "collapse", width: "100%" }}>
                                    {[
                                      ["id",           row.id],
                                      ["sender",       row.sender || "(empty)"],
                                      ["senderEmail",  row.senderEmail || "(empty)"],
                                      ["subject",      row.subject || "(empty)"],
                                      ["preview",      row.preview || "(empty)"],
                                      ["receivedDate", row.receivedDate],
                                    ].map(([k, v]) => (
                                      <tr key={k}>
                                        <td style={{ padding: "3px 8px 3px 0", color: "#57606a", fontWeight: 600, verticalAlign: "top", whiteSpace: "nowrap", width: 90 }}>{k}</td>
                                        <td style={{ padding: "3px 0", color: "#1f2328", wordBreak: "break-all" }}>{v}</td>
                                      </tr>
                                    ))}
                                    <tr>
                                      <td style={{ padding: "3px 8px 3px 0", color: "#57606a", fontWeight: 600, verticalAlign: "top" }}>body</td>
                                      <td style={{ padding: "3px 0", color: "#1f2328", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{row.bodyPreview}{row.bodyPreview.length === 400 ? "…" : ""}</td>
                                    </tr>
                                  </table>
                                </div>

                                {/* Agent result */}
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#57606a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                                    Agent classification result
                                  </div>
                                  <table style={{ fontSize: 12, borderCollapse: "collapse", width: "100%" }}>
                                    {[
                                      ["priority",          row.priority],
                                      ["emailType",         row.emailType],
                                      ["requiresAction",    String(row.requiresAction)],
                                      ["confidence",        `${Math.round(row.confidence * 100)}%`],
                                      ["reason",            row.reason || "(none)"],
                                      ["recommendedAction", row.recommendedAction ?? "(none)"],
                                    ].map(([k, v]) => (
                                      <tr key={k}>
                                        <td style={{ padding: "3px 8px 3px 0", color: "#57606a", fontWeight: 600, verticalAlign: "top", whiteSpace: "nowrap", width: 140 }}>{k}</td>
                                        <td style={{ padding: "3px 0", color: "#1f2328", wordBreak: "break-word" }}>{v}</td>
                                      </tr>
                                    ))}
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
