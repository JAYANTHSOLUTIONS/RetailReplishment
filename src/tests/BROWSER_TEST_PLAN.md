# Daily Test Plan — Project 2: Retail Replenishment Desk

> **Handbook Reference:** FE / UI / UX Training – Fresher Handbook (Pages 7, 8 & 9)  
> **Submission Format:** Standard Daily Test Plan Template

---

## 1. Header & Scope

| Field | Value |
| :--- | :--- |
| **Day, name, and whose screen** | Day 6 — Fresher B, testing own screen (Retail Replenishment Desk) |
| **Feature or screen under test** | Retail Replenishment Desk: dense data table, priority rules, default sorting, dynamic side panels collapse/expand, MOQ checklist, PO dispatch, inline editable quantity, unsaved confirmation, states, accessibility |
| **Build** | Branch `new-copy`, URL `http://localhost:5173/` |
| **Environment** | Chrome (124.0.6367.60), Windows 11, 1440 px, 100% zoom, Light theme; TC14 in Firefox (1280 px); TC15 in Opera |
| **Test data** | 150 catalog products across 3 suppliers (`Heritage Foods`, `Britannia Industries`, `Nature's Farm`); URL state option `?state=` (`default`, `loading`, `empty`, `no_results`, `error`) |
| **In scope / out of scope** | **In:** dense data table, priority calculation, sorting, dynamic collapse/expand panels, inline quantity editing, unsaved-change dialog, MOQ checklist & PO dispatch, auto ID/SKU creation, states (`?state=`), grayscale accessibility, cross-browser.<br>**Out:** multi-currency live FX conversion, real backend payment gateway. |

---

## 2. Test Cases (Format identical to Reference Image Pages 8 & 9)

| ID | Area | Precondition / data | Steps | Expected result | Actual result | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC01** | Sorting | Default data | Open /replenishment | Critical priority items first (stock ≤ 25% target or < 10), then low priority (≤ 60%), then healthy; critical shows red dot + "Critical" badge | As expected | **Pass** | `TC01_sort_1440_chrome.png` |
| **TC02** | Valid actions | An item in status Critical | Select it | Checkbox ticks; row highlights in blue tint; Supplier Queue and PO Draft side panels smoothly expand into view | As expected | **Pass** | `TC02_new-actions.png` |
| **TC03** | Note validation | Order Qty cell on row bi-001 | Press Enter, type "-15", click Save | Error: quantity must be a non-negative integer; corrupted value not committed to SQLite | Input rejected with error message (DEF-01) | **Fail** | `TC03_reject-error.png (DEF-01)` |
| **TC04** | Confirmation | bi-001 with unsaved edit "99" | Click other supplier card | Dialog prompts: "Unsaved Quantity Changes - Discard changes or keep editing?" before navigating | As expected | **Pass** | `TC04_confirm.png` |
| **TC05** | After action | Britannia PO Draft with MOQ met | Confirm approval | PO inserted in SQLite purchase_orders table; items marked as "ordered" (gray badge); toast "PO #BI-2026-SUBMITTED approved" for 5 s | As expected (timed 5 s) | **Pass** | `TC05_toast.png` |
| **TC06** | Undo | Right after TC05 or selection | Click Undo / Cancel Selection | Status, quantities, and selection revert cleanly to baseline state | As expected | **Pass** | `TC06_undo.png` |
| **TC07** | Keyboard | Search box focused | Type "some" in search | Typing does not trigger shortcuts | Typing "a" approved the selected item | **Fail** | `TC07_shortcut-bug.mp4 (DEF-02)` |
| **TC08** | Search | Open tab | Search "FreshCo" / "Butter" | Only matching products; tab counts update | As expected | **Pass** | `TC08_search.png` |
| **TC09** | Deep link | None | Open /?state=loading | Loading state with skeleton shimmer rows matching table layout | As expected | **Pass** | `TC09_deeplink.png` |
| **TC10** | Loading state | ?state=loading | Open the URL | Skeleton list and detail panel matching the real layout | As expected | **Pass** | `TC10_loading.png` |
| **TC11** | Empty state | ?state=empty | Open the URL | "No Replenishment Required. No products are waiting for replenishment." + "+ Add First Product" | As expected | **Pass** | `TC11_empty.png` |
| **TC12** | Error state | ?state=error | Open the URL | Error text says earlier decisions are saved + "Retry Connection" | As expected | **Pass** | `TC12_error.png` |
| **TC13** | Status without color | DevTools → Rendering → emulate achromatopsia | View the queue | Every status readable by icon + text | As expected | **Pass** | `TC13_grayscale.png` |
| **TC14** | Other browser | Firefox, 1280 px | Repeat TC01 and TC05 | Same result as Chrome; no layout break | As expected | **Pass** | `TC14_firefox_1280.png` |
| **TC15** | Other browser | Opera | Repeat TC01 | Same result as Chrome | Opera not installed on this laptop; IT request raised | **Blocked** | — |
| **TC16** | MOQ rule | 1 item selected (value ₹1,560, MOQ ₹8,000) | Inspect PO Draft panel | MOQ checklist shows value below target (Fail ✖); amber warning banner displayed; "Approve & Dispatch PO" button disabled | As expected | **Pass** | `TC16_moq_below.png` |
| **TC17** | MOQ rule met | Items selected ≥ ₹8,000, ≥ 40 units | Inspect PO Draft panel | Progress bar turns green "(MOQ Met)"; checklist shows passes (✔); green success banner; "Approve & Dispatch PO" button enabled | As expected | **Pass** | `TC17_moq_met.png` |
| **TC18** | Bulk selection | 25 items per page (6 pages) | Click "Select Page (25/25)" | All 25 items selected; banner offers "Select all 150 filtered products"; clicking selects all 150 across all pages | As expected | **Pass** | `TC18_bulk_select.png` |
| **TC19** | Bulk edit | 10 items selected | Click "Bulk Edit" → Set to Safety Target | Live preview shows calculated changes for all 10 items; submitting updates quantities and recalculates subtotals in SQLite | As expected | **Pass** | `TC19_bulk_edit.png` |
| **TC20** | Product creation | Replenishment desk open | Click "+ Add Product" → fill details | Modal does not ask for manual ID or SKU; system automatically derives next unique ID/SKU from SQLite (e.g. hf-051) on save | As expected | **Pass** | `TC20_add_product_auto_id.png` |
| **TC21** | Responsive | DevTools at 768 px viewport | Inspect table and modals | No horizontal page scroll; table scrolls internally; toolbars wrap cleanly; Add Product modal inputs fit comfortably | As expected | **Pass** | `TC21_responsive_768px.png` |
| **TC22** | Zoom | 1280 px viewport, 200% zoom | Zoom to 200%, navigate table | No clipped text; rupee amounts readable; buttons remain clickable; modals scroll internally | As expected | **Pass** | `TC22_zoom_200.png` |

---

## 3. Defects Found (Format identical to Reference Image Page 9)

| ID | Title: [screen] — [what fails] | Severity | Steps to reproduce | Expected vs actual | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **DEF-01** | **Replenishment Table — Reject saves with negative quantity / invalid note** | **High** | 1. Click quantity editor on SKU (`HF-001`)<br>2. Enter `-15` or invalid format<br>3. Press Enter / click Save | **Expected:** Inline error message and corrupted value not committed to SQLite.<br>**Actual:** Contract/product accepted invalid input. | **Open** |
| **DEF-02** | **Keyboard — Shortcut fires while typing in search box** | **High** | 1. Focus search box (`Ctrl+K`)<br>2. Type `"some"` (contains letter "a") | **Expected:** Typing does not trigger shortcuts; text enters search box only.<br>**Actual:** Typing "a" triggered shortcut and approved the selected item. | **Open** |
| **DEF-03** | **Add Product Modal — 4-column inputs caused horizontal scroll on tablet widths** | **Medium** | 1. Set viewport to 768px<br>2. Click "+ Add Product"<br>3. Observe input layout | **Expected:** Inputs wrap responsively in 2-column or 1-column layout without viewport overflow.<br>**Actual:** Horizontal scrollbar rendered inside card. | **Fixed** |
| **DEF-04** | **Branding — Header and section logos too small on high-DPI displays** | **Low** | 1. Open 1440px desktop<br>2. Inspect topbar and section logos | **Expected:** Clean, legible 36px–40px branding icons.<br>**Actual:** 20px icons were difficult to distinguish. | **Fixed** |

---

## 4. Daily Summary

**Summary:** Run 22 · Passed 19 · Failed 2 · Blocked 1 · **Biggest remaining risk:** Shortcut key listener propagation when search input has focus (DEF-02); fix with `e.stopPropagation()` in search key handler.
