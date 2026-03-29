import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ConsultationIntakePanel from './SoundLegendPortal/ConsultationIntakePanel';
import { buildConsultationIntakeDefaults } from '../utils/consultationIntakeSchema';

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

const pageShellStyle = {
  minHeight: '100vh',
  padding: '120px 24px 60px',
  background:
    'radial-gradient(circle at top left, rgba(44,72,140,0.22), transparent 32%), linear-gradient(180deg, #07080d 0%, #0b0d14 100%)',
  color: '#f5f7fb',
};

const pageInnerStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
};

const heroCardStyle = {
  borderRadius: '22px',
  padding: '28px',
  marginBottom: '18px',
  background:
    'radial-gradient(circle at top left, rgba(255, 204, 0, 0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
};

const statusCardStyle = {
  borderRadius: '18px',
  padding: '18px 20px',
  marginBottom: '18px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
};

const mutedStyle = {
  color: 'rgba(226, 232, 245, 0.76)',
};

const actionRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  marginTop: '18px',
};

const ghostButtonStyle = {
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  borderRadius: '999px',
  padding: '11px 16px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
};

const primaryButtonStyle = {
  border: 0,
  background:
    'linear-gradient(135deg, rgba(244, 200, 66, 0.96), rgba(220, 174, 45, 0.92))',
  color: '#111',
  borderRadius: '999px',
  padding: '11px 18px',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
};

function formatTimestamp(ts) {
  if (!ts) return '';
  try {
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString();
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}

async function findSubmissionByToken(token) {
  const submissionsRef = collection(db, 'soundlegend_submissions');
  const submissionQuery = query(
    submissionsRef,
    where('questionnaireToken', '==', token),
    limit(1)
  );

  const snap = await getDocs(submissionQuery);

  if (!snap.empty) {
    return snap.docs[0];
  }

  return null;
}

function SoundlegendQuestionnaire() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [submissionDocId, setSubmissionDocId] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [completedAt, setCompletedAt] = useState(null);
  const [intakeValue, setIntakeValue] = useState(() =>
    normalizeIncomingIntake({})
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  const pageTitle = useMemo(() => {
    if (customerName?.trim()) {
      return `${customerName.split(' ')[0]}'s SoundLegend Questionnaire`;
    }
    return 'Your SoundLegend Questionnaire';
  }, [customerName]);

  useEffect(() => {
    let isMounted = true;

    const loadSubmission = async () => {
      if (!token) {
        if (!isMounted) return;
        setIsInvalidToken(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setPageError('');
        setIsInvalidToken(false);

        let foundDoc = await findSubmissionByToken(token);

        if (!foundDoc) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          foundDoc = await findSubmissionByToken(token);
        }

        if (!isMounted) return;

        if (!foundDoc) {
          setIsInvalidToken(true);
          setIsLoading(false);
          return;
        }

        const data = foundDoc.data() || {};
        const normalizedIntake = normalizeIncomingIntake(
          data.consultationIntake || {}
        );

        setSubmissionDocId(foundDoc.id);
        setLinkedUserId(data.linkedUserId || '');
        setCustomerName(
          data.fullName ||
            `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
            ''
        );
        setCustomerEmail(data.email || '');
        setIntakeValue(normalizedIntake);
        setIsAlreadyComplete(!!data.questionnaireCompleted);
        setCompletedAt(data.questionnaireCompletedAt || null);
      } catch (err) {
        console.error('Failed to load SoundLegend questionnaire:', err);
        if (!isMounted) return;
        setPageError('Unable to load this questionnaire right now.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSubmission();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleFinalSubmit = async () => {
    if (!submissionDocId || isSubmitting || isAlreadyComplete) return;

    try {
      setIsSubmitting(true);
      setPageError('');

      const normalized = normalizeIncomingIntake(intakeValue);

      await updateDoc(doc(db, 'soundlegend_submissions', submissionDocId), {
        consultationIntake: normalized,
        consultationIntakeUpdatedAt: serverTimestamp(),
        questionnaireCompleted: true,
        questionnaireCompletedAt: serverTimestamp(),
        status: 'Questionnaire Complete',
        stage: 'questionnaire_complete',
      });

      if (linkedUserId) {
        try {
          await updateDoc(doc(db, 'users', linkedUserId), {
            consultationIntake: normalized,
            consultationIntakeUpdatedAt: serverTimestamp(),
            questionnaireCompleted: true,
            questionnaireCompletedAt: serverTimestamp(),
            soundlegendLeadStatus: 'questionnaire_complete',
            latestQuestionnaireToken: token || '',
          });
        } catch (userErr) {
          console.error('Failed updating linked user intake:', userErr);
        }
      }

      setIntakeValue(normalized);
      setIsAlreadyComplete(true);
      setCompletedAt(new Date());
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
      setPageError('Failed to submit questionnaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={pageShellStyle}>
        <div style={pageInnerStyle}>
          <div style={heroCardStyle}>
            <p style={{ margin: 0, ...mutedStyle }}>Loading questionnaire…</p>
          </div>
        </div>
      </div>
    );
  }

  if (isInvalidToken) {
    return (
      <div style={pageShellStyle}>
        <div style={pageInnerStyle}>
          <div style={heroCardStyle}>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.72,
              }}
            >
              SoundLegend Questionnaire
            </p>

            <h1 style={{ margin: '0 0 16px', fontSize: '36px', lineHeight: 1.1 }}>
              This questionnaire link is invalid
            </h1>

            <p style={{ margin: 0, ...mutedStyle }}>
              The link may be expired, incomplete, or no longer associated with an
              active SoundLegend submission.
            </p>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={ghostButtonStyle}
                onClick={() => navigate('/artisan-shop/soundlegend')}
              >
                Back to SoundLegend
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAlreadyComplete) {
    return (
      <div style={pageShellStyle}>
        <div style={pageInnerStyle}>
          <div style={heroCardStyle}>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.72,
                color: 'rgba(255, 216, 120, 0.92)',
              }}
            >
              Questionnaire Complete
            </p>

            <h1 style={{ margin: '0 0 16px', fontSize: '36px', lineHeight: 1.1 }}>
              Thank you for your time
            </h1>

            <p style={{ margin: '0 0 10px', ...mutedStyle }}>
              Your SoundLegend questionnaire has already been submitted.
            </p>

            {completedAt ? (
              <p style={{ margin: '0 0 10px', ...mutedStyle }}>
                Submitted on: {formatTimestamp(completedAt)}
              </p>
            ) : null}

            <p style={{ margin: '0 0 10px', ...mutedStyle }}>
              Dan will review your answers and typically reach out within 2
              business days to coordinate your free consultation.
            </p>

            <p style={{ margin: 0, ...mutedStyle }}>
              In the meantime, you can explore some previous builds in the Legacy
              Vault.
            </p>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => navigate('/artisan-shop/soundlegend/vault')}
              >
                Explore the Legacy Vault
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShellStyle}>
      <div style={pageInnerStyle}>
        <div style={heroCardStyle}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '12px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.72,
            }}
          >
            Private SoundLegend Intake
          </p>

          <h1 style={{ margin: '0 0 14px', fontSize: '38px', lineHeight: 1.08 }}>
            {pageTitle}
          </h1>

          <p style={{ margin: '0 0 10px', fontSize: '17px', ...mutedStyle }}>
            This short intake is here to help Dan understand what you are looking
            for before your consultation. It does not lock anything in.
          </p>

          {customerEmail ? (
            <p style={{ margin: 0, fontSize: '14px', ...mutedStyle }}>
              Submission email: {customerEmail}
            </p>
          ) : null}
        </div>

        {pageError ? (
          <div style={statusCardStyle}>
            <div style={{ color: 'rgba(255, 130, 130, 0.96)', fontWeight: 700 }}>
              {pageError}
            </div>
          </div>
        ) : null}

        <ConsultationIntakePanel
          value={intakeValue}
          onChange={setIntakeValue}
          isSaving={isSubmitting}
          title="SoundLegend Questionnaire"
          subtitle="A few quick questions to help shape your consultation. This does not set anything in stone."
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '14px',
            marginTop: '18px',
            padding: '4px',
          }}
        >
          <div style={{ fontSize: '13px', ...mutedStyle }}>
            Token verified: {token}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              style={ghostButtonStyle}
              onClick={() => navigate('/artisan-shop/soundlegend')}
              disabled={isSubmitting}
            >
              Back
            </button>

            <button
              type="button"
              style={primaryButtonStyle}
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Questionnaire'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoundlegendQuestionnaire;