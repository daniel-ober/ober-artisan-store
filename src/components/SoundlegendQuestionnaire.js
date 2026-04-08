import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ConsultationIntakePanel from './SoundLegendPortal/ConsultationIntakePanel';
import {
  buildConsultationIntakeDefaults,
  isConsultationIntakeComplete,
} from '../utils/consultationIntakeSchema';
import './SoundlegendQuestionnaire.css';

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
  if (!token) return null;

  const questionnaireRef = doc(db, 'soundlegend_questionnaires', token);
  const snap = await getDoc(questionnaireRef);

  if (snap.exists()) {
    return snap;
  }

  return null;
}

function SoundlegendQuestionnaire() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [questionnaireDocId, setQuestionnaireDocId] = useState('');
  const [submissionDocId, setSubmissionDocId] = useState('');
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

  const [fatalLoadError, setFatalLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const pageTitle = useMemo(() => {
    if (customerName?.trim()) {
      return `${customerName.split(' ')[0]}'s SoundLegend Questionnaire`;
    }
    return 'Your SoundLegend Questionnaire';
  }, [customerName]);

  const intakeComplete = useMemo(
    () => isConsultationIntakeComplete(intakeValue),
    [intakeValue]
  );

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
        setFatalLoadError('');
        setSubmitError('');
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

        setQuestionnaireDocId(foundDoc.id);
        setSubmissionDocId(data.submissionId || '');
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
        setFatalLoadError('Unable to load this questionnaire right now.');
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
    if (!questionnaireDocId || isSubmitting || isAlreadyComplete) return;

    if (!intakeComplete) {
      setSubmitError(
        'Please complete every required question before submitting your questionnaire.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      const normalized = normalizeIncomingIntake(intakeValue);

      await updateDoc(
        doc(db, 'soundlegend_questionnaires', questionnaireDocId),
        {
          consultationIntake: normalized,
          consultationIntakeUpdatedAt: serverTimestamp(),
          questionnaireCompleted: true,
          questionnaireCompletedAt: serverTimestamp(),
          status: 'Questionnaire Complete',
          stage: 'questionnaire_complete',
          updatedAt: serverTimestamp(),
        }
      );

      if (submissionDocId) {
        try {
          await updateDoc(doc(db, 'soundlegend_submissions', submissionDocId), {
            consultationIntake: normalized,
            consultationIntakeUpdatedAt: serverTimestamp(),
            questionnaireCompleted: true,
            questionnaireCompletedAt: serverTimestamp(),
            status: 'Questionnaire Complete',
            stage: 'questionnaire_complete',
          });
        } catch (submissionSyncErr) {
          console.warn(
            'Questionnaire saved, but submission sync failed:',
            submissionSyncErr
          );
        }
      }

      setIntakeValue(normalized);
      setIsAlreadyComplete(true);
      setCompletedAt(new Date());
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
      setSubmitError(
        'We could not submit your questionnaire just now. Please try again in a moment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="slq-page">
        <div className="slq-shell">
          <div className="slq-hero slq-hero--compact">
            <p className="slq-kicker">Private SoundLegend Intake</p>
            <h1 className="slq-title">Loading questionnaire…</h1>
            <p className="slq-muted">
              Please hang tight while we verify your private link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isInvalidToken) {
    return (
      <div className="slq-page">
        <div className="slq-shell">
          <div className="slq-hero">
            <p className="slq-kicker">SoundLegend Questionnaire</p>
            <h1 className="slq-title">This questionnaire link is invalid</h1>
            <p className="slq-muted">
              The link may be expired, incomplete, or no longer associated with
              an active SoundLegend submission.
            </p>

            <div className="slq-actions">
              <button
                type="button"
                className="slq-btn slq-btn--ghost"
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

  if (fatalLoadError) {
    return (
      <div className="slq-page">
        <div className="slq-shell">
          <div className="slq-hero">
            <p className="slq-kicker">Private SoundLegend Intake</p>
            <h1 className="slq-title">We hit a snag loading this page</h1>
            <p className="slq-muted">{fatalLoadError}</p>

            <div className="slq-status slq-status--error">
              Please refresh the page once, or return to the SoundLegend page
              and request a fresh questionnaire link.
            </div>

            <div className="slq-actions">
              <button
                type="button"
                className="slq-btn slq-btn--ghost"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
              <button
                type="button"
                className="slq-btn slq-btn--primary"
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
      <div className="slq-page">
        <div className="slq-shell">
          <div className="slq-hero">
            <p className="slq-kicker slq-kicker--gold">
              Questionnaire Complete
            </p>
            <h1 className="slq-title">Thank you for filling this out</h1>

            <p className="slq-muted">
              Your questionnaire has been submitted successfully.
            </p>

            {completedAt ? (
              <p className="slq-muted">
                Submitted on: {formatTimestamp(completedAt)}
              </p>
            ) : null}

            <div className="slq-callout">
              <h3 className="slq-callout-title">What to expect next</h3>
              <p className="slq-callout-copy">
                Your SoundLegend call is meant to be relaxed, conversational,
                and low-pressure. Most calls take around 20–30 minutes.
              </p>
              <p className="slq-callout-copy">
                Nothing is forced. Each drum develops organically based on your
                sound, your preferences, and what feels right as the build
                direction takes shape.
              </p>
              <ul className="slq-callout-list">
                <li>We may talk through the kind of sound you are chasing</li>
                <li>
                  We may compare what you love or feel is missing in current
                  snares
                </li>
                <li>
                  We may talk through shell direction, feel, and visual vibe
                </li>
                <li>
                  We may clarify where you want guidance versus where you
                  already have a vision
                </li>
              </ul>
            </div>

            <p className="slq-muted">
              We will review your responses and reach out within 2 business days
              to coordinate your free consultation.
            </p>

            <div className="slq-actions">
              <button
                type="button"
                className="slq-btn slq-btn--primary"
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
    <div className="slq-page">
      <div className="slq-shell">
        <div className="slq-hero">
          <p className="slq-kicker">Private Questionnaire</p>
          <h1 className="slq-title">{pageTitle}</h1>
          <p className="slq-muted slq-lede">
            We do not want to take more than a few minutes of your time. These
            are mostly easy-select questions to help Dan get a general sense of
            your sound, direction, and preferences before your consultation.
          </p>
          <p className="slq-muted slq-muted--soft">
            Nothing you fill out here is locked in or a commitment by any means.
            It is simply meant to give us a more thoughtful starting point for
            your call.
          </p>

          {customerEmail ? (
            <p className="slq-submeta">Submission email: {customerEmail}</p>
          ) : null}
        </div>

        {submitError ? (
          <div className="slq-status slq-status--error">{submitError}</div>
        ) : null}

        <div className="slq-panel-wrap">
          <ConsultationIntakePanel
            value={intakeValue}
            onChange={setIntakeValue}
            onSubmit={handleFinalSubmit}
            isSaving={isSubmitting}
            isSubmitting={isSubmitting}
            title="SoundLegend Pre-Consultation Questionnaire"
            subtitle="A few quick sections to help shape a more thoughtful, personal consultation."
          />
        </div>

        <div className="slq-footerbar">
          <div className="slq-token">
            <span className="slq-token-label">Private link verified</span>
            <span className="slq-token-value">{token}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoundlegendQuestionnaire;
