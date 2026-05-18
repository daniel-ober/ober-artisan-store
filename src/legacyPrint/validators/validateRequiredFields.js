function getNestedValue(object, path) {

  return path.split('.').reduce((current, key) => {

    if (current === undefined || current === null) return undefined;

    return current[key];

  }, object);

}

function isMissingValue(value) {

  return value === undefined || value === null || value === '';

}

export function validateRequiredFields(document = {}, requiredFields = []) {

  return requiredFields.filter((fieldPath) => {

    const value = getNestedValue(document, fieldPath);

    return isMissingValue(value);

  });

}