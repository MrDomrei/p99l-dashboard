# P99L Lottery Report & Dashboard Workflow

This project manages the automated extraction, reporting, and dashboard visualization for P99L Admin lottery system data.

---

## 1. System Architecture & API Endpoints

- **Admin Portal**: `https://admin.p99l.com`
- **CloudFront Base URL**: `https://d1rsx2ylunqjey.cloudfront.net`
- **Login Endpoint**: `POST /api/v1.0.0/auth/login`
  - Headers: Basic Token `R2VuaXVzTG9UVEVSWTE2OEAxMjNAIzIlOTk5OV4mJDpMb3R0b1YyMTY4RnJvbnRAMTIzQCMyJTk5OTleJiQ=`, `Origin: https://admin.p99l.com`
  - Credentials: Read from `.env` (`P99L_USERNAME`, `P99L_PASSWORD`).
- **Report Endpoints**:
  1. **All Lotteries Combined (គ្រប់ប្រភេទឆ្នោតទាំងអស់)**:
     - `GET /api/v1.0.0/report/total-report/all?filterByLevel={level}&filterByReportType=TOTAL&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&size=10000`
  2. **Individual Specific Lottery (របាយការណ៍តាមប្រភេទឆ្នោតនីមួយៗ)**:
     - `GET /api/v1.0.0/total-report?filterByLevel={level}&filterByReportType=TOTAL&filterByLotteryType={api_code}&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&size=10000`
  
  - **Lottery Type Code Mapping**:
    1. ⚡ `MHSB` - លាភមហាសម្បត្តិ ➡️ `filterByLotteryType=LEAP`
    2. 🏆 `MC` - មហាឈ្នះ ➡️ `filterByLotteryType=VN1`
    3. 🏢 `MT` - មហាទេព ➡️ `filterByLotteryType=VN2`
    4. 🇰🇭 `KH` - ឆ្នោតខ្មែរ ➡️ `filterByLotteryType=KH`
    5. 🎁 `TC` - ទិញឈ្នះ ➡️ `filterByLotteryType=TN`
    6. 🎯 `SC` - ឆ្នោត ➡️ `filterByLotteryType=SC`
    7. 🇹🇭 `TH` - ឆ្នោត ➡️ `filterByLotteryType=TH`
    8. 🌊 `KP` - ឆ្នោត កំពត ➡️ `filterByLotteryType=KP`
    - `ALL` - គ្រប់ប្រភេទឆ្នោតទាំងអស់ ➡️ `/api/v1.0.0/report/total-report/all`

---

## 2. 32-Column Report Rules & Structure

The detailed table contains **32 specific columns** in exact Khmer lottery nomenclature:
1. `Date`
2. `ប្រភេទឆ្នោត` (ALL / MHSB / MC / MT / KH / TC / SC / TH / KP)
3. `កូដសមាជិក` (Username)
4. `ឈ្មោះ` (Nickname)
5. `លុយលក់ 1D(KHR)` *(Placed before 2D)*
6. `លុយលក់ 2D(KHR)`
7. `លុយលក់ 3D(KHR)`
8. `លុយលក់ 4D(KHR)`
9. `លុយលក់ 1D(USD)` *(Placed before 2D)*
10. `លុយលក់ 2D(USD)`
11. `លុយលក់ 3D(USD)`
12. `លុយលក់ 4D(USD)`
13. `លុយសង 1D(KHR)` *(Placed before 2D)*
14. `លុយសង 2D(KHR)`
15. `លុយសង 3D(KHR)`
16. `លុយសង 4D(KHR)`
17. `លុយសង 1D(USD)` *(Placed before 2D)*
18. `លុយសង 2D(USD)`
19. `លុយសង 3D(USD)`
20. `លុយសង 4D(USD)`
21. `លុយស៊ីខាត (KHR)` (`winLoseAmountKhr`)
22. `លុយស៊ីខាត (USD)` (`winLoseAmountUsd`)
23. `បញ្ជីចាស់ (KHR)` (`oldAmountKhr`)
24. `បញ្ជីចាស់ (USD)` (`oldAmountUsd`)
25. `លុយខ្លី (KHR)` (`borrow.amountKhr`)
26. `លុយសង (KHR)` (`give.amountKhr`)
27. `លុយខ្លី (USD)` (`borrow.amountUsd`)
28. `លុយសង (USD)` (`give.amountUsd`)
29. `តវ៉ា (KHR)` (`protestAmount.amountKhr`)
30. `តវ៉ា (USD)` (`protestAmount.amountUsd`)
31. `ប្រាក់តុល្យភាពចុងក្រោយ (KHR)` (`totalAmountKhr`)
32. `ប្រាក់តុល្យភាពចុងក្រោយ (USD)` (`totalAmountUsd`)

---

## 3. Dashboard & Net Calculations (ស៊ីខាតប្រចាំថ្ងៃ)

- **Net Win/Loss (លុយស៊ីខាត)**: Always use the exact system fields `winLoseAmountKhr` and `winLoseAmountUsd` (from `summery` for ALL or from individual SuperSenior record). **Do not calculate raw bet minus win**, as system fields incorporate commission share and company percentage.
- **Comparison Trends vs Previous Day**: Compare day $N$ vs day $N-1$ chronologically:
  - Increase: 🟢 `▲ +Amount`
  - Decrease: 🔴 `▼ -Amount`
  - Neutral: `=`
- **Auto Select SuperSenior**: Searchable filter allowing instant auto-completion by typing username or nickname.
- **Top KPI Cards**:
  1. `ស៊ីខាតសរុបប្រចាំខែ (Total Net Win/Loss)` (Exact System Net)
  2. `លុយលក់សរុបប្រចាំខែ (Total Month Sales)`
  3. `ចំនួនថ្ងៃសរុប (Total Days)`
  *(Do not include Total Wins card)*.

---

## 4. Excel & Export File Naming

- Standard filename convention: `total_summary_report_DD_MM_YYYY.xlsx` (e.g. `total_summary_report_24_08_2026.xlsx`).
- Multi-sheet layout: `Dashboard`, `Member (សមាជិក)`, `Master (មេ)`, `Senior (សេនៀ)`, `Super Senior (ស៊ុបភើ)`.
- Green header theme: `#2E7D32`.

---

## 5. SuperSenior Sang (លេខសាង) Rules

- SuperSenior Sang calculations: Win/loss amounts are inverted (`winLoseAmount * -1`) to represent the house balance.
- Included in both master Excel database, daily standalone Excel, and Google Drive archive.

---

## 6. Commands & Auto-Sync Workflow

- **Daily Extraction Command**:
  ```bash
  python export_p99l_report.py YYYY-MM-DD
  ```
  *(Or in chat: `let go DD-MM-YY` or `let go today`)*
- **Automatic Operations Performed**:
  1. Login to P99L Admin API and fetch all 4 levels + 8 lotteries + SuperSenior Sang.
  2. Update `total_summary_report.json` with compact formatting.
  3. Rebuild `p99l_master_database_<month>_<year>.xlsx` and `monthly_net_summary_<month>_<year>.xlsx`.
  4. Generate standalone 32-column `total_summary_report_DD_MM_YYYY.xlsx`.
  5. Auto-sync directly to Google Drive (`Google_Drive_P99L`).
  6. Auto-commit & push to GitHub Pages (`https://mrdomrei.github.io/p99l-dashboard/`).

