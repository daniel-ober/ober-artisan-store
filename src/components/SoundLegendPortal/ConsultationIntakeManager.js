import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ConsultationIntakePanel from './ConsultationIntakePanel';
import { buildConsultationIntakeDefaults } from '../../utils/consultationIntakeSchema';

function getProjectId(project = {}) {
  return (
    project?.id ||
    project?.projectId ||
    project?.docId ||
    project?.serial ||
    project?.snareSerial ||
    project?.lineSerial ||
    ''
  );
}

function normalizeIncomingIntake(value = {}) {
  const defaults = buildConsultationIntakeDefaults();
  const merged = { ...defaults };

  Object.keys(defaults).forEach((sectionKey) => {
    merged[sectionKey] = {
      ...defaults[sectionKey],
      ...(value?.[sectionKey] || {}),
    };
  });

  return merged;
}

function deepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

const ConsultationIntakeManager = ({
  project,
  onSaved,
  onCancel,
  title = 'Consultation Intake',
  subtitle = 'Capture discovery details that will seed the SoundLegend story.',
}) => {
  const projectId = useMemo(() => getProjectId(project), [project]);

  const savedIntake = useMemo(
    () => normalizeIncomingIntake(project?.consultationIntake || {}),
    [project?.consultationIntake]
  );

  const [draftIntake, setDraftIntake] = useState(savedIntake);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setDraftIntake(savedIntake);
  }, [savedIntake]);

  const isDirty = useMemo(() => {
    return !deepEqual(savedIntake, draftIntake);
  }, [savedIntake, draftIntake]);

  const handleSave = async (nextValue) => {
    if (!projectId) {
      setSaveError('Missing project ID. Unable to save consultation intake.');
      return;
    }

    const payload = normalizeIncomingIntake(nextValue || draftIntake);

    try {
      setIsSaving(true);
      setSaveError('');
      setSaveMessage('');

      const projectRef = doc(db, 'projects', projectId);

      await updateDoc(projectRef, {
        consultationIntake: payload,
        consultationIntakeUpdatedAt: serverTimestamp(),
      });

      setDraftIntake(payload);
      setSaveMessage('Consultation intake saved.');

      if (typeof onSaved === 'function') {
        onSaved(payload);
      }
    } catch (err) {
      console.error('Failed to save consultation intake:', err);
      setSaveError('Failed to save consultation intake.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sl-consultation-intake-manager">
      <ConsultationIntakePanel
        value={draftIntake}
        onChange={setDraftIntake}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
        title={title}
        subtitle={subtitle}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '10px',
          padding: '0 4px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: saveError
              ? 'rgba(255, 130, 130, 0.95)'
              : saveMessage
                ? 'rgba(145, 216, 168, 0.95)'
                : 'rgba(226, 232, 245, 0.64)',
          }}
        >
          {saveError || saveMessage || (isDirty ? 'Unsaved changes.' : 'All changes saved.')}
        </div>

        <button
          type="button"
          onClick={() => handleSave(draftIntake)}
          disabled={isSaving || !isDirty}
          style={{
            border: 0,
            borderRadius: '999px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isSaving || !isDirty ? 'not-allowed' : 'pointer',
            background:
              isSaving || !isDirty
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, rgba(84, 125, 255, 0.96), rgba(122, 162, 255, 0.92))',
            color: '#fff',
            opacity: isSaving || !isDirty ? 0.6 : 1,
          }}
        >
          {isSaving ? 'Saving…' : 'Save Intake'}
        </button>
      </div>
    </div>
  );
};

export default ConsultationIntakeManager;