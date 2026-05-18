export function computeModifiedConfigProfile(record = {}, stockConfig = {}, modifiedConfig = null) {

  return {

    scores: stockConfig?.scores || {},

    appliedDrivers: [],

    scoringBasis: modifiedConfig

      ? 'computed-modified-config-physical-fields-v1'

      : 'no-modified-config-provided',

  };

}