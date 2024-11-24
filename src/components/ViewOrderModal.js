import React, { useRef, useState } from 'react';
import './ViewOrderModal.css';

const logoUrl = "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/images%2Flogo%20A%20-%20main%20concept(large)%20.png?alt=media&token=a6ee039e-82c9-4a0d-8322-b6942bed48ba";

const ViewOrderModal = ({ order, onClose }) => {
  const modalRef = useRef();
  const [isEditing, setIsEditing] = useState({
    customerName: false,
    customerEmail: false,
    customerPhone: false,
    shippingAddress: false,
    billingAddress: false,
    status: false,
    internalNotes: false,
  });

  const [editableValues, setEditableValues] = useState({
    customerName: order.customerName || "N/A",
    customerEmail: order.customerEmail || "N/A",
    customerPhone: order.customerPhone || "N/A",
    shippingAddress: order.shippingAddress || "N/A",
    billingAddress: order.billingAddress || "N/A",
    status: order.status || "N/A",
    internalNotes: order.internalNotes || "No notes available.",
  });

  const handleEditToggle = (field) => {
    setIsEditing((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleDoubleClick = (field) => {
    setIsEditing((prevState) => ({
      ...prevState,
      [field]: true,
    }));
  };

  const handleBlur = (field) => {
    setIsEditing((prevState) => ({
      ...prevState,
      [field]: false,
    }));
  };

  const handleInputChange = (field, value) => {
    setEditableValues((prevValues) => ({
      ...prevValues,
      [field]: value,
    }));
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      handleBlur(field);
    } else if (e.key === 'Escape') {
      handleBlur(field);
      setEditableValues((prevValues) => ({
        ...prevValues,
        [field]: order[field], // Reset to original value on cancel
      }));
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2, h3 { text-align: center; }
            p { margin: 5px 0; }
            .order-info { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <img src="${logoUrl}" alt="Dan Ober Artisan" style="max-width: 100%; height: auto;" />
          <div class="order-info">${modalRef.current.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmail = () => {
    console.log(`Emailing order receipt to ${editableValues.customerEmail}`);
    // Add logic for sending an email if necessary
  };

  // Ensure numeric values for financial calculations
  const subtotal = typeof order.subtotal === 'number' ? order.subtotal : 0;
  const taxes = typeof order.taxes === 'number' ? order.taxes : 0;
  const shipping = typeof order.shipping === 'number' ? order.shipping : 0;
  const total = typeof order.total === 'number' ? order.total : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        <img src={logoUrl} alt="Dan Ober Artisan Logo" className="logo" />
        <h2>Receipt Details</h2>

        <div className="modal-body">
          <div className="customer-details">
            <h3>Customer Details</h3>
            {Object.keys(editableValues).slice(0, 5).map((field) => (
              <p key={field}>
                <strong>{`${field.charAt(0).toUpperCase() + field.slice(1)}:`}</strong>
                {isEditing[field] ? (
                  <input
                    type={field === "customerEmail" ? "email" : "text"}
                    value={editableValues[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    onKeyDown={(e) => handleKeyDown(e, field)}
                  />
                ) : (
                  <span onDoubleClick={() => handleDoubleClick(field)}>
                    {editableValues[field]}
                  </span>
                )}
              </p>
            ))}
          </div>

          <div className="order-details-section">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> {order.id}</p>
            <p>
              <strong>Status:</strong>
              {isEditing.status ? (
                <input
                  type="text"
                  value={editableValues.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  onBlur={() => handleBlur('status')}
                  onKeyDown={(e) => handleKeyDown(e, 'status')}
                />
              ) : (
                <span onDoubleClick={() => handleDoubleClick('status')}>
                  {editableValues.status}
                </span>
              )}
            </p>
            <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <h4>Items Ordered:</h4>
            <ul>
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} - {item.description} - {item.quantity} x ${item.price?.toFixed(2) || '0.00'} = ${(item.quantity * (item.price || 0)).toFixed(2)}
                  </li>
                ))
              ) : (
                <li>No items ordered.</li>
              )}
            </ul>
            <h4>Internal Notes:</h4>
            {isEditing.internalNotes ? (
              <textarea
                value={editableValues.internalNotes}
                onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                onBlur={() => handleBlur('internalNotes')}
                onKeyDown={(e) => handleKeyDown(e, 'internalNotes')}
              />
            ) : (
              <p onDoubleClick={() => handleDoubleClick('internalNotes')}>
                {editableValues.internalNotes}
              </p>
            )}
          </div>
        </div>

        <div className="order-summary">
          <h4>Order Summary</h4>
          <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
          <p><strong>Taxes:</strong> ${taxes.toFixed(2)}</p>
          <p><strong>Shipping & Handling:</strong> ${shipping.toFixed(2)}</p>
          <p><strong>Total:</strong> ${total.toFixed(2)}</p>
          <p>
            <strong>Return Policy:</strong> Find our return policy <a href="http://localhost:3000/return-policy" target="_blank" rel="noopener noreferrer">here</a>.
          </p>
          <p>
            <strong>Support:</strong> Contact us at <a href="mailto:support@danoberartisan.com">support@danoberartisan.com</a>.
          </p>
        </div>

        <button className="print-btn" onClick={handlePrint}>
          Print Receipt
        </button>
        <button className="email-btn" onClick={handleEmail}>
          Email Receipt
        </button>
      </div>
    </div>
  );
};

export default ViewOrderModal;
