
import discoveryPreviewPacket from '../reviewPlans/snare-discovery-packet-api-preview-v01.json';

const REFERENCE_TO_PREVIEW_MATCH = {

  heritage: 'acrolite',

  'black-beauty': 'black-beauty',

  brooklyn: 'true-cast',

};

const normalizeReferenceSearchTerm = selectedReferenceId =>

  REFERENCE_TO_PREVIEW_MATCH[selectedReferenceId] || selectedReferenceId || 'acrolite';

const getPreviewExamplePacket = (previewPacket, selectedReferenceId) => {

  const examples = previewPacket?.examples || [];

  const searchTerm = normalizeReferenceSearchTerm(selectedReferenceId);

  const found =

    examples.find(example => {

      const packet = example.packet || example.result?.packet;

      const drum = packet?.target?.drum || {};

      const haystack = [

        example.key,

        example.snareReferenceId,

        drum.id,

        drum.company,

        drum.model,

        drum.size,

      ]

        .filter(Boolean)

        .join(' ')

        .toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());

    }) || examples[0];

  return found?.packet || found?.result?.packet || null;

};

/**

 * Frontend-safe discovery packet loader.

 *

 * Current behavior:

 * - uses local preview packet examples

 *

 * Future behavior slot:

 * - read cached Firestore discovery packet

 * - call HTTPS/callable discovery endpoint

 * - fall back to preview packet in development

 *

 * Never import firebase-admin or server-only discovery builders here.

 */

export async function loadSnareDiscoveryPacket({

  firestore,

  selectedReferenceId,

  snareReferenceId,

  source = 'preview',

} = {}) {

  const lookupId = snareReferenceId || selectedReferenceId || 'heritage';

  if (source === 'cachedFirestore' && firestore && snareReferenceId) {

    try {

      const doc = await firestore

        .collection('snareDiscoveryPackets')

        .doc(snareReferenceId)

        .get();

      if (doc.exists) {

        const data = doc.data();

        return {

          status: 'ready',

          source: 'cachedFirestore',

          snareReferenceId,

          packet: data.packet || data,

          metadata: data.metadata || null,

          error: null,

        };

      }

    } catch (error) {

      console.warn('[LegacyPrint] cached discovery packet lookup failed:', error);

    }

  }

  const packet = getPreviewExamplePacket(discoveryPreviewPacket, lookupId);

  if (!packet) {

    return {

      status: 'error',

      source: 'preview',

      snareReferenceId: lookupId,

      packet: null,

      metadata: null,

      error: 'No local discovery preview packet found.',

    };

  }

  return {

    status: 'ready',

    source: 'preview',

    snareReferenceId: packet.target?.drum?.id || lookupId,

    packet,

    metadata: {

      fallback: true,

      selectedReferenceId: lookupId,

    },

    error: null,

  };

}

