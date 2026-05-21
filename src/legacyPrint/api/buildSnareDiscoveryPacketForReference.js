
const admin = require('firebase-admin');

const {

  buildSnareVoicePacket,

  buildSnareDiscoveryPacket,

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('../engine/snare');

const COLLECTION = 'snareReferenceDrums';

const ensureAdmin = () => {

  if (!admin.apps.length) {

    admin.initializeApp();

  }

  return admin.firestore();

};

const getPromotableCorpus = async db => {

  const snap = await db

    .collection(COLLECTION)

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const records = [];

  snap.forEach(doc => records.push({ id: doc.id, ...doc.data() }));

  return records;

};

const buildSnareDiscoveryPacketForReference = async (snareReferenceId, options = {}) => {

  if (!snareReferenceId) {

    throw new Error('snareReferenceId is required.');

  }

  const {

    overlay = DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay = true,

    includeBaseScore = true,

    includeRawRecord = false,

    similarLimit = 40,

    contrastLimit = 5,

    contrastMinScore = 0.4

  } = options;

  const db = options.db || ensureAdmin();

  const doc = await db.collection(COLLECTION).doc(snareReferenceId).get();

  if (!doc.exists) {

    return {

      found: false,

      snareReferenceId,

      reason: 'SNARE_REFERENCE_NOT_FOUND',

      packet: null

    };

  }

  const targetRecord = { id: doc.id, ...doc.data() };

  if (targetRecord.legacyPrintEnginePromotable !== true) {

    return {

      found: true,

      snareReferenceId,

      promotable: false,

      reason: 'SNARE_REFERENCE_NOT_ENGINE_PROMOTABLE',

      packet: null,

      metadata: {

        companyName: targetRecord.companyName || null,

        modelName: targetRecord.modelName || null,

        legacyPrintReadinessTier: targetRecord.legacyPrintReadinessTier || null,

        legacyPrintPromotionRule: targetRecord.legacyPrintPromotionRule || null

      }

    };

  }

  const corpusRecords = await getPromotableCorpus(db);

  const corpusPackets = corpusRecords.map(record =>

    buildSnareVoicePacket(record, {

      overlay,

      applyOverlay,

      includeBaseScore: false,

      includeRawRecord: false,

      mode: 'apiDiscoveryCorpus'

    })

  );

  const targetPacket = buildSnareVoicePacket(targetRecord, {

    overlay,

    applyOverlay,

    includeBaseScore,

    includeRawRecord,

    mode: 'apiDiscoveryTarget'

  });

  const packet = buildSnareDiscoveryPacket(targetPacket, corpusPackets, {

    overlay,

    applyOverlay,

    includeBaseScore,

    includeRawRecord,

    similarLimit,

    contrastLimit,

    contrastMinScore

  });

  return {

    found: true,

    promotable: true,

    snareReferenceId,

    packet,

    metadata: {

      corpusSize: corpusPackets.length,

      engineVersion: packet.engineVersion,

      packetVersion: packet.packetVersion,

      generatedAt: packet.generatedAt

    }

  };

};

module.exports = {

  buildSnareDiscoveryPacketForReference

};

