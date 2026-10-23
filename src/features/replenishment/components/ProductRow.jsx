import { memo } from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../../../components/ui';

const ProductRow = memo(function ProductRow({
  prod,
  pageIdx,
  isRowFocused,
  isOrdered,
  hasPendingEdit,
  pendingVal,
  displayQty,
  numericQty,
  lineSubtotal,
  isEditingThis,
  supName,
  supLogo,
  badgeType,
  badgeLabel,
  editQtyValue,
  inlineQtyError,
  formatCurrency,
  onToggleSelect,
  onRowHover,
  onRowFocus,
  onRowClick,
  onStartEdit,
  onInlineQtyChange,
  onCommitInlineQty,
  onCancelInlineQty,
  onNavigateNext,
  onNavigatePrev,
}) {
  return (
    <tr
      key={prod.id}
      data-row-index={pageIdx}
      className={`pr ${prod.selected ? 'sel' : ''} ${isRowFocused ? 'focused' : ''} ${isOrdered ? 'is-ordered' : ''} ${hasPendingEdit ? 'has-pending' : ''}`}
      tabIndex={0}
      onMouseEnter={() => onRowHover(pageIdx)}
      onFocus={() => onRowFocus(pageIdx)}
      onClick={() => onRowClick(pageIdx)}
    >
      <td className="col-chk">
        <input
          type="checkbox"
          className="cb"
          checked={!!prod.selected}
          onChange={() => onToggleSelect(prod.id)}
          aria-label={`Select ${prod.name}`}
          tabIndex={-1}
        />
      </td>
      <td className="col-id">
        <span className="prod-id-code">{prod.id}</span>
      </td>
      <td className="col-sku">
        <span className="sku-lbl">{prod.sku}</span>
      </td>
      <td className="col-name">
        <div className="prod-name">{prod.name}</div>
      </td>
      <td className="col-sup">
        <div className="sup-cell-content">
          {supLogo && (
            <img
              src={supLogo}
              alt=""
              className="sup-cell-logo"
            />
          )}
          <span className="sup-cell-name" title={supName}>
            {supName}
          </span>
        </div>
      </td>
      <td className="col-cat">
        <span className="cat-cell-tag">{prod.category}</span>
      </td>
      <td className="col-stk">{prod.currentStock}</td>
      <td className="col-tgt">{prod.safetyTarget}</td>
      <td className="col-st">
        <StatusBadge status={badgeType} label={badgeLabel} />
      </td>
      <td className="col-qty">
        {isEditingThis ? (
          <div className="qty-wrap">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`qty-inp ${inlineQtyError ? 'has-error' : ''}`}
              value={editQtyValue}
              onChange={(e) => onInlineQtyChange(e.target.value)}
              onBlur={() => onCommitInlineQty(prod.sku)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitInlineQty(prod.sku);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancelInlineQty();
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  const success = onCommitInlineQty(prod.sku);
                  if (success) {
                    if (e.shiftKey) {
                      onNavigatePrev(pageIdx);
                    } else {
                      onNavigateNext(pageIdx);
                    }
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const success = onCommitInlineQty(prod.sku);
                  if (success) {
                    onNavigateNext(pageIdx);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const success = onCommitInlineQty(prod.sku);
                  if (success) {
                    onNavigatePrev(pageIdx);
                  }
                }
              }}
              autoFocus
              aria-label="Order Quantity"
              aria-invalid={!!inlineQtyError}
              aria-describedby={inlineQtyError ? `inline-qty-err-${prod.sku}` : undefined}
            />
            {inlineQtyError && (
              <div
                id={`inline-qty-err-${prod.sku}`}
                className="field-error inline-qty-error"
                role="alert"
                style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', whiteSpace: 'nowrap' }}
              >
                {inlineQtyError}
              </div>
            )}
          </div>
        ) : (
          <div className="qty-cell-content d-inline-flex align-items-center" style={{ gap: 6 }}>
            <button
              type="button"
              tabIndex={-1}
              className={`qty-disp ${numericQty === 0 ? 'qty-zero' : ''} ${hasPendingEdit ? 'qty-pending' : ''}`}
              onClick={() => onStartEdit(pageIdx, prod.sku, hasPendingEdit ? pendingVal : String(prod.orderQty))}
              title="Click to edit quantity"
            >
              {displayQty}
            </button>
            {hasPendingEdit && (
              <span className="qty-unsaved-badge" title="Pending unsaved change (click Save All to commit)">
                Unsaved
              </span>
            )}
          </div>
        )}
      </td>
      <td className="col-prc">
        {formatCurrency ? formatCurrency(prod.unitCost) : prod.unitCost}
      </td>
      <td className="col-sub">
        {formatCurrency ? formatCurrency(lineSubtotal) : lineSubtotal}
      </td>
    </tr>
  );
});

ProductRow.propTypes = {
  prod: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sku: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    currentStock: PropTypes.number,
    safetyTarget: PropTypes.number,
    unitCost: PropTypes.number,
    selected: PropTypes.bool,
    orderQty: PropTypes.number,
    orderStatus: PropTypes.string,
  }).isRequired,
  pageIdx: PropTypes.number.isRequired,
  isRowFocused: PropTypes.bool,
  isOrdered: PropTypes.bool,
  hasPendingEdit: PropTypes.bool,
  pendingVal: PropTypes.string,
  displayQty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  numericQty: PropTypes.number,
  lineSubtotal: PropTypes.number,
  isEditingThis: PropTypes.bool,
  supName: PropTypes.string,
  supLogo: PropTypes.string,
  badgeType: PropTypes.string,
  badgeLabel: PropTypes.string,
  editQtyValue: PropTypes.string,
  inlineQtyError: PropTypes.string,
  formatCurrency: PropTypes.func,
  onToggleSelect: PropTypes.func.isRequired,
  onRowHover: PropTypes.func.isRequired,
  onRowFocus: PropTypes.func.isRequired,
  onRowClick: PropTypes.func.isRequired,
  onStartEdit: PropTypes.func.isRequired,
  onInlineQtyChange: PropTypes.func.isRequired,
  onCommitInlineQty: PropTypes.func.isRequired,
  onCancelInlineQty: PropTypes.func.isRequired,
  onNavigateNext: PropTypes.func.isRequired,
  onNavigatePrev: PropTypes.func.isRequired,
};

export default ProductRow;
