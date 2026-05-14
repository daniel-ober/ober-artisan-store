// src/components/ArtisanTools.js

import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {

  FaBoxes,

  FaChartBar,

  FaChevronLeft,

  FaFlask,

  FaPaintBrush,

  FaRulerCombined,

} from 'react-icons/fa';

import ManageElixirBatches from './ManageElixirBatches';

import './ArtisanTools.css';

const tools = [

  {

    key: 'stave-calculator',

    title: 'Stave Calculator',

    eyebrow: 'Shell geometry',

    description: 'Calculate stave angles, widths, shell thickness, and cut sizes.',

    icon: FaRulerCombined,

    action: 'route',

    route: '/admin/artisan-tools/stave-calculator',

  },

  {

    key: 'inventory-tracker',

    title: 'Inventory Tracker',

    eyebrow: 'Material control',

    description: 'Track wood, glue, hardware, and shop material usage.',

    icon: FaBoxes,

    action: 'route',

    route: '/admin/artisan-tools/inventory-tracker',

  },

  {

    key: 'finance-tracker',

    title: 'Finance Tracker',

    eyebrow: 'Build economics',

    description: 'Analyze cost, revenue, labor, margin, and build expenses.',

    icon: FaChartBar,

    action: 'route',

    route: '/admin/artisan-tools/finance-tracker',

  },

  {

    key: 'elixir-batches',

    title: 'Elixir Batches',

    eyebrow: 'Founder’s Toast™',

    description: 'Manage conditioning wax batches, formulas, notes, and batch records.',

    icon: FaFlask,

    action: 'inline',

  },

  {

    key: 'resin-accent-generator',

    title: 'Resin Accent Generator',

    eyebrow: 'Accent design',

    description: 'Preserve the grain and map natural voids for metallic resin accents.',

    icon: FaPaintBrush,

    action: 'route',

    route: '/admin/artisan-tools/resin-accent-generator',

  },

];

const ArtisanTools = () => {

  const navigate = useNavigate();

  const [activeInlineTool, setActiveInlineTool] = useState(null);

  const handleToolClick = (tool) => {

    if (tool.action === 'inline') {

      setActiveInlineTool(tool.key);

      return;

    }

    if (tool.route) {

      navigate(tool.route);

    }

  };

  if (activeInlineTool === 'elixir-batches') {

    return (

      <div className="artisan-tools-container artisan-tools-container--detail">

        <button

          type="button"

          className="artisan-tools-back"

          onClick={() => setActiveInlineTool(null)}

        >

          <FaChevronLeft />

          <span>Back to Artisan Tools</span>

        </button>

        <ManageElixirBatches />

      </div>

    );

  }

  return (

    <div className="artisan-tools-container">

      <header className="artisan-tools-header">

        <p className="artisan-tools-kicker">Shop Utilities</p>

        <h2>Artisan Tools</h2>

        <p>

          Internal workshop utilities for shell geometry, material tracking,

          production records, batch formulas, and visual build planning.

        </p>

      </header>

      <div className="tool-cards-wrapper">

        {tools.map((tool) => {

          const Icon = tool.icon;

          return (

            <button

              key={tool.key}

              type="button"

              className="tool-card"

              onClick={() => handleToolClick(tool)}

            >

              <span className="tool-card-eyebrow">{tool.eyebrow}</span>

              <span className="tool-icon-wrap">

                <Icon />

              </span>

              <span className="tool-card-title">{tool.title}</span>

              <span className="tool-card-description">{tool.description}</span>

            </button>

          );

        })}

      </div>

    </div>

  );

};

export default ArtisanTools;