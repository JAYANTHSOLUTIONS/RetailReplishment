import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function SaveAllModal({
  isOpen,
  onClose,
  isSavingAll,
  pendingQtyEdits = {},
  products = [],
  saveAllError,
  onConfirmSaveAll,
}) {
  const pendingCount = Object.keys(pendingQtyEdits).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSavingAll && onClose()}
      title="Confirm Save All Quantity Changes"
      icon={<span style={{ fontSize: 18 }} aria-hidden="true">💾</span>}
      size="md"
      contentClassName="confirm-modal"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSavingAll}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmSaveAll}
            disabled={isSavingAll}
          >
            {isSavingAll ? 'Saving to Database...' : `Confirm & Save (${pendingCount})`}
          </Button>
        </>
      }
    >
      <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text)' }}>
        You are about to save changes for <strong>{pendingCount}</strong> product{pendingCount > 1 ? 's' : ''} to SQLite:
      </p>
      {saveAllError && (
        <div className="field-error" style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
          {saveAllError}
        </div>
      )}
      <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', color: 'var(--text2)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '6px 10px' }}>SKU</th>
              <th style={{ padding: '6px 10px' }}>Product</th>
              <th style={{ padding: '6px 10px', textAlign: 'right' }}>Current</th>
              <th style={{ padding: '6px 10px', textAlign: 'right' }}>New Qty</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(pendingQtyEdits).map(([sku, newQty]) => {
              const p = products.find((prod) => prod.sku === sku);
              return (
                <tr key={sku} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sku}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{p?.name || 'Item'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text3)' }}>{p?.orderQty ?? 0}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--brand)' }}>{newQty}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

SaveAllModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isSavingAll: PropTypes.bool,
  pendingQtyEdits: PropTypes.object,
  products: PropTypes.array,
  saveAllError: PropTypes.string,
  onConfirmSaveAll: PropTypes.func.isRequired,
};
