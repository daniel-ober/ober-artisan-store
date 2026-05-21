
/**

 * Frontend-safe service contract for LegacyPrint snare discovery packets.

 *

 * This file intentionally does NOT import firebase-admin or server-only API code.

 * It defines the shape the Voice Playground UI should consume.

 *

 * Server/API layers can use:

 *   src/legacyPrint/api/buildSnareDiscoveryPacketForReference.js

 *

 * UI layers should use this service boundary so we can later swap in:

 * - callable Cloud Function

 * - REST endpoint

 * - cached Firestore discovery packet

 * - local preview packet during development

 */

const DISCOVERY_PACKET_STATUSES = {

  idle: 'idle',

  loading: 'loading',

  ready: 'ready',

  notFound: 'notFound',

  notPromotable: 'notPromotable',

  error: 'error'

};

const CUSTOMER_DISCOVERY_TABS = [

  {

    key: 'firstListen',

    label: 'First Listen',

    description: 'What the drum is most likely to sound like first.'

  },

  {

    key: 'playerAnalysis',

    label: 'Player Analysis',

    description: 'How the drum is likely to feel under the stick.'

  },

  {

    key: 'legacyPrintIdentity',

    label: 'LegacyPrint Identity',

    description: 'The physical voice fingerprint of the drum.'

  }

];

const DISCOVERY_MATCH_SECTIONS = [

  {

    key: 'differentBrandAlternatives',

    label: 'Other Brand Alternatives',

    description: 'Similar voice behavior outside the original brand family.'

  },

  {

    key: 'sameMaterialAlternatives',

    label: 'Same Shell Material',

    description: 'Similar voice behavior using the same primary shell material.'

  },

  {

    key: 'nearDuplicates',

    label: 'Closest Relatives',

    description: 'Same-family or near-identical voice relatives.'

  },

  {

    key: 'voiceContrast',

    label: 'Explore a Different Flavor',

    description: 'Contrasting drums that move the voice in a different direction.'

  }

];

const DISCOVERY_CONTRAST_MODES = [

  {

    key: 'overallContrast',

    label: 'Overall Contrast',

    description: 'The strongest broad voice difference.'

  },

  {

    key: 'dryToOpen',

    label: 'Dry to Open',

    description: 'Moves between controlled/dry and more open/resonant voices.'

  },

  {

    key: 'warmToBright',

    label: 'Warm to Bright',

    description: 'Moves between rounder body and brighter cut.'

  },

  {

    key: 'controlledToExplosive',

    label: 'Controlled to Explosive',

    description: 'Moves between focused control and bigger projection/impact.'

  }

];

const EMPTY_DISCOVERY_STATE = {

  status: DISCOVERY_PACKET_STATUSES.idle,

  snareReferenceId: null,

  packet: null,

  error: null

};

const normalizeDiscoveryPacketResponse = response => {

  if (!response) {

    return {

      ...EMPTY_DISCOVERY_STATE,

      status: DISCOVERY_PACKET_STATUSES.error,

      error: 'No discovery response returned.'

    };

  }

  if (response.found === false) {

    return {

      ...EMPTY_DISCOVERY_STATE,

      status: DISCOVERY_PACKET_STATUSES.notFound,

      snareReferenceId: response.snareReferenceId || null,

      error: response.reason || 'Snare reference was not found.'

    };

  }

  if (response.promotable === false) {

    return {

      ...EMPTY_DISCOVERY_STATE,

      status: DISCOVERY_PACKET_STATUSES.notPromotable,

      snareReferenceId: response.snareReferenceId || null,

      error: response.reason || 'Snare reference is not ready for LegacyPrint discovery.'

    };

  }

  if (!response.packet) {

    return {

      ...EMPTY_DISCOVERY_STATE,

      status: DISCOVERY_PACKET_STATUSES.error,

      snareReferenceId: response.snareReferenceId || null,

      error: 'Discovery packet was missing from response.'

    };

  }

  return {

    status: DISCOVERY_PACKET_STATUSES.ready,

    snareReferenceId: response.snareReferenceId || response.packet?.target?.drum?.id || null,

    packet: response.packet,

    metadata: response.metadata || null,

    error: null

  };

};

const getTargetReadoutTabs = discoveryPacket => {

  const target = discoveryPacket?.target;

  if (!target) return [];

  return CUSTOMER_DISCOVERY_TABS.map(tab => ({

    ...tab,

    nodes: target.readoutMaps?.[tab.key]?.nodes || [],

    summary:

      tab.key === 'firstListen'

        ? target.firstListen

        : tab.key === 'playerAnalysis'

          ? target.playerAnalysis

          : target.legacyPrintIdentity

  }));

};

const getRecommendedMatchSections = discoveryPacket => {

  const recommended = discoveryPacket?.discovery?.recommendedSections || [];

  const grouped = discoveryPacket?.discovery?.similar?.grouped?.groups || {};

  const contrastSections = discoveryPacket?.discovery?.contrast?.sections || [];

  return recommended.map(section => {

    if (section.key === 'voiceContrast') {

      return {

        ...section,

        matches: contrastSections.find(item => item.mode === discoveryPacket?.uiHints?.defaultContrastMode)?.matches || []

      };

    }

    return {

      ...section,

      matches: grouped[section.key] || []

    };

  });

};

const getContrastModeOptions = discoveryPacket => {

  const availableModes = discoveryPacket?.discovery?.contrast?.sections || [];

  return DISCOVERY_CONTRAST_MODES.map(mode => ({

    ...mode,

    matches: availableModes.find(section => section.mode === mode.key)?.matches || []

  }));

};

const createLocalDiscoveryPacketLoader = previewPacket => {

  return async snareReferenceId => {

    const examples = previewPacket?.examples || [];

    const found = examples.find(example => {

      const packet = example.packet || example.result?.packet;

      return (

        example.snareReferenceId === snareReferenceId ||

        packet?.target?.drum?.id === snareReferenceId ||

        packet?.target?.drum?.referenceId === snareReferenceId

      );

    });

    if (!found) {

      return normalizeDiscoveryPacketResponse({

        found: false,

        snareReferenceId,

        reason: 'LOCAL_PREVIEW_PACKET_NOT_FOUND'

      });

    }

    return normalizeDiscoveryPacketResponse({

      found: true,

      promotable: true,

      snareReferenceId,

      packet: found.packet || found.result?.packet,

      metadata: found.result?.metadata || null

    });

  };

};

module.exports = {

  DISCOVERY_PACKET_STATUSES,

  CUSTOMER_DISCOVERY_TABS,

  DISCOVERY_MATCH_SECTIONS,

  DISCOVERY_CONTRAST_MODES,

  EMPTY_DISCOVERY_STATE,

  normalizeDiscoveryPacketResponse,

  getTargetReadoutTabs,

  getRecommendedMatchSections,

  getContrastModeOptions,

  createLocalDiscoveryPacketLoader

};

