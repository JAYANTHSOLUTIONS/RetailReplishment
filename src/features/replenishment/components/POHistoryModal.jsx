import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function POHistoryModal({
  isOpen,
  onClose,
  supplier,
  poHistoryList = [],
  onDeletePO,
  formatCurrency,
  logoSrc,
}) {
  if (!supplier) return null;

  const icon = logoSrc ? (
    <img
      src={logoSrc}
      alt=""
      style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4, background: '#fff', border: '1px solid var(--border)', padding: 1 }}
    />
  ) : (
    <span aria-hidden="true">📑</span>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Order History — ${supplier.name}`}
      icon={icon}
      size="lg"
      contentClassName="info-modal-card"
      headerClassName="info-modal-header"
      bodyClassName="info-modal-body"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {poHistoryList.length === 0 ? (
        <div className="state-box" style={{ minHeight: 180 }}>
          <div className="state-icon">📋</div>
          <h3 className="state-title">No Purchase Order History</h3>
          <p className="state-body">
            No previous purchase orders have been submitted for {supplier.name}.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {poHistoryList.map((po) => (
            <div
              key={po.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 12,
                background: 'var(--bg)',
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  <strong style={{ fontSize: 13, color: 'var(--text)' }}>{po.poNumber}</strong>
                  <span className={`modal-badge ${po.status}`}>{po.status}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
                    {formatCurrency ? formatCurrency(po.totalAmount) : `$${po.totalAmount}`}
                  </span>
                  {onDeletePO && (
                    <button
                      type="button"
                      onClick={() => onDeletePO(po)}
                      title="Delete PO record"
                      aria-label={`Delete PO ${po.poNumber}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: '2px 4px',
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
              <div className="text-muted mb-2" style={{ fontSize: 11 }}>
                Created: {new Date(po.createdAt).toLocaleDateString()} &bull; {po.notes || 'Standard Order'}
              </div>
              {po.items && po.items.length > 0 && (
                <div
                  className="d-flex flex-wrap gap-1"
                  style={{
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: 6,
                  }}
                >
                  {po.items.map((it) => (
                    <span
                      key={it.id || it.sku}
                      style={{
                        fontSize: 11,
                        background: 'var(--surface)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                      }}
                    >
                      {it.name} ({it.quantity}x)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

POHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  supplier: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  poHistoryList: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      poNumber: PropTypes.string,
      status: PropTypes.string,
      totalAmount: PropTypes.number,
      createdAt: PropTypes.string,
      notes: PropTypes.string,
      items: PropTypes.array,
    })
  ),
  onDeletePO: PropTypes.func,
  formatCurrency: PropTypes.func,
  logoSrc: PropTypes.string,
};
