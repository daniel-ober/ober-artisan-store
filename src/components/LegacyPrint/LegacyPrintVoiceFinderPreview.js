
import React, { useMemo } from 'react';

import {

  AXIS_COLOR_BY_KEY,

  VOICE_NODE_GUIDE,

  MetricIcon,

} from './legacyPrintVoiceMappingData';

export const VOICE_FINDER_QUESTIONS = [

  {

    id: 'intent',

    label: '01 / Intent',

    question: 'What are you trying to hear or feel more of?',

    options: [

      { label: 'More snap', nodes: ['attack', 'brightness'] },

      { label: 'More body', nodes: ['warmth', 'sustain'] },

      { label: 'More cut', nodes: ['brightness', 'projection'] },

      { label: 'More control', nodes: ['control'] },

      { label: 'More response', nodes: ['sensitivity'] },

    ],

  },

  {

    id: 'meaning',

    label: '02 / Meaning',

    question: 'Which part of that matters most?',

    options: [

      { label: 'The first hit speaks clearly', nodes: ['attack'] },

      { label: 'The drum carries farther', nodes: ['projection'] },

      { label: 'The note feels fuller', nodes: ['warmth'] },

      { label: 'The response feels easier', nodes: ['sensitivity'] },

      { label: 'The voice stays organized', nodes: ['control'] },

    ],

  },

  {

    id: 'balance',

    label: '03 / Balance',

    question: 'What should that stay balanced with?',

    options: [

      { label: 'Body underneath it', nodes: ['warmth'] },

      { label: 'Enough cut to be heard', nodes: ['brightness'] },

      { label: 'A clean decay', nodes: ['control', 'sustain'] },

      { label: 'Room presence', nodes: ['projection'] },

      { label: 'Touch detail', nodes: ['sensitivity'] },

    ],

  },

  {

    id: 'avoid',

    label: '04 / Avoid',

    question: 'What should the drum avoid while doing that?',

    options: [

      { label: 'Too harsh', nodes: ['brightness', 'control'] },

      { label: 'Too thin', nodes: ['warmth'] },

      { label: 'Too ringy', nodes: ['sustain', 'control'] },

      { label: 'Too stiff', nodes: ['sensitivity'] },

      { label: 'Too wild', nodes: ['projection', 'control'] },

    ],

  },

  {

    id: 'feel',

    label: '05 / Feel',

    question: 'Where should you feel the improvement under your hands?',

    options: [

      { label: 'Backbeat authority', nodes: ['attack', 'projection'] },

      { label: 'Ghost notes and light touch', nodes: ['sensitivity'] },

      { label: 'A fuller center', nodes: ['warmth'] },

      { label: 'Tighter placement', nodes: ['control'] },

      { label: 'More air after the hit', nodes: ['sustain'] },

    ],

  },

  {

    id: 'context',

    label: '06 / Context',

    question: 'Where does this matter most?',

    options: [

      { label: 'Behind the kit', nodes: ['warmth', 'sensitivity'] },

      { label: 'Out front in a room', nodes: ['projection'] },

      { label: 'Under microphones', nodes: ['control', 'sensitivity'] },

      { label: 'In a loud band', nodes: ['brightness', 'projection'] },

      { label: 'Across many situations', nodes: ['control', 'warmth'] },

    ],

  },

  {

    id: 'confirm',

    label: '07 / Confirm',

    question: 'Which final phrase feels closest?',

    options: [

      { label: 'Crack with body', nodes: ['attack', 'warmth'] },

      { label: 'Power with focus', nodes: ['projection', 'control'] },

      { label: 'Cut without harshness', nodes: ['brightness', 'control'] },

      { label: 'Open but controlled', nodes: ['sustain', 'control'] },

      { label: 'Responsive but composed', nodes: ['sensitivity', 'control'] },

    ],

  },

];

const getNode = (nodeKey) => VOICE_NODE_GUIDE.find((node) => node.key === nodeKey);

const scoreAnswers = (answers) => {

  const scores = VOICE_NODE_GUIDE.reduce((acc, node) => {

    acc[node.key] = 0;

    return acc;

  }, {});

  answers.forEach((answer) => {

    answer.nodes.forEach((nodeKey) => {

      scores[nodeKey] += 1;

    });

  });

  return scores;

};

const LegacyPrintVoiceFinderPreview = ({

  finderAnswers,

  finderStepIndex,

  onAnswer,

  onReset,

}) => {

  const isComplete = finderStepIndex >= VOICE_FINDER_QUESTIONS.length;

  const currentQuestion = VOICE_FINDER_QUESTIONS[finderStepIndex];

  const topNodes = useMemo(() => {

    const scores = scoreAnswers(finderAnswers);

    return Object.entries(scores)

      .sort((a, b) => b[1] - a[1])

      .filter(([, value]) => value > 0)

      .slice(0, 4)

      .map(([nodeKey]) => getNode(nodeKey))

      .filter(Boolean);

  }, [finderAnswers]);

  return (

    <div className="oad-mode-side-panel oad-finder-side">

      <span className="oad-mode-side-kicker">Voice Finder</span>

      {!isComplete && (

        <>

          <h4>{currentQuestion.question}</h4>

          <div className="oad-finder-progress">

            {VOICE_FINDER_QUESTIONS.map((question, index) => (

              <i

                key={question.id}

                className={index <= finderStepIndex ? 'is-active' : ''}

              />

            ))}

          </div>

          <div className="oad-finder-answer-grid">

            {currentQuestion.options.map((option) => (

              <button key={option.label} type="button" onClick={() => onAnswer(option)}>

                <strong>{option.label}</strong>

                <span>

                  {option.nodes.map((nodeKey) => {

                    const node = getNode(nodeKey);

                    const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

                    return (

                      <i key={nodeKey} style={{ '--oad-axis-color': color }}>

                        <MetricIcon type={node.icon} color={color} size={13} />

                      </i>

                    );

                  })}

                </span>

              </button>

            ))}

          </div>

          <div className="oad-mode-output-note">

            <strong>Live output:</strong>

            <span>The main polygon reacts as answers are captured.</span>

          </div>

        </>

      )}

      {isComplete && (

        <>

          <h4>{finderAnswers[finderAnswers.length - 1]?.label || 'LegacyPrint generated'}</h4>

          <p>

            Your answers created this one-of-one voice print. The live polygon

            now becomes the visual result of the discovery session.

          </p>

          <div className="oad-finder-result-card">

            <strong>Primary traits</strong>

            <div className="oad-finder-result-nodes">

              {topNodes.map((node) => {

                const color = AXIS_COLOR_BY_KEY[node.key] || '#d6b277';

                return (

                  <span key={node.key} style={{ '--oad-axis-color': color }}>

                    <MetricIcon type={node.icon} color={color} size={14} />

                    {node.label}

                  </span>

                );

              })}

            </div>

          </div>

          <button type="button" className="oad-secondary-btn" onClick={onReset}>

            Restart Voice Finder

          </button>

        </>

      )}

    </div>

  );

};

export default LegacyPrintVoiceFinderPreview;

