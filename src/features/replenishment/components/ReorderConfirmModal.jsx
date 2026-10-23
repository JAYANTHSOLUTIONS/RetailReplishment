import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function ReorderConfirmModal({
  product,
  onConfirm,
  onCancel,
}) {
  if (!product) return null;

  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onCancel}
      title="Reorder Previously Dispatched Product?"
      icon={<span style={{ fontSize: 18 }} aria-hidden="true">🔄</span>}
      size="md"
      contentClassName="confirm-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel (Leave Unselected)
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm Reorder
          </Button>
        </>
      }
    >
      <p style={{ margin: '0 0 10px 0', fontSize: 13, color: 'var(--text)' }}>
        <strong>{product.name}</strong> (SKU: <code>{product.sku}</code>) has already been ordered and dispatched.
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
        Would you like to select this product again for a new replenishment order? Your acknowledgement will be remembered in SQLite so you won&apos;t be prompted again for this product.
      </p>
    </Modal>
  );
}

ReorderConfirmModal.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    sku: PropTypes.string,
    name: PropTypes.string,
  }),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
