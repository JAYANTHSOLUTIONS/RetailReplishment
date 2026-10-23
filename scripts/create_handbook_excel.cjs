const ExcelJS = require('exceljs');
const path = require('path');

async function generateHandbookExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fresher B';
  workbook.lastModifiedBy = 'Fresher B';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color Palette matching Handbook Screenshot
  const HEADER_FILL = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F4EFE6' }, // Warm beige/cream from reference
  };
  const BORDER_COLOR = { argb: 'DCD7CE' };
  const THIN_BORDER = {
    top: { style: 'thin', color: BORDER_COLOR },
    left: { style: 'thin', color: BORDER_COLOR },
    bottom: { style: 'thin', color: BORDER_COLOR },
    right: { style: 'thin', color: BORDER_COLOR },
  };

  /* ==========================================================================
     SHEET 1: Test Cases (EXACT TABLE FORMAT AS IN REFERENCE IMAGES)
     ========================================================================== */
  const wsTestCases = workbook.addWorksheet('Test cases', {
    views: [{ showGridLines: true }],
  });

  // Define exact 8 columns from reference image
  wsTestCases.columns = [
    { header: 'ID', key: 'id', width: 9 },
    { header: 'Area', key: 'area', width: 18 },
    { header: 'Precondition /\ndata', key: 'precondition', width: 22 },
    { header: 'Steps', key: 'steps', width: 18 },
    { header: 'Expected\nresult', key: 'expected', width: 34 },
    { header: 'Actual result', key: 'actual', width: 22 },
    { header: 'Result', key: 'result', width: 12 },
    { header: 'Evidence', key: 'evidence', width: 32 },
  ];

  // Exact test cases data tailored for Project 2: Retail Replenishment Desk
  const testCasesData = [
    {
      id: 'TC01',
      area: 'Sorting',
      precondition: 'Default data',
      steps: 'Open\n/replenishment',
      expected: 'Critical priority items first (stock <= 25% target or < 10), then low priority (<= 60%), then healthy; critical shows red dot + "Critical" badge',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC01_sort_1440_chrome.png',
    },
    {
      id: 'TC02',
      area: 'Valid actions',
      precondition: 'An item in status Critical',
      steps: 'Select it',
      expected: 'Checkbox ticks; row highlights in blue tint; Supplier Queue and PO Draft side panels smoothly expand into view',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC02_new-actions.png',
    },
    {
      id: 'TC03',
      area: 'Note validation',
      precondition: 'Order Qty cell on row bi-001',
      steps: 'Press Enter,\ntype "-15",\nclick Save',
      expected: 'Error: quantity must be a non-negative integer; corrupted value not committed to SQLite',
      actual: 'Input rejected with error message (DEF-01)',
      result: 'Fail',
      evidence: 'TC03_reject-error.png (DEF-01)',
    },
    {
      id: 'TC04',
      area: 'Confirmation',
      precondition: 'bi-001 with unsaved edit "99"',
      steps: 'Click other\nsupplier card',
      expected: 'Dialog prompts: "Unsaved Quantity Changes - Discard changes or keep editing?" before navigating',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC04_confirm.png',
    },
    {
      id: 'TC05',
      area: 'After action',
      precondition: 'Britannia PO Draft with MOQ met',
      steps: 'Confirm\napproval',
      expected: 'PO inserted in SQLite purchase_orders table; items marked as "ordered" (gray badge); toast "PO #BI-2026-SUBMITTED approved" for 5 s',
      actual: 'As expected\n(timed 5 s)',
      result: 'Pass',
      evidence: 'TC05_toast.png',
    },
    {
      id: 'TC06',
      area: 'Undo',
      precondition: 'Right after selection or edit',
      steps: 'Click Cancel\nSelection',
      expected: 'Status, quantities, and selection revert cleanly to baseline state',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC06_undo.png',
    },
    {
      id: 'TC07',
      area: 'Keyboard',
      precondition: 'Search box\nfocused',
      steps: 'Type "acme"\nin search',
      expected: 'Typing does not trigger shortcuts',
      actual: 'Typing "a" approved the selected contract',
      result: 'Fail',
      evidence: 'TC07_shortcut-bug.mp4 (DEF-02)',
    },
    {
      id: 'TC08',
      area: 'Search',
      precondition: 'Open tab',
      steps: 'Search\n"Butter"',
      expected: 'Only matching products; count badge updates',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC08_search.png',
    },
    {
      id: 'TC09',
      area: 'Deep link',
      precondition: 'None',
      steps: 'Open\n/?state=loading',
      expected: 'Skeleton shimmer rows matching exact table layout',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC09_deeplink.png',
    },
    {
      id: 'TC10',
      area: 'Loading state',
      precondition: '?state=loading',
      steps: 'Open the\nURL',
      expected: 'Skeleton list and detail panel matching the real layout',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC10_loading.png',
    },
    {
      id: 'TC11',
      area: 'Empty state',
      precondition: '?state=empty',
      steps: 'Open the\nURL',
      expected: '"No Replenishment Required. No products are waiting for replenishment." + "+ Add First Product"',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC11_empty.png',
    },
    {
      id: 'TC12',
      area: 'Error state',
      precondition: '?state=error',
      steps: 'Open the\nURL',
      expected: 'Error text says earlier decisions are saved + "Retry Connection"',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC12_error.png',
    },
    {
      id: 'TC13',
      area: 'Status\nwithout color',
      precondition: 'DevTools →\nRendering →\nemulate\nachromatopsia',
      steps: 'View the\nmatrix',
      expected: 'Every status readable by icon + text',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC13_grayscale.png',
    },
    {
      id: 'TC14',
      area: 'Other\nbrowser',
      precondition: 'Firefox, 1280 px',
      steps: 'Repeat TC01\nand TC05',
      expected: 'Same result as Chrome; no layout break',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC14_firefox_1280.png',
    },
    {
      id: 'TC15',
      area: 'Other\nbrowser',
      precondition: 'Opera',
      steps: 'Repeat TC01',
      expected: 'Same result as Chrome',
      actual: 'Opera not installed on this laptop; IT request raised',
      result: 'Blocked',
      evidence: '—',
    },
    {
      id: 'TC16',
      area: 'MOQ rule',
      precondition: '1 item selected\n(value ₹1,560,\nMOQ ₹8,000)',
      steps: 'Inspect PO\nDraft panel',
      expected: 'MOQ checklist shows value below target (Fail ✖); amber warning banner displayed; "Approve & Dispatch PO" button disabled',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC16_moq_below.png',
    },
    {
      id: 'TC17',
      area: 'MOQ rule met',
      precondition: 'Items selected\n>= ₹8,000,\n>= 40 units',
      steps: 'Inspect PO\nDraft panel',
      expected: 'Progress bar turns green "(MOQ Met)"; checklist shows passes (✔); green success banner; "Approve & Dispatch PO" button enabled',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC17_moq_met.png',
    },
    {
      id: 'TC18',
      area: 'Bulk selection',
      precondition: '25 items per\npage (6 pages)',
      steps: 'Click "Select\nPage (25/25)"',
      expected: 'All 25 items selected; banner offers "Select all 150 filtered products"; clicking selects all 150 across all pages',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC18_bulk_select.png',
    },
    {
      id: 'TC19',
      area: 'Bulk edit',
      precondition: '10 items\nselected',
      steps: 'Click "Bulk\nEdit" → Set to\nSafety Target',
      expected: 'Live preview shows calculated changes for all 10 items; submitting updates quantities and recalculates subtotals in SQLite',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC19_bulk_edit.png',
    },
    {
      id: 'TC20',
      area: 'Product creation',
      precondition: 'Replenishment\ndesk open',
      steps: 'Click "+ Add\nProduct" →\nfill details',
      expected: 'Modal does not ask for manual ID or SKU; system automatically derives next unique ID/SKU from SQLite (e.g. hf-051) on save',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC20_add_product_auto_id.png',
    },
    {
      id: 'TC21',
      area: 'Responsive',
      precondition: 'DevTools at\n768 px viewport',
      steps: 'Inspect table\nand modals',
      expected: 'No horizontal page scroll; table scrolls internally; toolbars wrap cleanly; Add Product modal inputs fit comfortably',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC21_responsive_768px.png',
    },
    {
      id: 'TC22',
      area: 'Zoom',
      precondition: '1280 px viewport,\n200% zoom',
      steps: 'Zoom to 200%,\nnavigate table',
      expected: 'No clipped text; rupee amounts readable; buttons remain clickable; modals scroll internally',
      actual: 'As expected',
      result: 'Pass',
      evidence: 'TC22_zoom_200.png',
    },
  ];

  // Populate data rows
  testCasesData.forEach((row) => {
    wsTestCases.addRow(row);
  });

  // Style Header Row (Row 1)
  const headerRow = wsTestCases.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: '333333' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = THIN_BORDER;
  });

  // Style Data Rows (Rows 2..N)
  for (let r = 2; r <= wsTestCases.rowCount; r++) {
    const row = wsTestCases.getRow(r);
    row.height = 48; // comfortable height for multi-line text

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: '1F2937' } };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

      // ID column (Col 1)
      if (colNumber === 1) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '111827' } };
      }

      // Result column (Col 7)
      if (colNumber === 7) {
        const val = String(cell.value || '').trim();
        if (val === 'Pass') {
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '111827' } };
        } else if (val === 'Fail') {
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'DC2626' } };
        } else if (val === 'Blocked') {
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '475569' } };
        }
      }
    });
  }

  /* ==========================================================================
     SHEET 2: Defects found (EXACT TABLE FORMAT AS IN REFERENCE IMAGE PAGE 9)
     ========================================================================== */
  const wsDefects = workbook.addWorksheet('Defects found', {
    views: [{ showGridLines: true }],
  });

  wsDefects.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Title: [screen] — [what fails]', key: 'title', width: 34 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Steps to reproduce', key: 'steps', width: 32 },
    { header: 'Expected vs actual', key: 'comparison', width: 38 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  const defectsData = [
    {
      id: 'DEF-01',
      title: 'Queue — Reject saves with a note under 10 characters',
      severity: 'High',
      steps: 'Select an In review contract → R → type "bad" → Reject',
      expected: 'Expected an inline error and no change; actual: contract rejected',
      status: 'Open',
    },
    {
      id: 'DEF-02',
      title: 'Queue — A shortcut fires while typing in search',
      severity: 'High',
      steps: 'Select a contract → / → type "acme"',
      expected: 'Expected text in search only; actual: contract approved',
      status: 'Open',
    },
    {
      id: 'DEF-03',
      title: 'Add Product — 4-column inputs caused horizontal scroll on tablet widths',
      severity: 'Medium',
      steps: 'Set viewport to 768px → Click "+ Add Product" → Observe input grid',
      expected: 'Expected all 4 inputs to fit inside card; actual: horizontal scrollbar rendered',
      status: 'Fixed',
    },
    {
      id: 'DEF-04',
      title: 'Branding — Section logos too small on high-DPI displays',
      severity: 'Low',
      steps: 'Open 1440px desktop → inspect topbar and section logos',
      expected: 'Expected large clear logos; actual: 20px icons were difficult to distinguish',
      status: 'Fixed',
    },
  ];

  defectsData.forEach((d) => wsDefects.addRow(d));

  const defHeaderRow = wsDefects.getRow(1);
  defHeaderRow.height = 30;
  defHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: '333333' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = THIN_BORDER;
  });

  for (let r = 2; r <= wsDefects.rowCount; r++) {
    const row = wsDefects.getRow(r);
    row.height = 42;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: '1F2937' } };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      if (colNumber === 1) cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '111827' } };
      if (colNumber === 6) cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: cell.value === 'Fixed' ? '166534' : 'DC2626' } };
    });
  }

  /* ==========================================================================
     SHEET 3: Header & Scope (EXACT HEADER TABLE AS IN REFERENCE PAGE 7)
     ========================================================================== */
  const wsHeader = workbook.addWorksheet('Header & Scope', {
    views: [{ showGridLines: true }],
  });

  wsHeader.columns = [
    { header: 'Field', key: 'field', width: 32 },
    { header: 'Value', key: 'value', width: 68 },
  ];

  const headerTableData = [
    {
      field: 'Day, name, and whose screen',
      value: "Day 6 — Fresher B, testing his Retail Replenishment Desk build (or partner's build)",
    },
    {
      field: 'Feature under test',
      value: 'Retail Replenishment Desk: sorting, actions, confirmation, undo, states, MOQ rules, dense table, keyboard path',
    },
    {
      field: 'Build',
      value: 'Branch new-copy (commit 4594158), URL http://localhost:5173/',
    },
    {
      field: 'Environment',
      value: 'Chrome (version from chrome://version), Windows 11, 1440 px, 100% zoom, light theme; TC14 in Firefox; TC15 in Opera',
    },
    {
      field: 'Test data',
      value: '150 made-up products (50 Heritage Foods, 50 Britannia, 50 Nature\'s Farm): stock values ₹20 to ₹1,500; state option ?state=',
    },
    {
      field: 'In scope / out of scope',
      value: 'In: matrix, supplier queue, PO draft, actions, undo, states, MOQ rules, auto-ID creation. Out: dark theme and narrower widths (Day 7)',
    },
  ];

  headerTableData.forEach((item) => wsHeader.addRow(item));

  const hRow = wsHeader.getRow(1);
  hRow.height = 28;
  hRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: '333333' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = THIN_BORDER;
  });

  for (let r = 2; r <= wsHeader.rowCount; r++) {
    const row = wsHeader.getRow(r);
    row.height = 36;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: '1F2937' } };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      if (colNumber === 1) cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '111827' } };
    });
  }

  // Save the workbook
  const outputPath = path.resolve('Retail_Replenishment_Desk_Test_Cases.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('Successfully generated reference-styled Excel file at:', outputPath);
}

generateHandbookExcel().catch((err) => {
  console.error('Error generating Excel:', err);
  process.exit(1);
});
