import React, { useState } from "react";

const CustomerDetails = ({
  customerData,
  handleChange,
  isEditing,
  onSave,
  onEditToggle,
  onCancel,
}) => {
  const [showNotes, setShowNotes] = useState(false); // Toggle visibility of notes

  const boilerplateNotes = `Let’s start with your musical journey! How did you get into drumming?


Who are a few drummers that have inspired your playing style?


Is there a musician or band that’s been especially influential in your career?


What genres do you primarily play? Any secondary genres?


What’s the kit you’re currently playing? Can you share some specs or details about it?


What’s your average playing environment? Are you mostly playing in clubs, large venues, studios, or other settings?


How often do you play these days?


What are some goals you’ve set for yourself as a drummer?


What has been your biggest challenge in your musical journey so far?


What drives you as a musician? Is there something that keeps you inspired to keep going?


If you had to pick, what’s the single most important quality in a drum for you (Sound texture, volume, feel, looks, or something else)?


What’s your timeline for needing this drum? Are you working toward a specific project or event?


How did you hear about us?


Why did you choose us for your custom drum?`;

  const handleOpenNotepad = () => {
    const customerName = customerData.customerName || "Customer";
    const sanitizedCustomerName = customerName.replace(/[/\\?%*:|"<>]/g, "-");

    const fileName = `${sanitizedCustomerName} - Introduction Call.txt`;

    const fileContent = boilerplateNotes;

    const element = document.createElement("a");
    const file = new Blob([fileContent], { type: "text/plain" });

    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatNotes = (notes) => {
    const safeNotes = typeof notes === "string" ? notes : "";
    const lines = safeNotes.split("\n").filter((line) => line.trim() !== "");
    return lines.map((line, index) => {
      if (line.trim().endsWith("?")) {
        return (
          <p key={index}>
            <strong>{line.trim()}</strong>
          </p>
        );
      } else {
        return (
          <p key={index} style={{ marginLeft: "20px", fontStyle: "italic" }}>
            {line.trim()}
          </p>
        );
      }
    });
  };

  return (
    <div className="customer-details-container">
      <h3>Customer Details</h3>
      <div className="customer-details">
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

      <div className="customer-notes">
        <div className="notes-header">
          <h4>
            Customer Notes{" "}
            <button
              className="toggle-notes-btn"
              onClick={() => setShowNotes((prev) => !prev)}
            >
              {showNotes ? "Hide Notes" : "Show Notes"}
            </button>
          </h4>
        </div>
        {showNotes && (
          <>
            <button
              className="download-notes-btn"
              onClick={handleOpenNotepad}
              style={{ marginBottom: "10px" }}
            >
              📝 DOWNLOAD BOILERPLATE
            </button>
            {isEditing ? (
              <textarea
                value={customerData.notes || boilerplateNotes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows="10"
              />
            ) : (
              <div className="formatted-notes">
                {customerData.notes
                  ? formatNotes(customerData.notes)
                  : "No notes provided."}
              </div>
            )}
          </>
        )}
      </div>
      <div className="edit-controls">
        {isEditing ? (
          <>
            <button className="save-button" onClick={onSave}>
              Save
            </button>
            <button className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
          </>
        ) : (
          <button className="edit-button" onClick={onEditToggle}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;