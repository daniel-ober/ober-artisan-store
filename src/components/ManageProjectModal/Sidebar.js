import React from "react";

const buildPhases = [
  { key: "overview", label: "Overview" },
  { key: "Step 1. Wood Preparation", label: "Step 1. Wood Preparation" },
  // Add other phases here...
];

const Sidebar = ({ selectedTab, setSelectedTab }) => (
  <aside className="sidebar">
    {buildPhases.map((phase) => (
      <button
        key={phase.key}
        className={selectedTab === phase.key ? "active" : ""}
        onClick={() => setSelectedTab(phase.key)}
      >
        {phase.label}
      </button>
    ))}
  </aside>
);

export default Sidebar;