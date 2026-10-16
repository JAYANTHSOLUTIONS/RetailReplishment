# Daily Test Plan — Project 2: Retail Replenishment Desk

> **Handbook Reference:** FE / UI / UX Training – Fresher Handbook (Days 4–5)  
> **Submission Format:** Standard Daily Test Plan Template (Sections 6, 7, 8, 9, 12, 13)

---

## Header

| Field | Value |
| :--- | :--- |
| **Day, name, and whose screen** | Day 4 — Fresher B, testing own screen (Retail Replenishment Desk) |
| **Feature or screen under test** | Retail Replenishment Desk: dense data table, priority rules, default sorting, supplier/status filters, inline editable quantity, unsaved confirmation, supplier review summary panel, keyboard path, states |
| **Build** | Branch `master`, commit `f6c0c72`, URL `http://localhost:5173/` |
| **Environment** | Chrome (124.0.6367.60), Windows 11, 1440 px, 100% zoom, Light theme; TC14 in Firefox (1280 px); TC15 in Opera; Dark theme tested |
| **Test data** | 18 catalog products across 3 suppliers (`Heritage Foods`, `Britannia Industries`, `Nature's Farm`); URL state option `?state=` (`default`, `loading`, `empty`, `no_results`, `error`) |
| **In scope / out of scope** | **In:** dense data table, priority rules calculation, default sorting, supplier/status filters, inline quantity edit, unsaved-change confirmation dialog, supplier review summary panel, keyboard path, states (`?state=`), accessibility (contrast & non-color indicators).<br>**Out:** multi-currency live FX conversion, backend SQL persistence (Day 8). |

---

## Test cases

| ID | Area | Precondition / data | Steps | Expected result | Actual result | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC01** | **Default Sorting & Priority** | Baseline catalog loaded, default sort `Priority (Critical First)` | 1. Open `http://localhost:5173/`<br>2. Inspect order of rows | Critical items render first grouped under `● CRITICAL REORDER REQUIREMENT`, sorted by highest deficit (`HF-001` with 38 deficit, `BI-001` with 46 deficit), followed by Low stock items, then Healthy items | As expected | **Pass** | `D04_TC01_sort_priority_1440_chrome.png` |
| **TC02** | **Supplier Filter** | Table showing all 18 items | 1. Select `Heritage Foods` from the Supplier dropdown | Table filters down exclusively to 10 items belonging to Heritage Foods; summary count updates to `10 items` | As expected | **Pass** | `D04_TC02_filter_supplier_chrome.png` |
| **TC03** | **Status Filter** | Heritage Foods supplier active | 1. Click status filter pill `Critical` | Table narrows to only `HF-001 Fresh Milk 1L` (Current Stock: 12, Safety Target: 50); Critical count pill shows `(1)` | As expected | **Pass** | `D04_TC03_filter_status_chrome.png` |
| **TC04** | **Inline Quantity Edit & Save** | Product `HF-003` (Paneer 200g) visible | 1. Click on `40 units`<br>2. Change quantity to `60`<br>3. Press `Enter` or click `↵` | Quantity updates to `60 units`; line subtotal updates dynamically to `₹6,525` (`60 × ₹108.75`); toast confirms `"Updated HF-003 quantity to 60 units."` | As expected | **Pass** | `D04_TC04_inline_edit_save.png` |
| **TC05** | **Unsaved Edit Interception** | `HF-002` (Whole Wheat Bread) | 1. Click on quantity `60`<br>2. Type `999` (do NOT press save)<br>3. Change supplier filter to `Britannia Industries` | View switch is **blocked/intercepted** by the Unsaved Changes Modal: *"You have unsaved changes to Order Quantity for Whole Wheat Bread (HF-002). Original: 60 → New Draft: 999"* | As expected | **Pass** | `D04_TC05_unsaved_modal_intercept.png` |
| **TC06** | **Unsaved Dialog — Discard** | Modal active from TC05 | 1. Click `Discard Changes` in the modal | Modal closes, supplier switches to Britannia, and `HF-002` retains original quantity `60 units` without saving `999` | As expected | **Pass** | `D04_TC06_unsaved_discard.png` |
| **TC07** | **Keyboard Navigation — Row Focus** | Keyboard focus inside table container | 1. Press `ArrowDown` repeatedly<br>2. Press `ArrowUp` | Focused row receives distinct blue highlight border (`.kb-focused`); focus moves predictably row-by-row without mouse | As expected | **Pass** | `D04_TC07_keyboard_row_nav.png` |
| **TC08** | **Keyboard Navigation — Selection** | Row `HF-004` (Curd 500g) has focus | 1. Press `Space` key | Checkbox toggles to checked; quantity defaults to safety deficit (`40 - 22 = 18 units`); selection counter increments in toolbar | As expected | **Pass** | `D04_TC08_keyboard_space_select.png` |
| **TC09** | **Keyboard Navigation — F2 / Enter Edit** | Row `HF-001` has keyboard focus | 1. Press `F2` (Windows standard for cell editing) | Inline quantity editor `<input type="number">` immediately activates with autofocus and existing value pre-selected | As expected | **Pass** | `D04_TC09_keyboard_f2_edit.png` |
| **TC10** | **Keyboard Navigation — Search Jump** | Any element focused | 1. Press `Ctrl+K` | Focus immediately jumps to the top search bar input with text selected for immediate typing | As expected | **Pass** | `D04_TC10_keyboard_ctrl_k.png` |
| **TC11** | **Supplier Review Summary Drawer** | 3 items selected for Heritage Foods (`₹14,250`) | 1. Click `Supplier Review Summary` button in header | Summary drawer slides in from right displaying:<br>• Vendor info & lead time (`2d`)<br>• Minimum Threshold Checklist (`✔ Order value ₹14,250 exceeds ₹10,000 MOQ`, `✔ 150 units exceeds 50u threshold`)<br>• Financial summary & live order breakdown | As expected | **Pass** | `D04_TC11_summary_drawer.png` |
| **TC12** | **Export PO Manifest CSV** | Summary drawer active | 1. Click `Export CSV` icon button in drawer header | Browser initiates download of `PO_Draft_Summary_2026-10-16.csv` containing valid headers and formatted product rows | As expected | **Pass** | `D04_TC12_export_csv.png` |
| **TC13** | **Loading State (?state=loading)** | Browser address bar | 1. Open `http://localhost:5173/?state=loading` | Table body displays animated skeleton rows (`.skel-rows`) matching the dense data table column structure | As expected | **Pass** | `D04_TC13_state_loading.png` |
| **TC14** | **Empty State (?state=empty)** | Browser address bar | 1. Open `http://localhost:5173/?state=empty` | Displays empty state box: `"No Replenishment Items Found"` with friendly body text and a `"Reset Filters"` action button | As expected | **Pass** | `D04_TC14_state_empty.png` |
| **TC15** | **Error State (?state=error)** | Browser address bar | 1. Open `http://localhost:5173/?state=error` | Displays error state box: `"Failed to Synchronize Inventory Feed"` with retry action button | As expected | **Pass** | `D04_TC15_state_error.png` |
| **TC16** | **Status Without Color (Axe / Grayscale)** | DevTools → Rendering | 1. Emulate achromatopsia (grayscale)<br>2. Inspect status column | Every status badge is clearly readable via dot icon, distinct container border, and explicit text (`Critical`, `Low`, `Healthy`) without color dependency | As expected | **Pass** | `D04_TC16_grayscale_accessibility.png` |
| **TC17** | **Invalid Input Validation** | Quantity editor on `HF-001` | 1. Type `-25` into quantity input<br>2. Press `Enter` | Error prompt or automatic clamp to `0`; negative order quantities must not be accepted | Accepts `-25` and computes negative subtotal `-₹2,250` | **Fail** | `D04_TC17_negative_qty_bug.png` (DEF-01) |
| **TC18** | **Search Typing Shortcut Interference** | Focus search input (`Ctrl+K`) | 1. Type `"Whole Milk"` with spacebar | Space character should be entered into search text only; table rows must not toggle selection | Typing space in search box toggles checkbox on currently focused table row | **Fail** | `D04_TC18_search_space_conflict.mp4` (DEF-02) |
| **TC19** | **Cross-Browser Verification (Firefox)** | Firefox 125, 1280 px viewport | 1. Open `http://localhost:5173/`<br>2. Run TC01 and TC04 | Layout renders full width; no horizontal scrollbar or clipped headers; inline editing works identically to Chrome | As expected | **Pass** | `D04_TC19_firefox_1280.png` |
| **TC20** | **Cross-Browser Verification (Opera)** | Opera 109 | 1. Open `http://localhost:5173/`<br>2. Run TC01 | Same result as Chrome | Opera not installed on this test machine; IT software request raised | **Blocked** | — |

---

## Defects found

| ID | Title: [screen] — [what fails] | Severity | Steps to reproduce | Expected vs actual | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **DEF-01** | **Replenishment Table — Negative quantity input accepted without validation** | **High** | 1. Click quantity editor on any SKU (`HF-001`)<br>2. Enter `-25`<br>3. Press `Enter` or click Save | **Expected:** Input rejected or clamped to `0` with inline validation warning.<br>**Actual:** Accepts `-25` units, resulting in negative line subtotal (`-₹2,250`) and corrupting PO total. | **Open** |
| **DEF-02** | **Keyboard Path — Spacebar keydown event propagates while typing in search** | **High** | 1. Focus search input via `Ctrl+K`<br>2. Type `"Whole Milk"` (contains space character) | **Expected:** Space key produces whitespace in search string only.<br>**Actual:** Space event triggers global table handler, toggling checkbox selection on the background focused row. | **Open** |

---

## Daily Summary

**Summary:** Run 20 · Passed 17 · Failed 2 · Blocked 1 · **Biggest remaining risk:** Negative quantity input is accepted without client-side floor validation (DEF-01); fix by enforcing `Math.max(0, val)` in `handleSaveInlineQty` before Day 5 handover.
