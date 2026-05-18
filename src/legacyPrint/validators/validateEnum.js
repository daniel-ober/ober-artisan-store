export function validateEnum({ value, allowedValues = [], fieldPath }) {

  if (value === undefined || value === null || value === '') {

    return null;

  }

  if (!allowedValues.includes(value)) {

    return {

      fieldPath,

      value,

      allowedValues,

      message: `INVALID_ENUM: ${fieldPath} must be one of: ${allowedValues.join(', ')}`

    };

  }

  return null;

}