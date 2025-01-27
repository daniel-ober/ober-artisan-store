import React from "react";

const CustomerDetails = ({ customerData, handleChange, isEditing }) => {
  return (
    <div className="customer-details">
      <h3>Customer Details</h3>
      <p>
        <strong>User ID:</strong> {customerData.userId || "Guest"}
      </p>
      <p>
        <strong>Name:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={customerData.customerName || ""}
            onChange={(e) => handleChange("customerName", e.target.value)}
          />
        ) : (
          customerData.customerName || "N/A"
        )}
      </p>
      <p>
        <strong>Email:</strong>{" "}
        {isEditing ? (
          <input
            type="email"
            value={customerData.customerEmail || ""}
            onChange={(e) => handleChange("customerEmail", e.target.value)}
          />
        ) : (
          customerData.customerEmail || "N/A"
        )}
      </p>
      <p>
        <strong>Phone:</strong>{" "}
        {isEditing ? (
          <input
            type="tel"
            value={customerData.customerPhone || ""}
            onChange={(e) => handleChange("customerPhone", e.target.value)}
          />
        ) : (
          customerData.customerPhone || "N/A"
        )}
      </p>
      <p>
        <strong>Shipping Address:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={customerData.customerAddress || ""}
            onChange={(e) => handleChange("customerAddress", e.target.value)}
          />
        ) : (
          customerData.customerAddress || "N/A"
        )}
      </p>
    </div>
  );
};

export default CustomerDetails;