import React, { useState } from 'react';
import './AddProductModal.css';

const ArtisanSpecsForm = ({ onBack, onSubmit }) => {
  const [artisanSpecs, setArtisanSpecs] = useState({
    depth: '',
    width: '',
    weight: '',
    shellThickness: '',
    bearingEdge: '',
    woodSpecies: [],
    customWoodSpecies: '',
    constructionType: '',
    drumType: '',
    finish: '',
    hardwareColor: '',
    lugCount: '',
    lugType: '',
    interactive360Url: '',
    snareThrowOff: '',
    snareWires: '',
    quantityStaves: '',
    completionDate: '',
  });

  const drumTypes = ['Snare', 'Piccolo', 'Tom', 'Bass Drum', 'Floor Tom'];
  const constructionTypes = ['Stave', 'Ply', 'Steam Bent', 'Hybrid'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArtisanSpecs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWoodSpeciesChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setArtisanSpecs((prev) => ({
      ...prev,
      woodSpecies: selectedOptions,
    }));
  };

  const isSnareOrPiccolo =
    artisanSpecs.drumType === 'Snare' || artisanSpecs.drumType === 'Piccolo';
  const isStaveOrHybrid =
    artisanSpecs.constructionType === 'Stave' ||
    artisanSpecs.constructionType === 'Hybrid';

  return (
    <div className="add-product-modal">
      <div className="modal-content">
        <h2>Add New Product</h2>
        <h3>Step 2: Artisan Specifications</h3>

        <form>
          <div className="form-group">
            <label htmlFor="drumType">Drum Type:</label>
            <select
              id="drumType"
              name="drumType"
              value={artisanSpecs.drumType}
              onChange={handleInputChange}
            >
              <option value="">Select Drum Type</option>
              {drumTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="constructionType">Construction Type:</label>
            <select
              id="constructionType"
              name="constructionType"
              value={artisanSpecs.constructionType}
              onChange={handleInputChange}
            >
              <option value="">Select Construction Type</option>
              {constructionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {isStaveOrHybrid && (
            <div className="form-group">
              <label htmlFor="quantityStaves">Quantity of Staves:</label>
              <input
                id="quantityStaves"
                type="text"
                name="quantityStaves"
                value={artisanSpecs.quantityStaves}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="woodSpecies">Wood Species:</label>
            <div id="woodSpecies" className="checkbox-group">
              {[
                'Ash',
                'Beech',
                'Birch',
                'Bubinga',
                'Cherry',
                'Jatoba',
                'Kapur',
                'Leopardwood',
                'Mahogany',
                'Mango',
                'Maple',
                'Oak',
                'Padauk',
                'Poplar',
                'Purpleheart',
                'Sapele',
                'Walnut',
                'Other',
              ].map((species) => (
                <div key={species} className="checkbox-item">
                  <input
                    id={`woodSpecies-${species}`} // Unique ID for each checkbox
                    type="checkbox"
                    name="woodSpecies"
                    value={species}
                    checked={artisanSpecs.woodSpecies.includes(species)}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      setArtisanSpecs((prevSpecs) => {
                        const woodSpecies = checked
                          ? [...prevSpecs.woodSpecies, value]
                          : prevSpecs.woodSpecies.filter(
                              (item) => item !== value
                            );
                        return { ...prevSpecs, woodSpecies };
                      });
                    }}
                  />
                  <label htmlFor={`woodSpecies-${species}`}>{species}</label>{' '}
                  {/* Associated label */}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="customWoodSpecies">Custom Wood Species:</label>
            <input
              id="customWoodSpecies"
              type="text"
              name="customWoodSpecies"
              value={artisanSpecs.customWoodSpecies}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="depth">Depth (in):</label>
            <input
              id="depth"
              type="text"
              name="depth"
              value={artisanSpecs.depth}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="width">Width (in):</label>
            <input
              id="width"
              type="text"
              name="width"
              value={artisanSpecs.width}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (lbs):</label>
            <input
              id="weight"
              type="text"
              name="weight"
              value={artisanSpecs.weight}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="shellThickness">Shell Thickness (mm):</label>
            <input
              id="shellThickness"
              type="text"
              name="shellThickness"
              value={artisanSpecs.shellThickness}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bearingEdge">Bearing Edge:</label>
            <input
              id="bearingEdge"
              type="text"
              name="bearingEdge"
              value={artisanSpecs.bearingEdge}
              onChange={handleInputChange}
            />
          </div>

          {isSnareOrPiccolo && (
            <>
              <div className="form-group">
                <label htmlFor="snareThrowOff">Snare Throw Off:</label>
                <input
                  id="snareThrowOff"
                  type="text"
                  name="snareThrowOff"
                  value={artisanSpecs.snareThrowOff}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="snareWires">Snare Wires:</label>
                <input
                  id="snareWires"
                  type="text"
                  name="snareWires"
                  value={artisanSpecs.snareWires}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="finish">Finish:</label>
            <input
              id="finish"
              type="text"
              name="finish"
              value={artisanSpecs.finish}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lugCount">Lug Count:</label>
            <input
              id="lugCount"
              type="text"
              name="lugCount"
              value={artisanSpecs.lugCount}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lugType">Lug Type:</label>
            <input
              id="lugType"
              type="text"
              name="lugType"
              value={artisanSpecs.lugType}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hardwareColor">Hardware Color:</label>
            <input
              id="hardwareColor"
              type="text"
              name="hardwareColor"
              value={artisanSpecs.hardwareColor}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="interactive360Url">360 Interactive URL:</label>
            <input
              id="interactive360Url"
              type="text"
              name="interactive360Url"
              value={artisanSpecs.interactive360Url}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="completionDate">Completion Date:</label>
            <input
              id="completionDate"
              type="date"
              name="completionDate"
              value={artisanSpecs.completionDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="button-group">
            <button type="button" onClick={onBack}>
              Back
            </button>
            <button type="button" onClick={() => onSubmit(artisanSpecs)}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtisanSpecsForm;
