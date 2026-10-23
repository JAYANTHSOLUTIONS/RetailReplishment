import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function PendingManifestsModal({
  isOpen,
  onClose,
  supplierName,
  manifestsList = [],
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pending Manifests — ${supplierName || 'Supplier'}`}
      icon={<span aria-hidden="true">📦</span>}
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
      {manifestsList.length === 0 ? (
        <div className="state-box" style={{ minHeight: 180 }}>
          <div className="state-icon">🚚</div>
          <h3 className="state-title">No Pending Manifests</h3>
          <p className="state-body">
            There are currently no inbound delivery manifests pending for {supplierName || 'this supplier'}.
          </p>
        </div>
      ) : (
        <table className="modal-table w-100">
          <thead>
            <tr>
              <th>Manifest #</th>
              <th>Expected Arrival</th>
              <th>Items</th>
              <th>Units</th>
              <th>Carrier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {manifestsList.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.manifestNumber}</strong></td>
                <td>{m.expectedDate}</td>
                <td>{m.itemsCount} SKUs</td>
                <td>{m.totalUnits}</td>
                <td>{m.carrier}</td>
                <td>
                  <span className={`modal-badge ${m.status}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

PendingManifestsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  supplierName: PropTypes.string,
  manifestsList: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      manifestNumber: PropTypes.string,
      expectedDate: PropTypes.string,
      itemsCount: PropTypes.number,
      totalUnits: PropTypes.number,
      carrier: PropTypes.string,
      status: PropTypes.string,
    })
  ),
};
