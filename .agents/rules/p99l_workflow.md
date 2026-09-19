---
name: p99l-lottery-rules
description: Permanent workflow instructions for P99L Lottery reporting, APIs, 32-column structure, SuperSenior filter, 8 individual lottery mappings, and dashboard calculations.
always_on: true
---

# P99L Lottery Report & Dashboard Rules

## 1. System APIs & Authentication
- Admin Base URL: `https://d1rsx2ylunqjey.cloudfront.net`
- Login: `POST /api/v1.0.0/auth/login` (Uses `.env` credentials `P99L_USERNAME`, `P99L_PASSWORD`)
- Basic Auth Token: `R2VuaXVzTG9UVEVSWTE2OEAxMjNAIzIlOTk5OV4mJDpMb3R0b1YyMTY4RnJvbnRAMTIzQCMyJTk5OTleJiQ=`
- All Lotteries: `GET /api/v1.0.0/report/total-report/all`
- Individual Specific Lottery: `GET /api/v1.0.0/total-report?filterByLotteryType={code}`
- 8 Official Lottery Types Mapping:
  1. `MHSB` - លាភមហាសម្បត្តិ ➡️ `filterByLotteryType=LEAP`
  2. `MC` - មហាឈ្នះ ➡️ `filterByLotteryType=VN1`
  3. `MT` - មហាទេព ➡️ `filterByLotteryType=VN2`
  4. `KH` - ឆ្នោតខ្មែរ ➡️ `filterByLotteryType=KH`
  5. `TC` - ទិញឈ្នះ ➡️ `filterByLotteryType=TN`
  6. `SC` - ឆ្នោត ➡️ `filterByLotteryType=SC`
  7. `TH` - ឆ្នោត ➡️ `filterByLotteryType=TH`
  8. `KP` - ឆ្នោត កំពត ➡️ `filterByLotteryType=KP`

## 2. 32-Column Structure
- 1D columns are placed immediately before their respective 2D columns:
  - `លុយលក់ 1D(KHR)` before `2D(KHR)`
  - `លុយលក់ 1D(USD)` before `2D(USD)`
  - `លុយសង 1D(KHR)` before `2D(KHR)`
  - `លុយសង 1D(USD)` before `2D(USD)`

## 3. Net Win/Loss (លុយស៊ីខាត) Rule
- Always use `winLoseAmountKhr` and `winLoseAmountUsd` directly from the system response.
- Do NOT calculate raw bet minus win.

## 4. SuperSenior Filter & Dashboard
- Include Auto Select / Searchable SuperSenior dropdown and quick pills.
- Calculate daily comparisons against previous chronological day (▲ 🟢 / ▼ 🔴).

## 5. SuperSenior Sang (លេខសាង) Rules
- SuperSenior Sang calculations: Win/loss amounts are inverted (`winLoseAmount * -1`) to represent house balance.

## 6. Commands & Auto-Sync Workflow
- **Daily Extraction Command**: `python export_p99l_report.py YYYY-MM-DD` (or in chat: `let go DD-MM-YY`)
- Automatically generates daily 32-column Excel, updates master database, syncs to Google Drive, and pushes to GitHub Pages.
