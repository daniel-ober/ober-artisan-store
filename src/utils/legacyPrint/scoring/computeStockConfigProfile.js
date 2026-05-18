export function computeStockConfigProfile(record = {}, bareShell = {}) {

  return {

    scores: bareShell?.scores || {},

    appliedDrivers: [],

    scoringBasis: 'computed-stock-config-physical-fields-v1',

  };

}