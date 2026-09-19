---
name: p99report
description: Automatically extracts P99L Admin lottery reports, generates 32-column multi-sheet Excel files, updates the full month dataset, and serves the interactive dashboard with daily net comparisons and SuperSenior filters.
---

# P99L Report Skill (`/p99report`)

Use this skill whenever the user asks for `/p99report`, `p99report`, or wants to extract and update P99L lottery data.

---

## Capabilities & Execution Steps

When this skill is invoked:
1. **Authenticate & Fetch Daily Reports**:
   - Read credentials from `.env` (`P99L_USERNAME`, `P99L_PASSWORD`).
   - Query P99L Admin API for target dates across 4 main levels:
     - `member`
     - `master`
     - `senior`
     - `super-senior`
2. **Generate Multi-Sheet Excel Reports**:
   - Output filename format: `total_summary_report_DD_MM_YYYY.xlsx`
   - Include 5 sheets: `Dashboard`, `Member (សមាជិក)`, `Master (មេ)`, `Senior (សេនៀ)`, `Super Senior (ស៊ុបភើ)`
   - Apply green header theme `#2E7D32` and 32-column structure (1D placed before 2D).
3. **Update Multi-Date Dataset**:
   - Merge records into `total_summary_report.json` with reverse-chronological date sorting.
4. **Launch / Refresh Dashboard**:
   - Ensure `http://localhost:8080` serves `index.html` with:
     - 5-Column Daily Net Summary Table (Date, Sales KHR/USD, Net KHR/USD with comparison trend badges ▲/▼).
     - Auto-Select Searchable SuperSenior filter.
     - 2-Bars Per Day Grouped Chart (លុយលក់ vs ស៊ីខាត).
     - Top KPI cards using exact system `winLoseAmountKhr` and `winLoseAmountUsd`.

---

## Key Reference Scripts

- Full Month Batch Extractor: `python3 fetch_august_range.py`
- Single Date Excel Generator: `python3 export_p99l_report.py`
- Web Dashboard Server: `python3 -m http.server 8080`
