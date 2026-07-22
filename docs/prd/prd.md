# Hisaab Personal Budgeting App - Product Requirement Document (PRD) & Single Source of Truth

## 1. Overview & Goal
Hisaab is a premium personal budgeting application designed to run as a responsive React + TypeScript + Vite web app. It empowers users to manage multiple cash wallets, debit cards, and credit cards under a unified dashboard. The core value is providing clear visibility into available funds, outstanding debts, visual analytics, savings milestones, and statement settlement reminders while persisting data securely via Microsoft OneDrive Graph API.

---

## 2. Key Features & Requirements

### 2.1 Multi-Card & Account Management
* **Account Types**: Support for three distinct account types:
  1. **Cash**: Standard cash wallets.
  2. **Debit Card**: Standard checking/savings/debit card accounts.
  3. **Credit Card**: Card accounts with credit limits where balances represent deductible debt.
* **Card Carousel**:
  * An interactive carousel displaying accounts as realistic physical-looking cards (using premium gradients, chip graphics, and individual balances).
  * An **"All Accounts Combined"** card at the front representing aggregated stats.
  * Tapping a card filters the dashboard context: transaction list, charts, and header statistics.

### 2.2 Credit Card Limits & Deductible Debt
* **Finance Calculation Schema**:
  * **Individual Credit Card**:
    * **Available Credit** = `Limit - Outstanding Debt` (where Outstanding Debt = `Expenses - Incomes` on this credit card). This is the primary amount shown on the card.
    * **Outstanding Debt** = Secondary text shown on the card (e.g., `Spent: SAR X of Limit: SAR Y`).
    * **Visual Progress Bar**: A premium gradient progress bar showing card limit usage percentage.
    * **Default Credit Card Limit**: Pre-populated Al Rajhi Credit Card has a default limit of `10,000.00 SAR`.
  * **Aggregated Net Capital (All Accounts Combined)**:
    * **Net Capital** = `(Cash + Debit Card balances) - (Credit Card Outstanding Debt)`.
    * **Aggregated Credit Used** = `Total Credit Debt / Total Credit Limits` (displayed as supplementary text).
* **Over-limit Warnings**:
  * If a credit card is selected during transaction input, display a helper label: `Available Credit: SAR X / Y`.
  * Display a soft validation warning if the typed expense exceeds the card's available credit.
* **Monthly Credit Card Statement Settlement Prompt (25th of Month)**:
  * Triggered starting on the **25th of the month** (or subsequent days if not settled yet) if any credit card has an outstanding balance > 0.
  * Displays a modal dialogue listing each credit card with its current outstanding balance.
  * Default payment amount pre-fills to the full outstanding balance, allowing customization.
  * Payment source selection (Cash/Debit cards or "Direct Deposit (External)").
  * Submitting records two synced transactions:
    1. Expense on the source account (e.g., "Al Rajhi Credit Card Statement Payment").
    2. Income on the credit card (e.g., "Statement Payment Received").
  * Tracks `lastStatementPromptMonth` (e.g. `"2026-06"`) in local storage to prevent duplicate monthly prompts.
  * Manual "Settle Statement" button trigger available in Card Carousel/Settings.

### 2.3 Hisaab Brand Logo & Typography
* **Monogram Logo**:
  * A unique vector brandmark as an inline, highly responsive SVG component inside `/src/components/HisaabLogo.tsx`.
  * The emblem combines a stylized geometric emerald protection shield (financial security) intersecting with a dynamic golden ledger-growth curve forming the letter "H" (for Hisaab) with a rising investment seedling at its apex.
* **Visual Typography**:
  * Crisp, spacious display lettering in the header paired with high-contrast slate-900 backdrops, highlighted by deep forest-greens (emerald-600) and refined metallic amber gold colors (amber-500).

### 2.4 Smart Budgeting & Ledger Features
* **Dynamic Cash Flow Metrics**:
  * A comprehensive high-contrast snapshot panel presenting real-time calculations of Net Liquid Balance, Monthly Inflows (Income), and Monthly Outflows (Expenses) for the selected card or combined accounts.
* **Interactive Expense Category Chart**:
  * Inline custom SVG column chart that dynamically computes visual percentages and maps absolute spend ratios relative to category weights.
* **Budget Compliance Thresholds**:
  * Color-coded monthly spending limits configured in the dashboard/settings.
  * Warnings are flagged and category alert tags are displayed if spending on **Rent & Bills**, **Food (Groceries)**, or **Entertainment** exceeds target limits.
* **Active Savings Milestones**:
  * Track progress toward long-term goals (e.g., Emergency Fund, Laptop, Japan Trip) with inline progress bars.
  * Contribution Triggers allow funding goals incrementally by selecting a source account and generating a corresponding savings/transfer transaction.
* **Archival Transaction Ledger**:
  * Manage and view the transaction ledger easily.
  * Filter items by cash flow types or categories, search payee descriptions, and export the entire transaction log to JSON or CSV formats.

---

## 3. Design Tokens & Variables

### 3.1 Colors
The design system is split into two modes: **Minimalist Light Mode** (Indigo & Slate) and **Translucent Dark Mode** (Space Slate & Electric Indigo). All color changes transition smoothly over `0.3s`.

| Variable | Light Theme Value | Dark Theme Value | Purpose |
|---|---|---|---|
| `--bg-app` | `#f8fafc` | `#080a10` | Application canvas background |
| `--bg-card` | `#ffffff` | `rgba(17, 20, 32, 0.45)` | Standard card/panel background |
| `--bg-card-hover` | `#f8fafc` | `rgba(27, 30, 48, 0.6)` | Card background on hover |
| `--border-color` | `rgba(15, 23, 42, 0.06)` | `rgba(255, 255, 255, 0.04)` | Subtle border separators |
| `--text-primary` | `#0f172a` | `#f8fafc` | Primary headings, values, and text |
| `--text-secondary`| `#475569` | `#94a3b8` | Secondary/subtitle text |
| `--text-tertiary` | `#94a3b8` | `#64748b` | Tertiary captions/metadata text |
| `--color-accent` | `#4f46e5` | `#6366f1` | Highlight, selected item, interactive primary actions |
| `--color-accent-hover` | `#4338ca` | `#818cf8` | Interactive action states on hover |
| `--color-accent-bg` | `rgba(79, 70, 229, 0.06)` | `rgba(99, 102, 241, 0.12)` | Background tint for active accents |
| `--color-success` | `#10b981` | `#10b981` | Income amounts and positive indicators |
| `--color-success-bg`| `rgba(16, 185, 129, 0.06)` | `rgba(16, 185, 129, 0.12)` | Background tint for income |
| `--color-expense` | `#ef4444` | `#ef4444` | Expense amounts and negative indicators |
| `--color-expense-bg`| `rgba(239, 68, 68, 0.06)` | `rgba(239, 68, 68, 0.12)` | Background tint for expense |
| `--color-warning` | `#f59e0b` | `#f59e0b` | Warn states, alert alerts |
| `--color-warning-bg`| `rgba(245, 158, 11, 0.06)`| `rgba(245, 158, 11, 0.12)` | Background tint for warnings |

---

## 4. Implementation Checklists & Tasks

- [x] Consolidate Documentation (PRD, design-system, tasks)
- [x] Implement Hisaab Monogram Logo & Brand Header in `Header.tsx` and layouts
- [x] Implement Dynamic Cash Flow Metrics Snapshot Panel
- [x] Implement Interactive SVG Column Chart for Categories
- [x] Implement Budget Compliance Threshold Warnings & Setting Controls
- [x] Implement Active Savings Milestones (goals, progress bars, contribution triggers)
- [x] Implement Archival Transaction Ledger Extensions (Search, Type Filters, CSV & JSON Export)
- [x] Verification, compilation check, styling verification in browser
