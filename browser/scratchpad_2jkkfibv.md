# Budgeting App Test Checklist

- [x] Navigate to http://localhost:5173/ and verify page loads
- [x] Add transaction: amount 150.50, note 'Weekly Groceries', category 'Food', click 'Add Expense'
- [x] Verify transaction added successfully and dashboard metrics & history table update
- [x] Switch theme using the top-right toggle and verify light/dark background transition
- [x] Switch to 'Investment Ideas' tab, verify compound calculator sliders and expanders
- [x] Switch to Settings page, verify CSV exports button
- [x] Record results and summarize

## Test Summary
- **App URL**: `http://localhost:5173/` loaded successfully.
- **Transaction Add**: Added `$150.50` expense for `Weekly Groceries` under the `Food` category.
  - Verification: Successfully updated dashboard metrics (Total Balance: `-$150.50`, Total Spent: `$150.50`, Weekly Spent: `$150.50`), Category Distribution chart (Food: `100%`), and added the transaction to the history table.
- **Theme Toggling**: Successfully transitioned from dark to light mode, and back to dark mode using the top-right button. Both states have correct background styles.
- **Investment Ideas**:
  - Tested compound calculator sliders: successfully adjusted initial deposit to `$7,900`, updating Simulated Balance calculation to `$35,952`.
  - Tested expander widgets: successfully expanded card to read detailed index fund guides.
- **Settings Panel**: Successfully opened settings page, checked layout/fields, and triggered "Export CSV" without errors.
