import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './HulaGiftPage.css';

// Firebase (use your initialized app/db)
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db as FS } from '../firebaseConfig';

/* ---- tiny helper to mirror your previous API ---- */
const db = {
  col: (name) => collection(FS, name),
  doc: (name, id) => doc(FS, name, id),
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
};

/* --------------------------- Utils --------------------------- */
const randomId = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const loadJSON = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const FUN_FACTS = [
  'Ober shells are torch-tuned to reveal natural resonance before hardware ever touches wood.',
  'H-series oak staves are aligned by grain to keep the note focused and lively.',
  'SoundLegend pairs cherry warmth with maple articulation for cinematic ‘speak’.',
  'Die-cast hoops + vintage-style tube lugs = consistent rim energy and classy attack.',
  'Legacy Tuning finds the shell’s sweet-spot note, then maps adjacent-low/high ranges you can trust.',
  'Our bearing edges are cut after shell stabilization to keep the note centered and repeatable.',
  'Torch tuning exposes micro-stresses and helps the shell ‘settle’ before a single lug goes on.',
  'Cherry brings warmth; maple adds articulation—together they ‘speak’ clearly in a mix.',
  'Every Ober shell gets a resonance check before finishing so the final tone doesn’t surprise you.',
  'Vintage tube lugs are chosen for look and mass—less flex, more stable tuning.',
  'We prefer squared drum-key heads on rods for precise, repeatable torque.',
  'Die-cast hoops tame wild overtones; great for studios and live clarity.',
  'Oak delivers proud mids with authority—perfect for musical ‘knock’.',
  'Our finish schedule prioritizes clarity first, gloss second—tone always wins.',
];

/* --------------------------- Confetti (subtle) --------------------------- */
const Confetti = ({ fire = false }) => {
  const [flakes, setFlakes] = useState([]);
  useEffect(() => {
    if (!fire) return;
    const colors = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#8338EC'];
    const f = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      size: 6 + Math.random() * 8,
      color: pick(colors),
      rotate: (Math.random() - 0.5) * 360,
      duration: 2.2 + Math.random() * 1.2,
    }));
    setFlakes(f);
    const t = setTimeout(() => setFlakes([]), 2800);
    return () => clearTimeout(t);
  }, [fire]);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.left}%`,
            top: '-10px',
            width: f.size,
            height: f.size,
            background: f.color,
            filter: 'saturate(1.2)',
            animation: `fall ${f.duration}s ease-in ${f.delay}s forwards`,
            transform: `rotate(${f.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
};

/* --------------------------- WebAudio (Quest only) --------------------------- */
const useDrumSynth = () => {
  const ctxRef = useRef(null);
  const ensure = () => {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  };
  const kick = (time = 0) => {
    const ctx = ensure(),
      t = ctx.currentTime + time;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.23);
  };
  const snare = (time = 0) => {
    const ctx = ensure(),
      t = ctx.currentTime + time;
    const tone = ctx.createOscillator(),
      tg = ctx.createGain();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(190, t);
    tg.gain.setValueAtTime(0.5, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    tone.connect(tg).connect(ctx.destination);
    const nb = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
    const out = nb.getChannelData(0);
    for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource();
    n.buffer = nb;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.6, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    n.connect(bp).connect(ng).connect(ctx.destination);
    tone.start(t);
    tone.stop(t + 0.2);
    n.start(t);
    n.stop(t + 0.15);
  };
  const hat = (time = 0, open = false) => {
    const ctx = ensure(),
      t = ctx.currentTime + time;
    const nb = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
    const out = nb.getChannelData(0);
    for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource();
    n.buffer = nb;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.4 : 0.08));
    n.connect(hp).connect(g).connect(ctx.destination);
    n.start(t);
    n.stop(t + (open ? 0.42 : 0.1));
  };
  const tom = (time = 0, freq = 200) => {
    const ctx = ensure(),
      t = ctx.currentTime + time;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.26);
  };
  return { kick, snare, hat, tom };
};

/* --------------------------- Picker Data --------------------------- */
const DRUMS = [
  {
    key: 'h-003',
    titleShort: 'H-003',
    title: 'HERITAGE H-003 (Oak)',
    img: '/hula/h-003.jpg',
    audio: '/hula/h-003.mp3',
    personality: [
      'Rooted. Calm. Knows its worth.',
      'The steady pulse in a crowded room.',
      'Carries warmth beneath a tough shell.',
      'Speaks only when it has something to say.',
      'Legacy energy — patient and unshakable.',
    ],
  },
  {
    key: 'sl-003',
    titleShort: 'SL-003',
    title: 'SOUNDLEGEND SL-003 (Cherry/Birch)',
    img: '/hula/sl-003.jpg',
    audio: '/hula/sl-003.mp3',
    personality: [
      'Golden heart with studio soul.',
      'Lives for connection and spotlight glow.',
      'Romantic tone that always tells the truth.',
      'Feels every word, every note.',
      'Main-character energy wrapped in warmth.',
    ],
  },
  {
    key: 'sl-004',
    titleShort: 'SL-004',
    title: 'SOUNDLEGEND SL-004 (Cherry/Maple)',
    img: '/hula/sl-004.jpg',
    audio: '/hula/sl-004.mp3',
    personality: [
      'Storm-colored soul — beautiful chaos.',
      'Drawn to late nights and loud hearts.',
      'Magnetic, moody, impossible to ignore.',
      'Artistic fire hidden under control.',
      'The sound of emotion finding release.',
    ],
  },
];

/* --------------------------- Card --------------------------- */
function DrumCard({ d, selected, onSelect, onHear }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="rounded-2xl p-3 shadow transition-colors"
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '1rem',
        border: selected
          ? '2px solid rgba(251,191,36,0.6)' // warm gold
          : '1px solid rgba(255,255,255,0.1)',
        boxShadow: selected
          ? '0 18px 40px rgba(251,191,36,0.22)'
          : '0 10px 30px rgba(0,0,0,0.35)',
        cursor: 'default',
      }}
    >
      {/* IMAGE / PREVIEW */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          border: selected
            ? '2px solid rgba(251,191,36,0.5)'
            : '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <button
          onClick={onHear}
          className="block w-full"
          title="Tap to hear this drum"
          style={{ cursor: 'pointer' }}
        >
          <img
            src={d.img}
            alt={d.title}
            loading="lazy"
            style={{
              width: '100%',
              height: 220,
              objectFit: 'cover',
              filter: 'saturate(1.05) contrast(1.05)',
            }}
          />
        </button>

        {selected && (
          <div
            className="absolute left-2 top-2 rounded-md px-2 py-1 text-[12px] font-semibold flex items-center gap-1"
            style={{
              background:
                'linear-gradient(90deg,rgba(251,191,36,.9),rgba(253,224,71,.8))',
              color: '#111',
              border: '1px solid rgba(0,0,0,.4)',
              boxShadow: '0 8px 20px rgba(251,191,36,.4)',
            }}
          >
            ⭐ Your Pick
          </div>
        )}
      </div>

      {/* TITLE + SHORT CODE */}
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold tracking-wide text-white">
          {d.title}
        </h3>
        <span
          className="hula-pill"
          style={{
            borderColor: selected
              ? 'rgba(251,191,36,0.6)'
              : 'rgba(255,255,255,0.2)',
            color: selected ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.6)',
          }}
        >
          {d.titleShort}
        </span>
      </div>

      {/* PERSONALITY BLURB */}
      <div className="mt-3">
        <ul className="shell-personality text-sm text-white/70 space-y-1">
          Shell Personality
        </ul>
        <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
          {d.personality.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <p
        className="hula-note mt-1"
        style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.5)' }}
      >
        Tap the thumbnail to hear it 🔊
      </p>

      {/* SELECT BUTTON (locked + centered) */}
      <div className="mt-3 flex flex-col items-center text-center gap-2">
        <button
          onClick={onSelect}
          className="hula-btn"
          style={{
            minWidth: '120px', // keeps width stable
            justifyContent: 'center',
            textAlign: 'center',
            background: selected
              ? 'rgba(251,191,36,0.12)'
              : 'var(--hula-card)',
            borderColor: selected
              ? 'rgba(251,191,36,0.6)'
              : 'var(--hula-border)',
            color: selected
              ? 'rgba(251,191,36,0.9)'
              : 'var(--hula-fg)',
            fontWeight: 500,
            fontSize: '.9rem',
            lineHeight: 1.2,
            padding: '.5rem .8rem',
            borderRadius: '10px',
            boxShadow: selected
              ? '0 12px 30px rgba(251,191,36,.25)'
              : '0 10px 20px rgba(0,0,0,.4)',
            cursor: selected ? 'default' : 'pointer',
          }}
        >
          {selected ? 'Selected ✓' : 'Select'}
        </button>

        {selected && (
          <span
            className="text-xs font-medium"
            style={{
              color: 'rgba(251,191,36,0.9)',
              textShadow: '0 0 8px rgba(251,191,36,.4)',
            }}
          >
          </span>
        )}
      </div>

      {/* subtle scan bar just for motion / vibe */}
      <div className="mt-3 h-2 rounded bg-white/10 overflow-hidden w-full">
        <span
          className="block h-2"
          style={{
            width: '0%',
            background: 'linear-gradient(90deg,#fff,rgba(255,255,255,.65))',
            animation: 'hula-scan 1.8s ease-in-out infinite',
          }}
        />
      </div>
    </motion.div>
  );
}
/* --------------------------- Sketch Drumset (pads) --------------------------- */
function SketchDrumset({ active, onHit }) {
  return (
    <svg
      viewBox="0 0 600 260"
      className="w-full rounded-xl border border-white/10 bg-white/5 shadow"
      style={{ filter: 'contrast(1.02) saturate(1.02)' }}
    >
      <defs>
        <filter id="rough">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
        </filter>
      </defs>
      <g
        onClick={() => onHit(0)}
        style={{ cursor: 'pointer' }}
        filter="url(#rough)"
      >
        <ellipse
          cx="290"
          cy="170"
          rx="80"
          ry="52"
          fill={active === 0 ? 'rgba(56,189,248,.4)' : 'rgba(56,189,248,.22)'}
          stroke="rgba(255,255,255,.45)"
          strokeWidth="2"
        />
        <text x="290" y="175" textAnchor="middle" fill="#fff" fontSize="14">
          Kick
        </text>
      </g>
      <g
        onClick={() => onHit(1)}
        style={{ cursor: 'pointer' }}
        filter="url(#rough)"
      >
        <ellipse
          cx="190"
          cy="120"
          rx="55"
          ry="34"
          fill={active === 1 ? 'rgba(244,63,94,.4)' : 'rgba(244,63,94,.22)'}
          stroke="rgba(255,255,255,.45)"
          strokeWidth="2"
        />
        <text x="190" y="124" textAnchor="middle" fill="#fff" fontSize="14">
          Snare
        </text>
      </g>
      <g
        onClick={() => onHit(2)}
        style={{ cursor: 'pointer' }}
        filter="url(#rough)"
      >
        <ellipse
          cx="120"
          cy="70"
          rx="44"
          ry="24"
          fill={active === 2 ? 'rgba(250,204,21,.5)' : 'rgba(250,204,21,.35)'}
          stroke="rgba(255,255,255,.45)"
          strokeWidth="2"
        />
        <text x="120" y="74" textAnchor="middle" fill="#111" fontSize="13">
          Hi-Hat
        </text>
      </g>
      <g
        onClick={() => onHit(3)}
        style={{ cursor: 'pointer' }}
        filter="url(#rough)"
      >
        <ellipse
          cx="390"
          cy="110"
          rx="55"
          ry="34"
          fill={active === 3 ? 'rgba(139,92,246,.4)' : 'rgba(139,92,246,.22)'}
          stroke="rgba(255,255,255,.45)"
          strokeWidth="2"
        />
        <text x="390" y="114" textAnchor="middle" fill="#fff" fontSize="14">
          Tom
        </text>
      </g>
    </svg>
  );
}

/* --------------------------- Rhythm Quest (3,5,7) --------------------------- */
const PADS = [
  { trigger: (s) => s.kick() }, // 0
  { trigger: (s) => s.snare() }, // 1
  { trigger: (s) => s.hat(0, false) }, // 2
  { trigger: (s) => s.tom(0, 200) }, // 3
];

function Modal({ open, title, message, cta, onAction }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onAction} />
      <div className="relative z-10 w-[min(92vw,420px)] rounded-xl border border-white/15 bg-[#111827] p-4 shadow-xl">
        <h4 className="text-base font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-white/80">{message}</p>
        <div className="mt-3 flex justify-end">
          <button className="hula-btn" onClick={onAction}>
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function RhythmQuest({ onClear }) {
  const synth = useDrumSynth();

  const TARGETS = [3, 4, 5];
  const [roundIdx, setRoundIdx] = useState(0); // 0..2
  const [sequence, setSequence] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | show | input
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);
  const cursor = useRef(0);

  // modal
  const [modal, setModal] = useState({
    open: false,
    title: '',
    message: '',
    cta: '',
    onAction: () => {},
  });

  const genSequence = (len) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * PADS.length));

  const flash = async (idx) => {
    setActive(idx);
    PADS[idx].trigger(synth);
    await new Promise((r) => setTimeout(r, 320));
    setActive(-1);
    await new Promise((r) => setTimeout(r, 110));
  };

  const showSequence = async (arr) => {
    setPlaying(true);
    setStatus('show');
    cursor.current = 0;
    for (const idx of arr) {
      // eslint-disable-next-line no-await-in-loop
      await flash(idx);
    }
    setPlaying(false);
    setStatus('input');
  };

  const startRound = async (len) => {
    const arr = genSequence(len);
    setSequence(arr);
    await showSequence(arr);
  };

  const start = async () => startRound(TARGETS[roundIdx]);

  const replay = async () => {
    if (sequence.length) await showSequence(sequence);
  };

  const nextRound = async () => {
    const nextIdx = roundIdx + 1;
    if (nextIdx < TARGETS.length) {
      setRoundIdx(nextIdx);
      await startRound(TARGETS[nextIdx]);
    } else {
      // finished 7-beat
      setModal({ open: false });
      onClear?.();
    }
  };

  const retryRound = async () => {
    await startRound(TARGETS[roundIdx]);
  };

  const hit = (idx) => {
    if (playing || status !== 'input') return;
    PADS[idx].trigger(synth);

    const c = cursor.current;
    if (idx !== sequence[c]) {
      setStatus('idle');
      setModal({
        open: true,
        title: 'Missed a beat',
        message:
          'No sweat — you were close. Click below when you’re ready to try this pattern again.',
        cta: 'Click here when you’re ready',
        onAction: () => {
          setModal({ open: false });
          retryRound();
        },
      });
      return;
    }

    const next = c + 1;
    if (next === sequence.length) {
      setStatus('idle');
      const isLast = roundIdx === TARGETS.length - 1;
      setModal({
        open: true,
        title: isLast ? 'Legendary! 🤘' : 'You rocked it 🤘',
        message: isLast
          ? 'You cleared all patterns!'
          : 'Great job! Ready for a more complex pattern?',
        cta: isLast
          ? 'Unlock the Community Wall'
          : 'Click here when you’re ready for the next pattern',
        onAction: () => {
          setModal({ open: false });
          isLast ? onClear?.() : nextRound();
        },
      });
    } else {
      cursor.current = next;
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-wide">Rhythm Quest</h3>
        <div className="text-sm text-white/70">
          Pattern:{' '}
          <span className="font-semibold text-white/90">
            {TARGETS[roundIdx]}
          </span>{' '}
          beats
        </div>
      </div>
      <p className="hula-note mt-1">
        Repeat the pattern on the sketch kit. Clear 3 → 4 → 5 beats to unlock
        the wall.
      </p>

      <div className="mt-3">
        <SketchDrumset active={active} onHit={hit} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status === 'idle' &&
          (sequence.length === 0 ? (
            <button onClick={start} className="hula-btn">
              Start
            </button>
          ) : (
            <button onClick={replay} className="hula-btn">
              Replay Pattern
            </button>
          ))}
        {status === 'show' && (
          <span className="hula-btn" style={{ pointerEvents: 'none' }}>
            Listening…
          </span>
        )}
        {status === 'input' && (
          <span className="hula-btn" style={{ pointerEvents: 'none' }}>
            Your turn
          </span>
        )}
      </div>

      <Modal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        cta={modal.cta}
        onAction={modal.onAction}
      />
    </div>
  );
}

/* --------------------------- Guestbook (optional name) --------------------------- */
function Guestbook({ isAdmin = false }) {
  const [notes, setNotes] = useState([]);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (db) {
      const q = db.query(db.col('hula_guestbook'), db.orderBy('at', 'desc'));
      return db.onSnapshot(q, (snap) => {
        setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    } else {
      setNotes(loadJSON('hula_notes', []));
    }
  }, []);

  const add = async () => {
    const text = msg.trim();
    const who = name.trim() || 'Anonymous Wook';
    if (!text) return;
    setMsg('');
    if (db) {
      await db.addDoc(db.col('hula_guestbook'), {
        text,
        name: who,
        at: db.serverTimestamp(),
      });
    } else {
      const next = [
        { id: randomId(), text, name: who, at: Date.now() },
        ...notes,
      ].slice(0, 100);
      setNotes(next);
      saveJSON('hula_notes', next);
    }
  };

  const remove = async (id) => {
    if (db) {
      await db.deleteDoc(db.doc('hula_guestbook', id));
    }
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveJSON('hula_notes', next);
      return next;
    });
  };

  return (
    <div className="mt-6 gb-wrap">
      <h3 className="text-lg font-semibold tracking-wide">
        Resonate Some Positivity — Drop a Comment!
      </h3>
      <p className="hula-note mt-1">
        Keep it kind, keep it human, festival vibes only ✌️
      </p>

      <div className="gb-inputs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          maxLength={40}
        />
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Say something nice…"
          maxLength={240}
        />
        <button onClick={add} className="gb-btn">
          Post
        </button>
      </div>

      <ul className="gb-list">
        {notes.length === 0 && (
          <li className="text-white/60 text-sm">
            Be the first to leave something.
          </li>
        )}

        {notes.map((n) => (
          <li
            key={n.id}
            className="gb-item flex items-start justify-between gap-3"
          >
            <div>
              <div className="text-sm text-white">{n.text}</div>
              <div className="text-[11px] text-white/50 mt-1">
                <span className="text-white/70">
                  {n.name || 'Anonymous Wook'}
                </span>{' '}
                ·{' '}
                {n.at?.toDate
                  ? n.at.toDate().toLocaleString()
                  : new Date(n.at || Date.now()).toLocaleString()}
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => remove(n.id)}
                className="text-[11px] px-2 py-1 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
                title="Delete (admin)"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------- Main --------------------------- */
export default function HulaGiftPage({ isAdmin = false, userId = 'anon' }) {
  const [confetti, setConfetti] = useState(false);

  // selection state
  const [favorite, setFavorite] = useState(() => loadJSON('hula_favorite', ''));
  const [submitted, setSubmitted] = useState(() =>
    loadJSON('hula_submitted', false)
  );
  const [questCleared, setQuestCleared] = useState(() =>
    loadJSON('hula_quest_cleared', false)
  );
  const [facts, setFacts] = useState('');

  // likes (live from Firestore; fallback to LS)
  const [likes, setLikes] = useState({ 'h-003': 0, 'sl-003': 0, 'sl-004': 0 });

  // preload audio
  const audioCache = useRef(new Map());
  useEffect(() => {
    DRUMS.forEach(({ key, audio }) => {
      if (!audioCache.current.has(key)) {
        const a = new Audio(audio);
        a.preload = 'auto';
        audioCache.current.set(key, a);
      }
    });
  }, []);

  // theme ring via ?tag
  const search = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const tag = search.get('tag');
  const themeRing = useMemo(
    () =>
      ({
        orange: 'ring-amber-400/60',
        purple: 'ring-fuchsia-400/60',
        teal: 'ring-teal-400/60',
        cyan: 'ring-cyan-400/60',
      })[tag] || 'ring-cyan-400/60',
    [tag]
  );

  // page mount stylers + intro confetti
  useEffect(() => {
    document.body.classList.add('hula-route');
    const t = setTimeout(() => setConfetti(true), 500);
    const t2 = setTimeout(() => setConfetti(false), 3000);
    return () => {
      document.body.classList.remove('hula-route');
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  // live likes
  useEffect(() => {
    if (!db) {
      setLikes(
        loadJSON('hula_likes', { 'h-003': 0, 'sl-003': 0, 'sl-004': 0 })
      );
      return;
    }
    const unsub = db.onSnapshot(db.doc('hula_likes', 'global'), (snap) => {
      const data = snap.data() || {};
      setLikes({
        'h-003': data['h-003'] || 0,
        'sl-003': data['sl-003'] || 0,
        'sl-004': data['sl-004'] || 0,
      });
    });
    return () => unsub();
  }, []);

  const hear = (key) => {
    const a = audioCache.current.get(key);
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  };

  const selectFavorite = (key) => {
    setFavorite(key);
    saveJSON('hula_favorite', key);
  };

  const submitPick = async () => {
    if (!favorite) return;

    setSubmitted(true);
    saveJSON('hula_submitted', true);

    // Optimistic likes update
    setLikes((cur) => ({ ...cur, [favorite]: (cur[favorite] || 0) + 1 }));

    if (db) {
      const voteId =
        userId && userId !== 'anon' ? userId : `GUEST_${randomId()}`;
      try {
        await db.setDoc(db.doc('hula_likes', 'global'), {}, { merge: true });
        await db.updateDoc(db.doc('hula_likes', 'global'), {
          [favorite]: db.increment(1),
        });
        await db.setDoc(
          db.doc('hula_user_votes', voteId),
          { favorite, at: db.serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        setLikes((cur) => ({
          ...cur,
          [favorite]: Math.max(0, (cur[favorite] || 1) - 1),
        }));
        console.error('❌ Vote save failed:', e);
      }
    } else {
      const next = {
        ...loadJSON('hula_likes', {}),
        [favorite]: (likes[favorite] || 0) + 1,
      };
      saveJSON('hula_likes', next);
    }
  };

  const onQuestClear = () => {
    setQuestCleared(true);
    saveJSON('hula_quest_cleared', true);
    setFacts(pick(FUN_FACTS));
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
  };

  // 🔓 Unlock community/results once user participates in either action
  const communityUnlocked = submitted || questCleared;

  // Results ordering
  const sorted = useMemo(() => {
    return [...DRUMS].sort((a, b) => (likes[b.key] || 0) - (likes[a.key] || 0));
  }, [likes]);

  const currentLeader = sorted[0];

  return (
    <div id="hula">
      <div className="hula-ambient" />
      <div className="hula-wrap">
        {/* Badge / Logo */}
        <div className="flex items-center gap-3">
          {/* <div className={`hula-badge ring-2 ${themeRing}`}>DO</div>
          <div className="hula-brand">Ober Artisan Drums</div> */}
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hula-hero"
        >
          <h1 className="hula-title">Happy HULA!</h1>

          <p className="hula-sub" style={{ fontWeight: 500 }}>
            Little reminder from a drum shop in Nashville: you’re not random
            background noise. You’re the main riff. You’re allowed to take up
            space, chase what calls you, and build something loud and honest.
            That’s the whole point.
          </p>

          <p className="hula-sub" style={{ marginTop: '1rem' }}>
            You didn’t just find a “promo.” You found an{' '}
            <strong>Ober Artisan festival coaster</strong> — a tiny piece of
            someone’s craft that escaped the shop and made it to the real world.
            Use it however your night needs: stash your drink, save the link,
            tag us in a video, use it to play some frisbee with a friend... or{' '}
            <strong>PASS IT ON TO A FELLOW FESTIE!!!</strong>
          </p>

          <p className="hula-sub" style={{ marginTop: '1rem' }}>
            Tap a drum to hear it. Pick the one that speaks to you. Or beat the
            Rhythm Quest. Either way you unlock the community wall and live
            results.
          </p>
        </motion.div>

        {/* Picker — 3 cards horizontally */}
        <section className="hula-card">
          <h2>Which drum resonates with you most?</h2>
          <p className="hula-note">
            Tap a thumbnail to hear it. Hit “Select” on the one that feels like
            you. Gold outline = your pick.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DRUMS.map((d) => (
              <DrumCard
                key={d.key}
                d={d}
                selected={favorite === d.key}
                onSelect={() => {
                  setFavorite(d.key);
                  saveJSON('hula_favorite', d.key);
                }}
                onHear={() => hear(d.key)}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              className="hula-btn"
              disabled={!favorite || submitted}
              onClick={submitPick}
              title={
                !favorite
                  ? 'Pick a favorite first'
                  : submitted
                    ? 'Already submitted'
                    : 'Submit your pick'
              }
              style={
                !favorite || submitted
                  ? { opacity: 0.7, cursor: 'not-allowed' }
                  : {}
              }
            >
              {submitted ? 'Pick submitted ✓' : 'Submit my pick'}
            </button>
            {favorite && !submitted && (
              <span className="hula-note">
                Your pick: <strong>{favorite.toUpperCase()}</strong>
              </span>
            )}
            {submitted && (
              <span className="hula-tag">Nice! Community unlocked.</span>
            )}
          </div>
        </section>

        {/* RESULTS */}
        {communityUnlocked && (
          <section className="hula-card">
            <h3 className="text-lg font-semibold tracking-wide">
              Results — Fan Favorites
            </h3>
            <p className="hula-note">
              Live tally from the community. Updated in real time.
            </p>

            {currentLeader && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-white/90 text-sm">
                    Current leader: <strong>{currentLeader.titleShort}</strong>{' '}
                    • ❤️ {likes[currentLeader.key] || 0}
                  </div>
                  <span className="hula-tag">Top Pick</span>
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((d) => {
                const count = likes[d.key] || 0;
                return (
                  <div
                    key={d.key}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-white/12">
                      <img
                        src={d.img}
                        alt={d.title}
                        style={{
                          width: '100%',
                          height: 180,
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        className="absolute left-2 top-2 rounded-md px-2 py-1 text-[12px] flex items-center gap-1"
                        style={{
                          background: 'rgba(0,0,0,0.45)',
                          border: '1px solid rgba(255,255,255,0.18)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <span>❤️</span>
                        <span>{count}</span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
                      <div
                        className="h-2"
                        style={{
                          width: `${Math.min(100, ((count || 0) * 100) / Math.max(1, likes[sorted[0].key] || 1))}%`,
                          background:
                            'linear-gradient(90deg,#fff,rgba(255,255,255,.65))',
                        }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-white/80">{d.title}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Rhythm Quest with progressive patterns + modals */}
        <section className="hula-card">
          <RhythmQuest onClear={onQuestClear} />
        </section>

        {/* Community Wall */}
        {communityUnlocked && (
          <section className="hula-card">
            {/* {facts && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <strong>Ober Fun Fact:</strong> {facts}
              </div>
            )} */}

            <Guestbook isAdmin={isAdmin} />

            <div className="cta-small" style={{ marginTop: '.6rem' }}>
              Share the vibe: hide this coaster QR somewhere legendary, or toss
              the link to someone who deserves a good night.
            </div>
            <div className="cta-actions">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(window.location.href)
                }
                className="hula-btn"
              >
                Copy link
              </button>
              <a href="/artisan-shop/soundlegend" className="hula-btn">
                Explore SoundLegend →
              </a>
              <a href="/artisan-shop/soundlegend/vault" className="hula-btn">
                Enter the Vault →
              </a>
            </div>
          </section>
        )}
      </div>

      <Confetti fire={confetti} />
      <footer
        style={{
          marginTop: '2rem',
          padding: '2rem 1rem 4rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '.8rem',
          lineHeight: 1.5,
          maxWidth: '900px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
          Take care of each other.
        </div>
        <div style={{ marginTop: '.5rem' }}>
          Be kind to the people around you, hype up the strangers who need it,
          pick up your trash, drink some water, and get home safe. The world
          sounds better when you’re still in it.
        </div>
      </footer>
    </div>
  );
}
