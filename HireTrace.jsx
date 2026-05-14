import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// PDF EXPORT — opens a print-ready HTML page in a new tab.
// User presses Ctrl+P / Cmd+P (or the browser auto-prompts)
// and saves as PDF. No CDN, no sandbox restrictions.
// ─────────────────────────────────────────────────────────────

function recordHTML(d) {
  const today = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  const statusColor = d.status === "clear" ? "#2DC653" : d.status === "flagged" ? "#E63946" : "#F4A261";
  const statusLabel = d.status === "clear" ? "Clear" : d.status === "flagged" ? "Flagged" : "In Review";
  const riskColor   = d.riskScore > 60 ? "#E63946" : d.riskScore > 30 ? "#F4A261" : "#2DC653";
  const riskPct     = d.riskScore + "%";

  const biasSection = d.biasFlags && d.biasFlags.length
    ? d.biasFlags.map(f => `<div class="flag">⚠ ${f}</div>`).join("")
    : `<div class="clear-flag">✓ No bias indicators detected</div>`;

  const aiSection = d.ai ? `
    <div class="section">
      <div class="section-label">AI SYSTEM INVOLVEMENT</div>
      <div class="grid2">
        <div><div class="field-label">AI System Used</div><div class="field-val">Yes — ${d.aiSystem || "—"}</div></div>
        <div><div class="field-label">AI Recommendation</div><div class="field-val">${d.aiRec || "—"}</div></div>
        <div style="grid-column:1/-1"><div class="field-label">Manager Override</div><div class="field-val ${d.override ? "red" : ""}">${d.override ? "Yes — manager rejected despite AI recommendation to advance" : "No"}</div></div>
      </div>
    </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>HireTrace — ${d.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,serif;color:#0A0A0A;background:#fff;padding:0}
  .page{max-width:720px;margin:0 auto;padding:48px 48px 64px}
  .header{background:#0A0A0A;color:#fff;padding:18px 24px;margin:-48px -48px 36px;display:flex;justify-content:space-between;align-items:center}
  .header-brand{font-size:13px;font-weight:700;letter-spacing:.5px}
  .header-sub{font-size:10px;color:#888;font-family:monospace}
  h1{font-size:26px;font-weight:400;margin-bottom:6px}
  .meta{font-size:12px;color:#6B6B67;margin-bottom:24px;font-family:Arial,sans-serif}
  .pills{display:flex;gap:8px;margin-bottom:32px;flex-wrap:wrap}
  .pill{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600;font-family:Arial,sans-serif}
  .section{margin-bottom:28px;padding-bottom:28px;border-bottom:0.5px solid #E4E4E0}
  .section:last-child{border-bottom:none}
  .section-label{font-size:9px;font-weight:700;color:#A8A8A4;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;font-family:Arial,sans-serif}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
  .field-label{font-size:10px;color:#A8A8A4;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;font-family:Arial,sans-serif}
  .field-val{font-size:13px;color:#0A0A0A;font-family:Arial,sans-serif}
  .field-val.red{color:#E63946;font-weight:600}
  .justification{border-left:3px solid #E63946;padding:12px 16px;background:#FAFAFA;font-style:italic;font-size:13px;color:#6B6B67;line-height:1.7;border-radius:0 6px 6px 0}
  .flag{background:#FCEBEB;color:#A32D2D;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:6px;font-family:Arial,sans-serif}
  .clear-flag{background:#EAF3DE;color:#3B6D11;padding:10px 14px;border-radius:6px;font-size:13px;font-weight:600;font-family:Arial,sans-serif}
  .risk-bar-wrap{margin-top:14px}
  .risk-bar-meta{display:flex;justify-content:space-between;font-size:11px;color:#6B6B67;margin-bottom:5px;font-family:Arial,sans-serif}
  .risk-bar-bg{height:6px;background:#F0F0ED;border-radius:4px;overflow:hidden}
  .risk-bar-fill{height:100%;border-radius:4px}
  .footer{margin-top:40px;padding-top:16px;border-top:0.5px solid #E4E4E0;display:flex;justify-content:space-between;font-size:10px;color:#A8A8A4;font-family:Arial,sans-serif}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{padding:32px 40px 48px}
    .header{margin:-32px -40px 28px}
    .no-print{display:none}
  }
</style>
</head><body>
<div class="page">
  <div class="header">
    <div class="header-brand">HireTrace.</div>
    <div class="header-sub">Individual Decision Record · EU AI Act Compliance</div>
  </div>

  <h1>Decision Record — ${d.id}</h1>
  <div class="meta">${d.role} &nbsp;·&nbsp; ${d.stage} &nbsp;·&nbsp; ${d.date} &nbsp;·&nbsp; Logged by ${d.loggedBy}</div>

  <div class="pills">
    <span class="pill" style="background:${statusColor}22;color:${statusColor}">${statusLabel}</span>
    <span class="pill" style="background:${riskColor}22;color:${riskColor}">Risk score: ${d.riskScore} / 100</span>
    ${d.ai ? `<span class="pill" style="background:#FAEEDA;color:#854F0B">AI-assisted</span>` : ""}
    ${d.override ? `<span class="pill" style="background:#FCEBEB;color:#A32D2D">Manager override</span>` : ""}
  </div>

  <div class="section">
    <div class="section-label">Candidate &amp; Decision Details</div>
    <div class="grid2">
      <div><div class="field-label">Candidate ID</div><div class="field-val" style="font-family:monospace">${d.id}</div></div>
      <div><div class="field-label">Role Applied For</div><div class="field-val">${d.role}</div></div>
      <div><div class="field-label">Hiring Stage</div><div class="field-val">${d.stage}</div></div>
      <div><div class="field-label">Decision Date</div><div class="field-val">${d.date}</div></div>
      <div><div class="field-label">Logged By</div><div class="field-val">${d.loggedBy}</div></div>
      <div><div class="field-label">Rejection Reason</div><div class="field-val">${d.reason}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Rejection Justification</div>
    <div class="justification">${d.justification}</div>
  </div>

  ${aiSection}

  <div class="section">
    <div class="section-label">Bias Analysis</div>
    ${biasSection}
    <div class="risk-bar-wrap">
      <div class="risk-bar-meta">
        <span>Bias risk score</span>
        <span style="color:${riskColor};font-weight:600">${d.riskScore} / 100</span>
      </div>
      <div class="risk-bar-bg">
        <div class="risk-bar-fill" style="width:${riskPct};background:${riskColor}"></div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>HireTrace &nbsp;·&nbsp; Generated ${today} &nbsp;·&nbsp; Confidential — EU AI Act compliance record</span>
    <span>Page 1 of 1</span>
  </div>

  <div class="no-print" style="margin-top:32px;text-align:center">
    <button onclick="window.print()" style="background:#0A0A0A;color:#fff;border:none;padding:10px 24px;border-radius:7px;font-size:14px;cursor:pointer;font-family:Arial,sans-serif">
      ↓ Save as PDF (Ctrl+P / Cmd+P)
    </button>
    <div style="font-size:11px;color:#888;margin-top:8px;font-family:Arial,sans-serif">In the print dialog, choose "Save as PDF" as the destination</div>
  </div>
</div>
</body></html>`;
}

function reportHTML(decisions, dateFrom, dateTo, company, officer) {
  const today = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  const periodLabel = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : dateFrom ? `From ${dateFrom}` : dateTo ? `Until ${dateTo}` : "All dates";

  const total      = decisions.length;
  const flagged    = decisions.filter(d => d.status === "flagged").length;
  const clear      = decisions.filter(d => d.status === "clear").length;
  const unresolved = decisions.filter(d => d.status !== "clear").length;
  const readiness  = total > 0 ? Math.round((clear / total) * 100) : 0;

  const biasTypes = {};
  decisions.forEach(d => d.biasFlags.forEach(f => { biasTypes[f] = (biasTypes[f] || 0) + 1; }));

  const articles = [
    { ref:"Art. 13", text:"Transparency — decision logging with timestamps, candidate IDs, justifications, and responsible officer.", status:"Met" },
    { ref:"Art. 14", text:"Human oversight — escalation workflow active. Flagged decisions reviewed by HR before finalization.", status: unresolved > 0 ? "Partial" : "Met" },
    { ref:"Art. 26", text:"Deployer obligations — AI system register documented. Override decisions logged and flagged.", status:"Met" },
    { ref:"Ann. III",text:"High-risk AI in employment — bias analysis records attached to each AI-assisted decision.", status: unresolved > 0 ? "Partial" : "Met" },
  ];

  const tableRows = decisions.map((d, i) => {
    const rc = d.riskScore > 60 ? "#E63946" : d.riskScore > 30 ? "#F4A261" : "#2DC653";
    const sc = d.status === "clear" ? "#2DC653" : d.status === "flagged" ? "#E63946" : "#F4A261";
    const sl = d.status === "clear" ? "Clear" : d.status === "flagged" ? "Flagged" : "Review";
    return `<tr style="background:${i % 2 === 0 ? "#fff" : "#F7F7F5"}">
      <td style="font-family:monospace;color:#6B6B67">${d.id}</td>
      <td>${d.role}</td>
      <td style="color:#6B6B67">${d.stage}</td>
      <td style="color:#6B6B67">${d.reason}</td>
      <td>${d.ai ? "Yes" : "No"}</td>
      <td style="color:${rc};font-weight:600">${d.riskScore}</td>
      <td style="color:${sc};font-weight:600">${sl}</td>
      <td>${d.biasFlags.join(", ") || "—"}</td>
    </tr>`;
  }).join("");

  const flaggedCards = decisions.filter(d => d.status !== "clear").map(d => {
    const rc = d.riskScore > 60 ? "#E63946" : "#F4A261";
    const bg = d.riskScore > 60 ? "#FCEBEB" : "#FAEEDA";
    const flags = d.biasFlags.length ? d.biasFlags.map(f => `<span class="flag-chip">⚠ ${f}</span>`).join(" ") : `<span style="color:#3B6D11">✓ No flags</span>`;
    const override = d.override ? `<div class="override-note">⚠ Manager override: rejected despite ${d.aiSystem} recommendation to advance</div>` : "";
    return `<div class="flagged-card" style="border-color:${rc}">
      <div class="flagged-header" style="background:${bg};color:${rc}">
        <strong>${d.id} — ${d.role}</strong>
        <span style="font-size:11px;font-weight:400">${d.stage} · ${d.date} · Risk: ${d.riskScore}/100 · Logged by ${d.loggedBy}</span>
      </div>
      <div class="flagged-body">
        <div class="justification" style="margin-bottom:10px">${d.justification}</div>
        <div style="margin-bottom:6px">${flags}</div>
        ${override}
      </div>
    </div>`;
  }).join("");

  const biasRows = Object.entries(biasTypes).length === 0
    ? `<div style="color:#3B6D11;font-weight:600;padding:8px 0">✓ No bias flags detected in this period</div>`
    : Object.entries(biasTypes).map(([flag, count]) => {
        const pct = Math.round((count / Math.max(flagged, 1)) * 100);
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>${flag}</span><strong>${count} case${count > 1 ? "s" : ""}</strong></div>
          <div style="height:5px;background:#F0F0ED;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#E63946;border-radius:4px"></div></div>
        </div>`;
      }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>HireTrace Audit Report — ${company}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,serif;color:#0A0A0A;background:#fff}
  .page{max-width:900px;margin:0 auto;padding:0 48px 64px}
  .cover{background:#0A0A0A;color:#fff;padding:40px 48px;margin:0 -48px 40px}
  .cover-brand{font-size:11px;color:#666;letter-spacing:1px;margin-bottom:16px;font-family:Arial,sans-serif}
  .cover h1{font-size:30px;font-weight:400;margin-bottom:10px}
  .cover-meta{font-size:11px;color:#888;font-family:monospace;line-height:1.8}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:36px}
  .stat{background:#F7F7F5;border-radius:8px;padding:14px 16px}
  .stat-val{font-size:28px;font-weight:500;line-height:1;margin-bottom:4px}
  .stat-label{font-size:11px;color:#6B6B67;font-family:Arial,sans-serif}
  h2{font-size:13px;font-weight:700;color:#A8A8A4;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;font-family:Arial,sans-serif}
  .section{margin-bottom:36px;padding-bottom:36px;border-bottom:0.5px solid #E4E4E0}
  .section:last-of-type{border-bottom:none}
  .article-row{display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border-radius:6px;margin-bottom:4px;font-family:Arial,sans-serif}
  .article-ref{font-family:monospace;font-size:10px;background:#F0F0ED;padding:2px 8px;border-radius:4px;color:#6B6B67;white-space:nowrap}
  .article-text{font-size:12px;color:#6B6B67;flex:1;line-height:1.5}
  .article-status{font-size:11px;font-weight:700;white-space:nowrap}
  table{width:100%;border-collapse:collapse;font-size:12px;font-family:Arial,sans-serif}
  th{text-align:left;font-size:9px;font-weight:700;color:#A8A8A4;text-transform:uppercase;letter-spacing:.6px;padding:8px 10px;background:#F7F7F5;border-bottom:0.5px solid #E4E4E0}
  td{padding:9px 10px;border-bottom:0.5px solid #F0F0ED;color:#0A0A0A}
  .flagged-card{border:1px solid #E4E4E0;border-radius:8px;overflow:hidden;margin-bottom:14px}
  .flagged-header{padding:12px 16px;display:flex;flex-direction:column;gap:4px;font-family:Arial,sans-serif;font-size:13px}
  .flagged-body{padding:14px 16px}
  .justification{border-left:3px solid #E63946;padding:10px 14px;background:#FAFAFA;font-style:italic;font-size:12px;color:#6B6B67;line-height:1.7;border-radius:0 5px 5px 0}
  .flag-chip{background:#FCEBEB;color:#A32D2D;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:600;font-family:Arial,sans-serif;display:inline-block;margin:2px 2px 2px 0}
  .override-note{background:#FAEEDA;color:#854F0B;padding:7px 12px;border-radius:5px;font-size:11px;font-weight:600;font-family:Arial,sans-serif;margin-top:8px}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .sig-box{border:0.5px solid #E4E4E0;border-radius:7px;padding:14px 16px}
  .sig-label{font-size:10px;color:#A8A8A4;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;font-family:Arial,sans-serif}
  .sig-line{border-bottom:0.5px solid #E4E4E0;height:24px;margin-bottom:8px}
  .sig-val{font-size:12px;color:#6B6B67;font-family:Arial,sans-serif}
  .footer{margin-top:40px;padding-top:14px;border-top:0.5px solid #E4E4E0;display:flex;justify-content:space-between;font-size:10px;color:#A8A8A4;font-family:Arial,sans-serif}
  .print-btn-wrap{text-align:center;margin:36px 0 0}
  @media print{
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .no-print{display:none}
    .page{padding:0 32px 48px}
    .cover{margin:0 -32px 32px;padding:32px}
  }
</style>
</head><body>
<div class="page">
  <div class="cover">
    <div class="cover-brand">HireTrace. &nbsp;&nbsp;EU AI Act Compliance</div>
    <h1>Hiring Decision Audit Report</h1>
    <div class="cover-meta">
      ${company}<br>
      Period: ${periodLabel}<br>
      Generated: ${today} &nbsp;·&nbsp; Ref: HT-${new Date().getFullYear()}-REPORT<br>
      Responsible Officer: ${officer}
    </div>
  </div>

  <div class="stats">
    ${[["Total decisions", total, "#0A0A0A"], ["Clear", clear, "#2DC653"], ["Flagged", flagged, "#E63946"], [`Readiness`, `${readiness}%`, readiness > 80 ? "#2DC653" : "#F4A261"]].map(([l, v, c]) =>
      `<div class="stat"><div class="stat-val" style="color:${c}">${v}</div><div class="stat-label">${l}</div></div>`
    ).join("")}
  </div>

  <div class="section">
    <h2>EU AI Act Compliance Mapping</h2>
    ${articles.map((a, i) => {
      const c = a.status === "Met" ? "#2DC653" : "#F4A261";
      const icon = a.status === "Met" ? "✓" : "⚠";
      return `<div class="article-row" style="background:${i % 2 === 0 ? "#FFFFFF" : "#F7F7F5"}">
        <span class="article-ref">${a.ref}</span>
        <span class="article-text">${a.text}</span>
        <span class="article-status" style="color:${c}">${icon} ${a.status}</span>
      </div>`;
    }).join("")}
  </div>

  <div class="section">
    <h2>Bias Flag Summary</h2>
    ${biasRows}
  </div>

  <div class="section">
    <h2>Decision Audit Log — ${total} decisions, ${periodLabel}</h2>
    <table>
      <thead><tr>
        <th>ID</th><th>Role</th><th>Stage</th><th>Reason</th><th>AI</th><th>Risk</th><th>Status</th><th>Bias flags</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  ${decisions.filter(d => d.status !== "clear").length > 0 ? `
  <div class="section">
    <h2>Flagged &amp; In-Review Decisions — Detail</h2>
    ${flaggedCards}
  </div>` : ""}

  <div class="section">
    <h2>Officer Declaration</h2>
    <p style="font-size:13px;color:#6B6B67;line-height:1.7;margin-bottom:20px;font-family:Arial,sans-serif">
      I confirm that the hiring decisions documented in this report were conducted in accordance with applicable EU AI Act obligations and Finnish non-discrimination law during the stated reporting period. All AI-assisted decisions have been logged with system identification, override records, and bias analysis results as required under Annex III, Article 13, and Article 26 of the EU AI Act.
    </p>
    <div class="sig-grid">
      ${[["HR Responsible Officer", officer], ["Company", company], ["Reporting Period", periodLabel], ["Date Signed", today]].map(([l, v]) =>
        `<div class="sig-box"><div class="sig-label">${l}</div><div class="sig-line"></div><div class="sig-val">${v}</div></div>`
      ).join("")}
    </div>
  </div>

  <div class="footer">
    <span>HireTrace &nbsp;·&nbsp; ${company} &nbsp;·&nbsp; ${today} &nbsp;·&nbsp; Confidential</span>
    <span>EU AI Act Compliance Documentation</span>
  </div>

  <div class="no-print print-btn-wrap">
    <button onclick="window.print()" style="background:#0A0A0A;color:#fff;border:none;padding:12px 28px;border-radius:7px;font-size:14px;cursor:pointer;font-family:Arial,sans-serif">
      ↓ Save as PDF (Ctrl+P / Cmd+P)
    </button>
    <div style="font-size:11px;color:#888;margin-top:8px;font-family:Arial,sans-serif">In the print dialog, choose "Save as PDF" as the destination</div>
  </div>
</div>
</body></html>`;
}

function openPrintWindow(html) {
  const w = window.open("", "_blank");
  if (!w) { alert("Pop-up blocked. Allow pop-ups for this site and try again."); return; }
  w.document.write(html);
  w.document.close();
  // slight delay so styles render before auto-print
  setTimeout(() => w.print(), 600);
}

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const T = {
  black:"#0A0A0A", white:"#FFFFFF", offwhite:"#F7F7F5",
  border:"#E4E4E0", borderLight:"#F0F0ED",
  textPrimary:"#0A0A0A", textSecondary:"#6B6B67", textTertiary:"#A8A8A4",
  red:"#E63946", redBg:"#FCEBEB", redText:"#A32D2D",
  amber:"#F4A261", amberBg:"#FAEEDA", amberText:"#854F0B",
  green:"#2DC653", greenBg:"#EAF3DE", greenText:"#3B6D11",
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:#F7F7F5;color:#0A0A0A}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#E4E4E0;border-radius:4px}
  select,input,textarea,button{font-family:'DM Sans',sans-serif}
  @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
  .fade{animation:fadeIn .25s ease forwards}
  .navitem:hover{background:#F7F7F5!important}
  .row-hover:hover{background:#F7F7F5!important}
  .btn-base:hover{opacity:.8}
`;

const Pill = ({color="gray",children,style={}}) => {
  const map={red:[T.redBg,T.redText],amber:[T.amberBg,T.amberText],green:[T.greenBg,T.greenText],gray:[T.offwhite,T.textSecondary]};
  const [bg,clr]=map[color]||map.gray;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:500,background:bg,color:clr,whiteSpace:"nowrap",...style}}>{children}</span>;
};
const Btn = ({children,primary,danger,success,ghost,small,onClick,disabled,style={}}) => {
  const base={display:"inline-flex",alignItems:"center",gap:5,padding:small?"4px 9px":"6px 13px",borderRadius:7,fontSize:small?11:12,cursor:disabled?"not-allowed":"pointer",border:`0.5px solid ${T.border}`,background:"#fff",color:T.textPrimary,fontFamily:"'DM Sans',sans-serif",transition:"opacity .15s",opacity:disabled?.5:1,...style};
  if(primary)Object.assign(base,{background:T.black,color:"#fff",border:`0.5px solid ${T.black}`});
  if(danger) Object.assign(base,{background:T.red,color:"#fff",border:`0.5px solid ${T.red}`});
  if(success)Object.assign(base,{background:T.green,color:"#fff",border:`0.5px solid ${T.green}`});
  if(ghost)  Object.assign(base,{background:"none",border:"none",color:T.textSecondary});
  return <button className="btn-base" onClick={onClick} disabled={disabled} style={base}>{children}</button>;
};
const Card = ({children,style={}}) => <div style={{background:"#fff",border:`0.5px solid ${T.border}`,borderRadius:12,padding:"16px 20px",marginBottom:12,...style}}>{children}</div>;
const Inp  = ({value,onChange,placeholder="",type="text",style={}}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",padding:"7px 10px",border:`0.5px solid ${T.border}`,borderRadius:7,fontSize:13,background:"#fff",color:T.textPrimary,outline:"none",...style}}/>
);
const Sel  = ({value,onChange,options=[],style={}}) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",padding:"7px 28px 7px 10px",border:`0.5px solid ${T.border}`,borderRadius:7,fontSize:13,background:"#fff",color:T.textPrimary,outline:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 9px center",...style}}>
    {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>
);
const FL = ({children,req}) => <div style={{fontSize:11,fontWeight:500,color:T.textSecondary,marginBottom:4}}>{children}{req&&<span style={{color:T.red,marginLeft:2}}>*</span>}</div>;
const ST = ({children}) => <div style={{fontSize:10,fontWeight:500,color:T.textTertiary,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>{children}</div>;

function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return <div className="fade" style={{position:"fixed",bottom:20,right:20,background:T.black,color:"#fff",padding:"10px 16px",borderRadius:8,fontSize:13,zIndex:9999,boxShadow:"0 4px 16px rgba(0,0,0,.18)"}}>{msg}</div>;
}
function Modal({children,onClose}){
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000}}>
    <div className="fade" style={{background:"#fff",borderRadius:14,padding:"24px 28px",maxWidth:480,width:"90%",maxHeight:"80vh",overflowY:"auto"}}>{children}</div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────
const SAMPLE = [
  {id:"C-0041",role:"HR Specialist",stage:"CV screening",date:"2026-05-12",reason:"Qualification gap",ai:false,justification:"Candidate lacked the required HRIS experience and held no relevant certification. Decision aligned with minimum qualification threshold.",status:"clear",riskScore:12,biasFlags:[],loggedBy:"M. Virtanen"},
  {id:"C-0040",role:"Data Analyst",stage:"First interview",date:"2026-05-12",reason:"Culture fit",ai:true,aiSystem:"Teamtailor AI",aiRec:"Advance",override:true,justification:"Candidate doesn't fit our team dynamic and comes from the wrong university background for our culture.",status:"flagged",riskScore:72,biasFlags:["Institution bias","Cultural proxy"],loggedBy:"M. Virtanen"},
  {id:"C-0039",role:"Software Engineer",stage:"Second interview",date:"2026-05-10",reason:"Overqualified",ai:true,aiSystem:"Recruitee Score",aiRec:"Advance",override:true,justification:"Candidate has 12 years of experience for a junior role. Concerned they would leave quickly.",status:"review",riskScore:41,biasFlags:["Age proxy (possible)"],loggedBy:"J. Korhonen"},
  {id:"C-0038",role:"Sales Lead",stage:"CV screening",date:"2026-05-09",reason:"Portfolio insufficient",ai:false,justification:"Portfolio did not demonstrate B2B SaaS sales experience required for the role.",status:"clear",riskScore:8,biasFlags:[],loggedBy:"M. Virtanen"},
  {id:"C-0037",role:"Marketing Manager",stage:"First interview",date:"2026-05-11",reason:"Culture fit",ai:true,aiSystem:"Teamtailor AI",aiRec:"Reject",override:false,justification:"Candidate's accent was difficult to understand and their presentation style felt too formal for our culture.",status:"flagged",riskScore:68,biasFlags:["National origin proxy","Cultural proxy"],loggedBy:"M. Virtanen"},
  {id:"C-0033",role:"UX Designer",stage:"Second interview",date:"2026-05-08",reason:"Culture fit",ai:false,justification:"Candidate seemed set in their ways and unlikely to adapt to our fast-moving startup environment.",status:"review",riskScore:41,biasFlags:["Age proxy (possible)"],loggedBy:"J. Korhonen"},
];

const NAV=[
  {id:"dashboard",icon:"⊞",label:"Dashboard",group:"main"},
  {id:"log",icon:"＋",label:"Log decision",group:"main"},
  {id:"auditlog",icon:"≡",label:"Audit log",group:"main"},
  {id:"escalation",icon:"⚠",label:"Escalation queue",group:"main",badge:true},
  {id:"report",icon:"↓",label:"Generate report",group:"compliance"},
  {id:"import",icon:"↑",label:"Import CSV",group:"compliance"},
];
const REASON_CHIPS=["Qualification gap","Experience level","Technical skills","Salary mismatch","Culture fit","Overqualified","Role filled internally","Communication skills","Portfolio insufficient","Other"];
const STAGES=["","CV screening","Phone screen","First interview","Second interview","Final round","Reference check"];

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({active,setActive,escalationCount}){
  const daysLeft=Math.ceil((new Date("2026-08-02")-new Date())/864e5);
  return(
    <aside style={{width:210,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,overflowY:"auto"}}>
      <div style={{padding:"16px 16px 14px",borderBottom:`0.5px solid ${T.border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:500}}>HireTrace<span style={{color:T.red}}>.</span></div>
        <div style={{fontSize:11,color:T.textTertiary,marginTop:2}}>Compliance workspace</div>
      </div>
      <nav style={{padding:"8px 6px",flex:1}}>
        {["main","compliance"].map(group=>(
          <div key={group}>
            <div style={{fontSize:10,fontWeight:500,color:T.textTertiary,padding:group==="main"?"8px 10px 4px":"12px 10px 4px",letterSpacing:".6px",textTransform:"uppercase"}}>{group==="main"?"Main":"Compliance"}</div>
            {NAV.filter(n=>n.group===group).map(item=>(
              <div key={item.id} className="navitem" onClick={()=>setActive(item.id)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,cursor:"pointer",fontSize:13,marginBottom:1,background:active===item.id?T.offwhite:"transparent",color:active===item.id?T.textPrimary:T.textSecondary,fontWeight:active===item.id?500:400,transition:"background .1s"}}>
                <span style={{fontSize:14,width:16,textAlign:"center"}}>{item.icon}</span>
                {item.label}
                {item.badge&&escalationCount>0&&<span style={{marginLeft:"auto",background:T.red,color:"#fff",fontSize:10,fontWeight:500,padding:"1px 6px",borderRadius:10}}>{escalationCount}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div style={{padding:"12px 16px",borderTop:`0.5px solid ${T.border}`}}>
        <div style={{fontSize:11,color:T.textSecondary}}>EU AI Act deadline</div>
        <div style={{fontSize:13,fontWeight:500,color:T.red,marginTop:2}}>Aug 2, 2026 — {daysLeft} days</div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
function Dashboard({decisions,setActive}){
  const total=decisions.length,flagged=decisions.filter(d=>d.status==="flagged").length;
  const escalations=decisions.filter(d=>d.status==="flagged"||d.status==="review").length;
  const clear=decisions.filter(d=>d.status==="clear").length,readiness=Math.round((clear/total)*100);
  const biasTypes={};decisions.forEach(d=>d.biasFlags.forEach(f=>{biasTypes[f]=(biasTypes[f]||0)+1;}));
  const stats=[
    {label:"Total decisions",value:total,sub:"+8 vs last month",subColor:T.green},
    {label:"Flagged (bias risk)",value:flagged,sub:`${Math.round((flagged/total)*100)}% flag rate`,subColor:T.red,vc:T.red},
    {label:"Escalations pending",value:escalations,sub:"Awaiting HR review",subColor:T.amber,vc:T.amber},
    {label:"Audit readiness",value:`${readiness}%`,sub:`${total-clear} items need attention`,subColor:T.amber,vc:readiness>80?T.green:T.amber},
  ];
  const checklist=[
    {done:true,text:"Decision logging active",sub:"All rejections timestamped"},
    {done:true,text:"Bias analysis on file",sub:"Attached to each record"},
    {done:escalations===0,warn:escalations>0,text:escalations>0?`${escalations} escalations unresolved`:"Escalation workflow clear",sub:escalations>0?"Review required before audit":"All flagged decisions reviewed"},
    {done:false,warn:true,text:"Audit report not generated",sub:"Required for Article 13 documentation"},
  ];
  return(
    <div className="fade">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400}}>Hiring compliance overview</div>
          <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>Turku HQ · {total} decisions logged this period</div>
        </div>
        <Btn primary onClick={()=>setActive("log")}>＋ Log decision</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {stats.map((s,i)=>(
          <div key={i} onClick={()=>{if(i===2)setActive("escalation");else if(i===0)setActive("auditlog");}}
            style={{background:"#fff",border:`0.5px solid ${T.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 0 2px ${T.border}`}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{fontSize:11,color:T.textSecondary,marginBottom:5}}>{s.label}</div>
            <div style={{fontSize:24,fontWeight:500,lineHeight:1,color:s.vc||T.textPrimary}}>{s.value}</div>
            <div style={{fontSize:11,color:s.subColor||T.textSecondary,marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:12,marginBottom:12}}>
        <Card style={{marginBottom:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:500}}>Recent decisions</div>
            <span onClick={()=>setActive("auditlog")} style={{fontSize:12,color:T.textSecondary,cursor:"pointer"}}>View all →</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["ID","Role","Reason","AI","Status"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,fontWeight:500,color:T.textTertiary,textTransform:"uppercase",letterSpacing:".4px",paddingBottom:7,borderBottom:`0.5px solid ${T.border}`}}>{h}</th>)}</tr></thead>
            <tbody>{decisions.slice(0,5).map((d,i)=>(
              <tr key={i} className="row-hover" style={{cursor:"pointer"}} onClick={()=>setActive("auditlog")}>
                <td style={{padding:"8px 0",borderBottom:`0.5px solid ${T.borderLight}`,fontFamily:"'DM Mono',monospace",fontSize:11,color:T.textSecondary}}>{d.id}</td>
                <td style={{padding:"8px 0",borderBottom:`0.5px solid ${T.borderLight}`}}>{d.role}</td>
                <td style={{padding:"8px 0",borderBottom:`0.5px solid ${T.borderLight}`,fontSize:11,color:T.textSecondary}}>{d.reason}</td>
                <td style={{padding:"8px 0",borderBottom:`0.5px solid ${T.borderLight}`}}><Pill color={d.ai?"amber":"gray"}>{d.ai?"Yes":"No"}</Pill></td>
                <td style={{padding:"8px 0",borderBottom:`0.5px solid ${T.borderLight}`}}><Pill color={d.status==="clear"?"green":d.status==="flagged"?"red":"amber"}>{d.status==="clear"?"✓ Clear":d.status==="flagged"?"⚠ Flagged":"↻ Review"}</Pill></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{marginBottom:0}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Bias breakdown</div>
            {Object.entries(biasTypes).length===0?<div style={{fontSize:13,color:T.textSecondary}}>No bias flags.</div>:Object.entries(biasTypes).map(([type,count],i)=>(
              <div key={i} style={{marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSecondary,marginBottom:2}}><span>{type}</span><span style={{fontWeight:500,color:T.textPrimary}}>{count}</span></div>
                <div style={{height:3,background:T.offwhite,borderRadius:4}}><div style={{height:"100%",background:T.red,borderRadius:4,width:`${(count/Math.max(flagged,1))*100}%`}}/></div>
              </div>
            ))}
          </Card>
          <Card style={{marginBottom:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
              <div style={{fontSize:14,fontWeight:500}}>Escalation queue</div>
              <span style={{fontSize:11,color:T.red,fontWeight:500}}>{escalations} pending</span>
            </div>
            {decisions.filter(d=>d.status==="flagged"||d.status==="review").slice(0,3).map((d,i)=>(
              <div key={i} style={{padding:"8px 0",borderBottom:i<2?`0.5px solid ${T.borderLight}`:"none"}}>
                <div style={{fontSize:13,fontWeight:500}}>{d.id} · {d.role}</div>
                <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>Logged by {d.loggedBy}</div>
                <div style={{marginTop:4}}>{d.biasFlags.map((f,j)=><Pill key={j} color="red" style={{marginRight:4,fontSize:10}}>⚠ {f}</Pill>)}</div>
              </div>
            ))}
            <div style={{marginTop:10,paddingTop:10,borderTop:`0.5px solid ${T.borderLight}`}}>
              <Btn small onClick={()=>setActive("escalation")}>View escalation queue →</Btn>
            </div>
          </Card>
        </div>
      </div>
      <Card>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:500}}>EU AI Act compliance checklist</div>
          <span onClick={()=>setActive("report")} style={{fontSize:12,color:T.textSecondary,cursor:"pointer"}}>Generate report →</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px 24px"}}>
          {checklist.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8}}>
              <span style={{fontSize:15,flexShrink:0,color:item.done?T.green:item.warn?T.amber:T.red}}>{item.done?"✓":item.warn?"⚠":"✗"}</span>
              <div><div style={{fontSize:13,fontWeight:500}}>{item.text}</div><div style={{fontSize:11,color:T.textSecondary}}>{item.sub}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Log Decision
// ─────────────────────────────────────────────────────────────
function LogDecision({onSubmit,setActive}){
  const [form,setForm]=useState({candidateId:"",role:"",stage:"",date:"",ai:false,aiSystem:"",aiRec:"",override:"",reasons:[],justification:""});
  const [analysis,setAnalysis]=useState("idle");
  const [submitted,setSubmitted]=useState(null);
  const timerRef=useRef(null);
  const wordCount=form.justification.trim().split(/\s+/).filter(w=>w).length;
  const handleJustification=val=>{
    setForm(f=>({...f,justification:val}));
    const wc=val.trim().split(/\s+/).filter(w=>w).length;
    clearTimeout(timerRef.current);
    if(wc<8){setAnalysis("idle");return;}
    if(analysis==="done")return;
    setAnalysis("analyzing");
    timerRef.current=setTimeout(()=>setAnalysis("done"),2200);
  };
  const toggleReason=r=>setForm(f=>({...f,reasons:f.reasons.includes(r)?f.reasons.filter(x=>x!==r):[...f.reasons,r]}));
  const handleSubmit=()=>{
    const id="C-"+String(Math.floor(Math.random()*8000)+1000);
    onSubmit({id,role:form.role||"Unknown role",stage:form.stage||"CV screening",date:form.date||new Date().toISOString().split("T")[0],reason:form.reasons[0]||"Other",ai:form.ai,aiSystem:form.aiSystem,aiRec:form.aiRec,override:form.override==="Yes — manager rejected despite AI advance",justification:form.justification,status:analysis==="done"?"flagged":"clear",riskScore:analysis==="done"?72:8,biasFlags:analysis==="done"?["Institution bias","Cultural proxy"]:[],loggedBy:"M. Virtanen"});
    setSubmitted(id);
  };
  if(submitted)return(
    <div className="fade" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:12,textAlign:"center"}}>
      <div style={{fontSize:40,color:T.green}}>✓</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Decision logged</div>
      <div style={{fontSize:13,color:T.textSecondary}}>Record {submitted} added to the audit log.</div>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn onClick={()=>{setSubmitted(null);setForm({candidateId:"",role:"",stage:"",date:"",ai:false,aiSystem:"",aiRec:"",override:"",reasons:[],justification:""});setAnalysis("idle");}}>Log another</Btn>
        <Btn primary onClick={()=>setActive("auditlog")}>View in audit log →</Btn>
      </div>
    </div>
  );
  return(
    <div className="fade">
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400}}>Log a rejection decision</div>
        <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>Fields marked <span style={{color:T.red}}>*</span> required for EU AI Act compliance.</div>
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Candidate details</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><FL req>Candidate ID</FL><Inp value={form.candidateId} onChange={v=>setForm(f=>({...f,candidateId:v}))} placeholder="e.g. C-0042" style={{fontFamily:"'DM Mono',monospace"}}/><div style={{fontSize:10,color:T.textTertiary,marginTop:2}}>Use ATS reference. No names stored.</div></div>
          <div><FL req>Role applied for</FL><Inp value={form.role} onChange={v=>setForm(f=>({...f,role:v}))} placeholder="e.g. Data Analyst"/></div>
          <div><FL req>Hiring stage</FL><Sel value={form.stage} onChange={v=>setForm(f=>({...f,stage:v}))} options={STAGES}/></div>
          <div><FL req>Decision date</FL><Inp type="date" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}/></div>
        </div>
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>AI system involvement</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0"}}>
          <div><div style={{fontSize:13}}>Was an AI tool used in this decision?</div><div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>CV screeners, ranking tools, ATS scoring, video analysis</div></div>
          <div onClick={()=>setForm(f=>({...f,ai:!f.ai}))} style={{width:34,height:18,borderRadius:18,background:form.ai?T.black:T.border,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
            <div style={{position:"absolute",width:12,height:12,background:"#fff",borderRadius:"50%",top:3,left:form.ai?18:3,transition:"left .2s"}}/>
          </div>
        </div>
        {form.ai&&(
          <div style={{marginTop:10,paddingTop:12,borderTop:`0.5px solid ${T.border}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><FL req>AI system name</FL><Inp value={form.aiSystem} onChange={v=>setForm(f=>({...f,aiSystem:v}))} placeholder="e.g. Teamtailor AI"/></div>
            <div><FL>AI recommendation</FL><Sel value={form.aiRec} onChange={v=>setForm(f=>({...f,aiRec:v}))} options={["","Advance candidate","Reject candidate","No recommendation given"]}/></div>
            <div style={{gridColumn:"1/-1"}}><FL>Did the manager override the AI?</FL><Sel value={form.override} onChange={v=>setForm(f=>({...f,override:v}))} options={["","Yes — manager rejected despite AI advance","Yes — manager advanced despite AI reject","No — decision aligned with AI","Not applicable"]}/></div>
          </div>
        )}
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:500,marginBottom:3}}>Rejection reason</div>
        <div style={{fontSize:11,color:T.textSecondary,marginBottom:12}}>Select all that apply</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {REASON_CHIPS.map(r=><div key={r} onClick={()=>toggleReason(r)} style={{padding:"4px 11px",borderRadius:20,border:`0.5px solid ${form.reasons.includes(r)?T.black:T.border}`,fontSize:12,cursor:"pointer",background:form.reasons.includes(r)?T.black:"#fff",color:form.reasons.includes(r)?"#fff":T.textSecondary,transition:"all .12s"}}>{r}</div>)}
        </div>
        <FL req>Justification — in your own words</FL>
        <textarea value={form.justification} onChange={e=>handleJustification(e.target.value)} placeholder="Describe why this candidate was not progressed..." style={{width:"100%",padding:"9px 11px",border:`0.5px solid ${T.border}`,borderRadius:7,fontSize:13,fontFamily:"'DM Sans',sans-serif",minHeight:85,resize:"vertical",outline:"none",lineHeight:1.6,color:T.textPrimary}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:10,color:T.textTertiary}}><span>Minimum 30 words recommended</span><span>{wordCount} words</span></div>
      </Card>
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:500,marginBottom:12}}>🛡 Bias analysis <Pill color="red" style={{fontSize:10}}>Claude API</Pill></div>
        {analysis==="idle"&&<div style={{padding:14,textAlign:"center",border:`0.5px dashed ${T.border}`,borderRadius:8,color:T.textTertiary,fontSize:13}}>Analysis runs automatically as you type.</div>}
        {analysis==="analyzing"&&<div style={{display:"flex",alignItems:"center",gap:10,padding:12,fontSize:13,color:T.textSecondary}}>{[0,.2,.4].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.black,animation:`pulse 1s ${d}s ease-in-out infinite`}}/>)}Analyzing for bias indicators...</div>}
        {analysis==="done"&&(
          <div>
            <div style={{border:`0.5px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{padding:"9px 13px",background:T.offwhite,borderBottom:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:500,color:T.redText}}>⚠ 2 bias indicators detected</span>
                <span style={{fontSize:12,color:T.textSecondary}}>Risk score: <strong style={{color:T.red}}>72 / 100</strong></span>
              </div>
              <div style={{padding:13}}>
                {[{type:"Institution bias",text:'The phrase "wrong university background" suggests assessment on institution rather than demonstrated competency.'},{type:"Cultural proxy",text:'"Team dynamic" without objective criteria may function as a proxy for cultural or ethnic background.'}].map((flag,i)=>(
                  <div key={i} style={{display:"flex",gap:9,paddingBottom:i===0?10:0,marginBottom:i===0?10:0,borderBottom:i===0?`0.5px solid ${T.borderLight}`:"none"}}>
                    <span style={{color:T.red,flexShrink:0}}>⚠</span>
                    <div><div style={{fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",color:T.redText,marginBottom:2}}>{flag.type}</div><div style={{fontSize:12,color:T.textSecondary,lineHeight:1.5}}>{flag.text}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:T.amberBg,border:`0.5px solid ${T.amber}`,borderRadius:8,padding:"9px 13px",display:"flex",gap:8,marginTop:10,fontSize:13,color:T.amberText}}>→ This decision will be routed to the escalation queue for HR review.</div>
          </div>
        )}
      </Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4}}>
        <Btn ghost onClick={()=>setActive("dashboard")}>← Cancel</Btn>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>window.__toast?.("Draft saved")}>Save draft</Btn>
          <Btn primary onClick={handleSubmit}>✓ Submit decision</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Audit Log — with working ↓ Export PDF per record
// ─────────────────────────────────────────────────────────────
function AuditLog({decisions,setActive,onUpdate,showToast}){
  const [expanded,setExpanded]=useState(null);
  const [statusFilter,setStatusFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(0);
  const [editModal,setEditModal]=useState(null);
  const PER_PAGE=5;
  const filtered=decisions.filter(d=>{
    const ms=statusFilter==="all"||d.status===statusFilter;
    const mq=d.id.toLowerCase().includes(search.toLowerCase())||d.role.toLowerCase().includes(search.toLowerCase());
    return ms&&mq;
  });
  const totalPages=Math.ceil(filtered.length/PER_PAGE);
  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);

  const exportCSV=data=>{
    const header=["ID","Role","Stage","Date","Reason","AI used","Risk score","Status","Bias flags","Logged by"];
    const rows=data.map(d=>[d.id,d.role,d.stage,d.date,d.reason,d.ai?"Yes":"No",d.riskScore,d.status,d.biasFlags.join("; "),d.loggedBy]);
    const csv=[header,...rows].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=`hiretrace_audit_${new Date().toISOString().split("T")[0]}.csv`;a.click();
    showToast("CSV downloaded ✓");
  };

  const handleRecordPDF = (d) => {
    openPrintWindow(recordHTML(d));
    showToast(`Print window opened for ${d.id}`);
  };

  return(
    <div className="fade">
      {editModal&&<EditModal decision={editModal} onSave={updated=>{onUpdate(updated);setEditModal(null);showToast("Record updated ✓");}} onClose={()=>setEditModal(null)}/>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400}}>Audit log</div>
          <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{decisions.length} decisions · {decisions.filter(d=>d.status==="flagged").length} flagged</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>exportCSV(decisions)}>↓ Export CSV</Btn>
          <Btn primary onClick={()=>setActive("report")}>↓ Generate report</Btn>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 11px",border:`0.5px solid ${T.border}`,borderRadius:7,background:"#fff",flex:1}}>
          <span style={{color:T.textTertiary}}>⌕</span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search by ID or role..." style={{border:"none",outline:"none",fontSize:13,background:"transparent",width:"100%",fontFamily:"'DM Sans',sans-serif",color:T.textPrimary}}/>
        </div>
        <Sel value={statusFilter} onChange={v=>{setStatusFilter(v);setPage(0);}} options={[{value:"all",label:"All statuses"},{value:"clear",label:"Clear"},{value:"flagged",label:"Flagged"},{value:"review",label:"In review"}]} style={{width:"auto"}}/>
      </div>
      <div style={{background:"#fff",border:`0.5px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"85px 1fr 110px 80px 90px 110px 24px",padding:"9px 14px",background:T.offwhite,borderBottom:`0.5px solid ${T.border}`}}>
          {["ID","Role","Reason","AI","Risk","Status",""].map(h=><div key={h} style={{fontSize:10,fontWeight:500,color:T.textTertiary,textTransform:"uppercase",letterSpacing:".4px"}}>{h}</div>)}
        </div>
        {paged.length===0&&<div style={{padding:24,textAlign:"center",fontSize:13,color:T.textTertiary}}>No decisions match your filters.</div>}
        {paged.map((d,i)=>(
          <div key={d.id} style={{borderBottom:i<paged.length-1?`0.5px solid ${T.borderLight}`:"none"}}>
            <div className="row-hover" onClick={()=>setExpanded(expanded===d.id?null:d.id)}
              style={{display:"grid",gridTemplateColumns:"85px 1fr 110px 80px 90px 110px 24px",padding:"10px 14px",cursor:"pointer",alignItems:"center",background:expanded===d.id?T.offwhite:"transparent",transition:"background .1s"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.textSecondary}}>{d.id}</div>
              <div style={{fontSize:13}}>{d.role}</div>
              <div style={{fontSize:11,color:T.textSecondary}}>{d.reason}</div>
              <div><Pill color={d.ai?"amber":"gray"}>{d.ai?"Yes":"No"}</Pill></div>
              <div style={{fontSize:12,fontWeight:500,color:d.riskScore>60?T.red:d.riskScore>30?T.amber:T.green}}>{d.riskScore} / 100</div>
              <div><Pill color={d.status==="clear"?"green":d.status==="flagged"?"red":"amber"}>{d.status==="clear"?"✓ Clear":d.status==="flagged"?"⚠ Flagged":"↻ Review"}</Pill></div>
              <div style={{color:T.textTertiary,transition:"transform .2s",transform:expanded===d.id?"rotate(180deg)":"none"}}>∨</div>
            </div>
            {expanded===d.id&&(
              <div className="fade" style={{padding:"13px 16px 15px",background:T.offwhite,borderTop:`0.5px solid ${T.border}`}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px 20px"}}>
                  <div><ST>Justification</ST><div style={{background:"#fff",borderLeft:`2px solid ${T.red}`,padding:"7px 11px",borderRadius:"0 7px 7px 0",fontSize:12,color:T.textSecondary,lineHeight:1.6,fontStyle:"italic"}}>{d.justification}</div></div>
                  <div><ST>Bias indicators</ST>{d.biasFlags.length===0?<div style={{fontSize:13,color:T.green}}>✓ No bias indicators detected</div>:d.biasFlags.map((f,j)=><Pill key={j} color="red" style={{marginRight:4,marginBottom:3,display:"inline-flex"}}>⚠ {f}</Pill>)}</div>
                  <div><ST>Stage</ST><div style={{fontSize:13}}>{d.stage}</div></div>
                  <div><ST>Logged by</ST><div style={{fontSize:13}}>{d.loggedBy} · {d.date}</div></div>
                  {d.override&&<div style={{gridColumn:"1/-1"}}><ST>AI override</ST><div style={{fontSize:13,color:T.red}}>Yes — manager rejected despite AI advance</div></div>}
                </div>
                <div style={{display:"flex",gap:7,marginTop:10,paddingTop:10,borderTop:`0.5px solid ${T.border}`}}>
                  <Btn small onClick={()=>setEditModal(d)}>✎ Edit</Btn>
                  {d.status!=="clear"&&<Btn small onClick={()=>setActive("escalation")} style={{color:T.red,borderColor:T.red}}>→ View in queue</Btn>}
                  <Btn small onClick={()=>handleRecordPDF(d)}>↓ Export PDF</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderTop:`0.5px solid ${T.border}`,fontSize:12,color:T.textSecondary}}>
          <span>Showing {paged.length} of {filtered.length} · Page {page+1} / {Math.max(totalPages,1)}</span>
          <div style={{display:"flex",gap:7}}>
            <Btn small onClick={()=>{if(page>0)setPage(p=>p-1);else showToast("Already on first page");}}>← Prev</Btn>
            <Btn small onClick={()=>{if(page<totalPages-1)setPage(p=>p+1);else showToast("Already on last page");}}>Next →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({decision,onSave,onClose}){
  const [role,setRole]=useState(decision.role);
  const [justification,setJustification]=useState(decision.justification);
  return(
    <Modal onClose={onClose}>
      <div style={{fontSize:15,fontWeight:500,marginBottom:14}}>Edit record {decision.id}</div>
      <div style={{marginBottom:10}}><FL>Role</FL><Inp value={role} onChange={setRole}/></div>
      <div style={{marginBottom:16}}><FL>Justification</FL><textarea value={justification} onChange={e=>setJustification(e.target.value)} style={{width:"100%",padding:"8px 10px",border:`0.5px solid ${T.border}`,borderRadius:7,fontSize:13,fontFamily:"'DM Sans',sans-serif",minHeight:80,resize:"vertical",outline:"none",lineHeight:1.6,color:T.textPrimary}}/></div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={onClose}>Cancel</Btn><Btn primary onClick={()=>onSave({...decision,role,justification})}>Save changes</Btn></div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Escalation Queue
// ─────────────────────────────────────────────────────────────
function EscalationQueue({decisions,onResolve,setActive,showToast}){
  const [expanded,setExpanded]=useState(null);
  const [resolved,setResolved]=useState([]);
  const [chips,setChips]=useState({});
  const [notes,setNotes]=useState({});
  const [legalModal,setLegalModal]=useState(null);
  const pending=decisions.filter(d=>d.status==="flagged"||d.status==="review");
  const unresolvedCount=pending.filter(d=>!resolved.includes(d.id)).length;
  const handleResolve=d=>{
    if(!chips[d.id]){showToast("Select a reviewer decision first");return;}
    setResolved(r=>[...r,d.id]);onResolve(d.id);setExpanded(null);showToast("Escalation resolved ✓");
  };
  return(
    <div className="fade">
      {legalModal&&<Modal onClose={()=>setLegalModal(null)}><div style={{fontSize:15,fontWeight:500,marginBottom:10}}>Escalate to Legal</div><div style={{fontSize:13,color:T.textSecondary,marginBottom:16,lineHeight:1.6}}>Decision {legalModal.id} ({legalModal.role}) will be flagged as a legal escalation.</div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={()=>setLegalModal(null)}>Cancel</Btn><Btn danger onClick={()=>{showToast("Escalated to legal team ✓");setLegalModal(null);}}>Confirm escalation</Btn></div></Modal>}
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400}}>Escalation queue</div>
        <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{unresolvedCount} decisions pending HR review</div>
      </div>
      {unresolvedCount===0&&<div style={{textAlign:"center",padding:48,background:"#fff",borderRadius:12,border:`0.5px solid ${T.border}`,marginBottom:12}}><div style={{fontSize:32,marginBottom:10,color:T.green}}>✓</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:18}}>All escalations resolved</div><div style={{fontSize:13,color:T.textSecondary,marginTop:4}}>Audit report is ready to generate.</div><div style={{marginTop:14}}><Btn primary onClick={()=>setActive("report")}>→ Generate report</Btn></div></div>}
      {pending.map(d=>{
        const isResolved=resolved.includes(d.id),isOpen=expanded===d.id;
        return(
          <div key={d.id} style={{background:"#fff",border:`0.5px solid ${T.border}`,borderRadius:12,marginBottom:10,overflow:"hidden",opacity:isResolved?.45:1,transition:"opacity .3s"}}>
            <div onClick={()=>{if(!isResolved)setExpanded(isOpen?null:d.id);}} style={{padding:"14px 18px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",cursor:isResolved?"default":"pointer"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:d.riskScore>60?T.redBg:T.amberBg,color:d.riskScore>60?T.redText:T.amberText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,flexShrink:0}}>{d.riskScore}</div>
                <div>
                  <div style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:T.textSecondary,marginBottom:2}}>{d.id} · {d.role} · {d.stage}</div>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:5}}>Logged by {d.loggedBy} · {d.date}</div>
                  <div>{d.biasFlags.map((f,j)=><Pill key={j} color={d.riskScore>60?"red":"amber"} style={{marginRight:4,fontSize:10}}>⚠ {f}</Pill>)}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                {isResolved?<Pill color="green">✓ Resolved</Pill>:<Pill color={d.riskScore>60?"red":"amber"}>Pending</Pill>}
              </div>
            </div>
            {isOpen&&!isResolved&&(
              <div className="fade" style={{borderTop:`0.5px solid ${T.border}`,padding:"16px 18px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div><ST>Rejection justification</ST><div style={{background:T.offwhite,borderLeft:`2px solid ${T.red}`,padding:"8px 12px",borderRadius:"0 7px 7px 0",fontSize:12,color:T.textSecondary,lineHeight:1.6,fontStyle:"italic"}}>{d.justification}</div></div>
                  <div><ST>Bias flags</ST><div style={{background:T.offwhite,borderRadius:8,padding:"11px 13px"}}>{d.biasFlags.map((f,j)=><div key={j} style={{display:"flex",gap:7,marginBottom:j<d.biasFlags.length-1?9:0}}><span style={{color:d.riskScore>60?T.red:T.amber}}>⚠</span><div style={{fontSize:11,color:T.textSecondary}}>{f}</div></div>)}</div></div>
                </div>
                <div style={{borderTop:`0.5px solid ${T.border}`,paddingTop:14}}>
                  <div style={{fontSize:12,fontWeight:500,marginBottom:8}}>HR reviewer decision <span style={{color:T.red}}>*</span></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                    {["Justified — bias flag incorrect","Partially justified — add context","Not justified — decision at risk","Escalate to legal"].map(opt=>(
                      <div key={opt} onClick={()=>setChips(c=>({...c,[d.id]:opt}))} style={{padding:"5px 11px",borderRadius:7,border:`0.5px solid ${chips[d.id]===opt?T.black:T.border}`,fontSize:12,cursor:"pointer",background:chips[d.id]===opt?T.black:"#fff",color:chips[d.id]===opt?"#fff":T.textSecondary,transition:"all .12s"}}>{opt}</div>
                    ))}
                  </div>
                  <textarea value={notes[d.id]||""} onChange={e=>setNotes(n=>({...n,[d.id]:e.target.value}))} placeholder="Add reviewer notes..." style={{width:"100%",padding:"8px 11px",border:`0.5px solid ${T.border}`,borderRadius:7,fontSize:13,fontFamily:"'DM Sans',sans-serif",minHeight:65,resize:"vertical",outline:"none",lineHeight:1.6,color:T.textPrimary,marginBottom:10}}/>
                  <div style={{display:"flex",gap:8}}>
                    <Btn success onClick={()=>handleResolve(d)}>✓ Resolve and close</Btn>
                    <Btn danger onClick={()=>setLegalModal(d)}>⚖ Escalate to legal</Btn>
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

// ─────────────────────────────────────────────────────────────
// CSV Import
// ─────────────────────────────────────────────────────────────
function CSVImport({onImport,setActive,showToast}){
  const [step,setStep]=useState(1);const [progress,setProgress]=useState(0);const [analyzing,setAnalyzing]=useState(false);const [done,setDone]=useState(false);const [showPreview,setShowPreview]=useState(false);
  const STEPS=["Upload file","Map columns","Run analysis","Review & import"];
  const runAnalysis=()=>{setAnalyzing(true);let p=0;const iv=setInterval(()=>{p+=2.5;setProgress(Math.min(p,100));if(p>=100){clearInterval(iv);setTimeout(()=>{setAnalyzing(false);setDone(true);setStep(4);},400);}},80);};
  const previewData=[{id:"C-0050",role:"Backend Engineer",reason:"Experience mismatch",status:"clear"},{id:"C-0051",role:"Product Manager",reason:"Culture fit",status:"flagged"},{id:"C-0052",role:"QA Engineer",reason:"Qualification gap",status:"clear"},{id:"C-0053",role:"DevOps Lead",reason:"Salary mismatch",status:"clear"}];
  return(
    <div className="fade">
      <div style={{marginBottom:18}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400}}>Import from ATS</div><div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>Export rejections from your ATS, upload here, map columns, run batch analysis.</div></div>
      <div style={{display:"flex",alignItems:"center",marginBottom:22}}>
        {STEPS.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"initial"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,background:i<step?T.green:i===step-1?T.black:T.border,color:i<=step-1?"#fff":T.textTertiary}}>{i<step-1?"✓":i+1}</div>
              <span style={{fontSize:12,color:i===step-1?T.textPrimary:T.textTertiary}}>{s}</span>
            </div>
            {i<STEPS.length-1&&<div style={{flex:1,height:".5px",background:T.border,margin:"0 10px"}}/>}
          </div>
        ))}
      </div>
      <Card><div style={{fontSize:14,fontWeight:500,marginBottom:10}}>Uploaded file</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:T.offwhite,borderRadius:8}}><div style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:18,color:T.green}}>⊞</span><div><div style={{fontSize:13,fontWeight:500}}>teamtailor_rejections_may2026.csv</div><div style={{fontSize:11,color:T.textSecondary}}>47 rows · 6 columns · 18 KB</div></div></div><Btn small onClick={()=>showToast("File removed")}>✕ Remove</Btn></div>{step===1&&<div style={{marginTop:12}}><Btn primary onClick={()=>setStep(2)}>Next: Map columns →</Btn></div>}</Card>
      {step>=2&&<Card><div style={{fontSize:14,fontWeight:500,marginBottom:3}}>Column mapping</div><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["HireTrace field","CSV column"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,fontWeight:500,color:T.textTertiary,textTransform:"uppercase",letterSpacing:".4px",paddingBottom:7,borderBottom:`0.5px solid ${T.border}`}}>{h}</th>)}</tr></thead><tbody>{[{label:"Candidate ID",req:true,opts:["candidate_id","id"]},{label:"Role applied for",req:true,opts:["job_title","position"]},{label:"Rejection reason",req:true,opts:["rejection_note","notes"]},{label:"Decision date",req:true,opts:["rejected_at","date"]},{label:"Hiring stage",opts:["stage_name","-- skip --"]},{label:"AI tool used",opts:["-- skip --","ai_screening"]}].map((row,i)=><tr key={i}><td style={{padding:"9px 0",borderBottom:`0.5px solid ${T.borderLight}`}}><div style={{fontSize:13,fontWeight:500}}>{row.label}{row.req&&<span style={{color:T.red,marginLeft:2}}>*</span>}</div></td><td style={{padding:"9px 0 9px 14px",borderBottom:`0.5px solid ${T.borderLight}`}}><Sel value={row.opts[0]} onChange={()=>{}} options={row.opts} style={{width:"auto",minWidth:180}}/></td></tr>)}</tbody></table>{step===2&&<div style={{marginTop:14,display:"flex",gap:8}}><Btn onClick={()=>setStep(1)}>← Back</Btn><Btn primary onClick={()=>setStep(3)}>Next: Run analysis →</Btn></div>}</Card>}
      {step>=3&&<Card><div style={{fontSize:14,fontWeight:500,marginBottom:3}}>Batch analysis</div>{!analyzing&&!done&&<div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:14}}>{[["Rows to analyze","47"],["Est. API cost","~€0.08"],["Est. time","~45s"]].map(([l,v])=><div key={l} style={{background:T.offwhite,borderRadius:8,padding:"11px 13px"}}><div style={{fontSize:11,color:T.textSecondary,marginBottom:3}}>{l}</div><div style={{fontSize:18,fontWeight:500}}>{v}</div></div>)}</div><div style={{display:"flex",gap:8}}><Btn onClick={()=>setStep(2)}>← Back</Btn><Btn primary onClick={runAnalysis}>🛡 Run batch analysis</Btn></div></div>}{analyzing&&<div><div style={{fontSize:12,color:T.textSecondary,marginBottom:6}}>Analyzing row {Math.round(progress/100*47)} of 47...</div><div style={{height:4,background:T.offwhite,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:T.black,borderRadius:4,width:`${progress}%`,transition:"width .1s"}}/></div></div>}{done&&<div className="fade"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:12}}>{[["Analyzed","47",T.textPrimary,T.offwhite],["Clear","34",T.greenText,T.greenBg],["Flagged","13",T.redText,T.redBg]].map(([l,v,c,bg])=><div key={l} style={{background:bg,borderRadius:8,padding:"11px 13px"}}><div style={{fontSize:11,color:c,marginBottom:3}}>{l}</div><div style={{fontSize:18,fontWeight:500,color:c}}>{v}</div></div>)}</div><Btn onClick={()=>setShowPreview(p=>!p)}>👁 {showPreview?"Hide":"Preview"} results</Btn>{showPreview&&<div style={{marginTop:10,border:`0.5px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>{previewData.map((pd,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"9px 13px",borderBottom:i<previewData.length-1?`0.5px solid ${T.borderLight}`:"none",fontSize:12}}><span style={{fontFamily:"'DM Mono',monospace",color:T.textSecondary}}>{pd.id}</span><span style={{flex:1}}>{pd.role}</span><Pill color={pd.status==="flagged"?"red":"green"}>{pd.status==="flagged"?"⚠ Flagged":"✓ Clear"}</Pill></div>)}</div>}<div style={{marginTop:12}}><Btn primary onClick={()=>{onImport();showToast("47 decisions imported ✓");setTimeout(()=>setActive("auditlog"),1000);}}>↓ Import 47 decisions</Btn></div></div>}</Card>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Generate Report — with working PDF export
// ─────────────────────────────────────────────────────────────
function GenerateReport({decisions,setActive,showToast}){
  const [dateFrom,setDateFrom]=useState("2026-04-14");
  const [dateTo,setDateTo]=useState("2026-05-13");
  const [company,setCompany]=useState("Acme Oy");
  const [officer,setOfficer]=useState("Mia Virtanen, HR Manager");
  const [include,setInclude]=useState("all");
  const [emailModal,setEmailModal]=useState(false);
  const [emailTo,setEmailTo]=useState("mia.virtanen@acme.fi, legal@acme.fi");
  const [emailBody,setEmailBody]=useState("Please find attached the HireTrace EU AI Act audit report.");

  const filtered=decisions.filter(d=>{
    const dd=new Date(d.date);
    if(dateFrom&&dd<new Date(dateFrom))return false;
    if(dateTo&&dd>new Date(dateTo))return false;
    if(include==="flagged"&&d.status==="clear")return false;
    return true;
  });
  const total=filtered.length,flagged=filtered.filter(d=>d.status==="flagged").length;
  const clear=filtered.filter(d=>d.status==="clear").length,unresolved=filtered.filter(d=>d.status!=="clear").length;
  const readiness=total>0?Math.round((clear/total)*100):0;
  const biasTypes={};filtered.forEach(d=>d.biasFlags.forEach(f=>{biasTypes[f]=(biasTypes[f]||0)+1;}));
  const articles=[
    {ref:"Art. 13",text:"Transparency — decision logging with timestamps, candidate IDs, rejection justifications, and responsible officer on file.",status:"Met",color:T.green},
    {ref:"Art. 14",text:"Human oversight — escalation workflow active. Flagged decisions reviewed by HR before finalization.",status:unresolved>0?"Partial":"Met",color:unresolved>0?T.amber:T.green},
    {ref:"Art. 26",text:"Deployer obligations — AI system register documented. Override decisions logged and flagged.",status:"Met",color:T.green},
    {ref:"Ann. III",text:"High-risk AI in employment — bias analysis records attached to each AI-assisted decision.",status:unresolved>0?"Partial":"Met",color:unresolved>0?T.amber:T.green},
  ];

  const handleDownloadPDF=()=>{
    if(filtered.length===0){showToast("No decisions match the selected date range");return;}
    openPrintWindow(reportHTML(filtered,dateFrom,dateTo,company,officer));
    showToast("Print window opened — save as PDF from the print dialog");
  };

  return(
    <div className="fade">
      {emailModal&&(
        <Modal onClose={()=>setEmailModal(false)}>
          <div style={{fontSize:15,fontWeight:500,marginBottom:14}}>Send report by email</div>
          <div style={{marginBottom:10}}><FL>Recipients</FL><Inp value={emailTo} onChange={setEmailTo}/></div>
          <div style={{marginBottom:16}}><FL>Message</FL><textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)} style={{width:"100%",padding:"8px 10px",border:`0.5px solid ${T.border}`,borderRadius:7,fontSize:13,fontFamily:"'DM Sans',sans-serif",minHeight:70,resize:"vertical",outline:"none",lineHeight:1.6,color:T.textPrimary}}/></div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn onClick={()=>setEmailModal(false)}>Cancel</Btn><Btn primary onClick={()=>{showToast("Report sent ✓");setEmailModal(false);}}>Send report</Btn></div>
        </Modal>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400}}>EU AI Act audit report</div>
          <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>Configure scope, preview, and export as PDF.</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setEmailModal(true)}>✉ Send by email</Btn>
          <Btn primary onClick={handleDownloadPDF}>↓ Download PDF</Btn>
        </div>
      </div>

      <Card>
        <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Report settings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><FL req>Date from</FL><Inp type="date" value={dateFrom} onChange={setDateFrom}/></div>
          <div><FL req>Date to</FL><Inp type="date" value={dateTo} onChange={setDateTo}/></div>
          <div><FL>Company name</FL><Inp value={company} onChange={setCompany}/></div>
          <div><FL>Responsible officer</FL><Inp value={officer} onChange={setOfficer}/></div>
          <div style={{gridColumn:"1/-1"}}><FL>Include in report</FL><Sel value={include} onChange={setInclude} options={[{value:"all",label:"All decisions (clear + flagged)"},{value:"flagged",label:"Flagged & in-review only"}]}/></div>
        </div>
        <div style={{marginTop:12,padding:"9px 12px",background:T.offwhite,borderRadius:8,fontSize:12,color:T.textSecondary,display:"flex",gap:16,flexWrap:"wrap"}}>
          <span><strong style={{color:T.textPrimary}}>{total}</strong> decisions match</span>
          <span style={{color:T.green}}><strong>{clear}</strong> clear</span>
          <span style={{color:T.red}}><strong>{flagged}</strong> flagged</span>
          <span style={{color:T.amber}}><strong>{unresolved}</strong> unresolved</span>
          <span style={{marginLeft:"auto",color:readiness>80?T.green:T.amber}}>Readiness: <strong>{readiness}%</strong></span>
        </div>
      </Card>

      {unresolved>0&&<div style={{background:T.amberBg,border:`0.5px solid ${T.amber}`,borderRadius:8,padding:"9px 13px",display:"flex",gap:8,fontSize:12,color:T.amberText,marginBottom:12}}>⚠ {unresolved} unresolved escalation{unresolved>1?"s":""}.{" "}<span onClick={()=>setActive("escalation")} style={{cursor:"pointer",textDecoration:"underline"}}>Resolve before finalising.</span></div>}

      {/* Live preview */}
      <div style={{border:`0.5px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{background:T.black,color:"#fff",padding:"18px 22px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:12,opacity:.5,marginBottom:8}}>HireTrace.</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,marginBottom:3}}>EU AI Act Hiring Decision Audit Report</div>
          <div style={{fontSize:11,opacity:.5,fontFamily:"'DM Mono',monospace"}}>{company} · Period: {dateFrom} – {dateTo} · Generated: {new Date().toLocaleDateString("en-FI")} · Ref: HT-{new Date().getFullYear()}-REPORT</div>
        </div>
        <div style={{padding:"18px 22px"}}>
          <div style={{marginBottom:18,paddingBottom:18,borderBottom:`0.5px solid ${T.border}`}}>
            <ST>Decision summary</ST>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9}}>
              {[["Total",""+total,T.textPrimary],["Clear",""+clear,T.green],["Flagged",""+flagged,T.red],["Unresolved",""+unresolved,T.amber]].map(([l,v,c])=>(
                <div key={l} style={{background:T.offwhite,borderRadius:8,padding:"9px 11px"}}>
                  <div style={{fontSize:20,fontWeight:500,color:c,lineHeight:1,marginBottom:2}}>{v}</div>
                  <div style={{fontSize:11,color:T.textSecondary}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:18,paddingBottom:18,borderBottom:`0.5px solid ${T.border}`}}>
            <ST>EU AI Act compliance mapping</ST>
            {articles.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:i<articles.length-1?9:0}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,padding:"2px 7px",background:T.offwhite,borderRadius:4,color:T.textSecondary,flexShrink:0}}>{a.ref}</span>
                <div style={{fontSize:12,color:T.textSecondary,lineHeight:1.5,flex:1}}>{a.text}</div>
                <span style={{fontSize:11,fontWeight:500,color:a.color,flexShrink:0}}>{a.status==="Met"?"✓":"⚠"} {a.status}</span>
              </div>
            ))}
          </div>
          <div style={{marginBottom:18,paddingBottom:18,borderBottom:`0.5px solid ${T.border}`}}>
            <ST>Bias flag summary</ST>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(biasTypes).length===0?<span style={{fontSize:13,color:T.green}}>✓ No bias flags detected</span>:Object.entries(biasTypes).map(([type,count])=><Pill key={type} color="red">{type} · {count} case{count>1?"s":""}</Pill>)}
            </div>
          </div>
          <div>
            <ST>Officer declaration</ST>
            <div style={{fontSize:12,color:T.textSecondary,lineHeight:1.6,marginBottom:12}}>I confirm that the hiring decisions documented in this report were conducted in accordance with applicable EU AI Act obligations and Finnish non-discrimination law during the stated reporting period.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["HR responsible officer",officer],["Date signed",new Date().toLocaleDateString("en-FI")]].map(([l,v])=>(
                <div key={l} style={{border:`0.5px solid ${T.border}`,borderRadius:8,padding:"11px 13px"}}>
                  <div style={{fontSize:10,color:T.textTertiary,marginBottom:9}}>{l}</div>
                  <div style={{borderBottom:`0.5px solid ${T.border}`,height:24,marginBottom:6}}/>
                  <div style={{fontSize:11,color:T.textSecondary}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{marginTop:12,padding:"14px 18px",background:T.black,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:"#fff"}}>Ready to export</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{total} decisions · {dateFrom} to {dateTo} · {company}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
          <Btn onClick={handleDownloadPDF} style={{background:"#fff",color:T.black,border:"none"}}>↓ Download PDF</Btn>
          <div style={{fontSize:10,color:"#888"}}>Opens print dialog → Save as PDF</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────
export default function App(){
  const [active,setActive]=useState("dashboard");
  const [decisions,setDecisions]=useState(SAMPLE);
  const [toast,setToast]=useState(null);
  const showToast=useCallback((msg)=>{setToast(null);setTimeout(()=>setToast(msg),10);},[]);
  window.__toast=showToast;
  const escalationCount=decisions.filter(d=>d.status==="flagged"||d.status==="review").length;
  const handleNewDecision=d=>setDecisions(prev=>[d,...prev]);
  const handleResolve=id=>setDecisions(prev=>prev.map(d=>d.id===id?{...d,status:"clear"}:d));
  const handleUpdate=updated=>setDecisions(prev=>prev.map(d=>d.id===updated.id?updated:d));
  const screens={
    dashboard: <Dashboard decisions={decisions} setActive={setActive}/>,
    log:       <LogDecision onSubmit={handleNewDecision} setActive={setActive}/>,
    auditlog:  <AuditLog decisions={decisions} setActive={setActive} onUpdate={handleUpdate} showToast={showToast}/>,
    escalation:<EscalationQueue decisions={decisions} onResolve={handleResolve} setActive={setActive} showToast={showToast}/>,
    report:    <GenerateReport decisions={decisions} setActive={setActive} showToast={showToast}/>,
    import:    <CSVImport onImport={()=>{}} setActive={setActive} showToast={showToast}/>,
  };
  return(
    <>
      <style>{globalCSS}</style>
      {toast&&<Toast key={toast+Date.now()} msg={toast} onDone={()=>setToast(null)}/>}
      <div style={{display:"flex",minHeight:"100vh",background:T.offwhite}}>
        <Sidebar active={active} setActive={setActive} escalationCount={escalationCount}/>
        <main style={{flex:1,padding:26,maxWidth:"calc(100vw - 210px)",overflowX:"hidden"}}>{screens[active]}</main>
      </div>
    </>
  );
}
