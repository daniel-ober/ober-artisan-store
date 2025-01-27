import React from "react";

const CustomerDetails = ({ data, isEditing, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    onChange((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  return (
    <div className="customer-details">
      <h3>Customer Details</h3>
      <p>
        <strong>Name:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={data?.name || ""}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        ) : (
          data?.name || "N/A"
        )}
      </p>
      <p>
        <strong>Email:</strong>{" "}
        {isEditing ? (
          <input
            type="email"
            value={data?.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
        ) : (
          data?.email || "N/A"
        )}
      </p>
      <p>
        <strong>Address:</strong>{" "}
        {isEditing ? (
          <>
            <input
              type="text"
              placeholder="Street"
              value={data?.address?.street || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
            />
            <input
              type="text"
              placeholder="City"
              value={data?.address?.city || ""}
              onChange={(e) => handleAddressChange("city", e.target.value)}
            />
            <input
              type="text"
              placeholder="State"
              value={data?.address?.state || ""}
              onChange={(e) => handleAddressChange("state", e.target.value)}
            />
            <input
              type="text"
              placeholder="Zip"
              value={data?.address?.zip || ""}
              onChange={(e) => handleAddressChange("zip", e.target.value)}
            />
          </>
        ) : (
          `${data?.address?.street}, ${data?.address?.city}, ${data?.address?.state} ${data?.address?.zip}`
        )}
      </p>
    </div>
  );
};

export default CustomerDetails;