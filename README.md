# Retail Replenishment Desk (StockDesk)

An enterprise-grade category replenishment and inventory planning desk built with React, Vite, and high-density Vanilla CSS.

## Key Features

- **Full-Width Dense Data Table**: Category replenishment matrix spanning 100% viewport width with collapsible priority groups (`CRITICAL`, `LOW`, `HEALTHY`).
- **Supplier Review Summary Panel**: Slide-over drawer providing real-time MOQ/freight threshold verification, financial summary, and line-item order breakdown.
- **Windows Keyboard Navigation Path**:
  - <kbd>↑</kbd> / <kbd>↓</kbd>: Navigate through catalog rows.
  - <kbd>Space</kbd>: Toggle item selection.
  - <kbd>F2</kbd> or <kbd>Enter</kbd>: In-place cell quantity editing with autofocus.
  - <kbd>Ctrl+K</kbd>: Quick jump to search.
  - <kbd>Ctrl+S</kbd>: Save replenishment draft to local storage.
  - <kbd>Ctrl+A</kbd>: Select all items in view.
  - <kbd>Esc</kbd>: Cancel inline editing or dismiss dialogs.
- **Calculated Priority Rules**: Dynamic categorization based on current stock, safety targets, and deficit sorting.
- **Supplier & Status Filtering**: Multi-supplier selector and status pills with real-time count badges.
- **Inline Editing with Unsaved-Change Protection**: Unsaved Changes Dialog intercepts view changes or accidental navigation.
- **EDI PO Transmission Workflow**: Export as CSV, print manifests, and simulate PO transmission.
- **Master Test Plan**: Comprehensive documentation in `src/tests/BROWSER_TEST_PLAN.md`.

## Getting Started

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Production build
npm run build
```
