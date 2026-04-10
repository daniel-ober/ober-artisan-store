import React from 'react';
import { createPortal } from 'react-dom';
import './OutstandingHelpOverlay.css';

const OutstandingHelpOverlay = ({
  outstandingHelpItem,
  setOutstandingHelpItem,
}) => {
  if (!outstandingHelpItem || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="mpm-story-help-overlay"
      onClick={() => setOutstandingHelpItem(null)}
    >
      <div
        className="mpm-story-help-modal"
        role="dialog"
        aria-modal="true"
        aria-label={outstandingHelpItem.label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mpm-story-help-modal-head">
          <h4>{outstandingHelpItem.label}</h4>

          <button
            type="button"
            className="mpm-story-help-close"
            onClick={() => setOutstandingHelpItem(null)}
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        {!!outstandingHelpItem.whereToUpdate && (
          <div className="mpm-story-help-block">
            <strong>Update here</strong>
            <p>{outstandingHelpItem.whereToUpdate}</p>
          </div>
        )}

        {!!outstandingHelpItem.resolutionSteps?.length && (
          <div className="mpm-story-help-block">
            <strong>
              {outstandingHelpItem.resolutionTitle || 'How to resolve'}
            </strong>
            <ul>
              {outstandingHelpItem.resolutionSteps.map((step, idx) => (
                <li key={`${outstandingHelpItem.id}-step-${idx}`}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {!!outstandingHelpItem.questionsToAsk?.length && (
          <div className="mpm-story-help-block">
            <strong>Questions to ask the artist</strong>
            <ul>
              {outstandingHelpItem.questionsToAsk.map((question, idx) => (
                <li key={`${outstandingHelpItem.id}-question-${idx}`}>
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default OutstandingHelpOverlay;