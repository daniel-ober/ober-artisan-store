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
  maxWidth: '1120px',
  margin: '0 auto',
};

const heroCardStyle = {
  borderRadius: '24px',
  padding: '30px',
  marginBottom: '18px',
  background:
    'radial-gradient(circle at top left, rgba(255, 204, 0, 0.08), transparent 28%), linear-gradient(180deg, rgba(19,22,34,0.96), rgba(10,12,20,0.98))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
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

function formatTimestamp(value) {
  if (!value) return '';

  try {
    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleString();
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
}

function SoundlegendQuestionnaire() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [submissionDocId, setSubmissionDocId] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submittedCompletedAt, setSubmittedCompletedAt] = useState(null);
  const [intakeValue, setIntakeValue] = useState(() =>
    normalizeIncomingIntake({})
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageMessage, setPageMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [showSubmittedView, setShowSubmittedView] = useState(false);

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
        setPageMessage('');

        const submissionsRef = collection(db, 'soundlegend_submissions');
        const submissionQuery = query(
          submissionsRef,
          where('questionnaireToken', '==', token),
          limit(1)
        );

        const snap = await getDocs(submissionQuery);

        if (!isMounted) return;

        if (snap.empty) {
          setIsInvalidToken(true);
          setIsLoading(false);
          return;
        }

        const foundDoc = snap.docs[0];
        const data = foundDoc.data() || {};
        const normalizedIntake = normalizeIncomingIntake(
          data.consultationIntake || {}
        );
        const alreadyCompleted = !!data.questionnaireCompleted;

        setSubmissionDocId(foundDoc.id);
        setLinkedUserId(data.linkedUserId || '');
        setCustomerName(
          data.fullName ||
            `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
            ''
        );
        setCustomerEmail(data.email || '');
        setIntakeValue(normalizedIntake);
        setIsAlreadyComplete(alreadyCompleted);
        setSubmittedCompletedAt(data.questionnaireCompletedAt || null);

        if (alreadyCompleted) {
          setShowSubmittedView(true);
        }
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

  const handleSaveOnly = async (nextValue) => {
    if (!submissionDocId || isAlreadyComplete) return;

    try {
      setPageError('');
      setPageMessage('');

      const normalized = normalizeIncomingIntake(nextValue || intakeValue);

      await updateDoc(doc(db, 'soundlegend_submissions', submissionDocId), {
        consultationIntake: normalized,
        consultationIntakeUpdatedAt: serverTimestamp(),
      });

      setIntakeValue(normalized);
      setPageMessage('Progress saved.');
    } catch (err) {
      console.error('Failed to save questionnaire progress:', err);
      setPageError('Failed to save progress.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!submissionDocId || isAlreadyComplete) return;

    try {
      setIsSubmitting(true);
      setPageError('');
      setPageMessage('');

      const normalized = normalizeIncomingIntake(intakeValue);

      const submissionRef = doc(db, 'soundlegend_submissions', submissionDocId);

      await updateDoc(submissionRef, {
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

      setIsAlreadyComplete(true);
      setShowSubmittedView(true);
      setPageMessage('');
      setSubmittedCompletedAt(new Date());
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
                opacity: 0.7,
              }}
            >
              SoundLegend Questionnaire
            </p>

            <h1
              style={{ margin: '0 0 16px', fontSize: '36px', lineHeight: 1.1 }}
            >
              This questionnaire link is invalid
            </h1>

            <p style={{ margin: 0, ...mutedStyle }}>
              The link may be expired, incomplete, or no longer associated with
              an active SoundLegend submission.
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

  if (showSubmittedView && isAlreadyComplete) {
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
                opacity: 0.7,
              }}
            >
              Questionnaire Received
            </p>

            <h1
              style={{ margin: '0 0 14px', fontSize: '40px', lineHeight: 1.08 }}
            >
              Thank you for taking the time
            </h1>

            <p style={{ margin: '0 0 12px', fontSize: '17px', ...mutedStyle }}>
              Your SoundLegend questionnaire has been submitted successfully.
              This does not lock anything in stone. It simply gives Dan a better
              sense of where you are in your drum journey, what you are drawn
              to, and how to make your consultation more meaningful.
            </p>

            <p style={{ margin: '0 0 12px', fontSize: '15px', ...mutedStyle }}>
              Dan will review your answers and typically reach out within 2
              business days to coordinate your free consultation.
            </p>

            {submittedCompletedAt ? (
              <p style={{ margin: 0, fontSize: '14px', ...mutedStyle }}>
                Submitted on: {formatTimestamp(submittedCompletedAt)}
              </p>
            ) : null}

            <div style={actionRowStyle}>
              <button
                type="button"
                style={ghostButtonStyle}
                onClick={() => navigate('/artisan-shop/soundlegend')}
              >
                Back to SoundLegend
              </button>

              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => navigate('/artisan-shop/soundlegend')}
              >
                Submit a New Inquiry
              </button>
            </div>
          </div>

          <div style={statusCardStyle}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Already filled this out?
            </div>
            <div style={mutedStyle}>
              If you opened this link again later, no worries. Your questionnaire
              is already on file. The next step is simply waiting for our
              craftsman to coordinate your consultation.
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
              opacity: 0.7,
            }}
          >
            Private SoundLegend Intake
          </p>

          <h1 style={{ margin: '0 0 14px', fontSize: '38px', lineHeight: 1.08 }}>
            {pageTitle}
          </h1>

          <p style={{ margin: '0 0 10px', fontSize: '17px', ...mutedStyle }}>
            This short intake is here to help Dan understand what you are drawn
            to before your consultation. Nothing in this form sets your build in
            stone. It simply gives us a clearer starting point for the
            conversation.
          </p>

          {customerEmail ? (
            <p style={{ margin: 0, fontSize: '14px', ...mutedStyle }}>
              Submission email: {customerEmail}
            </p>
          ) : null}
        </div>

        {(pageMessage || pageError) && (
          <div style={statusCardStyle}>
            {pageError ? (
              <div
                style={{ color: 'rgba(255, 130, 130, 0.96)', fontWeight: 700 }}
              >
                {pageError}
              </div>
            ) : null}

            {pageMessage ? (
              <div
                style={{
                  color: 'rgba(145, 216, 168, 0.96)',
                  fontWeight: 700,
                  marginTop: pageError ? 8 : 0,
                }}
              >
                {pageMessage}
              </div>
            ) : null}
          </div>
        )}

        <ConsultationIntakePanel
          value={intakeValue}
          onChange={setIntakeValue}
          onSave={handleSaveOnly}
          isSaving={isSubmitting}
          title="SoundLegend Questionnaire"
          subtitle="A few quick questions to help shape your consultation."
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
            Token verified
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