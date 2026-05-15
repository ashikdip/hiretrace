import { useState, useEffect, useRef } from "react";

// ── PDF Utilities ──────────────────────────────────────────────
const generateIndividualRecordPDF = (d, reviewerDecision = "", reviewerNotes = "") => {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const statusColor = d.status === "flagged" ? "#C9372C" : d.status === "review" ? "#D97706" : "#1D9E75";
  const statusLabel = d.status === "flagged" ? "Flagged" : d.status === "review" ? "In review" : "Clear";
  const biasRows = d.biasFlags.length > 0
    ? d.biasFlags.map(f => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#C9372C;">⚠ ${f}</td></tr>`).join("")
    : `<tr><td style="padding:6px 10px;font-size:12px;color:#1D9E75;">✓ No bias indicators detected</td></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>HireTrace Decision Record ${d.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Geist', sans-serif; color: #111110; background: #fff; padding: 0; }
  .cover { background: #111110; color: #fff; padding: 32px 40px 28px; }
  .cover-label { font-size: 11px; opacity: 0.4; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }
  .cover-title { font-size: 22px; font-weight: 500; margin-bottom: 6px; }
  .cover-meta { font-size: 11px; opacity: 0.5; font-family: 'Geist Mono', monospace; }
  .body { padding: 32px 40px; }
  .section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #E2E1DC; }
  .section:last-child { border-bottom: none; margin-bottom: 0; }
  .section-label { font-size: 9px; font-weight: 600; color: #A8A8A4; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field-label { font-size: 10px; color: #A8A8A4; margin-bottom: 4px; }
  .field-value { font-size: 13px; color: #111110; }
  .mono { font-family: 'Geist Mono', monospace; }
  .justification { background: #F5F4F1; border-left: 2px solid #C9372C; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 13px; color: #6B6B67; line-height: 1.6; font-style: italic; }
  .reviewer-box { background: #F5F4F1; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #6B6B67; line-height: 1.6; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .sig-box { border: 1px solid #E2E1DC; border-radius: 8px; padding: 14px 16px; }
  .sig-label { font-size: 10px; color: #A8A8A4; margin-bottom: 10px; }
  .sig-line { border-bottom: 1px solid #E2E1DC; height: 32px; margin-bottom: 8px; }
  .sig-name { font-size: 12px; color: #6B6B67; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; background: ${d.status === "flagged" ? "#FFECEB" : d.status === "review" ? "#FFF8E6" : "#E1F5EE"}; color: ${statusColor}; }
  .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #E2E1DC; font-size: 10px; color: #A8A8A4; font-family: 'Geist Mono', monospace; display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>
<div class="cover">
  <div class="cover-label">HireTrace · Individual Decision Record</div>
  <div class="cover-title">${d.role} · ${d.id}</div>
  <div class="cover-meta">${d.stage} · ${d.date} · Logged by ${d.loggedBy} · Generated: ${today}</div>
</div>
<div class="body">
  <div class="section">
    <div class="section-label">Decision details</div>
    <div class="grid2">
      <div><div class="field-label">Candidate ID</div><div class="field-value mono">${d.id}</div></div>
      <div><div class="field-label">Role</div><div class="field-value">${d.role}</div></div>
      <div><div class="field-label">Hiring stage</div><div class="field-value">${d.stage}</div></div>
      <div><div class="field-label">Decision date</div><div class="field-value">${d.date}</div></div>
      <div><div class="field-label">Primary reason</div><div class="field-value">${d.reason}</div></div>
      <div><div class="field-label">Status</div><div class="field-value"><span class="status-badge">${statusLabel}</span></div></div>
      <div><div class="field-label">AI system used</div><div class="field-value">${d.ai ? (d.aiSystem || "Yes") : "No"}</div></div>
      <div><div class="field-label">Risk score</div><div class="field-value" style="color:${statusColor};font-weight:500;">${d.riskScore} / 100</div></div>
      ${d.override ? `<div style="grid-column:1/-1"><div class="field-label">AI override</div><div class="field-value" style="color:#C9372C;">Yes — manager rejected despite AI advance recommendation</div></div>` : ""}
    </div>
  </div>
  <div class="section">
    <div class="section-label">Rejection justification</div>
    <div class="justification">${d.justification}</div>
  </div>
  <div class="section">
    <div class="section-label">Bias analysis (Claude API)</div>
    <table><tbody>${biasRows}</tbody></table>
  </div>
  ${reviewerDecision || reviewerNotes ? `
  <div class="section">
    <div class="section-label">HR reviewer decision</div>
    ${reviewerDecision ? `<div class="reviewer-box" style="margin-bottom:10px;"><strong>${reviewerDecision}</strong></div>` : ""}
    ${reviewerNotes ? `<div class="reviewer-box">${reviewerNotes}</div>` : ""}
  </div>` : ""}
  <div class="section">
    <div class="section-label">Officer declaration</div>
    <div style="font-size:12px;color:#6B6B67;line-height:1.7;margin-bottom:16px;">I confirm that this hiring decision was conducted in accordance with applicable EU AI Act obligations and Finnish non-discrimination law (Yhdenvertaisuuslaki 1325/2014). All bias indicators have been reviewed. This record forms part of the organisation's audit trail under Article 13 and Annex III.</div>
    <div class="sig-grid">
      <div class="sig-box"><div class="sig-label">HR responsible officer</div><div class="sig-line"></div><div class="sig-name">Mia Virtanen, HR Manager · Acme Oy</div></div>
      <div class="sig-box"><div class="sig-label">Date signed</div><div class="sig-line"></div><div class="sig-name">${today}</div></div>
    </div>
  </div>
  <div class="footer"><span>HireTrace v1.0 · Confidential compliance record</span><span>Ref: ${d.id} · ${today}</span></div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HireTrace_Record_${d.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Design tokens ──────────────────────────────────────────────
const T = {
  black: "#111110",
  white: "#FFFFFF",
  offwhite: "#F5F4F1",
  border: "#E2E1DC",
  borderLight: "#EBEBЕ7",
  textPrimary: "#111110",
  textSecondary: "#6B6B67",
  textTertiary: "#A8A8A4",
  red: "#C9372C",
  redBg: "#FFECEB",
  redText: "#8C1B13",
  amber: "#D97706",
  amberBg: "#FFF8E6",
  amberText: "#7A4100",
  green: "#1D9E75",
  greenBg: "#E1F5EE",
  greenText: "#085041",
  cardBg: "#FFFFFF",
  pageBg: "#F5F4F1",
  accent: "#2563EB",
  accentBg: "#EFF6FF",
  accentText: "#1E3A8A",
  sidebarBg: "#18181B",
  sidebarText: "#E4E4E7",
  sidebarMuted: "#71717A",
  sidebarHover: "#27272A",
  sidebarActive: "#3F3F46",
  sidebarBorder: "#27272A",
};

// ── Global styles ──────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Geist', sans-serif; background: ${T.pageBg}; color: ${T.textPrimary}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  select, input, textarea, button { font-family: 'Geist', sans-serif; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes progressFill { from { width: 0%; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
  .fade-in { animation: fadeIn 0.25s ease forwards; }
`;

// ── Shared components ──────────────────────────────────────────
const Pill = ({ color = "gray", children, style }) => {
  const colors = {
    red: { bg: T.redBg, text: T.redText },
    amber: { bg: T.amberBg, text: T.amberText },
    green: { bg: T.greenBg, text: T.greenText },
    gray: { bg: T.offwhite, text: T.textSecondary },
    blue: { bg: T.accentBg, text: T.accentText },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: "0.01em", background: c.bg, color: c.text, ...style }}>
      {children}
    </span>
  );
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, primary, danger, success, ghost, onClick, disabled, style }) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${T.border}`, fontFamily: "'Geist', sans-serif", transition: "all 0.12s", opacity: disabled ? 0.45 : 1, letterSpacing: "-0.01em", ...style };
  if (primary) return <button onClick={onClick} disabled={disabled} style={{ ...base, background: T.black, color: T.white, border: `1px solid ${T.black}` }}>{children}</button>;
  if (danger) return <button onClick={onClick} disabled={disabled} style={{ ...base, background: T.red, color: T.white, border: `1px solid ${T.red}` }}>{children}</button>;
  if (success) return <button onClick={onClick} disabled={disabled} style={{ ...base, background: T.green, color: T.white, border: `1px solid ${T.green}` }}>{children}</button>;
  if (ghost) return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "none", border: "none", color: T.textSecondary, padding: "7px 10px" }}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: T.white, color: T.textPrimary }}>{children}</button>;
};

const Input = ({ value, onChange, placeholder, type = "text", style, defaultValue }) => (
  <input type={type} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder}
    style={{ width: "100%", padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, background: T.white, color: T.textPrimary, outline: "none", transition: "border-color 0.12s", ...style }} />
);

const Select = ({ value, onChange, children, style }) => (
  <select value={value} onChange={onChange}
    style={{ width: "100%", padding: "8px 30px 8px 12px", border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, background: T.white, color: T.textPrimary, outline: "none", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", ...style }}>
    {children}
  </select>
);

const FieldLabel = ({ children, required }) => (
  <div style={{ fontSize: 12, fontWeight: 500, color: T.textSecondary, marginBottom: 5, letterSpacing: "0.01em" }}>
    {children}{required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 600, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{children}</div>
);

// ── Sample data ────────────────────────────────────────────────
const SAMPLE_DECISIONS = [
  { id: "C-0041", role: "HR Specialist", stage: "CV screening", date: "2026-05-12", reason: "Qualification gap", ai: false, justification: "Candidate lacked the required HRIS experience and held no relevant certification. Decision aligned with minimum qualification threshold.", status: "clear", riskScore: 12, biasFlags: [], loggedBy: "M. Virtanen" },
  { id: "C-0040", role: "Data Analyst", stage: "First interview", date: "2026-05-12", reason: "Culture fit", ai: true, aiSystem: "Teamtailor AI", aiRec: "Advance", override: true, justification: "Candidate doesn't fit our team dynamic and comes from the wrong university background for our culture.", status: "flagged", riskScore: 72, biasFlags: ["Institution bias", "Cultural proxy"], loggedBy: "M. Virtanen" },
  { id: "C-0039", role: "Software Engineer", stage: "Second interview", date: "2026-05-10", reason: "Overqualified", ai: true, aiSystem: "Recruitee Score", aiRec: "Advance", override: true, justification: "Candidate has 12 years of experience for a junior role. Concerned they would leave quickly once a senior position opens elsewhere.", status: "review", riskScore: 41, biasFlags: ["Age proxy (possible)"], loggedBy: "J. Korhonen" },
  { id: "C-0038", role: "Sales Lead", stage: "CV screening", date: "2026-05-09", reason: "Portfolio insufficient", ai: false, justification: "Portfolio did not demonstrate B2B SaaS sales experience required for the role. No relevant case studies presented.", status: "clear", riskScore: 8, biasFlags: [], loggedBy: "M. Virtanen" },
  { id: "C-0037", role: "Marketing Manager", stage: "First interview", date: "2026-05-11", reason: "Culture fit", ai: true, aiSystem: "Teamtailor AI", aiRec: "Reject", override: false, justification: "Candidate's accent was difficult to understand in the interview and their presentation style felt too formal for our informal culture.", status: "flagged", riskScore: 68, biasFlags: ["National origin proxy", "Cultural proxy"], loggedBy: "M. Virtanen" },
  { id: "C-0033", role: "UX Designer", stage: "Second interview", date: "2026-05-08", reason: "Culture fit", ai: false, justification: "Candidate seemed set in their ways and unlikely to adapt to our fast-moving startup environment. Looking for someone more energetic.", status: "review", riskScore: 41, biasFlags: ["Age proxy (possible)"], loggedBy: "J. Korhonen" },
];

const ESCALATION_DECISIONS = SAMPLE_DECISIONS.filter(d => d.status === "flagged" || d.status === "review");

// ── Sidebar ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "log", label: "Log decision", icon: "＋" },
  { id: "auditlog", label: "Audit log", icon: "≡" },
  { id: "escalation", label: "Escalation queue", icon: "⚠", badge: true },
  { id: "report", label: "Generate report", icon: "↓" },
  { id: "import", label: "Import CSV", icon: "↑" },
];

function Sidebar({ active, setActive, escalationCount }) {
  return (
    <aside style={{ width: 228, flexShrink: 0, background: T.sidebarBg, borderRight: `1px solid ${T.sidebarBorder}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "22px 18px 16px", borderBottom: `1px solid ${T.sidebarBorder}` }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 19, fontWeight: 400, color: T.white, letterSpacing: "-0.2px" }}>
          HireTrace<span style={{ color: T.red }}>.</span>
        </div>
        <div style={{ fontSize: 11, color: T.sidebarMuted, marginTop: 3, letterSpacing: "0.02em" }}>Compliance workspace</div>
      </div>
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: T.sidebarMuted, padding: "8px 10px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Main</div>
        {NAV_ITEMS.slice(0, 4).map(item => (
          <div key={item.id} onClick={() => setActive(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, marginBottom: 1, background: active === item.id ? T.sidebarActive : "transparent", color: active === item.id ? T.white : T.sidebarText, fontWeight: active === item.id ? 500 : 400, transition: "all 0.1s", letterSpacing: "-0.01em" }}>
            <span style={{ fontSize: 13, width: 16, textAlign: "center", opacity: active === item.id ? 1 : 0.6 }}>{item.icon}</span>
            {item.label}
            {item.badge && escalationCount > 0 && (
              <span style={{ marginLeft: "auto", background: T.red, color: T.white, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4 }}>{escalationCount}</span>
            )}
          </div>
        ))}
        <div style={{ fontSize: 9, fontWeight: 600, color: T.sidebarMuted, padding: "14px 10px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Reports</div>
        {NAV_ITEMS.slice(4).map(item => (
          <div key={item.id} onClick={() => setActive(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, marginBottom: 1, background: active === item.id ? T.sidebarActive : "transparent", color: active === item.id ? T.white : T.sidebarText, fontWeight: active === item.id ? 500 : 400, transition: "all 0.1s", letterSpacing: "-0.01em" }}>
            <span style={{ fontSize: 13, width: 16, textAlign: "center", opacity: active === item.id ? 1 : 0.6 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.sidebarBorder}` }}>
        <div style={{ fontSize: 10, color: T.sidebarMuted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>HireTrace</div>
        <div style={{ fontSize: 12, color: T.sidebarMuted, letterSpacing: "-0.01em", fontFamily: "'Geist Mono', monospace" }}>v1.0</div>
      </div>
    </aside>
  );
}


// ── Dashboard ──────────────────────────────────────────────────
function Dashboard({ decisions, setActive }) {
  const total = decisions.length;
  const flagged = decisions.filter(d => d.status === "flagged").length;
  const escalations = decisions.filter(d => d.status === "flagged" || d.status === "review").length;
  const clear = decisions.filter(d => d.status === "clear").length;
  const readiness = Math.round((clear / total) * 100);

  const biasTypes = {};
  decisions.forEach(d => d.biasFlags.forEach(f => { biasTypes[f] = (biasTypes[f] || 0) + 1; }));

  const statCards = [
    { label: "Total decisions", value: total, sub: "+8 vs last month", subColor: T.green },
    { label: "Flagged (bias risk)", value: flagged, sub: `${Math.round((flagged / total) * 100)}% flag rate`, subColor: T.red, valueColor: T.red },
    { label: "Escalations pending", value: escalations, sub: "Awaiting HR review", subColor: T.amber, valueColor: T.amber },
    { label: "Audit readiness", value: `${readiness}%`, sub: `${total - clear} items need attention`, subColor: T.amber, valueColor: readiness > 80 ? T.green : T.amber },
  ];

  const checklist = [
    { done: true, text: "Decision logging active", sub: "All rejections timestamped" },
    { done: true, text: "Bias analysis on file", sub: "Claude API attached to each record" },
    { done: escalations === 0, warn: escalations > 0, text: escalations > 0 ? `${escalations} escalations unresolved` : "Escalation workflow clear", sub: escalations > 0 ? "Review required before audit" : "All flagged decisions reviewed" },
    { done: false, warn: true, text: "Audit report not generated", sub: "Required for Article 13 documentation" },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px", lineHeight: 1.2 }}>Hiring compliance overview</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>Turku HQ · {total} decisions logged this period</div>
        </div>
        <Btn primary onClick={() => setActive("log")}>＋ Log decision</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, color: s.valueColor || T.textPrimary, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.subColor || T.textSecondary, marginTop: 5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 14 }}>
        <Card style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Recent decisions</div>
            <span onClick={() => setActive("auditlog")} style={{ fontSize: 12, color: T.textSecondary, cursor: "pointer" }}>View all →</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>{["ID", "Role", "Reason", "AI used", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 500, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.4px", paddingBottom: 8, borderBottom: `0.5px solid ${T.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {decisions.slice(0, 5).map((d, i) => (
                <tr key={i}>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${T.borderLight}`, fontFamily: "'Geist Mono', monospace", fontSize: 12, color: T.textSecondary }}>{d.id}</td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${T.borderLight}` }}>{d.role}</td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${T.borderLight}`, color: T.textSecondary, fontSize: 12 }}>{d.reason}</td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${T.borderLight}` }}><Pill color={d.ai ? "amber" : "gray"}>{d.ai ? "Yes" : "No"}</Pill></td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${T.borderLight}` }}>
                    <Pill color={d.status === "clear" ? "green" : d.status === "flagged" ? "red" : "amber"}>
                      {d.status === "clear" ? "✓ Clear" : d.status === "flagged" ? "⚠ Flagged" : "↻ Review"}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Bias breakdown</div>
            {Object.entries(biasTypes).length === 0 ? (
              <div style={{ fontSize: 13, color: T.textSecondary }}>No bias flags detected.</div>
            ) : Object.entries(biasTypes).map(([type, count], i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, marginBottom: 3 }}>
                  <span>{type}</span><span style={{ fontWeight: 500, color: T.textPrimary }}>{count}</span>
                </div>
                <div style={{ height: 4, background: T.offwhite, borderRadius: 4 }}>
                  <div style={{ height: "100%", background: T.red, borderRadius: 4, width: `${(count / flagged) * 100}%` }} />
                </div>
              </div>
            ))}
          </Card>

          <Card style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Escalation queue</div>
              <span style={{ fontSize: 11, color: T.red, fontWeight: 500 }}>{escalations} pending</span>
            </div>
            {ESCALATION_DECISIONS.slice(0, 3).map((d, i) => (
              <div key={i} style={{ padding: "9px 0", borderBottom: i < 2 ? `0.5px solid ${T.borderLight}` : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.id} · {d.role}</div>
                <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>Logged by {d.loggedBy}</div>
                <div style={{ marginTop: 4 }}>{d.biasFlags.map((f, j) => <Pill key={j} color="red" style={{ marginRight: 4, fontSize: 10 }}>{f}</Pill>)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>EU AI Act compliance checklist</div>
          <span onClick={() => setActive("report")} style={{ fontSize: 12, color: T.textSecondary, cursor: "pointer" }}>Generate report →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{ fontSize: 16, flexShrink: 0, color: item.done ? T.green : item.warn ? T.amber : T.red }}>
                {item.done ? "✓" : item.warn ? "⚠" : "✗"}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.text}</div>
                <div style={{ fontSize: 12, color: T.textSecondary }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Log Decision ───────────────────────────────────────────────
const REASON_CHIPS = ["Qualification gap", "Experience level", "Technical skills", "Salary mismatch", "Culture fit", "Overqualified", "Role filled internally", "Communication skills", "Portfolio insufficient", "Other"];

function LogDecision({ onSubmit }) {
  const [form, setForm] = useState({ candidateId: "", role: "", stage: "", date: "", ai: false, aiSystem: "", aiRec: "", override: "", reasons: [], justification: "" });
  const [analysisState, setAnalysisState] = useState("idle"); // idle | analyzing | done
  const [submitted, setSubmitted] = useState(false);
  const analysisTimer = useRef(null);

  const wordCount = form.justification.trim().split(/\s+/).filter(w => w).length;

  const handleText = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, justification: val }));
    const wc = val.trim().split(/\s+/).filter(w => w).length;
    if (wc < 8) { setAnalysisState("idle"); return; }
    if (analysisState === "done") return;
    clearTimeout(analysisTimer.current);
    setAnalysisState("analyzing");
    analysisTimer.current = setTimeout(() => setAnalysisState("done"), 2000);
  };

  const toggleReason = (r) => setForm(f => ({ ...f, reasons: f.reasons.includes(r) ? f.reasons.filter(x => x !== r) : [...f.reasons, r] }));

  const handleSubmit = () => {
    const newDecision = {
      id: `C-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      role: form.role || "Unknown role",
      stage: form.stage || "CV screening",
      date: form.date || new Date().toISOString().split("T")[0],
      reason: form.reasons[0] || "Other",
      ai: form.ai,
      aiSystem: form.aiSystem,
      justification: form.justification,
      status: analysisState === "done" ? "flagged" : "clear",
      riskScore: analysisState === "done" ? 72 : 8,
      biasFlags: analysisState === "done" ? ["Institution bias", "Cultural proxy"] : [],
      loggedBy: "M. Virtanen",
    };
    onSubmit(newDecision);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 12 }}>
      <div style={{ fontSize: 40, color: T.green }}>✓</div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20 }}>Decision logged</div>
      <div style={{ fontSize: 13, color: T.textSecondary }}>The record has been added to the audit log.</div>
      <Btn onClick={() => setSubmitted(false)} primary style={{ marginTop: 8 }}>Log another</Btn>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px" }}>Log a rejection decision</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>Fields marked <span style={{ color: T.red }}>*</span> are required for EU AI Act compliance.</div>
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>👤 Candidate details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><FieldLabel required>Candidate ID</FieldLabel><Input value={form.candidateId} onChange={e => setForm(f => ({ ...f, candidateId: e.target.value }))} placeholder="e.g. C-0042" style={{ fontFamily: "'Geist Mono', monospace" }} /><div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>Use ATS reference. No names stored.</div></div>
          <div><FieldLabel required>Role applied for</FieldLabel><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Data Analyst" /></div>
          <div><FieldLabel required>Hiring stage</FieldLabel><Select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}><option value="">Select stage</option>{["CV screening", "Phone screen", "First interview", "Second interview", "Final round", "Reference check"].map(s => <option key={s}>{s}</option>)}</Select></div>
          <div><FieldLabel required>Decision date</FieldLabel><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>🤖 AI system involvement</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
          <div>
            <div style={{ fontSize: 13.5 }}>Was an AI tool used in this hiring decision?</div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>CV screeners, ranking tools, ATS scoring, video analysis, etc.</div>
          </div>
          <div onClick={() => setForm(f => ({ ...f, ai: !f.ai }))}
            style={{ width: 36, height: 20, borderRadius: 20, background: form.ai ? T.black : T.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", width: 14, height: 14, background: T.white, borderRadius: "50%", top: 3, left: form.ai ? 19 : 3, transition: "left 0.2s" }} />
          </div>
        </div>
        {form.ai && (
          <div style={{ marginTop: 12, paddingTop: 14, borderTop: `0.5px solid ${T.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><FieldLabel required>AI system name</FieldLabel><Input value={form.aiSystem} onChange={e => setForm(f => ({ ...f, aiSystem: e.target.value }))} placeholder="e.g. Teamtailor AI Screening" /></div>
              <div><FieldLabel>AI recommendation</FieldLabel><Select value={form.aiRec} onChange={e => setForm(f => ({ ...f, aiRec: e.target.value }))}><option value="">Select outcome</option><option>Advance candidate</option><option>Reject candidate</option><option>No recommendation given</option></Select></div>
              <div style={{ gridColumn: "1/-1" }}><FieldLabel>Did the hiring manager override the AI recommendation?</FieldLabel><Select value={form.override} onChange={e => setForm(f => ({ ...f, override: e.target.value }))}><option value="">Select</option><option>Yes — manager rejected despite AI advance</option><option>Yes — manager advanced despite AI reject</option><option>No — decision aligned with AI</option><option>Not applicable</option></Select><div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>Human overrides are the primary audit risk under EU AI Act Annex III.</div></div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>📋 Rejection reason</div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 14 }}>Select all that apply</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {REASON_CHIPS.map(r => (
            <div key={r} onClick={() => toggleReason(r)}
              style={{ padding: "5px 12px", borderRadius: 20, border: `0.5px solid ${form.reasons.includes(r) ? T.black : T.border}`, fontSize: 12, cursor: "pointer", background: form.reasons.includes(r) ? T.black : T.white, color: form.reasons.includes(r) ? T.white : T.textSecondary, transition: "all 0.15s" }}>
              {r}
            </div>
          ))}
        </div>
        <FieldLabel required>Justification — in your own words</FieldLabel>
        <textarea value={form.justification} onChange={handleText}
          placeholder="Describe why this candidate was not progressed. Be specific — this text is analyzed for bias indicators and stored as the compliance record."
          style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: "'Geist', sans-serif", minHeight: 90, resize: "vertical", outline: "none", lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: T.textTertiary }}>
          <span>Minimum 30 words recommended</span>
          <span>{wordCount} words</span>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
          🛡 Bias analysis <Pill color="red" style={{ fontSize: 10 }}>Claude API</Pill>
        </div>
        {analysisState === "idle" && (
          <div style={{ padding: 16, textAlign: "center", border: `0.5px dashed ${T.border}`, borderRadius: 8, color: T.textTertiary, fontSize: 13 }}>
            Analysis runs automatically as you type your justification above.
          </div>
        )}
        {analysisState === "analyzing" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, fontSize: 13, color: T.textSecondary }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.black, animation: `pulse 1s ${delay}s ease-in-out infinite` }} />
            ))}
            Analyzing for bias indicators...
          </div>
        )}
        {analysisState === "done" && (
          <div>
            <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: T.offwhite, borderBottom: `0.5px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.redText }}>⚠ 2 bias indicators detected</span>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Risk score: <strong style={{ color: T.red }}>72 / 100</strong></span>
              </div>
              <div style={{ padding: 14 }}>
                {[
                  { type: "Institution bias", text: 'The phrase "wrong university background" suggests candidate assessed on educational institution rather than demonstrated competency.' },
                  { type: "Cultural proxy", text: '"Team dynamic" without objective criteria may function as a proxy for cultural or ethnic background.' },
                ].map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i === 0 ? 12 : 0, marginBottom: i === 0 ? 12 : 0, borderBottom: i === 0 ? `0.5px solid ${T.borderLight}` : "none" }}>
                    <span style={{ color: T.red, flexShrink: 0, marginTop: 1 }}>⚠</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px", color: T.redText, marginBottom: 3 }}>{flag.type}</div>
                      <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>{flag.text}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, marginBottom: 5 }}><span>Bias risk score</span><span style={{ color: T.red, fontWeight: 500 }}>72 / 100 — High</span></div>
                  <div style={{ height: 5, background: T.offwhite, borderRadius: 5 }}><div style={{ height: "100%", width: "72%", background: T.red, borderRadius: 5 }} /></div>
                </div>
              </div>
            </div>
            <div style={{ background: T.amberBg, border: `0.5px solid ${T.amber}`, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 9, marginTop: 12, fontSize: 13, color: T.amberText }}>
              <span style={{ flexShrink: 0 }}>→</span>
              This decision will be routed to the <strong style={{ margin: "0 3px" }}>escalation queue</strong> for HR review before it is finalized.
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <Btn ghost>← Cancel</Btn>
        <div style={{ display: "flex", gap: 9 }}>
          <Btn>Save draft</Btn>
          <Btn primary onClick={handleSubmit}>✓ Submit decision</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Audit Log ──────────────────────────────────────────────────
function AuditLog({ decisions, setActive }) {
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = decisions.filter(d => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchSearch = d.id.toLowerCase().includes(search.toLowerCase()) || d.role.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px" }}>Audit log</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>{decisions.length} decisions logged · {decisions.filter(d => d.status === "flagged").length} flagged</div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <Btn>↓ Export CSV</Btn>
          <Btn primary onClick={() => setActive("report")}>↓ Generate report</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 9, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", border: `0.5px solid ${T.border}`, borderRadius: 7, background: T.white, flex: 1 }}>
          <span style={{ color: T.textTertiary }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or role..." style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", width: "100%", fontFamily: "'Geist', sans-serif" }} />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All statuses</option>
          <option value="clear">Clear</option>
          <option value="flagged">Flagged</option>
          <option value="review">In review</option>
        </Select>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 90px 100px 110px 30px", padding: "10px 16px", background: T.offwhite, borderBottom: `0.5px solid ${T.border}`, borderRadius: "12px 12px 0 0" }}>
          {["ID", "Role", "Reason", "AI used", "Risk", "Status", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 500, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</div>
          ))}
        </div>
        {filtered.map((d, i) => (
          <div key={d.id} style={{ borderBottom: i < filtered.length - 1 ? `0.5px solid ${T.borderLight}` : "none" }}>
            <div onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 90px 100px 110px 30px", padding: "11px 16px", cursor: "pointer", alignItems: "center", background: expanded === d.id ? T.offwhite : "transparent", transition: "background 0.12s" }}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: T.textSecondary }}>{d.id}</div>
              <div style={{ fontSize: 13 }}>{d.role}</div>
              <div style={{ fontSize: 12, color: T.textSecondary }}>{d.reason}</div>
              <div><Pill color={d.ai ? "amber" : "gray"}>{d.ai ? "Yes" : "No"}</Pill></div>
              <div style={{ fontSize: 12, fontWeight: 500, color: d.riskScore > 60 ? T.red : d.riskScore > 30 ? T.amber : T.green }}>{d.riskScore} / 100</div>
              <div><Pill color={d.status === "clear" ? "green" : d.status === "flagged" ? "red" : "amber"}>{d.status === "clear" ? "✓ Clear" : d.status === "flagged" ? "⚠ Flagged" : "↻ Review"}</Pill></div>
              <div style={{ color: T.textTertiary, transition: "transform 0.2s", transform: expanded === d.id ? "rotate(180deg)" : "none" }}>∨</div>
            </div>
            {expanded === d.id && (
              <div className="fade-in" style={{ padding: "14px 20px 16px", background: T.offwhite, borderTop: `0.5px solid ${T.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                  <div>
                    <SectionTitle>Justification</SectionTitle>
                    <div style={{ background: T.white, borderLeft: `2px solid ${T.red}`, padding: "8px 12px", borderRadius: "0 7px 7px 0", fontSize: 13, color: T.textSecondary, lineHeight: 1.6, fontStyle: "italic" }}>{d.justification}</div>
                  </div>
                  <div>
                    <SectionTitle>Bias indicators</SectionTitle>
                    {d.biasFlags.length === 0 ? (
                      <div style={{ fontSize: 13, color: T.green }}>✓ No bias indicators detected</div>
                    ) : d.biasFlags.map((f, j) => <Pill key={j} color="red" style={{ marginRight: 5, marginBottom: 4 }}>⚠ {f}</Pill>)}
                  </div>
                  <div>
                    <SectionTitle>Stage</SectionTitle>
                    <div style={{ fontSize: 13 }}>{d.stage}</div>
                  </div>
                  <div>
                    <SectionTitle>Logged by</SectionTitle>
                    <div style={{ fontSize: 13 }}>{d.loggedBy} · {d.date}</div>
                  </div>
                  {d.override && <div style={{ gridColumn: "1/-1" }}><SectionTitle>AI override</SectionTitle><div style={{ fontSize: 13, color: T.red }}>Yes — manager rejected despite AI advance</div></div>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${T.border}` }}>
                  <Btn style={{ fontSize: 12, padding: "5px 10px" }}>✎ Edit</Btn>
                  {d.status !== "clear" && <Btn style={{ fontSize: 12, padding: "5px 10px", color: T.red, borderColor: T.red }}>→ View in queue</Btn>}
                  <Btn onClick={() => generateIndividualRecordPDF(d)} style={{ fontSize: 12, padding: "5px 10px" }}>↓ Download record</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `0.5px solid ${T.border}`, fontSize: 13, color: T.textSecondary }}>
          <span>Showing {filtered.length} of {decisions.length} decisions</span>
          <div style={{ display: "flex", gap: 7 }}>
            <Btn style={{ fontSize: 12, padding: "5px 10px" }}>← Prev</Btn>
            <Btn style={{ fontSize: 12, padding: "5px 10px" }}>Next →</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Escalation Queue ───────────────────────────────────────────
function EscalationQueue({ decisions, onResolve }) {
  const [expanded, setExpanded] = useState(null);
  const [resolved, setResolved] = useState([]);
  const [chips, setChips] = useState({});
  const [notes, setNotes] = useState({});

  const pending = decisions.filter(d => (d.status === "flagged" || d.status === "review") && !resolved.includes(d.id));

  const handleResolve = (id) => {
    setResolved(r => [...r, id]);
    onResolve(id);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px" }}>Escalation queue</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>
          {pending.length} decisions pending HR review · Unresolved escalations block audit report generation.
        </div>
      </div>

      {pending.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, background: T.white, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 10, color: T.green }}>✓</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18 }}>All escalations resolved</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>Audit report is ready to generate.</div>
        </div>
      )}

      {decisions.filter(d => d.status === "flagged" || d.status === "review").map((d) => {
        const isResolved = resolved.includes(d.id);
        const isOpen = expanded === d.id;
        return (
          <div key={d.id} style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, marginBottom: 12, overflow: "hidden", opacity: isResolved ? 0.45 : 1, transition: "opacity 0.3s" }}>
            <div onClick={() => !isResolved && setExpanded(isOpen ? null : d.id)}
              style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: isResolved ? "default" : "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: d.riskScore > 60 ? T.redBg : T.amberBg, color: d.riskScore > 60 ? T.redText : T.amberText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{d.riskScore}</div>
                <div>
                  <div style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace", color: T.textSecondary, marginBottom: 2 }}>{d.id} · {d.role} · {d.stage}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Logged by {d.loggedBy} · {d.date}</div>
                  <div>{d.biasFlags.map((f, j) => <Pill key={j} color={d.riskScore > 60 ? "red" : "amber"} style={{ marginRight: 5, fontSize: 10 }}>⚠ {f}</Pill>)}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                {isResolved ? <Pill color="green">✓ Resolved</Pill> : <Pill color={d.riskScore > 60 ? "red" : "amber"}>Pending</Pill>}
                <span style={{ fontSize: 11, color: T.textTertiary }}>2 days ago</span>
              </div>
            </div>

            {isOpen && !isResolved && (
              <div className="fade-in" style={{ borderTop: `0.5px solid ${T.border}`, padding: "18px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <SectionTitle>Rejection justification</SectionTitle>
                    <div style={{ background: T.offwhite, borderLeft: `2px solid ${T.red}`, padding: "9px 13px", borderRadius: "0 7px 7px 0", fontSize: 13, color: T.textSecondary, lineHeight: 1.6, fontStyle: "italic" }}>{d.justification}</div>
                  </div>
                  <div>
                    <SectionTitle>Claude bias analysis</SectionTitle>
                    <div style={{ background: T.offwhite, borderRadius: 8, padding: "12px 14px" }}>
                      {d.biasFlags.map((f, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: j < d.biasFlags.length - 1 ? 10 : 0 }}>
                          <span style={{ color: d.riskScore > 60 ? T.red : T.amber, flexShrink: 0 }}>⚠</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: d.riskScore > 60 ? T.redText : T.amberText, marginBottom: 2 }}>{f}</div>
                            <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>Detected in justification text. Recommend documenting specific behavioral evidence.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>HR reviewer decision <span style={{ color: T.red }}>*</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
                    {["Justified — bias flag incorrect", "Partially justified — add context", "Not justified — decision at risk", "Escalate to legal"].map(opt => (
                      <div key={opt} onClick={() => setChips(c => ({ ...c, [d.id]: opt }))}
                        style={{ padding: "6px 12px", borderRadius: 7, border: `0.5px solid ${chips[d.id] === opt ? T.black : T.border}`, fontSize: 12, cursor: "pointer", background: chips[d.id] === opt ? T.black : T.white, color: chips[d.id] === opt ? T.white : T.textSecondary, transition: "all 0.15s" }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <textarea value={notes[d.id] || ""} onChange={e => setNotes(n => ({ ...n, [d.id]: e.target.value }))}
                    placeholder="Add reviewer notes — appended to the audit record..."
                    style={{ width: "100%", padding: "9px 12px", border: `0.5px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontFamily: "'Geist', sans-serif", minHeight: 70, resize: "vertical", outline: "none", lineHeight: 1.6, marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 9 }}>
                    <Btn success onClick={() => { handleResolve(d.id); generateIndividualRecordPDF(d, chips[d.id] || "", notes[d.id] || ""); }}>✓ Resolve and download record</Btn>
                    <Btn style={{ color: T.red, borderColor: T.red }}>⚖ Escalate to legal</Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── CSV Import ─────────────────────────────────────────────────
function CSVImport() {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  const runAnalysis = () => {
    setAnalyzing(true);
    let p = 0;
    const iv = setInterval(() => {
      p += 2.5;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(iv); setTimeout(() => { setAnalyzing(false); setDone(true); }, 300); }
    }, 80);
  };

  const STEPS = ["Upload file", "Map columns", "Run analysis", "Review & import"];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px" }}>Import from ATS</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>Export rejections from your ATS, upload here, map columns, run batch analysis.</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "initial" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, background: i < step ? T.green : i === step - 1 ? T.black : T.border, color: i <= step - 1 ? T.white : T.textTertiary }}>
                {i < step - 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 13, color: i === step - 1 ? T.textPrimary : T.textTertiary }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: "0.5px", background: T.border, margin: "0 10px" }} />}
          </div>
        ))}
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>📄 Uploaded file</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.offwhite, borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, color: T.green }}>⊞</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>teamtailor_rejections_may2026.csv</div>
              <div style={{ fontSize: 11, color: T.textSecondary }}>47 rows · 6 columns · 18 KB</div>
            </div>
          </div>
          <Btn style={{ fontSize: 12, padding: "5px 10px" }}>✕ Remove</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>↔ Column mapping</div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 14 }}>Match your ATS columns to HireTrace fields.</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["HireTrace field", "Map to CSV column"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 500, color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.4px", paddingBottom: 8, borderBottom: `0.5px solid ${T.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              { label: "Candidate ID", required: true, hint: "Unique reference, no names", options: ["candidate_id", "id", "ref_number"] },
              { label: "Role applied for", required: true, options: ["job_title", "position", "role"] },
              { label: "Rejection reason", required: true, hint: "Free text — analyzed by Claude", options: ["rejection_note", "notes", "feedback"] },
              { label: "Decision date", required: true, options: ["rejected_at", "date", "created_at"] },
              { label: "Hiring stage", options: ["stage_name", "pipeline_step", "-- skip --"] },
              { label: "AI tool used", hint: "Yes/No field", options: ["-- skip --", "ai_screening", "tool_used"] },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ padding: "10px 0", borderBottom: `0.5px solid ${T.borderLight}` }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{row.label}{row.required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}</div>
                  {row.hint && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>{row.hint}</div>}
                </td>
                <td style={{ padding: "10px 0 10px 16px", borderBottom: `0.5px solid ${T.borderLight}` }}>
                  <Select style={{ width: "auto", minWidth: 200 }}>{row.options.map(o => <option key={o}>{o}</option>)}</Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>🛡 Batch analysis</div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 16 }}>Claude will analyze all 47 rejection notes for bias indicators.</div>
        {!analyzing && !done && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[["Rows to analyze", "47"], ["Est. API cost", "~€0.08"], ["Est. time", "~45s"]].map(([label, val]) => (
                <div key={label} style={{ background: T.offwhite, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
            <Btn primary onClick={runAnalysis}>🛡 Run batch analysis</Btn>
          </div>
        )}
        {analyzing && (
          <div>
            <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 7 }}>Analyzing row {Math.round(progress / 100 * 47)} of 47...</div>
            <div style={{ height: 5, background: T.offwhite, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", background: T.black, borderRadius: 5, width: `${progress}%`, transition: "width 0.1s" }} />
            </div>
            <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 5 }}>Running Claude API · do not close this tab</div>
          </div>
        )}
        {done && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
              {[["Analyzed", "47", T.textPrimary, T.white], ["Clear", "34", T.green, T.greenBg], ["Flagged", "13", T.red, T.redBg]].map(([label, val, color, bg]) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color, marginBottom: 4, opacity: 0.8 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.amberBg, border: `0.5px solid ${T.amber}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.amberText, marginBottom: 14 }}>
              ⚠ 13 flagged decisions will be added to the escalation queue and require HR review.
            </div>
            <div style={{ display: "flex", gap: 9 }}>
              <Btn>👁 Preview results</Btn>
              <Btn primary>↓ Import 47 decisions</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Generate Report ────────────────────────────────────────────
function GenerateReport({ decisions }) {
  const total = decisions.length;
  const flagged = decisions.filter(d => d.status === "flagged").length;
  const clear = decisions.filter(d => d.status === "clear").length;
  const unresolved = decisions.filter(d => d.status === "review" || d.status === "flagged").length;

  const articles = [
    { ref: "Art. 13", text: "Transparency — decision logging with timestamps, candidate IDs, rejection justifications, and responsible officer on file.", status: "Met", color: T.green },
    { ref: "Art. 14", text: "Human oversight — escalation workflow active. Flagged decisions reviewed by HR before finalization.", status: unresolved > 0 ? "Partial" : "Met", color: unresolved > 0 ? T.amber : T.green },
    { ref: "Art. 26", text: "Deployer obligations — AI system register documented. Override decisions logged and flagged for review.", status: "Met", color: T.green },
    { ref: "Ann. III", text: "High-risk AI in employment — bias analysis records attached to each AI-assisted decision. Audit trail complete.", status: unresolved > 0 ? "Partial" : "Met", color: unresolved > 0 ? T.amber : T.green },
  ];

  const biasTypes = {};
  decisions.forEach(d => d.biasFlags.forEach(f => { biasTypes[f] = (biasTypes[f] || 0) + 1; }));

  const handleDownloadPDF = () => {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const biasLines = Object.entries(biasTypes).map(([type, count]) =>
      `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">${type}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#C9372C;font-weight:500;">${count} case${count > 1 ? "s" : ""}</td></tr>`
    ).join("") || `<tr><td colspan="2" style="padding:6px 10px;font-size:12px;color:#1D9E75;">✓ No bias flags detected</td></tr>`;

    const articleRows = articles.map(a =>
      `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;font-family:monospace;background:#f5f4f1;white-space:nowrap;">${a.ref}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;color:#6B6B67;">${a.text}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;font-weight:600;color:${a.color};white-space:nowrap;">${a.status === "Met" ? "✓" : "⚠"} ${a.status}</td></tr>`
    ).join("");

    const decisionRows = decisions.map((d, i) => {
      const statusColor = d.status === "clear" ? "#1D9E75" : d.status === "flagged" ? "#C9372C" : "#D97706";
      const statusLabel = d.status === "clear" ? "✓ Clear" : d.status === "flagged" ? "⚠ Flagged" : "↻ Review";
      const biasCell = d.biasFlags.length > 0 ? d.biasFlags.join(", ") : "None";
      const rowBg = i % 2 === 0 ? "#ffffff" : "#fafaf9";
      return `<tr style="background:${rowBg};">
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;font-family:monospace;color:#6B6B67;">${d.id}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;">${d.role}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;color:#6B6B67;">${d.stage}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;color:#6B6B67;">${d.reason}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;text-align:center;">${d.ai ? "Yes" : "No"}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;font-weight:600;color:${statusColor};">${statusLabel}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;color:#C9372C;">${biasCell}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;color:#6B6B67;">${d.loggedBy}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;color:#6B6B67;">${d.date}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>HireTrace Audit Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Geist:wght@400;500;600&family=Geist+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Geist', sans-serif; color: #111110; background: #fff; padding: 0; }
  .cover { background: #111110; color: #fff; padding: 40px 48px 36px; }
  .cover-title { font-family: 'Instrument Serif', serif; font-size: 26px; font-weight: 400; margin-bottom: 6px; }
  .cover-meta { font-size: 11px; opacity: 0.5; font-family: 'Geist Mono', monospace; }
  .body { padding: 36px 48px; }
  .section { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid #E2E1DC; }
  .section:last-child { border-bottom: none; margin-bottom: 0; }
  .section-label { font-size: 9px; font-weight: 600; color: #A8A8A4; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
  .stat-card { background: #F5F4F1; border-radius: 8px; padding: 12px 14px; }
  .stat-val { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-size: 11px; color: #6B6B67; }
  table { width: 100%; border-collapse: collapse; }
  .decl-text { font-size: 12px; color: #6B6B67; line-height: 1.7; margin-bottom: 18px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sig-box { border: 1px solid #E2E1DC; border-radius: 8px; padding: 14px 16px; }
  .sig-label { font-size: 10px; color: #A8A8A4; margin-bottom: 10px; }
  .sig-line { border-bottom: 1px solid #E2E1DC; height: 32px; margin-bottom: 8px; }
  .sig-name { font-size: 12px; color: #6B6B67; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #E2E1DC; font-size: 10px; color: #A8A8A4; font-family: 'Geist Mono', monospace; display: flex; justify-content: space-between; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>
<div class="cover">
  <div style="font-family:'Instrument Serif',serif;font-size:14px;opacity:0.4;margin-bottom:20px;">HireTrace.</div>
  <div class="cover-title">EU AI Act Hiring Decision Audit Report</div>
  <div class="cover-meta" style="margin-top:8px;">Acme Oy &middot; Period: 14 Apr &ndash; 13 May 2026 &middot; Generated: ${today} &middot; Ref: HT-2026-05</div>
</div>
<div class="body">
  <div class="section">
    <div class="section-label">Decision summary</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-label">Total</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#1D9E75;">${clear}</div><div class="stat-label">Clear</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#C9372C;">${flagged}</div><div class="stat-label">Flagged</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#D97706;">${unresolved}</div><div class="stat-label">Unresolved</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-label">EU AI Act article compliance mapping</div>
    <table><tbody>${articleRows}</tbody></table>
  </div>
  <div class="section">
    <div class="section-label">Bias flag summary</div>
    <table><tbody>${biasLines}</tbody></table>
  </div>
  <div class="section">
    <div class="section-label">Individual rejection decisions</div>
    <table>
      <thead>
        <tr style="background:#F5F4F1;">
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">ID</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Role</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Stage</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Reason</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:center;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">AI</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Status</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Bias flags</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Logged by</th>
          <th style="padding:8px 10px;font-size:10px;font-weight:600;color:#A8A8A4;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #E2E1DC;">Date</th>
        </tr>
      </thead>
      <tbody>${decisionRows}</tbody>
    </table>
  </div>
  <div class="section">
    <div class="section-label">Officer declaration</div>
    <div class="decl-text">I, the undersigned responsible officer, confirm that the hiring decisions documented in this report were conducted in accordance with applicable EU AI Act obligations (including Articles 13, 14, and 26 and Annex III requirements) and Finnish non-discrimination law (Yhdenvertaisuuslaki 1325/2014) during the stated reporting period. All AI-assisted decisions have been reviewed by a qualified human reviewer. Bias flags have been investigated and dispositioned. This report is submitted as part of the organisation's ongoing compliance documentation obligations.</div>
    <div class="sig-grid">
      <div class="sig-box">
        <div class="sig-label">HR responsible officer</div>
        <div class="sig-line"></div>
        <div class="sig-name">Mia Virtanen, HR Manager &middot; Acme Oy</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Date signed</div>
        <div class="sig-line"></div>
        <div class="sig-name">${today}</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <span>HireTrace v1.0 &middot; Confidential compliance document</span>
    <span>Ref: HT-2026-05</span>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "HireTrace_Audit_Report_HT-2026-05.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.3px" }}>EU AI Act audit report</div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>Configure scope, preview, and export.</div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <Btn>✉ Send by email</Btn>
          <Btn primary onClick={handleDownloadPDF}>↓ Download PDF</Btn>
        </div>
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>⚙ Report settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><FieldLabel>Reporting period</FieldLabel><Select><option>Last 30 days (14 Apr – 13 May 2026)</option><option>Last 90 days</option><option>Last 12 months</option></Select></div>
          <div><FieldLabel>Company name</FieldLabel><Input defaultValue="Acme Oy" /></div>
          <div><FieldLabel>Responsible officer</FieldLabel><Input defaultValue="Mia Virtanen, HR Manager" /></div>
          <div><FieldLabel>Include in report</FieldLabel><Select><option>All decisions (clear + flagged)</option><option>Flagged decisions only</option></Select></div>
        </div>
      </Card>

      {unresolved > 0 && (
        <div style={{ background: T.amberBg, border: `0.5px solid ${T.amber}`, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 9, fontSize: 13, color: T.amberText, marginBottom: 14 }}>
          <span>⚠</span>{unresolved} escalation{unresolved > 1 ? "s are" : " is"} unresolved. Resolve them before finalizing this report.
        </div>
      )}

      <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ background: T.black, color: T.white, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 13, opacity: 0.5, marginBottom: 10 }}>HireTrace.</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, marginBottom: 4 }}>EU AI Act Hiring Decision Audit Report</div>
          <div style={{ fontSize: 12, opacity: 0.5, fontFamily: "'Geist Mono', monospace" }}>Acme Oy · Period: 14 Apr – 13 May 2026 · Generated: 13 May 2026 · Ref: HT-2026-05</div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `0.5px solid ${T.border}` }}>
            <SectionTitle>Decision summary</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[["Total", total, T.textPrimary], ["Clear", clear, T.green], ["Flagged", flagged, T.red], ["Unresolved", unresolved, T.amber]].map(([label, val, color]) => (
                <div key={label} style={{ background: T.offwhite, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 22, fontWeight: 500, color, lineHeight: 1, marginBottom: 3 }}>{val}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `0.5px solid ${T.border}` }}>
            <SectionTitle>EU AI Act article compliance mapping</SectionTitle>
            {articles.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < articles.length - 1 ? 10 : 0 }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, padding: "3px 8px", background: T.offwhite, borderRadius: 4, color: T.textSecondary, flexShrink: 0 }}>{a.ref}</span>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, flex: 1 }}>{a.text}</div>
                <span style={{ fontSize: 11, fontWeight: 500, color: a.color, flexShrink: 0 }}>{a.status === "Met" ? "✓" : "⚠"} {a.status}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `0.5px solid ${T.border}` }}>
            <SectionTitle>Bias flag summary</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {Object.entries(biasTypes).map(([type, count]) => (
                <Pill key={type} color="red">{type} · {count} case{count > 1 ? "s" : ""}</Pill>
              ))}
              {Object.keys(biasTypes).length === 0 && <span style={{ fontSize: 13, color: T.green }}>✓ No bias flags detected</span>}
            </div>
          </div>

          <div>
            <SectionTitle>Officer declaration</SectionTitle>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>I confirm that the hiring decisions documented in this report were conducted in accordance with applicable EU AI Act obligations and Finnish non-discrimination law during the stated reporting period.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["HR responsible officer", "Mia Virtanen, HR Manager · Acme Oy"], ["Date signed", "13 May 2026"]].map(([label, val]) => (
                <div key={label} style={{ border: `0.5px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 10 }}>{label}</div>
                  <div style={{ borderBottom: `0.5px solid ${T.border}`, height: 28, marginBottom: 7 }} />
                  <div style={{ fontSize: 12, color: T.textSecondary }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App root ───────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [decisions, setDecisions] = useState(SAMPLE_DECISIONS);

  const escalationCount = decisions.filter(d => d.status === "flagged" || d.status === "review").length;

  const handleNewDecision = (decision) => {
    setDecisions(prev => [decision, ...prev]);
  };

  const handleResolve = (id) => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: "clear" } : d));
  };

  const screens = {
    dashboard: <Dashboard decisions={decisions} setActive={setActive} />,
    log: <LogDecision onSubmit={handleNewDecision} />,
    auditlog: <AuditLog decisions={decisions} setActive={setActive} />,
    escalation: <EscalationQueue decisions={decisions} onResolve={handleResolve} />,
    report: <GenerateReport decisions={decisions} />,
    import: <CSVImport />,
  };

  return (
    <>
      <style>{globalCSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: T.pageBg }}>
        <Sidebar active={active} setActive={setActive} escalationCount={escalationCount} />
        <main style={{ flex: 1, padding: "32px 36px", maxWidth: "calc(100vw - 228px)", overflowX: "hidden" }}>
          {screens[active]}
        </main>
      </div>
    </>
  );
}
