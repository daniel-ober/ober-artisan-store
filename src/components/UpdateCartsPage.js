import React from "react";
import updateCarts from "./updateCarts"; // Import the script

const UpdateCartsPage = () => {
  const handleUpdate = async () => {
    await updateCarts(); // Run the script
    alert("Carts have been updated.");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Update Carts Script</h1>
      <p>
        Click the button below to update all cart documents in Firestore by
        adding a missing <strong>userId</strong> field.
      </p>
      <button
        onClick={handleUpdate}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Run Update Script
      </button>
    </div>
  );
};

export default UpdateCartsPage;