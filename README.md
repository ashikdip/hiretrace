# HireTrace

**EU AI Act hiring decision compliance workspace**

HireTrace is a prototype compliance tool for HR teams operating under the [EU AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689), which classifies AI-assisted hiring and recruitment as a **high-risk application** under Annex III. It provides structured logging, automated bias analysis, an escalation workflow, and audit-ready PDF reporting — all in a single React component with no backend required.

---

## What problem does it solve

The EU AI Act (in force August 2026) requires organisations using AI in hiring to:

- Maintain a complete log of AI-assisted decisions with justifications (Article 13)
- Ensure meaningful human oversight and document overrides (Article 14)
- Register AI systems used in employment decisions (Article 26)
- Attach bias analysis records to each AI-assisted rejection (Annex III)

Most HR teams currently have no tooling for this. Rejection decisions are logged in ATS notes fields, bias review is informal or absent, and audit documentation is assembled manually under pressure. HireTrace is a working prototype of what purpose-built compliance tooling looks like.

---

## Features

### Dashboard
Real-time overview of the compliance posture for the current period:
- Decision volume, flag rate, escalation count, audit readiness percentage
- Clickable stat cards linking to the relevant screen
- Bias breakdown chart (flagged bias types with frequency bars)
- Escalation queue preview (top 3 pending items)
- EU AI Act compliance checklist (4 items, live status)

### Log Decision
Structured form for logging a single rejection:
- Candidate ID (ATS reference, no personal names stored)
- Role, hiring stage, decision date
- AI system involvement toggle — when enabled, captures system name, AI recommendation, and whether the manager overrode the AI
- Rejection reason chips (multi-select)
- Free-text justification field
- **Bias analysis panel**: fires automatically after 8+ words are typed, simulates a Claude API call, and returns flagged bias indicators with risk score (0–100). High-risk decisions are automatically routed to the escalation queue.

### Audit Log
Searchable, filterable table of all logged decisions:
- Filter by status (Clear / Flagged / In Review) or free-text search
- Expand any row to see: full justification, bias indicators, stage, logged-by, AI override note
- Edit modal for inline corrections
- **↓ Export PDF** per record — opens a print-formatted page in a new tab, ready to save as PDF via the browser print dialog
- CSV export of the full log

### Escalation Queue
HR reviewer workflow for flagged and in-review decisions:
- Risk score badge (red = high risk, amber = medium)
- Expand to see: justification, bias analysis detail
- Four resolution options: Justified / Partially justified / Not justified / Escalate to legal
- Reviewer notes appended to the audit record
- Legal escalation modal with confirmation
- Resolved decisions fade out; queue shows clear state when empty

### Generate Report
Date-range filtered audit report with live preview and PDF export:
- Real date pickers (from / to) that filter the decision set in real time
- Live summary bar: matching count, clear/flagged/unresolved breakdown, readiness %
- Configurable company name and responsible officer (flows into PDF)
- Include selector: all decisions vs. flagged-only
- Unresolved escalation warning with link
- **↓ Download PDF**: generates a multi-section print-formatted HTML document — cover block, stat cards, EU AI Act compliance mapping (Art. 13/14/26/Ann. III), bias summary, full decision table, flagged detail cards, officer declaration with signature fields

### Import CSV
4-step wizard for batch importing rejections from an ATS export:
1. Upload — mock file shown (47 rows, 18 KB)
2. Map columns — match ATS field names to HireTrace fields
3. Run analysis — animated progress bar, simulated Claude API batch call
4. Review & import — results (clear/flagged counts), preview toggle, import action

---

## PDF export approach

PDF generation uses **browser-native printing** with no external dependencies:

```js
function openPrintWindow(html) {
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 600);
}
```

`recordHTML(d)` and `reportHTML(decisions, ...)` build fully self-contained HTML strings with inline styles optimised for `@media print`. The browser's print dialog opens automatically — the user selects "Save as PDF" as the destination. This approach works in every browser sandbox without CDN dependencies.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 (functional components, hooks) |
| Styling | Inline styles + CSS-in-JS string injection |
| State | `useState` / `useCallback` — no external store |
| Fonts | Google Fonts (Playfair Display, DM Sans, DM Mono) |
| PDF | Browser `window.print()` with print-formatted HTML |
| Data | In-memory sample data (6 decisions) — no backend |
| Build | Works as a Claude.ai artifact (single JSX file) |

No npm packages beyond React itself. No Tailwind, no component library, no bundler configuration needed to run in the Claude artifact sandbox.

---

## Design system

All colours, spacing, and typography are defined in a single token object at the top of the file:

```js
const T = {
  black: "#0A0A0A",   offwhite: "#F7F7F5",
  border: "#E4E4E0",  borderLight: "#F0F0ED",
  red: "#E63946",     redBg: "#FCEBEB",   redText: "#A32D2D",
  amber: "#F4A261",   amberBg: "#FAEEDA", amberText: "#854F0B",
  green: "#2DC653",   greenBg: "#EAF3DE", greenText: "#3B6D11",
  // ...
};
```

**Typefaces:**
- `Playfair Display` — headings, report titles, the wordmark
- `DM Sans` — all body text, UI labels, buttons
- `DM Mono` — candidate IDs, timestamps, monospace data

---

## Sample data

Six decisions are seeded on load to demonstrate all status states:

| ID | Role | Status | Risk | Bias flags |
|---|---|---|---|---|
| C-0041 | HR Specialist | Clear | 12 | — |
| C-0040 | Data Analyst | Flagged | 72 | Institution bias, Cultural proxy |
| C-0039 | Software Engineer | In Review | 41 | Age proxy (possible) |
| C-0038 | Sales Lead | Clear | 8 | — |
| C-0037 | Marketing Manager | Flagged | 68 | National origin proxy, Cultural proxy |
| C-0033 | UX Designer | In Review | 41 | Age proxy (possible) |

The flagged cases are intentionally realistic: justification text that invokes "wrong university background", "accent was difficult to understand", and "seemed set in their ways" — the kinds of language that appear in real rejection notes and carry real legal risk under non-discrimination law.

---

## Running it

### As a Claude.ai artifact

Paste the contents of `HireTrace.jsx` into a Claude.ai conversation as a React artifact. It renders immediately with no configuration.

### Locally with Vite

```bash
npm create vite@latest hiretrace -- --template react
cd hiretrace
# Replace src/App.jsx with HireTrace.jsx contents
npm install
npm run dev
```

No additional packages required.

### As a standalone HTML file

The component can be bundled with a tool like [esm.sh](https://esm.sh) or wrapped in a simple Vite build for deployment as a static site.

---

## EU AI Act reference

| Obligation | HireTrace feature |
|---|---|
| Art. 13 — Transparency | Decision log with timestamps, candidate IDs, justifications, responsible officer |
| Art. 14 — Human oversight | Escalation queue; override documentation; resolution workflow |
| Art. 26 — Deployer obligations | AI system name and recommendation captured per decision |
| Annex III — High-risk AI | Bias analysis record attached to each AI-assisted decision |

The compliance deadline shown in the sidebar (August 2, 2026) reflects the date by which organisations deploying high-risk AI systems must be in compliance with the full set of Annex III obligations.

---

## What this is not

HireTrace is a **prototype**, built to demonstrate what EU AI Act compliance tooling for hiring could look like. It is not:

- A production-ready system
- Connected to a real database or auth layer
- Running actual Claude API calls (bias analysis is simulated)
- Legal advice

For a production deployment you would need: a backend with persistent storage, real authentication, actual LLM-based bias analysis (the Claude API prompt structure is implied by the UI), email delivery, ATS integrations, and a proper audit trail with immutable records.

---

## Context

Built in Turku, Finland — where the EU AI Act compliance deadline is not hypothetical. Finnish companies using AI in hiring (Teamtailor, Recruitee, LinkedIn Recruiter, etc.) will need documented processes for exactly what HireTrace demonstrates.

---

## License

MIT — use freely, adapt for your context.
