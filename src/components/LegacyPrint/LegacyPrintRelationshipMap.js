
import React from 'react';

import {

  LEGACYPRINT_RELATIONSHIPS,

  RELATIONSHIP_GROUPS,

  getRelationshipById,

} from './legacyPrintRelationships';

const LegacyPrintRelationshipMap = ({

  activeRelationshipId,

  onSelectRelationship,

  relationshipGroupId,

  onChangeRelationshipGroup,

}) => {

  const activeGroup =

    RELATIONSHIP_GROUPS.find((group) => group.id === relationshipGroupId) ||

    RELATIONSHIP_GROUPS[1];

  const visibleRelationships = activeGroup.relationshipIds

    .map((id) => getRelationshipById(id))

    .filter(Boolean);

  const activeRelationship =

    getRelationshipById(activeRelationshipId) || visibleRelationships[0];

  return (

    <div className="oad-mode-side-panel oad-relationship-side">

      <span className="oad-mode-side-kicker">Tonal Relationship</span>

      <h4>How traits connect.</h4>

      <p>

        The main polygon becomes the full relationship web. Tap a connector or

        choose a relationship below to see how two traits shape one another.

      </p>

      <div className="oad-view-option-grid">

        {RELATIONSHIP_GROUPS.map((group) => (

          <button

            key={group.id}

            type="button"

            className={relationshipGroupId === group.id ? 'is-active' : ''}

            onClick={() => {

              onChangeRelationshipGroup(group.id);

              onSelectRelationship(group.relationshipIds[0]);

            }}

          >

            {group.label}

          </button>

        ))}

      </div>

      <article className="oad-mode-readout-card">

        <div>

          <strong>{activeRelationship.shortLabel}</strong>

          <small>{activeRelationship.label}</small>

        </div>

        <p>{activeRelationship.description}</p>

      </article>

      <div className="oad-relationship-picker">

        {visibleRelationships.map((relationship) => (

          <button

            key={relationship.id}

            type="button"

            className={activeRelationship.id === relationship.id ? 'is-active' : ''}

            onClick={() => onSelectRelationship(relationship.id)}

          >

            {relationship.shortLabel}

          </button>

        ))}

      </div>

      <div className="oad-mode-output-note">

        <strong>Output:</strong>

        <span>Relationship phrase, meaning, and build implication.</span>

      </div>

    </div>

  );

};

export default LegacyPrintRelationshipMap;

