import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function SupplierContactModal({
  isOpen,
  onClose,
  supplier,
  contactData,
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
    <span aria-hidden="true">📞</span>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contact Supplier — ${supplier.name}`}
      icon={icon}
      size="md"
      contentClassName="info-modal-card"
      headerClassName="info-modal-header"
      bodyClassName="info-modal-body"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="contact-grid">
        <div className="contact-item">
          <div className="contact-label">Account Representative</div>
          <div className="contact-val">{contactData?.contactRep || 'Information unavailable'}</div>
        </div>
        <div className="contact-item">
          <div className="contact-label">Direct Email</div>
          <div className="contact-val">
            {contactData?.contactEmail ? (
              <a href={`mailto:${contactData.contactEmail}`}>{contactData.contactEmail}</a>
            ) : 'Information unavailable'}
          </div>
        </div>
        <div className="contact-item">
          <div className="contact-label">Phone Support</div>
          <div className="contact-val">
            {contactData?.contactPhone ? (
              <a href={`tel:${contactData.contactPhone}`}>{contactData.contactPhone}</a>
            ) : 'Information unavailable'}
          </div>
        </div>
        <div className="contact-item">
          <div className="contact-label">Standard Lead Time</div>
          <div className="contact-val">{contactData?.leadTime || supplier.leadTime || 'Information unavailable'}</div>
        </div>
        <div className="contact-item" style={{ gridColumn: '1 / -1' }}>
          <div className="contact-label">Warehouse &amp; Dispatch Address</div>
          <div className="contact-val">{contactData?.contactAddress || 'Information unavailable'}</div>
        </div>
      </div>
    </Modal>
  );
}

SupplierContactModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  supplier: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    leadTime: PropTypes.string,
  }),
  contactData: PropTypes.shape({
    contactRep: PropTypes.string,
    contactEmail: PropTypes.string,
    contactPhone: PropTypes.string,
    leadTime: PropTypes.string,
    contactAddress: PropTypes.string,
  }),
  logoSrc: PropTypes.string,
};
