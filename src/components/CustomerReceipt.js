import React from "react";
import "./CustomerReceipt.css";

const CustomerReceipt = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-content">
      <button className="close-button" onClick={onClose}>
        ✖
      </button>
      <h2>Customer Receipt</h2>

      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Customer Name:</strong> {order.customerName || "N/A"}</p>
      <p><strong>Email:</strong> {order.customerEmail || "N/A"}</p>
      <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>

      <h3>Products Ordered:</h3>
      {order.items.length > 0 ? (
        <ul>
          {order.items.map((item, index) => (
            <li key={index}>
              {item.name} - {item.quantity} x ${item.price?.toFixed(2)} = $
              {(item.quantity * item.price).toFixed(2)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items found.</p>
      )}

      <h4>Order Summary</h4>
      <p><strong>Subtotal:</strong> ${order.subtotal?.toFixed(2)}</p>
      <p><strong>Taxes:</strong> ${order.taxes?.toFixed(2)}</p>
      <p><strong>Total:</strong> ${order.total?.toFixed(2)}</p>

      {/* Print and Email Buttons */}
      <button className="print-btn" onClick={handlePrint}>
        Print Receipt
      </button>
      <button className="email-btn">
        Email Receipt
      </button>
    </div>
  );
};

export default CustomerReceipt;