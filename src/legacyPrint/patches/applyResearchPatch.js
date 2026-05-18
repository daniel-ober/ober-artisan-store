function setNestedValue(target, path, value) {

  const keys = path.split('.');

  let current = target;

  keys.forEach((key, index) => {

    if (index === keys.length - 1) {

      current[key] = value;

      return;

    }

    if (!current[key] || typeof current[key] !== 'object') {

      current[key] = {};

    }

    current = current[key];

  });

}

function removeNestedValue(target, path) {

  const keys = path.split('.');

  let current = target;

  keys.slice(0, -1).forEach((key) => {

    if (!current[key]) return;

    current = current[key];

  });

  delete current[keys[keys.length - 1]];

}

export function applyResearchPatch(baseDocument = {}, researchPatch = {}) {

  const patchedDocument = JSON.parse(JSON.stringify(baseDocument));

  Object.entries(researchPatch.proposedFields || {}).forEach(([fieldPath, value]) => {

    setNestedValue(patchedDocument, fieldPath, value);

  });

  (researchPatch.removedFields || []).forEach((fieldPath) => {

    removeNestedValue(patchedDocument, fieldPath);

  });

  return patchedDocument;

}