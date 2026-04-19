import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '../firebaseConfig';

import './AdminModalTheme.css';
import './ViewSoundlegendModal.css';

import { STATUS_OPTIONS, getOverviewStatus } from '../utils/statusConfig';
import defaultProjectFields from '../utils/defaultProjectFields';
import { defaultStepData } from '../utils/buildWorkflow';
import { buildConsultationIntakeDefaults } from '../utils/consultationIntakeSchema';

import {
  SOURCE_TYPE,
  createEmptyStoryEngineRecord,
} from '../utils/storyEngineSchema';

import {
  createSourceEntry,
  applyObservedFields,
  runStoryEngine,
} from '../utils/storyEngineHelpers';

import { buildStoryEngineFromSources } from '../utils/storyEngineBuildIntentAdapter';
import { runVoicingNarrativePipeline } from '../utils/storyEngineVoicingNarrative';
import { runStoryDraftPipeline } from '../utils/storyEngineDrafting';

const generateAndDownloadVCard = ({ firstName, lastName, email, phone }) => {
  const safeFirst = firstName || 'Contact';
  const safeLast = lastName || 'Ober';

  const vCard = `
BEGIN:VCARD
VERSION:3.0
N:${safeLast};${safeFirst}
FN:${safeFirst} ${safeLast}
EMAIL:${email || ''}
${phone ? `TEL;TYPE=CELL:${phone}` : ''}
END:VCARD
  `.trim();

  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFirst}_${safeLast}_OberContact.vcf`;
  a.click();

  URL.revokeObjectURL(url);
};

const buildSoundLegendProtectedFields = () => ({
  consultationIntake: buildConsultationIntakeDefaults(),

  buildCommitment: {
    isCommitted: false,
    committedAt: null,
    commitmentSource: '',
    commitmentNote: '',
  },

  scopeVisibility: {
    customerCanViewApprovedScope: false,
    customerUnlockedAt: null,
    unlockSource: '',
  },

  storyVisibility: {
    customerCanViewStoryDetails: false,
    storyUnlockedAt: null,
    unlockSource: '',
  },

  adminBuildRecommendation: {
    status: 'draft',
    updatedAt: Timestamp.now(),
    summary: '',
    shellRecipe: '',
    shellConstruction: '',
    dimensions: '',
    staveCount: '',
    reinforcementRings: '',
    primarySpecies: '',
    secondarySpecies: '',
    veneer: '',
    bearingEdges: '',
    snareBedDepth: '',
    lugType: '',
    hardwareFinish: '',
    hoops: '',
    throwOff: '',
    snareWires: '',
    exteriorFinish: '',
    interiorFinish: '',
    resinAccent: '',
    additionalNotes: '',
  },

  approvedCustomerScope: {
    artisanLine: 'SoundLegend',
    lineSerial: '',
    dimensionsLabel: '',
    width: '',
    shellDepth: '',
    staveCount: '',
    shellConstructionName: '',
    reinforcementRings: '',
    primarySpecies: '',
    secondarySpecies: '',
    veneer: '',
    bearingEdge: '',
    snareBedDepth: '',
    lugType: '',
    hardwareFinish: '',
    hoops: '',
    snareThrowOff: '',
    snareWires: '',
    exteriorFinish: '',
    interiorFinish: '',
    resinAccent: '',
    additionalNotes: '',
    lastApprovedAt: null,
    approvedBy: '',
  },
});

const formatTimestamp = (value) => {
  if (!value) return '—';
  try {
    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
};

const renderIntakeValue = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
};

const normalizeAvailabilityValue = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildSchedulingAvailabilityText = (intakeSection = {}) => {
  const days = normalizeAvailabilityValue(intakeSection.consultationDays);
  const times = normalizeAvailabilityValue(intakeSection.consultationTimes);

  if (days.length && times.length) {
    return `${days.join(', ')} • ${times.join(', ')}`;
  }

  if (days.length) return days.join(', ');
  if (times.length) return times.join(', ');

  return '—';
};

const normalizeTextValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (value === null || value === undefined) return '';

  return String(value).trim();
};

const joinArrayForField = (value) => {
  const arr = Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  return arr.length ? arr.join(', ') : '';
};

const hasMeaningfulValue = (value) => {
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => hasMeaningfulValue(item));
  }
  return String(value || '').trim() !== '';
};

const hasMeaningfulQuestionnaire = (consultationIntake = {}) => {
  return ['purpose', 'feel', 'voice', 'legacy', 'consult'].some((key) =>
    hasMeaningfulValue(consultationIntake?.[key])
  );
};

const mapIntakeToStoryEngineFieldMap = ({
  submissionData = {},
  consultationIntake = {},
}) => {
  const fullName = `${submissionData.firstName || ''} ${
    submissionData.lastName || ''
  }`.trim();

  const purpose = consultationIntake?.purpose || {};
  const feel = consultationIntake?.feel || {};
  const voice = consultationIntake?.voice || {};
  const legacy = consultationIntake?.legacy || {};
  const consult = consultationIntake?.consult || {};

  const tonalGoals = Array.isArray(voice.tonalGoals) ? voice.tonalGoals : [];
  const responsePriorities = Array.isArray(voice.responsePriorities)
    ? voice.responsePriorities
    : [];
  const genres = Array.isArray(voice.genres) ? voice.genres : [];
  const environments = Array.isArray(purpose.environments)
    ? purpose.environments
    : [];
  const visualDirection = Array.isArray(legacy.visualDirection)
    ? legacy.visualDirection
    : [];
  const consultationDays = normalizeAvailabilityValue(consult.consultationDays);
  const consultationTimes = normalizeAvailabilityValue(
    consult.consultationTimes
  );

  const combinedAvailability =
    consultationDays.length || consultationTimes.length
      ? [
          consultationDays.length ? `Days: ${consultationDays.join(', ')}` : '',
          consultationTimes.length
            ? `Times: ${consultationTimes.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' | ')
      : '';

  return {
    'buildIdentity.artistName': fullName,
    'buildIdentity.projectName': `${
      fullName || 'SoundLegend'
    } SoundLegend Build`,
    'buildIdentity.primaryUseCase': normalizeTextValue(purpose.primaryGoal),
    'buildIdentity.styleOfPlaying': normalizeTextValue(purpose.playerProfile),

    'globalProfile.playerContext.genreContext': joinArrayForField(genres),
    'globalProfile.playerContext.desiredOutcome': normalizeTextValue(
      purpose.primaryGoal
    ),
    'globalProfile.playerContext.currentPainPoints': joinArrayForField(
      feel.snareFrustrations
    ),
    'globalProfile.playerContext.influenceReferences': normalizeTextValue(
      legacy.influenceReferences
    ),

    'globalProfile.aestheticIntent.visualMood':
      joinArrayForField(visualDirection),
    'globalProfile.aestheticIntent.finishDirection':
      joinArrayForField(visualDirection),

    'globalProfile.sonicIntent.attack': joinArrayForField(tonalGoals),
    'globalProfile.sonicIntent.body': joinArrayForField(tonalGoals),
    'globalProfile.sonicIntent.sensitivity': normalizeTextValue(
      feel.dynamicFeel
    ),
    'globalProfile.sonicIntent.sustain': tonalGoals.includes('Open / resonant')
      ? 'Open / resonant'
      : tonalGoals.includes('Dry / controlled')
        ? 'Dry / controlled'
        : '',
    'globalProfile.sonicIntent.projection': tonalGoals.includes(
      'Bright / cutting'
    )
      ? 'Bright / cutting'
      : tonalGoals.includes('Punchy')
        ? 'Punchy'
        : '',
    'globalProfile.sonicIntent.tuningRange': normalizeTextValue(
      voice.sizeDirection
    ),
    'globalProfile.sonicIntent.articulation':
      joinArrayForField(responsePriorities),
    'globalProfile.sonicIntent.feel': joinArrayForField(feel.feelPriorities),

    'globalProfile.buildPreferences.shellConstruction': '',
    'globalProfile.buildPreferences.hardwareFinish': normalizeTextValue(
      legacy.hardwareFinishPreference
    ),
    'globalProfile.buildPreferences.sizePreference': normalizeTextValue(
      voice.sizeDirection
    ),
    'globalProfile.buildPreferences.contactPreference': normalizeTextValue(
      consult.consultationContactMethod
    ),
    'globalProfile.buildPreferences.availability': combinedAvailability,

    'globalProfile.buildPreferences.environment':
      joinArrayForField(environments),
    'globalProfile.buildPreferences.guidancePreference': normalizeTextValue(
      purpose.guidancePreference
    ),
  };
};

const tryApplyBuildIntentAdapter = ({ record, submissionData }) => {
  if (!record) return record;

  try {
    return (
      buildStoryEngineFromSources({
        existingRecord: record,
        submission: submissionData,
        questionnaireDoc: submissionData,
        project: {},
        adminNotes: {},
        createdBy: 'soundlegend_modal',
      }) || record
    );
  } catch (err) {
    console.error('⚠️ buildStoryEngineFromSources failed:', err);
    return record;
  }
};

const tryApplyVoicingNarrative = ({ record }) => {
  if (!record) return record;

  try {
    return runVoicingNarrativePipeline(record) || record;
  } catch (err) {
    console.error('⚠️ runVoicingNarrativePipeline failed:', err);
    return record;
  }
};

const buildInitialStoryEngineRecord = ({
  submissionData = {},
  consultationIntake = {},
  projectId = '',
}) => {
  let record = createEmptyStoryEngineRecord();

  record.projectId = projectId || null;
  record.artistId = submissionData?.ownerUid || submissionData?.userId || null;

  const sourceEntry = createSourceEntry({
    id: `consultation_${submissionData?.id || 'submission'}`,
    type: SOURCE_TYPE.CONSULTATION,
    label: 'SoundLegend consultation intake',
    content: JSON.stringify(
      {
        submissionId: submissionData?.id || '',
        firstName: submissionData?.firstName || '',
        lastName: submissionData?.lastName || '',
        email: submissionData?.email || '',
        consultationIntake,
      },
      null,
      2
    ),
    createdAt: new Date().toISOString(),
    createdBy: 'admin_portal',
    meta: {
      submissionId: submissionData?.id || '',
      questionnaireCompleted: !!submissionData?.questionnaireCompleted,
      consultationContactMethod:
        consultationIntake?.consult?.consultationContactMethod || '',
    },
  });

  const observedFieldMap = mapIntakeToStoryEngineFieldMap({
    submissionData,
    consultationIntake,
  });

  record = applyObservedFields(record, observedFieldMap, sourceEntry);

  record = runStoryEngine(record, {
    sourcesToRegister: [sourceEntry],
  });

  record = tryApplyBuildIntentAdapter({
    record,
    submissionData,
  });

  record = tryApplyVoicingNarrative({
    record,
  });

  record = runStoryEngine(record, {
    applyRecommendationInference: true,
    applyRecommendationsToMissing: true,
  });

  record = runStoryDraftPipeline(record, 'soundlegend_modal');

  return record;
};

const buildDiscoveryBridgeInput = ({
  submissionData = {},
  consultationIntake = {},
  storyEngine = null,
}) => {
  const purpose = consultationIntake?.purpose || {};
  const feel = consultationIntake?.feel || {};
  const voice = consultationIntake?.voice || {};
  const legacy = consultationIntake?.legacy || {};
  const consult = consultationIntake?.consult || {};

  return {
    submission: {
      id: submissionData?.id || '',
      firstName: submissionData?.firstName || '',
      lastName: submissionData?.lastName || '',
      fullName:
        `${submissionData?.firstName || ''} ${submissionData?.lastName || ''}`.trim(),
      email: submissionData?.email || '',
      phone: submissionData?.phone || '',
      artistBio: submissionData?.artistBio || '',
      inspiration: submissionData?.inspiration || '',
      questionnaireCompleted: !!submissionData?.questionnaireCompleted,
    },
    intake: {
      purpose: {
        playerProfile: purpose.playerProfile || '',
        primaryGoal: purpose.primaryGoal || '',
        environments: Array.isArray(purpose.environments)
          ? purpose.environments
          : [],
        guidancePreference: purpose.guidancePreference || '',
      },
      feel: {
        feelPriorities: Array.isArray(feel.feelPriorities)
          ? feel.feelPriorities
          : [],
        snareLoveMost: feel.snareLoveMost || '',
        snareFrustrations: Array.isArray(feel.snareFrustrations)
          ? feel.snareFrustrations
          : [],
        dynamicFeel: feel.dynamicFeel || '',
      },
      voice: {
        genres: Array.isArray(voice.genres) ? voice.genres : [],
        tonalGoals: Array.isArray(voice.tonalGoals) ? voice.tonalGoals : [],
        responsePriorities: Array.isArray(voice.responsePriorities)
          ? voice.responsePriorities
          : [],
        sizeDirection: voice.sizeDirection || '',
      },
      legacy: {
        visualDirection: Array.isArray(legacy.visualDirection)
          ? legacy.visualDirection
          : [],
        hardwareFinishPreference: legacy.hardwareFinishPreference || '',
        storyImportance: legacy.storyImportance || '',
        favoritePartOfPlaying: legacy.favoritePartOfPlaying || '',
        influenceReferences: legacy.influenceReferences || '',
        finalNotes: legacy.finalNotes || '',
      },
      consult: {
        consultationContactMethod: consult.consultationContactMethod || '',
        consultationDays: Array.isArray(consult.consultationDays)
          ? consult.consultationDays
          : [],
        consultationTimes: Array.isArray(consult.consultationTimes)
          ? consult.consultationTimes
          : [],
      },
    },
    consultationMapped: {},
    consultationSummary: '',
    consultationTranscript: '',
    adminNotes: '',
    discoveryWorkspace: {},
    storyEngineSnapshot: storyEngine || null,
  };
};

const buildDiscoveryBridgePromptPayload = (discoveryBridgeInput) => ({
  system: `
You are an expert discovery-to-build analysis assistant for custom artisan snare drums.

Your job is to analyze intake, questionnaire answers, consultation notes, transcript content, and craftsman notes to identify:
- what is already strong enough to trust
- what is still too unclear to safely build around
- what could block, weaken, or misdirect the build if left unresolved
- what the craftsman should ask next
- what assumptions should be avoided

Be conservative.
Do not invent preferences that are not supported.
Do not pretend the build is ready if important decisions are still missing.

You must return valid JSON only.
No markdown.
No prose outside JSON.
  `.trim(),
  user: `
Analyze this custom snare discovery payload and return JSON in exactly this shape:

{
  "overallBuildReadiness": "low",
  "globalBuildBlockers": ["..."],
  "globalConsultPriorities": ["..."],
  "truths": {
    "purpose": {
      "buildReadiness": "low",
      "signalsWeHave": ["..."],
      "criticalUnknowns": ["..."],
      "assumptionsToAvoid": ["..."],
      "followupQuestions": ["..."],
      "watchouts": ["..."],
      "recommendationNotes": ["..."]
    },
    "feel": {
      "buildReadiness": "low",
      "signalsWeHave": ["..."],
      "criticalUnknowns": ["..."],
      "assumptionsToAvoid": ["..."],
      "followupQuestions": ["..."],
      "watchouts": ["..."],
      "recommendationNotes": ["..."]
    },
    "voice": {
      "buildReadiness": "low",
      "signalsWeHave": ["..."],
      "criticalUnknowns": ["..."],
      "assumptionsToAvoid": ["..."],
      "followupQuestions": ["..."],
      "watchouts": ["..."],
      "recommendationNotes": ["..."]
    },
    "legacy": {
      "buildReadiness": "low",
      "signalsWeHave": ["..."],
      "criticalUnknowns": ["..."],
      "assumptionsToAvoid": ["..."],
      "followupQuestions": ["..."],
      "watchouts": ["..."],
      "recommendationNotes": ["..."]
    }
  },
  "proposedConsultFlow": ["..."],
  "buildDirectionSnapshot": {
    "safeToSayNow": ["..."],
    "unsafeToAssumeNow": ["..."],
    "likelyDecisionAreasNext": ["..."]
  }
}

Allowed buildReadiness values:
- "low"
- "medium"
- "high"

Truth mapping:
- purpose = why this drum exists, role, use case, context
- feel = touch, rebound, comfort, dynamic response, frustrations
- voice = tonal identity, projection, tuning lane, size implications
- legacy = visual direction, emotional significance, story, aesthetic alignment

Important:
- criticalUnknowns should focus on what still must be clarified before real build planning
- assumptionsToAvoid should protect the craftsman from false confidence
- followupQuestions should be specific and useful, not generic filler
- watchouts should point out risk, contradiction, or hidden decision gaps
- recommendationNotes should help the craftsman understand how to think about the next step

The output should help a craftsman bridge the gap between intake truth and actual build readiness.

Here is the payload:

${JSON.stringify(discoveryBridgeInput, null, 2)}
  `.trim(),
});

const toArrayOfStrings = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
};

const buildBridgeOverviewText = (bridge = {}) => {
  const blockers = toArrayOfStrings(bridge?.globalBuildBlockers);
  const priorities = toArrayOfStrings(bridge?.globalConsultPriorities);
  const safeToSayNow = toArrayOfStrings(
    bridge?.buildDirectionSnapshot?.safeToSayNow
  );
  const unsafeToAssumeNow = toArrayOfStrings(
    bridge?.buildDirectionSnapshot?.unsafeToAssumeNow
  );

  const parts = [];

  if (safeToSayNow.length) {
    parts.push(`What feels usable now: ${safeToSayNow.slice(0, 3).join('; ')}.`);
  }

  if (priorities.length) {
    parts.push(
      `Next consult priorities: ${priorities.slice(0, 3).join('; ')}.`
    );
  }

  if (blockers.length) {
    parts.push(`Current blockers: ${blockers.slice(0, 3).join('; ')}.`);
  }

  if (unsafeToAssumeNow.length) {
    parts.push(
      `Do not assume yet: ${unsafeToAssumeNow.slice(0, 3).join('; ')}.`
    );
  }

  return parts.join(' ').trim();
};

const adaptDiscoveryBridgeToSummaryStructure = (bridge = {}) => {
  const truths = bridge?.truths || {};
  const truthOrder = ['purpose', 'feel', 'voice', 'legacy'];

  const trustedSignals = [];
  const stillOpen = [];
  const confidenceRows = [];
  const followUps = [];
  const builderResearch = [];
  const nextSteps = [];
  const changedSignals = [];
  const conflictedSignals = [];

  truthOrder.forEach((truthKey) => {
    const truth = truths?.[truthKey] || {};
    const truthTitle =
      truthKey.charAt(0).toUpperCase() + truthKey.slice(1);

    const signalsWeHave = toArrayOfStrings(truth.signalsWeHave);
    const criticalUnknowns = toArrayOfStrings(truth.criticalUnknowns);
    const assumptionsToAvoid = toArrayOfStrings(truth.assumptionsToAvoid);
    const followupQuestions = toArrayOfStrings(truth.followupQuestions);
    const watchouts = toArrayOfStrings(truth.watchouts);
    const recommendationNotes = toArrayOfStrings(truth.recommendationNotes);

    const confidence =
      truth.buildReadiness === 'high'
        ? 'high'
        : truth.buildReadiness === 'medium'
          ? 'medium'
          : 'low';

    signalsWeHave.forEach((signal, index) => {
      trustedSignals.push({
        label: `${truthTitle} · Signal ${index + 1}`,
        value: signal,
        confidence,
        rationale:
          recommendationNotes[0] ||
          watchouts[0] ||
          `Bridge analysis found this signal usable enough to carry into the next stage.`,
      });
    });

    criticalUnknowns.forEach((item, index) => {
      stillOpen.push({
        label: `${truthTitle} · Open ${index + 1}`,
        note: item,
      });
    });

    assumptionsToAvoid.forEach((item, index) => {
      builderResearch.push({
        label: `${truthTitle} · Assumption ${index + 1}`,
        note: item,
      });
    });

    followupQuestions.forEach((item, index) => {
      followUps.push({
        label: `${truthTitle} · Follow-up ${index + 1}`,
        question: item,
      });
    });

    confidenceRows.push({
      label: truthTitle,
      value: signalsWeHave.length
        ? signalsWeHave.join(' • ')
        : 'No strong confirmed signals yet.',
      confidence,
      rationale:
        recommendationNotes[0] ||
        watchouts[0] ||
        (confidence === 'high'
          ? 'This truth looks strong enough to build around.'
          : confidence === 'medium'
            ? 'This truth is directionally useful but still needs confirming.'
            : 'This truth is still too soft to treat as stable build direction.'),
    });
  });

  toArrayOfStrings(bridge?.globalConsultPriorities).forEach((item) => {
    nextSteps.push(item);
  });

  toArrayOfStrings(bridge?.globalBuildBlockers).forEach((item, index) => {
    conflictedSignals.push({
      label: `Global blocker ${index + 1}`,
      note: item,
    });
  });

  toArrayOfStrings(
    bridge?.buildDirectionSnapshot?.unsafeToAssumeNow
  ).forEach((item, index) => {
    changedSignals.push({
      label: `Unsafe assumption ${index + 1}`,
      note: item,
    });
  });

  return {
    overview: buildBridgeOverviewText(bridge),
    trustedSignals,
    changedSignals,
    conflictedSignals,
    stillOpen,
    followUps,
    builderResearch,
    confidenceRows,
    nextSteps,
  };
};

const buildDiscoveryWorkspaceFromBridge = (bridge = {}) => {
  const structured = adaptDiscoveryBridgeToSummaryStructure(bridge);

  return {
    intake: {
      completed: false,
      completedAt: null,
    },
    consult: {
      completed: false,
      completedAt: null,
      rows: {},
      truthRows: {},
    },
    summary: {
      generated: true,
      generatedAt: new Date().toISOString(),
      editableText: structured.overview || '',
      structured,
    },
  };
};

const ViewSoundlegendModal = ({
  submission,
  onClose,
  onStatusUpdate,
  onUpdateSubmission,
}) => {
  const submissionId = submission?.id || null;

  const [selectedStatus, setSelectedStatus] = useState(
    submission?.status || 'New'
  );
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState(submission?.history || []);
  const [projectId, setProjectId] = useState(submission?.projectId || null);
  const [fullSubmission, setFullSubmission] = useState(
    submission ? { ...submission, id: submission.id } : null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const {
    firstName,
    lastName,
    email,
    phone,
    artistBio,
    inspiration,
    submittedAt,
    consultationIntake,
    questionnaireCompleted,
    questionnaireCompletedAt,
  } = fullSubmission || submission || {};

  useEffect(() => {
    if (!submissionId) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [submissionId, onClose]);

  const copyToClipboard = useCallback((text) => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => console.log(`📋 Copied: ${text}`))
      .catch((err) => console.error('❌ Copy failed:', err));
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    if (!submissionId) return;

    setSelectedStatus(newStatus);

    try {
      const overviewStatus = getOverviewStatus('soundlegend', newStatus);
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);

      const timestamp = new Date().toISOString();
      const historyEntry = { type: 'status', value: newStatus, timestamp };

      await updateDoc(submissionRef, {
        status: newStatus,
        overviewStatus,
        history: arrayUnion(historyEntry),
      });

      setHistory((prev) => [...prev, historyEntry]);

      const nextSubmission = {
        ...(fullSubmission || submission),
        id: submissionId,
        status: newStatus,
        overviewStatus,
        history: [...(history || []), historyEntry],
      };

      setFullSubmission(nextSubmission);
      onUpdateSubmission?.(nextSubmission);
      onStatusUpdate?.(submissionId, newStatus);
    } catch (err) {
      console.error('❌ Failed to update status in modal:', err);
    }
  };

  const handleNoteSubmit = async () => {
    if (!submissionId || !notes.trim()) return;

    try {
      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
      const timestamp = new Date().toISOString();
      const noteEntry = { type: 'note', value: notes.trim(), timestamp };

      await updateDoc(submissionRef, {
        history: arrayUnion(noteEntry),
      });

      setHistory((prev) => [...prev, noteEntry]);
      setNotes('');
    } catch (err) {
      console.error('❌ Failed to save note:', err);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionId || isDeleting) return;

    const confirmDelete = window.confirm(
      `Delete this SoundLegend submission for ${firstName || ''} ${
        lastName || ''
      }?\n\nThis cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const questionnaireToken =
        fullSubmission?.questionnaireToken ||
        submission?.questionnaireToken ||
        '';

      await deleteDoc(doc(db, 'soundlegend_submissions', submissionId));

      if (questionnaireToken) {
        try {
          await deleteDoc(
            doc(db, 'soundlegend_questionnaires', questionnaireToken)
          );
        } catch (questionnaireErr) {
          console.error(
            '⚠️ Failed to delete questionnaire doc:',
            questionnaireErr
          );
        }
      }

      onUpdateSubmission?.({
        ...(fullSubmission || submission),
        id: submissionId,
        _deleted: true,
      });

      alert('✅ SoundLegend submission deleted.');
      onClose?.();
    } catch (err) {
      console.error('❌ Failed to delete SoundLegend submission:', err);
      alert('Failed to delete submission. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const createProject = async () => {
    if (!submissionId || isCreatingProject) return;

    const confirmCreation = window.confirm(
      `Create Project for ${firstName || ''} ${lastName || ''}?`
    );
    if (!confirmCreation) return;

    setIsCreatingProject(true);

    try {
      const protectedFields = buildSoundLegendProtectedFields();
      const intakeDefaults = buildConsultationIntakeDefaults();
      const resolvedConsultationIntake = consultationIntake || intakeDefaults;

      const projectData = {
        source: 'SoundLegend',
        submissionId,
        customerName: `${firstName || ''} ${lastName || ''}`.trim(),
        customerEmail: email || '',
        customerPhone: phone || '',
        ownerEmail: email || '',
        customer: {
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          email: email || '',
          phone: phone || '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: '',
          },
        },
        artisanLine: 'SoundLegend',
        width: '',
        shellDepth: '',
        startDate: Timestamp.now(),
        currentPhase: '1. Discovery & Design',
        ...defaultStepData,
        ...defaultProjectFields,
        ...protectedFields,
        consultationIntake: resolvedConsultationIntake,
      };

      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      const newProjectId = projectRef.id;

      const submissionSnapshot = {
        ...(fullSubmission || submission),
        id: submissionId,
      };

      let storyEngine = buildInitialStoryEngineRecord({
        submissionData: submissionSnapshot,
        consultationIntake: resolvedConsultationIntake,
        projectId: newProjectId,
      });

      let discoveryBridge = null;
      let discoveryWorkspace =
        storyEngine?.sources?.discoveryWorkspace || {
          intake: {
            completed: false,
            completedAt: null,
          },
          consult: {
            completed: false,
            completedAt: null,
            rows: {},
            truthRows: {},
          },
          summary: {
            generated: false,
            generatedAt: null,
            editableText: '',
            structured: null,
          },
        };

      const shouldGenerateBridge = hasMeaningfulQuestionnaire(
        resolvedConsultationIntake
      );

      if (shouldGenerateBridge) {
        try {
          const discoveryBridgeInput = buildDiscoveryBridgeInput({
            submissionData: submissionSnapshot,
            consultationIntake: resolvedConsultationIntake,
            storyEngine,
          });

          const promptPayload =
            buildDiscoveryBridgePromptPayload(discoveryBridgeInput);

          const functions = getFunctions(app, 'us-central1');
          const generateDiscoveryBridge = httpsCallable(
            functions,
            'generateDiscoveryBridge'
          );

          const bridgeResponse = await generateDiscoveryBridge({
            projectId: newProjectId,
            discoveryBridgeInput,
            promptPayload,
          });

          discoveryBridge =
            bridgeResponse?.data?.result ||
            bridgeResponse?.data?.discoveryBridge ||
            bridgeResponse?.data ||
            null;

          if (discoveryBridge && typeof discoveryBridge === 'object') {
            discoveryBridge = {
              ...discoveryBridge,
              generatedAt:
                discoveryBridge.generatedAt || new Date().toISOString(),
              rawResponseText:
                discoveryBridge.rawResponseText ||
                buildBridgeOverviewText(discoveryBridge),
            };

            discoveryWorkspace =
              buildDiscoveryWorkspaceFromBridge(discoveryBridge);
          }
        } catch (bridgeErr) {
          console.error('❌ Failed to generate discovery bridge:', bridgeErr);
        }
      }

      const nextStoryEngine = {
        ...storyEngine,
        sources: {
          ...(storyEngine?.sources || {}),
          consultationTranscript:
            storyEngine?.sources?.consultationTranscript || '',
          consultationTranscriptTurns:
            storyEngine?.sources?.consultationTranscriptTurns || [],
          consultationSummary:
            storyEngine?.sources?.consultationSummary || '',
          adminNotes: storyEngine?.sources?.adminNotes || '',
          questionnaireRaw:
            storyEngine?.sources?.questionnaireRaw ||
            JSON.stringify(resolvedConsultationIntake, null, 2),
          questionnaireMapped:
            storyEngine?.sources?.questionnaireMapped || {},
          consultationMapped:
            storyEngine?.sources?.consultationMapped || {},
          discoveryWorkspace,
        },
      };

      storyEngine = nextStoryEngine;

      const projectUpdatePayload = {
        id: newProjectId,
        storyEngine,
        updatedAt: Timestamp.now(),
      };

      if (discoveryBridge) {
        projectUpdatePayload.discoveryBridge = discoveryBridge;
      }

      await updateDoc(doc(db, 'projects', newProjectId), projectUpdatePayload);

      const submissionRef = doc(db, 'soundlegend_submissions', submissionId);
      const systemEntry = {
        type: 'system',
        value: `Project created: ${newProjectId}`,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(submissionRef, {
        projectId: newProjectId,
        history: arrayUnion(systemEntry),
      });

      setProjectId(newProjectId);
      setHistory((prev) => [systemEntry, ...prev]);

      const nextSubmission = {
        ...(fullSubmission || submission),
        id: submissionId,
        projectId: newProjectId,
        history: [systemEntry, ...(history || [])],
      };

      setFullSubmission(nextSubmission);

      alert(`✅ Project created successfully!\n\nID: ${newProjectId}`);

      onUpdateSubmission?.(nextSubmission);
    } catch (err) {
      console.error('❌ Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  useEffect(() => {
    if (!submissionId) return;

    const fetchAndValidateSubmission = async () => {
      try {
        const ref = doc(db, 'soundlegend_submissions', submissionId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn('❌ Submission no longer exists.');
          return;
        }

        const data = snap.data();
        let validProjectId = data.projectId || null;

        if (validProjectId) {
          const projectRef = doc(db, 'projects', validProjectId);
          const projectSnap = await getDoc(projectRef);

          if (!projectSnap.exists()) {
            console.warn(`❌ Linked project not found: ${validProjectId}`);
            validProjectId = null;
            await updateDoc(ref, { projectId: null });
          }
        }

        let mergedData = { ...data, id: submissionId };

        if (
          (!mergedData.consultationIntake ||
            !mergedData.consultationIntake.purpose) &&
          mergedData.questionnaireToken
        ) {
          try {
            const questionnaireRef = doc(
              db,
              'soundlegend_questionnaires',
              mergedData.questionnaireToken
            );
            const questionnaireSnap = await getDoc(questionnaireRef);

            if (questionnaireSnap.exists()) {
              const questionnaireData = questionnaireSnap.data() || {};

              mergedData = {
                ...mergedData,
                consultationIntake:
                  questionnaireData.consultationIntake ||
                  mergedData.consultationIntake,
                consultationIntakeUpdatedAt:
                  questionnaireData.consultationIntakeUpdatedAt ||
                  mergedData.consultationIntakeUpdatedAt,
                questionnaireCompleted:
                  questionnaireData.questionnaireCompleted ??
                  mergedData.questionnaireCompleted,
                questionnaireCompletedAt:
                  questionnaireData.questionnaireCompletedAt ||
                  mergedData.questionnaireCompletedAt,
                status: mergedData.status || questionnaireData.status,
                stage: mergedData.stage || questionnaireData.stage,
              };
            }
          } catch (questionnaireErr) {
            console.error(
              '❌ Error loading questionnaire fallback data:',
              questionnaireErr
            );
          }
        }

        setFullSubmission(mergedData);
        setProjectId(validProjectId);
        setHistory(data.history || []);
        setSelectedStatus(data.status || 'New');
      } catch (err) {
        console.error('❌ Error loading/validating submission:', err);
      }
    };

    fetchAndValidateSubmission();
  }, [submissionId]);

  if (!submissionId) return null;

  const intakeDefaults = buildConsultationIntakeDefaults();
  const resolvedConsultationIntake = consultationIntake || intakeDefaults;

  const purpose =
    resolvedConsultationIntake?.purpose || intakeDefaults.purpose || {};
  const feel = resolvedConsultationIntake?.feel || intakeDefaults.feel || {};
  const voice = resolvedConsultationIntake?.voice || intakeDefaults.voice || {};
  const legacy =
    resolvedConsultationIntake?.legacy || intakeDefaults.legacy || {};
  const consult =
    resolvedConsultationIntake?.consult || intakeDefaults.consult || {};

  return ReactDOM.createPortal(
    <div
      className="slmodal__backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="slmodal light"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="slmodal__header">
          <h3>SoundLegend Submission</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="slmodal__body">
          <div className="ea-grid">
            <div className="ea-block">
              <h4>Status & Actions</h4>

              <div className="row">
                <span>Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  {STATUS_OPTIONS.soundlegend.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <span>Questionnaire</span>
                <span className="text-box">
                  {questionnaireCompleted ? 'Completed' : 'Pending'}
                </span>
              </div>

              {questionnaireCompleted ? (
                <div className="row">
                  <span>Completed At</span>
                  <span className="muted">
                    {formatTimestamp(questionnaireCompletedAt)}
                  </span>
                </div>
              ) : null}

              {projectId ? (
                <div className="row">
                  <span>Linked Project</span>
                  <div>
                    <a
                      href={`/legacy?projectId=${projectId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      Open Project ↗
                    </a>
                    <button
                      className="icon-btn ml-8"
                      onClick={() => copyToClipboard(projectId)}
                      title="Copy Project ID"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn--sm"
                  onClick={createProject}
                  disabled={isCreatingProject}
                >
                  {isCreatingProject ? 'Creating…' : 'Create Project'}
                </button>
              )}

              <div className="row">
                <span>Contact Card</span>
                <button
                  className="btn btn--sm"
                  onClick={() =>
                    generateAndDownloadVCard({
                      firstName,
                      lastName,
                      email,
                      phone,
                    })
                  }
                >
                  Download .vcf
                </button>
              </div>

              <div className="row">
                <span>Delete</span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={handleDeleteSubmission}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete Submission'}
                </button>
              </div>
            </div>

            <div className="ea-block">
              <h4>Contact</h4>

              <div className="row">
                <span>Name</span>
                <div>
                  <span className="text-box">
                    {firstName} {lastName}
                  </span>
                  <button
                    className="icon-btn ml-8"
                    onClick={() =>
                      copyToClipboard(
                        `${firstName || ''} ${lastName || ''}`.trim()
                      )
                    }
                    title="Copy name"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="row">
                <span>Email</span>
                <div>
                  <span className="text-box">{email}</span>
                  <button
                    className="icon-btn ml-8"
                    onClick={() => copyToClipboard(email)}
                    title="Copy email"
                  >
                    📋
                  </button>
                </div>
              </div>

              {phone && (
                <div className="row">
                  <span>Phone</span>
                  <span className="text-box">{phone}</span>
                </div>
              )}

              {submittedAt?.seconds && (
                <div className="row">
                  <span>Submitted</span>
                  <span className="muted">
                    {new Date(submittedAt.seconds * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="ea-block col-span-2">
              <h4>Questionnaire Details</h4>
              <div className="table-wrap">
                <table className="ea-table">
                  <tbody>
                    <tr>
                      <th>Player profile</th>
                      <td>{renderIntakeValue(purpose.playerProfile)}</td>
                    </tr>
                    <tr>
                      <th>Main goal</th>
                      <td>{renderIntakeValue(purpose.primaryGoal)}</td>
                    </tr>
                    <tr>
                      <th>Environments</th>
                      <td>{renderIntakeValue(purpose.environments)}</td>
                    </tr>
                    <tr>
                      <th>Guidance preference</th>
                      <td>{renderIntakeValue(purpose.guidancePreference)}</td>
                    </tr>

                    <tr>
                      <th>Feel priorities</th>
                      <td>{renderIntakeValue(feel.feelPriorities)}</td>
                    </tr>
                    <tr>
                      <th>What feels right</th>
                      <td>{renderIntakeValue(feel.snareLoveMost)}</td>
                    </tr>
                    <tr>
                      <th>Snare frustrations</th>
                      <td>{renderIntakeValue(feel.snareFrustrations)}</td>
                    </tr>
                    <tr>
                      <th>Low-volume sensitivity</th>
                      <td>{renderIntakeValue(feel.dynamicFeel)}</td>
                    </tr>

                    <tr>
                      <th>Genres</th>
                      <td>{renderIntakeValue(voice.genres)}</td>
                    </tr>
                    <tr>
                      <th>Tonal direction</th>
                      <td>{renderIntakeValue(voice.tonalGoals)}</td>
                    </tr>
                    <tr>
                      <th>Response priorities</th>
                      <td>{renderIntakeValue(voice.responsePriorities)}</td>
                    </tr>
                    <tr>
                      <th>Size direction</th>
                      <td>{renderIntakeValue(voice.sizeDirection)}</td>
                    </tr>

                    <tr>
                      <th>Visual direction</th>
                      <td>{renderIntakeValue(legacy.visualDirection)}</td>
                    </tr>
                    <tr>
                      <th>Hardware finish</th>
                      <td>
                        {renderIntakeValue(legacy.hardwareFinishPreference)}
                      </td>
                    </tr>
                    <tr>
                      <th>Story importance</th>
                      <td>{renderIntakeValue(legacy.storyImportance)}</td>
                    </tr>
                    <tr>
                      <th>Favorite part of playing</th>
                      <td>{renderIntakeValue(legacy.favoritePartOfPlaying)}</td>
                    </tr>
                    <tr>
                      <th>Influences</th>
                      <td className="pre">
                        {renderIntakeValue(legacy.influenceReferences)}
                      </td>
                    </tr>
                    <tr>
                      <th>Final notes</th>
                      <td className="pre">
                        {renderIntakeValue(legacy.finalNotes)}
                      </td>
                    </tr>

                    <tr>
                      <th>Scheduling contact method</th>
                      <td>
                        {renderIntakeValue(consult.consultationContactMethod)}
                      </td>
                    </tr>
                    <tr>
                      <th>Scheduling availability</th>
                      <td className="pre">
                        {buildSchedulingAvailabilityText(consult)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {artistBio && (
              <div className="ea-block col-span-2">
                <h4>Artist Bio</h4>
                <div className="text-box">{artistBio}</div>
              </div>
            )}

            {inspiration && (
              <div className="ea-block col-span-2">
                <h4>Inspiration</h4>
                <div className="text-box">{inspiration}</div>
              </div>
            )}

            <div className="ea-block col-span-2">
              <h4>Add Note</h4>
              <textarea
                rows={3}
                placeholder="Write an internal note…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="right">
                <button
                  className="btn btn--sm"
                  onClick={handleNoteSubmit}
                  disabled={!notes.trim()}
                >
                  Save Note
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setNotes('')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="ea-block col-span-2">
              <h4>History</h4>
              {history.length === 0 ? (
                <div className="muted">No history yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="ea-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry, index) => (
                        <tr key={`${entry.timestamp}-${index}`}>
                          <td>
                            {entry.type === 'status' ? 'Status' : entry.type}
                          </td>
                          <td className="pre">{entry.value}</td>
                          <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="slmodal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewSoundlegendModal;