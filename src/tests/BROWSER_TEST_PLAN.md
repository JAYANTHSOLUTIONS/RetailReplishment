# Master Test Plan: Retail Replenishment Desk (StockDesk)

> **Document Version:** 2.0  
> **Target Environment:** Chrome ≥ 118, Edge ≥ 118, Firefox ≥ 121  
> **Scope:** End-to-end verification of dense data table, keyboard navigation paths, calculated priority rules, supplier review summary, inline quantity editing with unsaved-change confirmations, and edge cases.

---

## 1. Test Matrix Overview

| Module | Test IDs | Priority | Automated / Manual |
| :--- | :--- | :--- | :--- |
| **Dense Data Table & ARIA Grid** | TC-GRID-01 through TC-GRID-05 | Critical | Both |
| **Keyboard Navigation Path** | TC-KBD-01 through TC-KBD-06 | Critical | Both |
| **Calculated Priority Rules & Sorting** | TC-PRIO-01 through TC-PRIO-04 | High | Both |
| **Supplier Review Summary & PO Draft** | TC-SUM-01 through TC-SUM-05 | High | Both |
| **Inline Quantity Editing & Unsaved Confirmation** | TC-EDIT-01 through TC-EDIT-06 | Critical | Both |
| **Filtering & Search Subsystems** | TC-FLTR-01 through TC-FLTR-04 | High | Both |
| **Batch Operations & Automation** | TC-BTCH-01 through TC-BTCH-03 | Medium | Both |
| **Application States & Resilience** | TC-STAT-01 through TC-STAT-04 | High | Both |
| **Edge-Case Validations** | TC-EDGE-01 through TC-EDGE-06 | High | Both |

---

## 2. Test Cases Specification

### 2.1 Dense Data Table & Grid Semantics

#### TC-GRID-01: Dense Table Rendering & Structure
- **Preconditions:** Navigate to `http://localhost:5173/`.
- **Action:** Inspect the table structure and CSS styles.
- **Expected:**
  - Table has `role="grid"` with headers `role="columnheader"` and cells `role="gridcell"`.
  - Column headers display in single/two-line compact format (`SKU`, `Item Name`, `Current Stock`, `Safety Target`, `Status`, `Order Qty`, `Subtotal (₹)`).
  - All 10 baseline items for Heritage Foods fit without causing a horizontal scrollbar at `1440×900`.
  - Numbers are strictly right-aligned (`Current Stock`, `Safety Target`, `Subtotal`).

#### TC-GRID-02: Priority Group Headers & Collapsing
- **Preconditions:** Default view loaded.
- **Action:** Click on the `● CRITICAL (4)` priority group header row.
- **Expected:**
  - The critical rows collapse smoothly; the chevron rotates 90 degrees.
  - The table row count adjusts, but pagination footer remains accurate.
  - Clicking again expands the section back to normal.

---

### 2.2 Keyboard Navigation Path

#### TC-KBD-01: Arrow Key Row Focus (ARIA Grid)
- **Preconditions:** Focus placed on the data table container (`tabIndex="0"`).
- **Action:** Press `ArrowDown` repeatedly, then `ArrowUp`.
- **Expected:**
  - Active focused row receives a visible blue highlight (`.kb-focused` class).
  - Pressing `ArrowDown` at the bottom wraps or stops at the last row; `ArrowUp` moves upward.
  - Focus indicator is clearly visible without mouse dependency.

#### TC-KBD-02: Row Selection via Spacebar
- **Preconditions:** Row `HF-004` (Curd 500g) has keyboard focus.
- **Action:** Press `Space`.
- **Expected:**
  - Checkbox toggles to checked state.
  - Quantity defaults to safety deficit (`40 - 22 = 18 units`) if previously 0.
  - Selection counter in toolbar increments (`"4 Items Selected"`).
  - Subtotal and Financial Summary immediately update.

#### TC-KBD-03: Activating Inline Edit via F2 or Enter Key (Windows Standard)
- **Preconditions:** Row `HF-002` (Whole Wheat Bread) has keyboard focus.
- **Action:** Press `F2` (Windows standard for cell editing) or `Enter`.
- **Expected:**
  - The `Order Qty` button switches to an active `<input type="number">` with autoFocus.
  - The existing quantity (`60`) is pre-filled.
  - Cursor is active inside the input for rapid data entry.

#### TC-KBD-04: Windows Quick Search Shortcut (Ctrl+K)
- **Preconditions:** Any element focused.
- **Action:** Press `Ctrl+K`.
- **Expected:**
  - Focus immediately jumps to the top search bar input.
  - Search input text is selected for immediate replacement/typing.

#### TC-KBD-05: Windows Navigation Keys (Home, End, PageUp, PageDown, Ctrl+A, Ctrl+S)
- **Preconditions:** Keyboard focus inside the table.
- **Action:** 
  1. Press `End` $\rightarrow$ moves focus directly to the last visible table row (`HF-009`).
  2. Press `Home` $\rightarrow$ moves focus directly to the first visible table row (`HF-001`).
  3. Press `PageDown` $\rightarrow$ advances focus 5 rows down.
  4. Press `PageUp` $\rightarrow$ returns focus 5 rows up.
  5. Press `Ctrl+A` $\rightarrow$ toggles selection of all catalog items.
  6. Press `Ctrl+S` $\rightarrow$ saves current replenishment draft and displays save toast.

---

### 2.3 Calculated Priority Rules & Dynamic Sorting

#### TC-PRIO-01: Calculated Priority Thresholds
- **Formula:**
  - `currentStock <= 0` OR `currentStock <= round(safetyTarget * 0.3)` $\rightarrow$ **Critical**
  - `currentStock < round(safetyTarget * 0.7)` $\rightarrow$ **Low**
  - `currentStock >= round(safetyTarget * 0.7)` $\rightarrow$ **Healthy**
- **Test Matrix Verification:**
  - `HF-001`: Stock `12`, Target `50` $\rightarrow 12 \le 15 \rightarrow$ **Critical** (Red badge)
  - `HF-004`: Stock `22`, Target `40` $\rightarrow 22 < 28 \rightarrow$ **Low** (Amber badge)
  - `HF-007`: Stock `45`, Target `50` $\rightarrow 45 \ge 35 \rightarrow$ **Healthy** (Green badge)

#### TC-PRIO-02: Default Sorting (Critical $\rightarrow$ Low $\rightarrow$ Healthy $\rightarrow$ Deficit)
- **Action:** Verify initial row sequence under "Priority (Critical First)".
- **Expected:**
  - Critical group renders first, ordered by highest deficit (`HF-001` with 38 deficit, `HF-002` with 35 deficit, etc.).
  - Low group renders second.
  - Healthy group renders third.

#### TC-PRIO-03: Secondary Sort Options
- **Action:** Select each option in `Sort:` dropdown:
  - `Current Stock (Low to High)`: Rows order ascending by stock (`8, 12, 15, 18, 22...`).
  - `Safety Target (High to Low)`: Rows order descending by target (`60, 60, 50, 40...`).
  - `Subtotal (High to Low)`: Highest rupee value items at the top.
  - `Item Name (A–Z)`: Alphabetical sorting by name.

---

### 2.4 Inline Quantity Editing & Unsaved-Change Confirmation

#### TC-EDIT-01: Basic Inline Edit & Save
- **Action:** Click `HF-003` (Paneer 200g) quantity `40`. Change to `60`.
- **Expected:**
  - `Unsaved` yellow pill appears below input.
  - Subtotal recalculates dynamically (`60 × ₹108.75 = ₹6,525`).
  - Pressing `Enter` or clicking `↵ Save` saves changes and dismisses the input.
  - Toast confirmation appears: `"Updated HF-003 quantity to 60 units."`

#### TC-EDIT-02: Cancel Inline Edit via Esc Key
- **Action:** Click `HF-002` quantity `60`. Type `999`. Press `Escape`.
- **Expected:**
  - Since changes are unsaved, the **Unsaved Changes Dialog** prompts:
    - `"You have unsaved changes to Order Quantity for Whole Wheat Bread (HF-002). Original: 60 → New Draft: 999."`
  - Clicking `Discard Changes` restores `60` without saving `999`.

#### TC-EDIT-03: Intercepting Supplier Switch with Unsaved Edit
- **Action:**
  1. Click `HF-001`, change quantity to `80` (do NOT press save).
  2. Click `Britannia Industries` in the Supplier Queue rail.
- **Expected:**
  - Supplier switch is **blocked/intercepted** by the Unsaved Changes Modal.
  - Three options provided: `Save & Proceed`, `Discard Changes`, `Keep Editing`.
  - Clicking `Keep Editing`: modal closes, active supplier remains Heritage Foods, input still has `80`.
  - Clicking `Save & Proceed`: saves `80` to `HF-001`, then switches active supplier to Britannia Industries.

#### TC-EDIT-04: Intercepting Filter or Sort Change with Unsaved Edit
- **Action:**
  1. Change `HF-002` quantity to `75` (unsaved).
  2. Click sort dropdown or single filter clear `×`.
- **Expected:**
  - Unsaved confirmation modal intercepts the view switch.
  - Clicking `Discard Changes` discards `75` and applies the new view.

---

### 2.5 Supplier Review Summary & Purchase Order Panel

#### TC-SUM-01: Real-time MOQ & Freight Threshold Validation
- **Action:** Inspect the Minimum Threshold Checklist in right panel.
- **Expected:**
  - Check 1: `✔ Order value ₹14,250 exceeds ₹10,000 minimum` (Green pass icon).
  - Check 2: `✔ Order units (150 units) exceeds 50 unit freight threshold` (Green pass icon).
- **Action 2:** Deselect `Whole Wheat Bread` and `Paneer 200g`.
- **Expected:**
  - Order value drops to `₹4,500` and units to `50`.
  - Check 1 updates to `✖ Order value ₹4,500 below ₹10,000 minimum` (Red fail icon).

#### TC-SUM-02: Live Order Breakdown Synchronization
- **Action:** Modify quantity or selection of any item.
- **Expected:**
  - The `Order Breakdown` list immediately updates with item names, unit counts, and line subtotals.
  - If 0 items selected, shows friendly empty state: `"No items selected for this order draft."`

#### TC-SUM-03: Export CSV Workflow
- **Action:** Click more options `⋮` $\rightarrow$ `Export as CSV`.
- **Expected:**
  - Browser downloads a file named `PO-2026-104_Heritage_Foods.csv`.
  - File contains correct headers and CSV data matching the active selection.

#### TC-SUM-04: Transmit PO Confirmation Modal
- **Action:** Click primary button `Approve & Send PO →`.
- **Expected:**
  - Confirmation dialog opens: `"✔ Purchase Order Transmitted"`.
  - Shows summary of Total Order Value, Units Ordered, and Lead Time window.
  - Clicking `Done` confirms order and shows toast feedback.

---

### 2.6 Filtering & Search Subsystems

#### TC-FLTR-01: Single Filter Option & Instant Search
- **Action:**
  1. Verify the matrix filter bar presents a single clean filter chip: `Supplier: Heritage Foods ×`.
  2. Press `Ctrl+K` and type `"Milk"`.
- **Expected:**
  - Table narrows down exclusively to `HF-001 Fresh Milk 1L`.
  - Redundant filter pills are eliminated, maintaining a clean enterprise toolbar.
  - Pagination displays `Showing 1–1 of 1 items`.

#### TC-FLTR-02: Single Filter Clear / Toggle to All Suppliers
- **Action:** Click `×` on `Supplier: Heritage Foods` chip.
- **Expected:**
  - Chip toggles to `All Suppliers`.
  - Table displays products across Heritage Foods, Britannia, and Nature's Farm.
  - Pagination updates to total combined catalog count.

---

### 2.7 Edge-Case Validations

#### TC-EDGE-01: Non-Numeric or Negative Quantity Inputs
- **Action:** Focus on quantity field and enter `-20` or invalid text `abc`. Press `Enter`.
- **Expected:**
  - Sanitized to `0` or minimum valid integer.
  - No NaN or runtime errors in Subtotal calculation (`₹0`).

#### TC-EDGE-02: Very Large Quantity Numbers
- **Action:** Enter `100000` into quantity field.
- **Expected:**
  - Correct Indian numbering formatting applied (`₹90,00,000`).
  - Table cell layout does not wrap or overflow the column bounds.

#### TC-EDGE-03: LocalStorage State Persistence
- **Action:** Edit quantities, click `Save Draft`, then refresh the browser page (`F5`).
- **Expected:**
  - Draft is saved to `localStorage` under `stockdesk_draft_products`.
  - The saved state is restored upon reload.

---

## 3. Automated Test Execution Commands

```bash
# Verify production compilation
npm run build

# Run unit and priority calculation tests
npm test
```
