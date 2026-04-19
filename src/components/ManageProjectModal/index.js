import React, { useEffect, useState } from 'react';
import IntakeDirectionSection from './IntakeDirectionSection';
import StoryStudioSection from './StoryStudioSection';
import OutstandingHelpOverlay from './OutstandingHelpOverlay';
import CraftsmanMasterToolSection from './sections/CraftsmanMasterToolSection';

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, app, storage } from '../../firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { Snackbar } from '@mui/material';
import { useImpersonation } from '../../context/ImpersonationContext';

import {
  createEmptyStoryEngineRecord,
  SOURCE_TYPE,
} from '../../utils/storyEngineSchema';

import {
  createSourceEntry,
  registerSource,
  applyObservedFields,
  createAdminFieldMapFromConsultation,
  createAdminFieldMapFromQuestionnaire,
  runStoryEngine,
} from '../../utils/storyEngineHelpers';

import { runStoryDraftPipeline } from '../../utils/storyEngineDrafting';
import { STORY_ENGINE_BUILD_SPEC_FIELDS } from '../../utils/storyEngineFieldConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';

import ProjectDetailsSection from './sections/ProjectDetailsSection';
import BuildScopeSection from './sections/BuildScopeSection';
import MediaFilesSection from './sections/MediaFilesSection';
import BuildWorkflowSection from './sections/BuildWorkflowSection';

import {
  ADMIN_NAV_GROUPS,
  ADMIN_SECTIONS,
  HYBRID_CHAPTER_PROMPTS,
  buildPhases,
} from './shared/constants';

import {
  buildSmartTranscriptTurns,
  splitTranscriptIntoChunks,
  mergeAdjacentTurns,
} from './shared/transcriptHelpers';

import {
  buildProjectFileStoragePath,
  getProjectFileKind,
  getProjectFilesFromSources,
  normalizeProjectFileRecord,
  normalizeSortOrdersForSection,
  syncAttachmentsFromProjectFiles,
  getProjectFileUrl,
} from './shared/projectFileHelpers';

import {
  ensureChecklistStructure,
  determineCurrentPhase,
  determineOverallStatus,
  deriveCustomerName,
  deriveCustomerEmail,
  getGlobalActivePointer,
  getIdentifier,
  getSubstepLabelText,
  getCheckpointCountForItem,
  normalizeCheckpointBooleans,
} from './shared/stepHelpers';

import {
  getProjectReadinessState,
  getLinkedUserStatusLabel,
} from './shared/readinessHelpers';

import './ManageProjectModal.css';

const buildQuestionnaireRawFromProject = (project = {}) => {
  const intake = project?.consultationIntake || {};

  const normalized = {
    playingWorld: intake?.playingWorld || {},
    soundGoals: intake?.soundGoals || {},
    buildDirection: intake?.buildDirection || {},
    consultPrep: intake?.consultPrep || {},
  };

  const hasAnyData = Object.values(normalized).some(
    (section) => section && Object.keys(section).length
  );

  if (!hasAnyData) return '';

  try {
    return JSON.stringify(normalized, null, 2);
  } catch {
    return '';
  }
};

const deriveBestProjectName = (project = {}) => {
  const identifier = getIdentifier(project);
  return (
    String(project?.projectName || '').trim() ||
    String(project?.title || '').trim() ||
    String(project?.name || '').trim() ||
    String(project?.lineSerial || '').trim() ||
    (identifier !== '—' ? identifier : '') ||
    String(project?.id || '').trim() ||
    ''
  );
};

const deriveBestArtistName = (project = {}, storyEngineData = {}) => {
  return (
    String(
      storyEngineData?.consultationMapped?.artistName ||
        storyEngineData?.questionnaireMapped?.artistName ||
        project?.customerName ||
        project?.customer?.name ||
        project?.customer?.displayName ||
        project?.customerInfo?.name ||
        project?.customerFullName ||
        project?.artistName ||
        ''
    ).trim() || ''
  );
};

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  const [selectedTab, setSelectedTab] = useState(
    ADMIN_SECTIONS.OVERVIEW_PROJECT_DETAILS
  );
  const [editableData, setEditableData] = useState({});
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const [expandedStepKey, setExpandedStepKey] = useState(null);
  const [selectedStepKey, setSelectedStepKey] = useState(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  const [pendingProjectFile, setPendingProjectFile] = useState(null);
  const [pendingProjectFileSection, setPendingProjectFileSection] =
    useState('other');
  const [pendingProjectFileHidden, setPendingProjectFileHidden] =
    useState(true);
  const [isUploadingProjectFile, setIsUploadingProjectFile] = useState(false);

  const [previewFile, setPreviewFile] = useState(null);

  const [mediaFilterSection, setMediaFilterSection] = useState('all');
  const [mediaFilterVisibility, setMediaFilterVisibility] = useState('all');
  const [mediaFilterKind, setMediaFilterKind] = useState('all');
  const [mediaSortMode, setMediaSortMode] = useState('custom');

  const [linkedUser, setLinkedUser] = useState(null);
  const [outstandingHelpItem, setOutstandingHelpItem] = useState(null);

  const [expandedSidebarGroup, setExpandedSidebarGroup] = useState('overview');

  const [storyEngineData, setStoryEngineData] = useState({
    consultationTranscript: '',
    consultationSummary: '',
    adminNotes: '',
    questionnaireRaw: '',
    questionnaireMapped: {
      artistName: '',
      styleOfPlaying: '',
      desiredOutcome: '',
      genreContext: '',
      recordingUse: '',
      liveUse: '',
      influenceReferences: '',
      hardwareFinish: '',
      woodPreference: '',
      finishDirection: '',
      responsePriorities: '',
      tonalGoals: '',
      preferredSizeDirection: '',
      consultationContactMethod: '',
      buildClarity: '',
    },
    consultationMapped: {
      artistName: '',
      projectName: '',
      primaryUseCase: '',
      styleOfPlaying: '',
      diameter: '',
      depth: '',
      genreContext: '',
      desiredOutcome: '',
      currentPainPoints: '',
      influenceReferences: '',
      visualMood: '',
      finishDirection: '',
      woodPreference: '',
      attack: '',
      body: '',
      sensitivity: '',
      sustain: '',
      projection: '',
      tuningRange: '',
      articulation: '',
      feel: '',
      responsePriorities: '',
      tonalGoals: '',
      preferredSizeDirection: '',
    },
    discoveryWorkspace: {
      intake: {
        completed: false,
        completedAt: null,
      },
      consult: {
        completed: false,
        completedAt: null,
        rows: {},
      },
      summary: {
        generated: false,
        generatedAt: null,
        editableText: '',
        structured: null,
      },
    },
    engineRecord: createEmptyStoryEngineRecord(),
    draftPreview: null,
  });

  const [storyEngineRunning, setStoryEngineRunning] = useState(false);
  const [normalizedTranscriptTurns, setNormalizedTranscriptTurns] = useState(
    []
  );
  const [isNormalizingTranscript, setIsNormalizingTranscript] = useState(false);

  useEffect(() => {
    if (!projectData) return;

    setEditableData((prev) => {
      const merged = { ...(prev || {}), ...(projectData || {}) };
      return ensureChecklistStructure(merged);
    });

    const mergedForStatus = ensureChecklistStructure({
      ...(editableData || {}),
      ...(projectData || {}),
    });
    setStatus(determineOverallStatus(mergedForStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectData]);

  useEffect(() => {
    if (!projectData) return;

    const se = projectData.storyEngine || {};
    const discoveryBridge = projectData?.discoveryBridge || {};

    const resolvedQuestionnaireRaw =
      typeof se?.sources?.questionnaireRaw === 'string' &&
      se.sources.questionnaireRaw.trim()
        ? se.sources.questionnaireRaw
        : se?.sources?.questionnaireRaw
          ? JSON.stringify(se.sources.questionnaireRaw, null, 2)
          : buildQuestionnaireRawFromProject(projectData);

    setStoryEngineData({
      consultationTranscript: se?.sources?.consultationTranscript || '',
      consultationSummary: se?.sources?.consultationSummary || '',
      adminNotes: se?.sources?.adminNotes || '',
      questionnaireRaw: resolvedQuestionnaireRaw,
      questionnaireMapped: se?.sources?.questionnaireMapped || {},
      consultationMapped: se?.sources?.consultationMapped || {},
      discoveryWorkspace: {
        intake: {
          completed: !!se?.sources?.discoveryWorkspace?.intake?.completed,
          completedAt:
            se?.sources?.discoveryWorkspace?.intake?.completedAt || null,
        },
        consult: {
          completed: !!se?.sources?.discoveryWorkspace?.consult?.completed,
          completedAt:
            se?.sources?.discoveryWorkspace?.consult?.completedAt || null,
          rows: se?.sources?.discoveryWorkspace?.consult?.rows || {},
          truthRows:
            se?.sources?.discoveryWorkspace?.consult?.truthRows || {},
        },
        summary: {
          generated:
            !!se?.sources?.discoveryWorkspace?.summary?.generated ||
            !!Object.keys(discoveryBridge || {}).length,
          generatedAt:
            se?.sources?.discoveryWorkspace?.summary?.generatedAt ||
            discoveryBridge?.generatedAt ||
            null,
          editableText:
            se?.sources?.discoveryWorkspace?.summary?.editableText ||
            discoveryBridge?.rawResponseText ||
            discoveryBridge?.overview ||
            '',
          structured:
            se?.sources?.discoveryWorkspace?.summary?.structured ||
            (Object.keys(discoveryBridge || {}).length ? discoveryBridge : null),
        },
      },
      engineRecord: se?.record || createEmptyStoryEngineRecord(),
      draftPreview: se?.draftPreview || null,
    });

    setNormalizedTranscriptTurns(
      Array.isArray(se?.sources?.consultationTranscriptTurns)
        ? se.sources.consultationTranscriptTurns
        : []
    );
  }, [projectData]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedTab(ADMIN_SECTIONS.OVERVIEW_PROJECT_DETAILS);
    setExpandedSidebarGroup('overview');
    setSelectedStepKey(buildPhases[0]?.key || null);
    setSelectedSubIndex(0);
    setExpandedStepKey(buildPhases[0]?.key || null);
  }, [isOpen]);

  useEffect(() => {
    const linkUser = async () => {
      setLinkedUser(null);
      if (!projectData) return;

      try {
        const directUserId =
          projectData.customerUserId ||
          projectData.userId ||
          projectData.ownerUserId;

        if (directUserId) {
          const uRef = doc(db, 'users', directUserId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            setLinkedUser({ id: uSnap.id, ...uSnap.data() });
            return;
          }
        }

        const rawEmail =
          projectData.customerEmail ||
          projectData.email ||
          projectData.customerEmailAddress;

        if (!rawEmail) return;

        const candidates = Array.from(
          new Set(
            [rawEmail, rawEmail.trim(), rawEmail.trim().toLowerCase()].filter(
              Boolean
            )
          )
        );

        const usersCol = collection(db, 'users');

        for (const email of candidates) {
          const q = query(usersCol, where('email', '==', email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            setLinkedUser({ id: docSnap.id, ...docSnap.data() });
            return;
          }
        }
      } catch (err) {
        console.error(
          '[ManageProjectModal] Failed to look up customer user for impersonation:',
          err
        );
      }
    };

    linkUser();
  }, [projectData]);

  if (!isOpen) return null;

  const saveToFirestore = async (partialUpdate = {}) => {
    try {
      const projectId =
        projectData?.id ||
        projectData?.projectId ||
        projectData?.docId ||
        projectData?.projectID;

      if (!projectId) {
        console.warn('[ManageProjectModal] saveToFirestore: missing project id');
        return;
      }

      const merged = {
        ...(editableData || {}),
        ...(partialUpdate || {}),
      };

      const nextStatus = determineOverallStatus(merged);
      const nextPhase = determineCurrentPhase(merged);

      const projectRef = doc(db, 'projects', projectId);

      await setDoc(
        projectRef,
        {
          ...partialUpdate,
          status: nextStatus,
          currentPhase: nextPhase,
          customerName: deriveCustomerName({
            ...(projectData || {}),
            ...(merged || {}),
          }),
          customerEmail: deriveCustomerEmail({
            ...(projectData || {}),
            ...(merged || {}),
          }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStatus(nextStatus);

      onProjectUpdate?.({
        id: projectId,
        ...partialUpdate,
        status: nextStatus,
        currentPhase: nextPhase,
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error('[ManageProjectModal] saveToFirestore failed:', err);
    }
  };

  const calculateProjectTotalTime = (data = editableData) => {
    let total = 0;
    buildPhases.forEach((phase) => {
      const cl = data?.[phase.key]?.checklist || [];
      cl.forEach((item) => {
        if (Number.isFinite(item.totalSeconds)) total += item.totalSeconds;
      });
    });
    return total;
  };

  const getWeightedProgressPct = (data) => {
    if (!data) return 0;

    const patched = {
      ...data,
      woodPreparation: data.discoveryDesign,
      shellConstruction: data.commitmentPortal,
      fineTuning: data.woodVisionLockIn,
      shellExteriorFinish: data.rawShellCreation,
      bearingEdges: data.shellTrueingTorchTune,
      snareBedCutting: data.exteriorArtFinish,
      hardwareDrilling: data.edgesSnareBeds,
      hardwareAssembly: data.hardwareAssembly,
      tuningAndDetailing: data.legacyTuningMedia,
      qualityCheck: data.finalQAPackagingDelivery,
    };

    return calculateProjectProgress(patched);
  };

  const weightedProgress = getWeightedProgressPct(editableData);
  const activePtr =
    weightedProgress < 100 ? getGlobalActivePointer(editableData) : null;

  const applyCompletionToItem = (
    stepKey,
    itemIndex,
    item,
    complete,
    { touchCheckpoints = false } = {}
  ) => {
    const base = {
      ...item,
      completed: !!complete,
    };

    if (!touchCheckpoints) return base;

    const expectedCount = getCheckpointCountForItem(stepKey, itemIndex, item);
    if (expectedCount <= 0) return base;

    return {
      ...base,
      checkpointStates: new Array(expectedCount).fill(!!complete),
    };
  };

  const bulkUpdateStepCompletion = (stepKey, complete) => {
    if (!stepKey) return;
    const step = editableData[stepKey];
    if (!step || !Array.isArray(step.checklist)) return;

    const updatedStep = {
      ...step,
      checklist: step.checklist.map((item, idx) =>
        applyCompletionToItem(stepKey, idx, item, complete, {
          touchCheckpoints: true,
        })
      ),
    };

    const update = { [stepKey]: updatedStep };
    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });
    saveToFirestore(update);
  };

  const handleCheckpointStatesChange = (
    stepKey,
    itemIndex,
    checkpointStates
  ) => {
    const step = editableData[stepKey] || { checklist: [] };
    const item = step.checklist?.[itemIndex];

    const expectedCount = getCheckpointCountForItem(stepKey, itemIndex, item);
    const normalizedStates = normalizeCheckpointBooleans(
      checkpointStates,
      expectedCount
    );

    const allDone =
      normalizedStates.length > 0 && normalizedStates.every(Boolean);

    const updatedChecklist = (step.checklist || []).map((it, idx) => {
      if (idx !== itemIndex) return it;
      return {
        ...it,
        checkpointStates: normalizedStates,
        completed: allDone,
      };
    });

    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };

    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });
    saveToFirestore(update);
  };

  const handleSubStepCompletionChange = (
    stepKey,
    itemIndex,
    completed,
    seconds
  ) => {
    const step = editableData[stepKey] || { checklist: [] };

    const updatedChecklist = (step.checklist || []).map((item, idx) => {
      if (idx !== itemIndex) return item;

      const expectedCount = getCheckpointCountForItem(stepKey, idx, item);

      const nextSeconds =
        typeof seconds === 'number' && !Number.isNaN(seconds)
          ? seconds
          : Number.isFinite(item.totalSeconds)
            ? item.totalSeconds
            : 0;

      const nextCheckpointStates =
        expectedCount > 0
          ? completed
            ? new Array(expectedCount).fill(true)
            : normalizeCheckpointBooleans(item.checkpointStates, expectedCount)
          : item.checkpointStates;

      return {
        ...item,
        completed: !!completed,
        totalSeconds: nextSeconds,
        checkpointStates: nextCheckpointStates,
      };
    });

    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };

    setEditableData((prev) => ({ ...prev, ...update }));
    onProjectUpdate?.({ id: projectData.id, [stepKey]: updatedStep });
    saveToFirestore(update);
  };

  const files = getProjectFilesFromSources({
    editableData,
    projectData,
  }).map((file) => normalizeProjectFileRecord(file));

  const handleProjectFileUpload = async () => {
    try {
      if (!pendingProjectFile) return;

      const projectId =
        projectData?.id ||
        projectData?.projectId ||
        projectData?.docId ||
        projectData?.projectID;

      if (!projectId) return;

      setIsUploadingProjectFile(true);

      const sectionKey = pendingProjectFileSection || 'other';
      const file = pendingProjectFile;

      const path = buildProjectFileStoragePath({
        projectId,
        sectionKey,
        originalName: file.name,
      });

      const fileRef = storageRef(storage, path);

      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file);
        task.on(
          'state_changed',
          () => {},
          (err) => reject(err),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(fileRef);

      const existingInSectionCount = files.filter((item) => {
        const itemSection =
          item?.section || item?.category || item?.subCategory || 'other';
        return itemSection === sectionKey;
      }).length;

      const fileKind = getProjectFileKind(file.name, file.type || '');

      const nextFile = normalizeProjectFileRecord({
        id: `file_${sectionKey}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: file.name,
        displayName: file.name,
        originalFileName: file.name,
        section: sectionKey,
        category: sectionKey,
        subCategory: sectionKey,
        sortOrder: existingInSectionCount,
        hiddenFromCustomer: pendingProjectFileHidden,
        hidden: pendingProjectFileHidden,
        url: downloadURL,
        downloadURL,
        thumbnailUrl: fileKind === 'image' ? downloadURL : '',
        contentType: file.type || '',
        size: file.size || 0,
        kind: fileKind,
        storagePath: path,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin',
      });

      const nextProjectFiles = [...files, nextFile];
      const nextAttachments = syncAttachmentsFromProjectFiles(nextProjectFiles);

      setEditableData((prev) => ({
        ...prev,
        projectFiles: nextProjectFiles,
        attachments: nextAttachments,
      }));

      await saveToFirestore({
        projectFiles: nextProjectFiles,
        attachments: nextAttachments,
      });

      setPendingProjectFile(null);
      setPendingProjectFileSection('other');
      setPendingProjectFileHidden(true);
    } catch (err) {
      console.error('[ManageProjectModal] Project file upload failed:', err);
    } finally {
      setIsUploadingProjectFile(false);
    }
  };

  const handleUpdateProjectFile = async (fileId, updates = {}) => {
    let nextFiles = files.map((file) => {
      if (file.id !== fileId) return file;

      const nextSection =
        updates.section ||
        updates.category ||
        updates.subCategory ||
        file.section;

      return normalizeProjectFileRecord(
        {
          ...file,
          ...updates,
          section: nextSection,
          category: nextSection,
          subCategory: nextSection,
          hidden:
            typeof updates.hiddenFromCustomer === 'boolean'
              ? updates.hiddenFromCustomer
              : typeof updates.hidden === 'boolean'
                ? updates.hidden
                : file.hidden,
          hiddenFromCustomer:
            typeof updates.hiddenFromCustomer === 'boolean'
              ? updates.hiddenFromCustomer
              : typeof updates.hidden === 'boolean'
                ? updates.hidden
                : file.hiddenFromCustomer,
        },
        nextSection
      );
    });

    const touchedSections = new Set(
      nextFiles.map(
        (file) => file.section || file.category || file.subCategory || 'other'
      )
    );

    touchedSections.forEach((sectionKey) => {
      nextFiles = normalizeSortOrdersForSection(nextFiles, sectionKey);
    });

    const nextAttachments = syncAttachmentsFromProjectFiles(nextFiles);

    setEditableData((prev) => ({
      ...prev,
      projectFiles: nextFiles,
      attachments: nextAttachments,
    }));

    await saveToFirestore({
      projectFiles: nextFiles,
      attachments: nextAttachments,
    });
  };

  const handleMoveProjectFile = async (fileId, direction) => {
    const target = files.find((file) => file.id === fileId);
    if (!target) return;

    const sectionKey =
      target.section || target.category || target.subCategory || 'other';

    const sectionFiles = files
      .filter((file) => {
        const section =
          file.section || file.category || file.subCategory || 'other';
        return section === sectionKey;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const currentIndex = sectionFiles.findIndex((file) => file.id === fileId);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= sectionFiles.length) return;

    const reordered = [...sectionFiles];
    [reordered[currentIndex], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[currentIndex],
    ];

    const reorderedWithSort = reordered.map((file, index) => ({
      ...file,
      sortOrder: index,
    }));

    const otherFiles = files.filter((file) => {
      const section =
        file.section || file.category || file.subCategory || 'other';
      return section !== sectionKey;
    });

    const nextFiles = [...otherFiles, ...reorderedWithSort];
    const nextAttachments = syncAttachmentsFromProjectFiles(nextFiles);

    setEditableData((prev) => ({
      ...prev,
      projectFiles: nextFiles,
      attachments: nextAttachments,
    }));

    await saveToFirestore({
      projectFiles: nextFiles,
      attachments: nextAttachments,
    });
  };

  const handleDeleteProjectFile = async (fileId) => {
    const target = files.find((file) => file.id === fileId);
    if (!target) return;

    const confirmed = window.confirm(
      `Delete "${target.displayName || target.name}"?`
    );
    if (!confirmed) return;

    const sectionKey =
      target.section || target.category || target.subCategory || 'other';

    let nextFiles = files.filter((file) => file.id !== fileId);
    nextFiles = normalizeSortOrdersForSection(nextFiles, sectionKey);

    const nextAttachments = syncAttachmentsFromProjectFiles(nextFiles);

    setEditableData((prev) => ({
      ...prev,
      projectFiles: nextFiles,
      attachments: nextAttachments,
    }));

    await saveToFirestore({
      projectFiles: nextFiles,
      attachments: nextAttachments,
    });

    if (target.storagePath) {
      try {
        const objectRef = storageRef(storage, target.storagePath);
        await deleteObject(objectRef);
      } catch (err) {
        console.warn(
          '[ManageProjectModal] Storage delete failed, Firestore record already removed:',
          err
        );
      }
    }
  };

  const currentPhaseLabel = determineCurrentPhase(editableData);
  const idText = projectData?.id || '—';
  const linkedUserStatus = getLinkedUserStatusLabel(linkedUser);

  const projectReadiness = getProjectReadinessState({
    editableData,
    projectData,
    storyEngineData,
    linkedUser,
  });

  const artistNameForHeader =
    storyEngineData.consultationMapped.artistName ||
    storyEngineData.questionnaireMapped.artistName ||
    deriveCustomerName(projectData) ||
    'Unassigned Artist';

  const compactProjectLabel =
    getIdentifier({
      ...(projectData || {}),
      ...(editableData || {}),
    }) || '—';

  const topbarPortalLabel = projectReadiness.portalExposure.portalReady
    ? 'Artist Portal Ready'
    : projectReadiness.portalExposure.softShareReady
      ? 'Portal Preview'
      : 'Portal Locked';

  const selectedStepLabel =
    selectedTab !== ADMIN_SECTIONS.BUILD_WORKFLOW
      ? currentPhaseLabel
      : buildPhases.find((p) => p.key === selectedStepKey)?.label ||
        currentPhaseLabel;

  const currentChecklist =
    selectedStepKey && editableData[selectedStepKey]
      ? editableData[selectedStepKey].checklist || []
      : [];

  const currentSub =
    selectedSubIndex !== null && currentChecklist[selectedSubIndex]
      ? currentChecklist[selectedSubIndex]
      : null;

  const currentSubLabel =
    (currentSub ? getSubstepLabelText(currentSub) : '') || selectedStepLabel;

  const getMobileSelectValue = () => {
    if (selectedTab === ADMIN_SECTIONS.BUILD_WORKFLOW) {
      return ADMIN_SECTIONS.BUILD_WORKFLOW;
    }
    return selectedTab;
  };

  const getMobileBuildSelectValue = () => {
    if (!selectedStepKey) return buildPhases[0]?.key || '';
    const idx = Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0;
    return `${selectedStepKey}::${idx}`;
  };

  const artistDisplayName =
    storyEngineData?.consultationMapped?.artistName ||
    storyEngineData?.questionnaireMapped?.artistName ||
    deriveCustomerName(projectData) ||
    'Artist';

  const smartTranscriptTurns =
    normalizedTranscriptTurns.length > 0
      ? normalizedTranscriptTurns
      : buildSmartTranscriptTurns(
          storyEngineData.consultationTranscript,
          artistDisplayName
        );

  const handleViewAsCustomer = () => {
    const projectId = projectData?.id;
    if (!projectId) return;

    const uid = linkedUser?.id || linkedUser?.uid || '';
    const name =
      linkedUser?.fullName ||
      (linkedUser?.firstName || linkedUser?.lastName
        ? `${linkedUser?.firstName || ''} ${linkedUser?.lastName || ''}`.trim()
        : '') ||
      '';
    const email = linkedUser?.email || '';

    if (uid && typeof startImpersonation === 'function') {
      startImpersonation(uid);
    }

    const params = new URLSearchParams();
    params.set('projectId', projectId);

    if (uid) {
      params.set('impersonateUid', uid);
      if (name) params.set('impersonateName', name);
      if (email) params.set('impersonateEmail', email);
    }

    navigate(`/legacy?${params.toString()}`);
  };

  const callHybridChapter = async ({
    chapterKey,
    sectionKey,
    payload,
    prompts,
    model = 'gpt-4.1-mini',
    timeoutMs = 45000,
  }) => {
    const functions = getFunctions(app);
    const callable = httpsCallable(functions, 'generateHybridStoryChapter');

    const result = await Promise.race([
      callable({
        chapterKey,
        sectionKey,
        payload,
        prompts,
        model,
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(
            new Error(
              `Hybrid callable timed out for ${chapterKey}.${sectionKey || 'unknown'}`
            )
          );
        }, timeoutMs)
      ),
    ]);

    return result?.data?.result || null;
  };

  const normalizeConsultationTranscript = async ({
    rawTranscript,
    artistName,
    timeoutMs = 45000,
  }) => {
    const functions = getFunctions(app);
    const callable = httpsCallable(functions, 'normalizeConsultationTranscript');

    try {
      const result = await Promise.race([
        callable({
          rawTranscriptText: rawTranscript,
          artistName,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transcript normalization timed out')), timeoutMs)
        ),
      ]);

      const turns = result?.data?.result?.turns || result?.data?.turns || [];

      if (!Array.isArray(turns)) {
        throw new Error('Transcript normalization returned an invalid shape');
      }

      return turns;
    } catch (err) {
      throw new Error(
        err?.details ||
          err?.message ||
          err?.customData?.message ||
          'Transcript normalization failed'
      );
    }
  };

  const handleNormalizeTranscript = async () => {
    const rawTranscript = String(
      storyEngineData.consultationTranscript || ''
    ).trim();

    const resolvedArtistName =
      storyEngineData?.consultationMapped?.artistName ||
      storyEngineData?.questionnaireMapped?.artistName ||
      deriveCustomerName(projectData) ||
      '';

    if (!rawTranscript) return;

    try {
      setIsNormalizingTranscript(true);

      const chunks = splitTranscriptIntoChunks(rawTranscript, 3500);
      const allTurns = [];

      for (const chunk of chunks) {
        const turns = await normalizeConsultationTranscript({
          rawTranscript: chunk,
          artistName: resolvedArtistName,
        });

        const cleanedTurns = (Array.isArray(turns) ? turns : [])
          .map((turn) => ({
            speaker:
              turn?.speaker === 'Ober Artisan'
                ? 'Ober Artisan'
                : resolvedArtistName || 'Artist',
            text: String(turn?.text || '').trim(),
            uncertain: !!turn?.uncertain,
          }))
          .filter((turn) => turn.text);

        allTurns.push(...cleanedTurns);
      }

      const mergedTurns = mergeAdjacentTurns(allTurns);
      if (!mergedTurns.length) {
        throw new Error('Transcript normalization returned no usable turns');
      }

      setNormalizedTranscriptTurns(mergedTurns);

      await saveToFirestore({
        storyEngine: {
          sources: {
            consultationTranscript: storyEngineData.consultationTranscript,
            consultationTranscriptTurns: mergedTurns,
            consultationSummary: storyEngineData.consultationSummary,
            adminNotes: storyEngineData.adminNotes,
            questionnaireRaw: storyEngineData.questionnaireRaw,
            questionnaireMapped: storyEngineData.questionnaireMapped,
            consultationMapped: storyEngineData.consultationMapped,
            discoveryWorkspace: storyEngineData.discoveryWorkspace,
          },
          record: storyEngineData.engineRecord,
          draftPreview: storyEngineData.draftPreview,
          lastUpdatedAt: new Date().toISOString(),
        },
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error('[ManageProjectModal] Transcript normalization failed:', err);
      window.alert(
        `Transcript formatting failed:\n\n${err?.message || 'Unknown error'}`
      );
    } finally {
      setIsNormalizingTranscript(false);
    }
  };

  const handleGenerateConsultationSummary = async () => {
    const rawTranscript = String(
      storyEngineData?.consultationTranscript || ''
    ).trim();

    if (!rawTranscript) return;

    try {
      setIsNormalizingTranscript(true);

      const resolvedArtistName =
        storyEngineData?.consultationMapped?.artistName ||
        storyEngineData?.questionnaireMapped?.artistName ||
        deriveCustomerName(projectData) ||
        '';

      const chunks = splitTranscriptIntoChunks(rawTranscript, 3500);
      const allTurns = [];

      for (const chunk of chunks) {
        const turns = await normalizeConsultationTranscript({
          rawTranscript: chunk,
          artistName: resolvedArtistName,
        });

        const cleanedTurns = (Array.isArray(turns) ? turns : [])
          .map((turn) => ({
            speaker:
              turn?.speaker === 'Ober Artisan'
                ? 'Ober Artisan'
                : resolvedArtistName || 'Artist',
            text: String(turn?.text || '').trim(),
            uncertain: !!turn?.uncertain,
          }))
          .filter((turn) => turn.text);

        allTurns.push(...cleanedTurns);
      }

      const mergedTurns = mergeAdjacentTurns(allTurns);
      if (!mergedTurns.length) {
        throw new Error('Transcript normalization returned no usable turns');
      }

      const transcriptTextForSummary = mergedTurns
        .map((turn) => `${turn.speaker}: ${turn.text}`)
        .join('\n');

      const summaryPrompt = `
Write a builder-facing consultation summary for a custom snare drum project.

Return plain text only.
Do not return JSON.
Do not return markdown headings.

Write 6 to 10 short bullet-style lines or short sentences that capture:
- overall consultation takeaway
- artist special asks
- hard no's / dislikes
- any changes from questionnaire assumptions
- pain points with current drums or setup
- preferences that now feel confirmed
- details that still feel open
- accommodations, constraints, or follow-up concerns

Tone:
- builder-facing
- practical
- direct
- concise
- not marketing language

Artist name:
${resolvedArtistName || 'Artist'}

Consultation transcript:
${transcriptTextForSummary}

Private admin notes:
${String(storyEngineData?.adminNotes || '').trim()}

Questionnaire context:
${String(storyEngineData?.questionnaireRaw || '').trim()}
      `.trim();

      const hybridResult = await callHybridChapter({
        chapterKey: 'commitmentPortal',
        sectionKey: 'chapterOverview',
        payload: {
          projectId: projectData?.id || '',
          chapterKey: 'commitmentPortal',
          chapterLabel: 'Commitment & Portal Setup',
          artistName: resolvedArtistName || '',
          projectName: deriveBestProjectName(projectData) || '',
          consultationMapped: storyEngineData?.consultationMapped || {},
          questionnaireMapped: storyEngineData?.questionnaireMapped || {},
          buildSpec: storyEngineData?.engineRecord?.buildSpec || {},
          recommendations: storyEngineData?.engineRecord?.recommendations || {},
          engineMeta: storyEngineData?.engineRecord?.engineMeta || {},
        },
        prompts: {
          chapterOverview: summaryPrompt,
        },
      });

      const cleanedSummary = String(hybridResult?.chapterOverview || '').trim();

      const nextStoryEngineData = {
        ...storyEngineData,
        consultationTranscript: rawTranscript,
        consultationSummary: cleanedSummary,
      };

      setNormalizedTranscriptTurns(mergedTurns);
      setStoryEngineData(nextStoryEngineData);

      await saveToFirestore({
        storyEngine: {
          sources: {
            consultationTranscript: rawTranscript,
            consultationTranscriptTurns: mergedTurns,
            consultationSummary: cleanedSummary,
            adminNotes: nextStoryEngineData.adminNotes,
            questionnaireRaw: nextStoryEngineData.questionnaireRaw,
            questionnaireMapped: nextStoryEngineData.questionnaireMapped,
            consultationMapped: nextStoryEngineData.consultationMapped,
            discoveryWorkspace: storyEngineData.discoveryWorkspace,
          },
          record: nextStoryEngineData.engineRecord,
          draftPreview: nextStoryEngineData.draftPreview,
          lastUpdatedAt: new Date().toISOString(),
        },
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error(
        '[ManageProjectModal] Consultation summary generation failed:',
        err
      );
      window.alert(
        `Call summarization failed:\n\n${err?.message || 'Unknown error'}`
      );
    } finally {
      setIsNormalizingTranscript(false);
    }
  };

  const saveStoryEngineToProject = async (payloadOverride = null) => {
    const payload = payloadOverride || {
      sources: {
        consultationTranscript: storyEngineData.consultationTranscript,
        consultationTranscriptTurns: normalizedTranscriptTurns,
        consultationSummary: storyEngineData.consultationSummary,
        adminNotes: storyEngineData.adminNotes,
        questionnaireRaw: storyEngineData.questionnaireRaw,
        questionnaireMapped: storyEngineData.questionnaireMapped,
        consultationMapped: storyEngineData.consultationMapped,
        discoveryWorkspace: storyEngineData.discoveryWorkspace,
      },
      record: storyEngineData.engineRecord,
      draftPreview: storyEngineData.draftPreview,
      lastUpdatedAt: new Date().toISOString(),
    };

    const payloadDiscoveryWorkspace =
      payload?.sources?.discoveryWorkspace || {};
    const payloadSummary = payloadDiscoveryWorkspace?.summary || {};

    const bridgeSummary =
      payloadSummary?.structured ||
      storyEngineData?.discoveryWorkspace?.summary?.structured ||
      null;

    await saveToFirestore({
      storyEngine: payload,
      discoveryBridge: bridgeSummary,
    });
  };

  const getChapterSectionData = (chapterKey, sectionKey) =>
    storyEngineData?.engineRecord?.chapters?.[chapterKey]?.storySections?.[
      sectionKey
    ] || {};

  const toggleChapterSectionLock = async ({
    chapterKey,
    sectionKey,
    locked,
  }) => {
    const currentRecord =
      storyEngineData.engineRecord || createEmptyStoryEngineRecord();

    const nextRecord = {
      ...currentRecord,
      chapters: {
        ...(currentRecord.chapters || {}),
        [chapterKey]: {
          ...(currentRecord.chapters?.[chapterKey] || {}),
          storySections: {
            ...(currentRecord.chapters?.[chapterKey]?.storySections || {}),
            [sectionKey]: {
              ...(currentRecord.chapters?.[chapterKey]?.storySections?.[
                sectionKey
              ] || {}),
              locked,
              lockedAt: locked ? new Date().toISOString() : null,
              lockedBy: locked ? 'admin' : '',
            },
          },
        },
      },
    };

    const nextDraftPreview = {
      ...(storyEngineData.draftPreview || {}),
      [chapterKey]: nextRecord?.chapters?.[chapterKey]?.storySections || {},
    };

    const nextState = {
      ...storyEngineData,
      engineRecord: nextRecord,
      draftPreview: nextDraftPreview,
    };

    setStoryEngineData(nextState);

    await saveStoryEngineToProject({
      sources: {
        consultationTranscript: nextState.consultationTranscript,
        consultationTranscriptTurns: normalizedTranscriptTurns,
        consultationSummary: nextState.consultationSummary,
        adminNotes: nextState.adminNotes,
        questionnaireRaw: nextState.questionnaireRaw,
        questionnaireMapped: nextState.questionnaireMapped,
        consultationMapped: nextState.consultationMapped,
        discoveryWorkspace: storyEngineData.discoveryWorkspace,
      },
      record: nextRecord,
      draftPreview: nextDraftPreview,
      lastRunAt: new Date().toISOString(),
    });

    setShowSnackbar(true);
  };

  const regenerateChapterSection = async ({ chapterKey, sectionKey }) => {
    try {
      setStoryEngineRunning(true);

      const currentRecord =
        storyEngineData.engineRecord || createEmptyStoryEngineRecord();
      const chapter = currentRecord?.chapters?.[chapterKey];
      if (!chapter) return;

      const existingSection = chapter?.storySections?.[sectionKey] || {};
      if (existingSection?.locked) return;

      const resolvedArtistName = deriveBestArtistName(
        projectData,
        storyEngineData
      );

      const payload = {
        projectId: projectData?.id || '',
        chapterKey,
        chapterLabel: chapter?.label || chapterKey,
        artistName: resolvedArtistName || '',
        projectName: deriveBestProjectName(projectData) || '',
        consultationMapped: storyEngineData.consultationMapped,
        questionnaireMapped: storyEngineData.questionnaireMapped,
        buildSpec: currentRecord?.buildSpec || {},
        recommendations: currentRecord?.recommendations || {},
        engineMeta: currentRecord?.engineMeta || {},
      };

      const prompts =
        sectionKey === 'chapterOverview'
          ? { chapterOverview: HYBRID_CHAPTER_PROMPTS.chapterOverview }
          : { buildNotes: HYBRID_CHAPTER_PROMPTS.buildNotes };

      const hybridResult = await callHybridChapter({
        chapterKey,
        sectionKey,
        payload,
        prompts,
      });

      const nextRecord = {
        ...currentRecord,
        chapters: {
          ...(currentRecord.chapters || {}),
          [chapterKey]: {
            ...(currentRecord.chapters?.[chapterKey] || {}),
            storySections: {
              ...(currentRecord.chapters?.[chapterKey]?.storySections || {}),
            },
          },
        },
      };

      if (sectionKey === 'chapterOverview' && hybridResult?.chapterOverview) {
        nextRecord.chapters[chapterKey].storySections.chapterOverview = {
          ...(nextRecord.chapters[chapterKey].storySections.chapterOverview ||
            {}),
          text: hybridResult.chapterOverview,
          lastGeneratedAt: new Date().toISOString(),
          lastGeneratedBy: 'admin',
        };
      }

      if (
        sectionKey === 'buildNotesStory' &&
        hybridResult?.buildNotes?.length
      ) {
        nextRecord.chapters[chapterKey].storySections.buildNotesStory = {
          ...(nextRecord.chapters[chapterKey].storySections.buildNotesStory ||
            {}),
          text: hybridResult.buildNotes.join('\n'),
          bulletItems: hybridResult.buildNotes,
          lastGeneratedAt: new Date().toISOString(),
          lastGeneratedBy: 'admin',
        };
      }

      const nextDraftPreview = {
        ...(storyEngineData.draftPreview || {}),
        [chapterKey]: nextRecord?.chapters?.[chapterKey]?.storySections || {},
      };

      const nextState = {
        ...storyEngineData,
        engineRecord: nextRecord,
        draftPreview: nextDraftPreview,
      };

      setStoryEngineData(nextState);

      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: nextState.consultationTranscript,
          consultationTranscriptTurns: normalizedTranscriptTurns,
          consultationSummary: nextState.consultationSummary,
          adminNotes: nextState.adminNotes,
          questionnaireRaw: nextState.questionnaireRaw,
          questionnaireMapped: nextState.questionnaireMapped,
          consultationMapped: nextState.consultationMapped,
          discoveryWorkspace: storyEngineData.discoveryWorkspace,
        },
        record: nextRecord,
        draftPreview: nextDraftPreview,
        lastRunAt: new Date().toISOString(),
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error(
        `[StoryEngine] Failed regenerating ${chapterKey}.${sectionKey}:`,
        err
      );
    } finally {
      setStoryEngineRunning(false);
    }
  };

  const handleRunStoryEngine = async () => {
    try {
      setStoryEngineRunning(true);

      let record = createEmptyStoryEngineRecord();
      record.projectId = projectData?.id || null;

      const resolvedArtistName = deriveBestArtistName(
        projectData,
        storyEngineData
      );

      const consultationSource = createSourceEntry({
        type: SOURCE_TYPE.CONSULTATION,
        label: 'Consultation Transcript',
        content: storyEngineData.consultationTranscript || '',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      const questionnaireSource = createSourceEntry({
        type: SOURCE_TYPE.QUESTIONNAIRE,
        label: 'Questionnaire Intake',
        content: storyEngineData.questionnaireRaw || '',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      const adminNotesSource = createSourceEntry({
        type: SOURCE_TYPE.ADMIN_NOTE,
        label: 'Admin Notes',
        content: [storyEngineData.consultationSummary, storyEngineData.adminNotes]
          .filter(Boolean)
          .join('\n\n'),
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      });

      record = registerSource(record, consultationSource);
      record = registerSource(record, questionnaireSource);
      record = registerSource(record, adminNotesSource);

      const consultationFieldMap = createAdminFieldMapFromConsultation(
        storyEngineData.consultationMapped
      );

      const questionnaireFieldMap = createAdminFieldMapFromQuestionnaire(
        storyEngineData.questionnaireMapped
      );

      record = applyObservedFields(
        record,
        consultationFieldMap,
        consultationSource
      );

      record = applyObservedFields(
        record,
        questionnaireFieldMap,
        questionnaireSource
      );

      const buildSpecKeys = Object.keys(
        storyEngineData.engineRecord?.buildSpec || {}
      );

      buildSpecKeys.forEach((fieldKey) => {
        const node = storyEngineData.engineRecord?.buildSpec?.[fieldKey];
        if (
          node?.value !== undefined &&
          node?.value !== null &&
          String(node.value).trim() !== ''
        ) {
          record.buildSpec[fieldKey] = {
            ...record.buildSpec[fieldKey],
            ...node,
          };
        }
      });

      record = runStoryEngine(record);
      record = runStoryDraftPipeline(record);

      const HYBRID_TEST_CHAPTERS = ['commitmentPortal'];

      for (const chapterKey of HYBRID_TEST_CHAPTERS) {
        const chapter = record?.chapters?.[chapterKey];
        if (!chapter) continue;

        const payload = {
          projectId: projectData?.id || '',
          chapterKey,
          chapterLabel: chapter?.label || chapterKey,
          artistName: resolvedArtistName || '',
          projectName: deriveBestProjectName(projectData) || '',
          consultationMapped: storyEngineData.consultationMapped,
          questionnaireMapped: storyEngineData.questionnaireMapped,
          buildSpec: record?.buildSpec || {},
          recommendations: record?.recommendations || {},
          engineMeta: record?.engineMeta || {},
        };

        try {
          const hybridResult = await callHybridChapter({
            chapterKey,
            payload,
            prompts: HYBRID_CHAPTER_PROMPTS,
          });

          if (hybridResult?.chapterOverview) {
            record.chapters[chapterKey].storySections.chapterOverview = {
              ...record.chapters[chapterKey].storySections.chapterOverview,
              text: hybridResult.chapterOverview,
              locked:
                record.chapters[chapterKey].storySections.chapterOverview
                  ?.locked || false,
              lockedAt:
                record.chapters[chapterKey].storySections.chapterOverview
                  ?.lockedAt || null,
              lockedBy:
                record.chapters[chapterKey].storySections.chapterOverview
                  ?.lockedBy || '',
              lastGeneratedAt: new Date().toISOString(),
              lastGeneratedBy: 'admin',
            };
          }

          if (hybridResult?.buildNotes?.length) {
            record.chapters[chapterKey].storySections.buildNotesStory = {
              ...record.chapters[chapterKey].storySections.buildNotesStory,
              text: hybridResult.buildNotes.join('\n'),
              bulletItems: hybridResult.buildNotes,
              locked:
                record.chapters[chapterKey].storySections.buildNotesStory
                  ?.locked || false,
              lockedAt:
                record.chapters[chapterKey].storySections.buildNotesStory
                  ?.lockedAt || null,
              lockedBy:
                record.chapters[chapterKey].storySections.buildNotesStory
                  ?.lockedBy || '',
              lastGeneratedAt: new Date().toISOString(),
              lastGeneratedBy: 'admin',
            };
          }
        } catch (err) {
          console.error(`Hybrid generation failed for ${chapterKey}:`, err);
        }
      }

      const draftPreview = Object.fromEntries(
        Object.entries(record?.chapters || {}).map(([key, value]) => [
          key,
          value?.storySections || {},
        ])
      );

      const nextState = {
        ...storyEngineData,
        engineRecord: record,
        draftPreview,
      };

      setStoryEngineData(nextState);

      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: nextState.consultationTranscript,
          consultationTranscriptTurns: normalizedTranscriptTurns,
          consultationSummary: nextState.consultationSummary,
          adminNotes: nextState.adminNotes,
          questionnaireRaw: nextState.questionnaireRaw,
          questionnaireMapped: nextState.questionnaireMapped,
          consultationMapped: nextState.consultationMapped,
          discoveryWorkspace: storyEngineData.discoveryWorkspace,
        },
        record,
        draftPreview,
        lastRunAt: new Date().toISOString(),
      });

      setShowSnackbar(true);
    } catch (err) {
      console.error('Story engine run failed:', err);
    } finally {
      setStoryEngineRunning(false);
    }
  };

  const storyStudioOutstandingItems = (() => {
    const items = [];

    if (!storyEngineData?.consultationTranscript?.trim()) {
      items.push({
        id: 'consultation-transcript',
        label: 'Add consultation transcript',
        type: 'source',
      });
    }

    if (!storyEngineData?.consultationSummary?.trim()) {
      items.push({
        id: 'consultation-summary',
        label: 'Add consultation summary',
        type: 'source',
      });
    }

    if (!storyEngineData?.questionnaireRaw?.trim()) {
      items.push({
        id: 'questionnaire-raw',
        label: 'Add questionnaire raw intake',
        type: 'source',
      });
    }

    STORY_ENGINE_BUILD_SPEC_FIELDS.forEach((field) => {
      const value =
        storyEngineData?.engineRecord?.buildSpec?.[field.key]?.value || '';

      if (!String(value).trim()) {
        items.push({
          id: `buildspec-${field.key}`,
          label: `Confirm build direction: ${field.label}`,
          type: 'buildspec',
          fieldKey: field.key,
        });
      }
    });

    return items;
  })();

  const storyStudioSummaryStats = {
    outstandingCount: storyStudioOutstandingItems.length,
    chapterCount: Object.keys(storyEngineData?.engineRecord?.chapters || {})
      .length,
    readiness:
      storyEngineData?.engineRecord?.engineMeta?.draftReadiness || 'not_ready',
    confidence: Math.round(
      (storyEngineData?.engineRecord?.engineMeta?.overallConfidence || 0) * 100
    ),
  };

  const buildWorkflowLocked = !projectReadiness.buildWorkflowUnlocked;

  const renderVeneerDesignerPlaceholder = () => (
    <section className="mpm-surface mpm-tab-shell">
      <div className="mpm-tab-section-header">
        <div>
          <div className="mpm-tab-kicker">Veneer Designer Tool</div>
          <h3 className="mpm-tab-title">Resin Accent Generator</h3>
          <p className="mpm-tab-subtitle">
            This workspace will house veneer direction, resin accent concepting,
            and future mockup planning that feeds build direction and story
            work.
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <div className="manage-project-modal-overlay mpm-overlay" onClick={onClose}>
      <div
        className={`manage-project-modal-content mpm-modal mpm-light ${
          outstandingHelpItem ? 'mpm-help-open' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-project-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mpm-header mpm-header-compact">
          <div className="mpm-header-topbar mpm-header-topbar-compact">
            <div className="mpm-header-topbar-left mpm-header-topbar-left-compact">
              <div className="mpm-header-kicker">SoundLegend Project</div>

              <div className="mpm-header-title-row">
                <h2 id="admin-project-view-title" className="mpm-title">
                  {artistNameForHeader}
                </h2>

                <span className="mpm-topbar-divider">•</span>

                <span className="mpm-header-project-inline">
                  {compactProjectLabel}
                </span>
              </div>

              <div className="mpm-header-meta-inline">
                <span className="mpm-header-inline-chip">
                  ID: {idText}
                  <button
                    type="button"
                    className="mpm-copy-icon-btn"
                    onClick={() =>
                      navigator.clipboard?.writeText(String(idText))
                    }
                    title="Copy project ID"
                    aria-label="Copy project ID"
                  >
                    ⧉
                  </button>
                </span>

                <span className="mpm-header-inline-chip">
                  Progress: {weightedProgress}%
                </span>

                <span className="mpm-header-inline-chip">
                  Chapter: {currentPhaseLabel}
                </span>

                <span className="mpm-header-inline-chip">
                  {projectReadiness.buildWorkflowUnlocked
                    ? 'Workflow Ready'
                    : 'Workflow Locked'}
                </span>
              </div>
            </div>

            <div className="mpm-header-topbar-actions">
              {projectData?.id ? (
                <button
                  type="button"
                  className="mpm-action-btn mpm-action-btn-compact"
                  onClick={handleViewAsCustomer}
                  disabled={!projectReadiness.portalExposure.softShareReady}
                  title={
                    projectReadiness.portalExposure.softShareReady
                      ? 'Open artist portal preview'
                      : 'Portal preview is locked until discovery is stronger'
                  }
                >
                  {topbarPortalLabel}
                </button>
              ) : null}

              <button
                type="button"
                aria-label="Close modal"
                className="mpm-close-btn"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          </div>
        </header>

        <div className="mpm-body">
          <div className="mpm-mobile-phase-selector-wrapper">
            <select
              className="mpm-phase-selector-dropdown"
              value={getMobileSelectValue()}
              onChange={(e) => {
                const nextValue = e.target.value;

                if (nextValue === ADMIN_SECTIONS.BUILD_WORKFLOW) {
                  if (buildWorkflowLocked) return;
                  setSelectedTab(ADMIN_SECTIONS.BUILD_WORKFLOW);
                  setExpandedStepKey(
                    selectedStepKey || buildPhases[0]?.key || null
                  );
                  setSelectedStepKey(
                    selectedStepKey || buildPhases[0]?.key || null
                  );
                  setSelectedSubIndex(
                    Number.isFinite(selectedSubIndex) ? selectedSubIndex : 0
                  );
                  return;
                }

                setSelectedTab(nextValue);
              }}
            >
              <option value={ADMIN_SECTIONS.OVERVIEW_PROJECT_DETAILS}>
                Overview • Project Details
              </option>
              <option value={ADMIN_SECTIONS.OVERVIEW_BUILD_SCOPE}>
                Overview • Build Scope
              </option>
              <option value={ADMIN_SECTIONS.OVERVIEW_MEDIA_FILES}>
                Overview • Media & Files
              </option>
              <option value={ADMIN_SECTIONS.DISCOVERY_INTAKE_DETAILS}>
                Discovery • Intake Details & Interpretation
              </option>
              <option value={ADMIN_SECTIONS.DISCOVERY_PRECONSULT_PREP}>
                Discovery • Intake Analysis & Pre-Consult Prep
              </option>
              <option value={ADMIN_SECTIONS.DISCOVERY_CONSULTATION_TOOL}>
                Discovery • Consultation Call & Transcript Tool
              </option>
              <option value={ADMIN_SECTIONS.DISCOVERY_CRAFTSMAN_MASTER}>
                Discovery • Craftsman Master Tool
              </option>
              <option value={ADMIN_SECTIONS.DISCOVERY_FULL_RECAP}>
                Discovery • Full Discovery Recap Interpretation Tool
              </option>
              <option value={ADMIN_SECTIONS.BUILD_VENEER_DESIGNER}>
                Build • Veneer Designer Tool
              </option>
              <option
                value={ADMIN_SECTIONS.BUILD_WORKFLOW}
                disabled={buildWorkflowLocked}
              >
                {buildWorkflowLocked
                  ? 'Build • Workflow (Locked)'
                  : 'Build • Workflow'}
              </option>
            </select>

            {selectedTab === ADMIN_SECTIONS.BUILD_WORKFLOW &&
            !buildWorkflowLocked ? (
              <select
                className="mpm-phase-selector-dropdown mpm-phase-selector-dropdown-secondary"
                value={getMobileBuildSelectValue()}
                onChange={(e) => {
                  const [stepKey, idxStr] = e.target.value.split('::');
                  const idx = Number(idxStr) || 0;

                  setExpandedStepKey(stepKey);
                  setSelectedStepKey(stepKey);
                  setSelectedSubIndex(idx);
                }}
              >
                {(Array.isArray(buildPhases) ? buildPhases : []).map(
                  (phase) => {
                    const cl = Array.isArray(
                      editableData?.[phase.key]?.checklist
                    )
                      ? editableData[phase.key].checklist
                      : [];

                    if (!cl.length) return null;

                    return (
                      <optgroup key={phase.key} label={phase.label}>
                        {cl.map((item, idx) => {
                          const label = String(
                            item?.task ?? item?.label ?? ''
                          ).trim();
                          return (
                            <option
                              key={`${phase.key}::${idx}`}
                              value={`${phase.key}::${idx}`}
                            >
                              {label}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  }
                )}
              </select>
            ) : null}
          </div>

          <aside className="mpm-sidebar">
            {ADMIN_NAV_GROUPS.map((group) => {
              const isOpenGroup = expandedSidebarGroup === group.id;

              return (
                <div
                  key={group.id}
                  className={`mpm-sidebar-group ${isOpenGroup ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="mpm-sidebar-group-toggle"
                    onClick={() =>
                      setExpandedSidebarGroup((prev) =>
                        prev === group.id ? '' : group.id
                      )
                    }
                  >
                    <span className="mpm-sidebar-group-label">
                      {group.label}
                    </span>
                    <span className="mpm-sidebar-group-toggle-icon">
                      {isOpenGroup ? '−' : '+'}
                    </span>
                  </button>

                  {isOpenGroup ? (
                    <div className="mpm-sidebar-group-buttons">
                      {group.items.map((item) => (
                        <button
                          key={item.key}
                          className={`mpm-sidebar-overview-btn ${
                            selectedTab === item.key ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSelectedTab(item.key);
                            setExpandedSidebarGroup(group.id);
                          }}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div
              className={`mpm-sidebar-group ${
                expandedSidebarGroup === 'buildWorkflow' ? 'is-open' : ''
              }`}
            >
              <button
                type="button"
                className="mpm-sidebar-group-toggle"
                onClick={() =>
                  setExpandedSidebarGroup((prev) =>
                    prev === 'buildWorkflow' ? '' : 'buildWorkflow'
                  )
                }
              >
                <span className="mpm-sidebar-group-label">Build Workflow</span>
                <span className="mpm-sidebar-group-toggle-icon">
                  {expandedSidebarGroup === 'buildWorkflow' ? '−' : '+'}
                </span>
              </button>
            </div>
          </aside>

          <main className="mpm-main">
            {selectedTab === ADMIN_SECTIONS.OVERVIEW_PROJECT_DETAILS ? (
              <ProjectDetailsSection
                projectData={projectData}
                editableData={editableData}
                storyEngineData={storyEngineData}
                status={status}
                currentPhaseLabel={currentPhaseLabel}
                weightedProgress={weightedProgress}
                projectReadiness={projectReadiness}
                topbarPortalLabel={topbarPortalLabel}
                linkedUserStatus={linkedUserStatus}
                calculateProjectTotalTime={calculateProjectTotalTime}
              />
            ) : selectedTab === ADMIN_SECTIONS.OVERVIEW_BUILD_SCOPE ? (
              <BuildScopeSection
                storyEngineData={storyEngineData}
                editableData={editableData}
                projectData={projectData}
              />
            ) : selectedTab === ADMIN_SECTIONS.OVERVIEW_MEDIA_FILES ? (
              <MediaFilesSection
                files={files}
                mediaFilterSection={mediaFilterSection}
                setMediaFilterSection={setMediaFilterSection}
                mediaFilterVisibility={mediaFilterVisibility}
                setMediaFilterVisibility={setMediaFilterVisibility}
                mediaFilterKind={mediaFilterKind}
                setMediaFilterKind={setMediaFilterKind}
                mediaSortMode={mediaSortMode}
                setMediaSortMode={setMediaSortMode}
                pendingProjectFileSection={pendingProjectFileSection}
                setPendingProjectFileSection={setPendingProjectFileSection}
                pendingProjectFileHidden={pendingProjectFileHidden}
                setPendingProjectFileHidden={setPendingProjectFileHidden}
                pendingProjectFile={pendingProjectFile}
                setPendingProjectFile={setPendingProjectFile}
                isUploadingProjectFile={isUploadingProjectFile}
                handleProjectFileUpload={handleProjectFileUpload}
                handleUpdateProjectFile={handleUpdateProjectFile}
                handleMoveProjectFile={handleMoveProjectFile}
                handleDeleteProjectFile={handleDeleteProjectFile}
                setPreviewFile={setPreviewFile}
              />
            ) : selectedTab === ADMIN_SECTIONS.DISCOVERY_INTAKE_DETAILS ? (
              <IntakeDirectionSection
                mode="intakeDetails"
                storyEngineData={storyEngineData}
                setStoryEngineData={setStoryEngineData}
                handleGenerateConsultationSummary={handleGenerateConsultationSummary}
                storyEngineRunning={storyEngineRunning}
                isNormalizingTranscript={isNormalizingTranscript}
                normalizedTranscriptTurns={normalizedTranscriptTurns}
                buildSmartTranscriptTurns={buildSmartTranscriptTurns}
                deriveCustomerName={deriveCustomerName}
                projectData={projectData}
                saveStoryEngineToProject={saveStoryEngineToProject}
                smartTranscriptTurns={smartTranscriptTurns}
              />
            ) : selectedTab === ADMIN_SECTIONS.DISCOVERY_PRECONSULT_PREP ? (
              <IntakeDirectionSection
                mode="preconsultPrep"
                storyEngineData={storyEngineData}
                setStoryEngineData={setStoryEngineData}
                handleGenerateConsultationSummary={handleGenerateConsultationSummary}
                storyEngineRunning={storyEngineRunning}
                isNormalizingTranscript={isNormalizingTranscript}
                normalizedTranscriptTurns={normalizedTranscriptTurns}
                buildSmartTranscriptTurns={buildSmartTranscriptTurns}
                deriveCustomerName={deriveCustomerName}
                projectData={projectData}
                saveStoryEngineToProject={saveStoryEngineToProject}
                smartTranscriptTurns={smartTranscriptTurns}
              />
            ) : selectedTab === ADMIN_SECTIONS.DISCOVERY_CONSULTATION_TOOL ? (
              <IntakeDirectionSection
                mode="consultationTool"
                storyEngineData={storyEngineData}
                setStoryEngineData={setStoryEngineData}
                handleGenerateConsultationSummary={handleGenerateConsultationSummary}
                handleNormalizeTranscript={handleNormalizeTranscript}
                storyEngineRunning={storyEngineRunning}
                isNormalizingTranscript={isNormalizingTranscript}
                normalizedTranscriptTurns={normalizedTranscriptTurns}
                buildSmartTranscriptTurns={buildSmartTranscriptTurns}
                deriveCustomerName={deriveCustomerName}
                projectData={projectData}
                saveStoryEngineToProject={saveStoryEngineToProject}
                smartTranscriptTurns={smartTranscriptTurns}
              />
            ) : selectedTab === ADMIN_SECTIONS.DISCOVERY_CRAFTSMAN_MASTER ? (
              <CraftsmanMasterToolSection
                projectData={projectData}
                editableData={editableData}
                storyEngineData={storyEngineData}
                saveToFirestore={saveToFirestore}
                saveStoryEngineToProject={saveStoryEngineToProject}
              />
            ) : selectedTab === ADMIN_SECTIONS.DISCOVERY_FULL_RECAP ? (
              <StoryStudioSection
                storyEngineData={storyEngineData}
                storyEngineRunning={storyEngineRunning}
                handleRunStoryEngine={handleRunStoryEngine}
                saveStoryEngineToProject={saveStoryEngineToProject}
                storyStudioSummaryStats={storyStudioSummaryStats}
                storyStudioOutstandingItems={storyStudioOutstandingItems}
                setOutstandingHelpItem={setOutstandingHelpItem}
                regenerateChapterSection={regenerateChapterSection}
                toggleChapterSectionLock={toggleChapterSectionLock}
                getChapterSectionData={getChapterSectionData}
                craftsmanMasterTool={
                  editableData?.craftsmanMasterTool ||
                  projectData?.craftsmanMasterTool ||
                  {}
                }
              />
            ) : selectedTab === ADMIN_SECTIONS.BUILD_VENEER_DESIGNER ? (
              renderVeneerDesignerPlaceholder()
            ) : buildWorkflowLocked ? (
              <section className="mpm-build-locked-panel">
                <div className="mpm-build-locked-kicker">Build</div>
                <h3 className="mpm-build-locked-title">
                  Build workflow is still locked
                </h3>
                <p className="mpm-build-locked-copy">
                  Finish discovery, direction, and proposal groundwork first so
                  the shop workflow starts from a stable build plan.
                </p>

                <div className="mpm-build-locked-list">
                  {projectReadiness.blockers.map((blocker) => (
                    <div key={blocker} className="mpm-build-locked-item">
                      {blocker}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <BuildWorkflowSection
                buildPhases={buildPhases}
                editableData={editableData}
                selectedStepKey={selectedStepKey}
                selectedSubIndex={selectedSubIndex}
                setSelectedTab={setSelectedTab}
                ADMIN_SECTIONS={ADMIN_SECTIONS}
                expandedStepKey={expandedStepKey}
                setExpandedStepKey={setExpandedStepKey}
                setSelectedStepKey={setSelectedStepKey}
                setSelectedSubIndex={setSelectedSubIndex}
                activePtr={activePtr}
                currentSubLabel={currentSubLabel}
                bulkUpdateStepCompletion={bulkUpdateStepCompletion}
                handleSubStepCompletionChange={handleSubStepCompletionChange}
                handleCheckpointStatesChange={handleCheckpointStatesChange}
              />
            )}
          </main>
        </div>

        {previewFile ? (
          <div
            className="mpm-file-preview-overlay"
            onClick={() => setPreviewFile(null)}
          >
            <div
              className="mpm-file-preview-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mpm-file-preview-header">
                <div className="mpm-file-preview-title">
                  {previewFile?.name || previewFile?.fileName || 'File Preview'}
                </div>

                <button
                  type="button"
                  className="mpm-close-btn"
                  onClick={() => setPreviewFile(null)}
                >
                  ✕
                </button>
              </div>

              <div className="mpm-file-preview-body">
                {previewFile?.kind === 'image' ? (
                  <img
                    src={getProjectFileUrl(previewFile)}
                    alt={previewFile?.name || 'Preview'}
                    className="mpm-file-preview-image"
                  />
                ) : previewFile?.kind === 'pdf' ? (
                  <iframe
                    src={getProjectFileUrl(previewFile)}
                    title={previewFile?.name || 'PDF Preview'}
                    className="mpm-file-preview-frame"
                  />
                ) : previewFile?.kind === 'video' ? (
                  <video
                    controls
                    className="mpm-file-preview-video"
                    src={getProjectFileUrl(previewFile)}
                  />
                ) : previewFile?.kind === 'audio' ? (
                  <audio
                    controls
                    className="mpm-file-preview-audio"
                    src={getProjectFileUrl(previewFile)}
                  />
                ) : (
                  <div className="mpm-file-preview-fallback">
                    <p>No inline preview available for this file type.</p>
                    <a
                      href={getProjectFileUrl(previewFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mpm-bulk-btn"
                    >
                      Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <OutstandingHelpOverlay
          outstandingHelpItem={outstandingHelpItem}
          setOutstandingHelpItem={setOutstandingHelpItem}
        />

        <Snackbar
          open={showSnackbar}
          autoHideDuration={3000}
          onClose={() => setShowSnackbar(false)}
          message="Changes saved"
        />
      </div>
    </div>
  );
};

export default ManageProjectModal;