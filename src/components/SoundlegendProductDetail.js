import React, { useEffect, useMemo, useState } from 'react';

import { useLocation } from 'react-router-dom';

import {

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  Button,

  Typography,

} from '@mui/material';

import './SoundlegendProductDetail.css';

/* ================= Helpers ================= */

const onlyDigits = (s = '') => s.replace(/\D/g, '').slice(0, 10);

const formatDashed = (d) => {

  if (!d) return '';

  if (d.length >= 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;

  if (d.length >= 3) return `${d.slice(0, 3)}-${d.slice(3)}`;

  return d;

};

const isEmailFormat = (v) =>

  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

const formatCurrency = (value) =>

  `$${Number(value || 0).toLocaleString('en-US')}`;

const formatDepth = (value) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return String(value || '');

  return num.toFixed(2).replace(/\.00$/, '.0').replace(/0$/, '');

};

const LazyImg = (props) => <img loading="lazy" decoding="async" {...props} />;

const getSelected = (options, value) =>

  options.find((option) => option.value === value) || options[0];

/* ================= Basic Inline 360 Viewer ================= */

function InlineFrame360({

  totalFrames = 392,

  basePath = '/soundlegend360/med',

  prefix = 'frame_',

  pad = 3,

  ext = 'webp',

  fps = 30,

  dragSensitivity = 0.22,

}) {

  const [loaded, setLoaded] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true);

  const [frame, setFrame] = useState(0);

  const imgsRef = React.useRef([]);

  const rafRef = React.useRef(null);

  const lastTsRef = React.useRef(0);

  const draggingRef = React.useRef(false);

  const lastXRef = React.useRef(0);

  const carryRef = React.useRef(0);

  const urlFor = React.useCallback(

    (i) => {

      const n = String(i + 1).padStart(pad, '0');

      return `${basePath}/${prefix}${n}.${ext}`;

    },

    [basePath, prefix, pad, ext]

  );

  useEffect(() => {

    let cancelled = false;

    imgsRef.current = Array.from({ length: totalFrames }, (_, i) => {

      const img = new Image();

      img.decoding = 'async';

      img.loading = 'eager';

      img.src = urlFor(i);

      img.onload = () => {

        if (!cancelled) setLoaded((v) => Math.min(v + 1, totalFrames));

      };

      img.onerror = () => {

        if (!cancelled) setLoaded((v) => Math.min(v + 1, totalFrames));

      };

      return img;

    });

    return () => {

      cancelled = true;

      imgsRef.current = [];

    };

  }, [totalFrames, urlFor]);

  useEffect(() => {

    const tick = (ts) => {

      if (!isPlaying) return;

      const frameTime = 1000 / fps;

      const delta = ts - (lastTsRef.current || ts);

      if (delta >= frameTime) {

        lastTsRef.current = ts;

        setFrame((current) => (current + 1) % totalFrames);

      }

      rafRef.current = requestAnimationFrame(tick);

    };

    if (isPlaying && loaded > 0) {

      lastTsRef.current = 0;

      rafRef.current = requestAnimationFrame(tick);

    }

    return () => {

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

    };

  }, [isPlaying, fps, loaded, totalFrames]);

  const onPointerDown = (e) => {

    e.preventDefault();

    e.currentTarget.setPointerCapture?.(e.pointerId);

    draggingRef.current = true;

    lastXRef.current = e.clientX;

    carryRef.current = 0;

    setIsPlaying(false);

  };

  const onPointerMove = (e) => {

    if (!draggingRef.current) return;

    e.preventDefault();

    const dx = e.clientX - lastXRef.current;

    lastXRef.current = e.clientX;

    const delta = -dx * dragSensitivity + carryRef.current;

    const step = delta | 0;

    carryRef.current = delta - step;

    if (step) {

      setFrame((current) => {

        let next = (current + step) % totalFrames;

        if (next < 0) next += totalFrames;

        return next;

      });

    }

  };

  const onPointerUp = (e) => {

    draggingRef.current = false;

    e.currentTarget.releasePointerCapture?.(e.pointerId);

  };

  const pct = Math.round((loaded / totalFrames) * 100);

  const src = imgsRef.current[frame]?.src || urlFor(0);

  return (

    <div className="sl360-shell">

      <div

        className="sl360-stage"

        role="img"

        aria-label="360 degree SoundLegend product viewer"

        tabIndex={0}

        onDragStart={(e) => e.preventDefault()}

        onPointerDown={onPointerDown}

        onPointerMove={onPointerMove}

        onPointerUp={onPointerUp}

        onPointerCancel={onPointerUp}

      >

        <img src={src} alt="SoundLegend 360 preview" draggable={false} />

        {loaded < totalFrames && (

          <div className="sl360-loader">

            <div className="sl360-bar">

              <div style={{ width: `${pct}%` }} />

            </div>

            <span>Loading {pct}%</span>

          </div>

        )}

      </div>

      <p className="sl360-note">Click and drag to rotate the drum.</p>

    </div>

  );

}

/* ================= Blueprint Icon ================= */

const BlueprintIcon = ({ type }) => {

  if (type === 'hybrid') {

    return (

      <svg viewBox="0 0 220 120" aria-hidden="true">

        <path className="bp-line" d="M22 78 C54 38, 166 38, 198 78" />

        <path className="bp-line bp-soft" d="M38 78 C66 52, 154 52, 182 78" />

        <path className="bp-line bp-accent" d="M54 78 C78 63, 142 63, 166 78" />

        <path className="bp-line" d="M22 78 L198 78" />

        <path className="bp-line bp-soft" d="M42 88 L178 88" />

        <circle className="bp-dot" cx="72" cy="78" r="3" />

        <circle className="bp-dot" cx="110" cy="78" r="3" />

        <circle className="bp-dot" cx="148" cy="78" r="3" />

      </svg>

    );

  }

  if (type === 'guided') {

    return (

      <svg viewBox="0 0 220 120" aria-hidden="true">

        <path className="bp-line" d="M40 84 C60 38, 160 38, 180 84" />

        <path className="bp-line bp-soft" d="M55 84 C72 54, 148 54, 165 84" />

        <path className="bp-line bp-accent" d="M110 32 L118 55 L142 55 L123 69 L130 92 L110 78 L90 92 L97 69 L78 55 L102 55 Z" />

        <path className="bp-line" d="M40 84 L180 84" />

        <circle className="bp-dot" cx="110" cy="84" r="4" />

      </svg>

    );

  }

  return (

    <svg viewBox="0 0 220 120" aria-hidden="true">

      <path className="bp-line" d="M24 82 C56 36, 164 36, 196 82" />

      <path className="bp-line" d="M24 82 L196 82" />

      <path className="bp-line bp-soft" d="M46 82 C72 56, 148 56, 174 82" />

      <path className="bp-line bp-accent" d="M62 82 L78 50 M88 82 L101 43 M114 82 L122 40 M140 82 L135 43 M166 82 L151 50" />

      <circle className="bp-dot" cx="62" cy="82" r="3" />

      <circle className="bp-dot" cx="88" cy="82" r="3" />

      <circle className="bp-dot" cx="114" cy="82" r="3" />

      <circle className="bp-dot" cx="140" cy="82" r="3" />

      <circle className="bp-dot" cx="166" cy="82" r="3" />

    </svg>

  );

};

/* ================= Builder Options ================= */

const DIAMETER_OPTIONS = [

  { value: '10', label: '10"', basePrice: 1725, materialFactor: 0.76, helper: 'Compact specialty voice.' },

  { value: '12', label: '12"', basePrice: 1850, materialFactor: 0.88, helper: 'Fast and focused.' },

  { value: '13', label: '13"', basePrice: 1950, materialFactor: 0.96, helper: 'Balanced and sensitive.' },

  { value: '14', label: '14"', basePrice: 2050, materialFactor: 1, helper: 'Classic full snare voice.' },

  { value: '15', label: '15"', basePrice: 2275, materialFactor: 1.15, helper: 'Big body and rare footprint.' },

];

const DEPTH_OPTIONS = [

  { value: '3.5', label: '3.5"', helper: 'Piccolo / specialty', price: -150, hours: -4 },

  { value: '4.0', label: '4.0"', helper: 'Short and quick', price: -100, hours: -3 },

  { value: '4.5', label: '4.5"', helper: 'Crisp and tight', price: -50, hours: -2 },

  { value: '5.0', label: '5.0"', helper: 'Classic shallow', price: 0, hours: 0 },

  { value: '5.5', label: '5.5"', helper: 'Balanced standard', price: 80, hours: 1 },

  { value: '6.0', label: '6.0"', helper: 'Fuller body', price: 160, hours: 2 },

  { value: '6.5', label: '6.5"', helper: 'Deep but versatile', price: 250, hours: 3 },

  { value: '7.0', label: '7.0"', helper: 'Big and rich', price: 350, hours: 5 },

  { value: '7.5', label: '7.5"', helper: 'Very deep', price: 475, hours: 7 },

  { value: '8.0', label: '8.0"', helper: 'Maximum body', price: 600, hours: 9 },

];

const VOICE_GOALS = [

  {

    value: 'warm',

    label: 'Warm / Full',

    helper: 'More body, lower-mid richness, and a rounder shell voice.',

    mood: 'Body, bloom, dark wood.',

  },

  {

    value: 'focused',

    label: 'Dry / Focused',

    helper: 'Controlled overtones, tighter note shape, and easier studio placement.',

    mood: 'Shorter tail, controlled edges.',

  },

  {

    value: 'bright',

    label: 'Bright / Cutting',

    helper: 'More attack, snap, articulation, and upper-register presence.',

    mood: 'Fast front edge, clean cut.',

  },

  {

    value: 'sensitive',

    label: 'Sensitive / Expressive',

    helper: 'Lighter-touch response, ghost notes, brush detail, and dynamic nuance.',

    mood: 'Touch, breath, detail.',

  },

  {

    value: 'versatile',

    label: 'Balanced / Versatile',

    helper: 'A flexible all-around voice for live, studio, and mixed styles.',

    mood: 'Center-weighted, adaptable.',

  },

  {

    value: 'guided',

    label: 'Dan’s Recommendation',

    helper: 'Let the voice direction be shaped after your intake and playing context.',

    mood: 'Discovery-led.',

  },

];

const CONSTRUCTION_OPTIONS = [

  {

    value: 'stave',

    label: 'Stave Shell',

    helper:

      'Most direct SoundLegend path. Strong shell identity, dimensional tone, and a very personal handmade feel.',

    leans: 'Leans toward: body, projection, character, one-of-one feel.',

    baseAdd: 0,

    hours: 0,

    icon: 'stave',

  },

  {

    value: 'hybrid',

    label: 'Hybrid Shell',

    helper:

      'A voiced stave core with a thin 1/8" steam-bent outer component. More layered, modern, and visually flexible.',

    leans: 'Leans toward: controlled attack, layered tone, finish complexity.',

    baseAdd: 475,

    hours: 8,

    icon: 'hybrid',

  },

  {

    value: 'guided',

    label: 'Other / Dan Recommended',

    helper:

      'Use this when the sound goal matters more than the technical route. I’ll recommend the practical build path.',

    leans: 'Leans toward: best-fit design after consultation.',

    baseAdd: 225,

    hours: 3,

    icon: 'guided',

  },

];

const STAVE_SPECIES_OPTIONS = [

  { value: 'maple', label: 'Maple', boardCost: 90, helper: 'Clear, balanced, familiar.' },

  { value: 'walnut', label: 'Walnut', boardCost: 145, helper: 'Darker, warmer, seasoned.' },

  { value: 'cherry', label: 'Cherry', boardCost: 125, helper: 'Sweet, musical, controlled.' },

  { value: 'oak', label: 'Oak', boardCost: 120, helper: 'Punchy, open, strong presence.' },

  { value: 'mahogany', label: 'Mahogany', boardCost: 150, helper: 'Soft, warm, vintage lean.' },

  { value: 'ash', label: 'Ash', boardCost: 130, helper: 'Lively, bright, textured.' },

  { value: 'padauk', label: 'Padauk', boardCost: 190, helper: 'Colorful, punchy, premium.' },

  { value: 'wenge', label: 'Wenge', boardCost: 230, helper: 'Dense, dark, focused.' },

  { value: 'exotic-guided', label: 'Exotic / Guided', boardCost: 275, helper: 'Quoted around availability.' },

];

const OUTER_VENEER_OPTIONS = [

  { value: 'maple-outer', label: 'Maple outer', price: 160, helper: 'Clean, bright, flexible.' },

  { value: 'walnut-outer', label: 'Walnut outer', price: 220, helper: 'Darker and richer.' },

  { value: 'cherry-outer', label: 'Cherry outer', price: 200, helper: 'Warm and musical.' },

  { value: 'figured-maple', label: 'Figured Maple outer', price: 350, helper: 'More visual figure.' },

  { value: 'burl-premium', label: 'Burl / premium outer', price: 525, helper: 'High visual impact.' },

  { value: 'guided-outer', label: 'Dan recommended outer', price: 250, helper: 'Chosen for voice and look.' },

];

const FINISH_DIRECTIONS = [

  { value: 'natural', label: 'Natural Wood', helper: 'Raw beauty, grain, oil, satin, or gloss.' },

  { value: 'scorched', label: 'Scorched / Torch-Touched', helper: 'Fire, contrast, dark grain, shop character.' },

  { value: 'stained', label: 'Custom Stain', helper: 'Color mood, faded edges, depth, and gloss.' },

  { value: 'resin', label: 'Resin / Acrylic Accent', helper: 'One-of-one statement, mockup recommended.' },

  { value: 'painted', label: 'Painted / Graphic', helper: 'Art direction, simple graphics, approved concepts.' },

  { value: 'other', label: 'Other / Not Sure', helper: 'Median estimate until the idea is reviewed.' },

];

const FINISH_DETAIL_OPTIONS = {

  natural: [

    { value: 'natural-satin', label: 'Natural Satin', price: 0, hours: 0, helper: 'Soft sheen and organic feel.' },

    { value: 'natural-gloss', label: 'Natural Gloss', price: 175, hours: 3, helper: 'More polish, depth, and reflection.' },

    { value: 'oil-wax', label: 'Oil / Wax Feel', price: 125, hours: 2, helper: 'Hand-rubbed, tactile, low-gloss.' },

    { value: 'open-pore', label: 'Open-Pore Natural', price: 150, hours: 3, helper: 'More texture and visible grain feel.' },

  ],

  scorched: [

    { value: 'light-scorch', label: 'Light Scorch', price: 175, hours: 3, helper: 'Subtle torch character.' },

    { value: 'medium-scorch', label: 'Medium Scorch', price: 275, hours: 5, helper: 'Controlled contrast and warmth.' },

    { value: 'heavy-scorch', label: 'Heavy Scorch', price: 375, hours: 7, helper: 'Bold dark contrast.' },

    { value: 'scorched-fade', label: 'Scorched Fade', price: 475, hours: 9, helper: 'Torch character blended into a finish mood.' },

  ],

  stained: [

    { value: 'full-stain-satin', label: 'Full Stain Satin', price: 250, hours: 5, helper: 'Even color with softer sheen.' },

    { value: 'full-stain-gloss', label: 'Full Stain Gloss', price: 375, hours: 7, helper: 'Richer depth and reflection.' },

    { value: 'faded-stain', label: 'Faded Stain', price: 475, hours: 9, helper: 'Color movement with wood showing through.' },

    { value: 'burst-stain', label: 'Burst / Edge Fade', price: 575, hours: 11, helper: 'Edge-to-center color movement.' },

    { value: 'custom-color-match', label: 'Custom Color Match', price: 700, hours: 13, helper: 'Approximate a color, photo, or moodboard.' },

  ],

  resin: [

    { value: 'subtle-resin', label: 'Subtle Resin Accent', price: 700, hours: 12, helper: 'Small accents and restrained color.' },

    { value: 'grain-fill-resin', label: 'Grain / Stress Resin Fill', price: 925, hours: 16, helper: 'Organic resin in natural stress points.' },

    { value: 'bold-resin', label: 'Bold Resin Feature', price: 1250, hours: 22, helper: 'More visible premium accent.' },

    { value: 'full-concept-resin', label: 'Full Concept Resin Direction', price: 1650, hours: 30, helper: 'High-effort mockup-driven concept.' },

  ],

  painted: [

    { value: 'single-color', label: 'Single Color Satin / Gloss', price: 375, hours: 7, helper: 'Clean solid color direction.' },

    { value: 'two-tone', label: 'Two-Tone / Split Finish', price: 575, hours: 10, helper: 'Two finish areas or color relationship.' },

    { value: 'graphic-simple', label: 'Simple Graphic Direction', price: 800, hours: 15, helper: 'Simple shape, stripe, mark, or motif.' },

    { value: 'graphic-complex', label: 'Complex Graphic Direction', price: 1250, hours: 24, helper: 'Reviewed for feasibility first.' },

  ],

  other: [

    { value: 'other-guided', label: 'Other / Idea Review', price: 650, hours: 12, helper: 'Median placeholder until scoped.' },

    { value: 'dan-guided-visual', label: 'Dan’s Visual Recommendation', price: 350, hours: 7, helper: 'Visual concept shaped after consultation.' },

  ],

};

const INTERIOR_FINISH_OPTIONS = [

  { value: 'natural-sanded', label: 'Natural Sanded Interior', price: 0, hours: 0, helper: 'Clean, simple, and included.' },

  { value: 'sealed-clear', label: 'Clear-Sealed Interior', price: 85, hours: 2, helper: 'Light protection and cleaner interior look.' },

  { value: 'interior-scorch', label: 'Interior Scorch Detail', price: 175, hours: 4, helper: 'Visible interior torch character.' },

  { value: 'interior-stain', label: 'Interior Stain / Tone', price: 225, hours: 5, helper: 'Darker or moodier interior treatment.' },

  { value: 'signed-interior', label: 'Signed / Dated Interior', price: 0, hours: 1, helper: 'Included simple handwritten shop note.' },

];

const BADGE_OPTIONS = [

  { value: 'standard', label: 'Standard Ober Badge', price: 0, hours: 0, helper: 'Included SoundLegend badge treatment.' },

  {

    value: 'leather-brass',

    label: 'Custom Leather + Brass Badge',

    price: 250,

    hours: 4,

    helper: 'Handcrafted custom leather and brass direction. Design must be approved.',

  },

  {

    value: 'hand-scorched-signature',

    label: 'Hand-Scorched Artist Signature / Logo',

    price: 250,

    hours: 4,

    helper: 'Hand-scorched or hand-drawn mark. Must be realistic and approved.',

  },

  {

    value: 'inside-waterslide',

    label: 'Inside Signature / Logo Print',

    price: 50,

    hours: 1,

    helper: 'Ink-printed signature or simple logo inside the shell.',

  },

];

const LUG_OPTIONS = [

  { value: 'vintage-tube', label: 'Vintage Tube Lugs', price: 0, helper: 'Classic SoundLegend character.' },

  { value: 'double-ended-tube', label: 'Double-Ended Tube Lugs', price: 100, helper: 'More substantial classic look.' },

  { value: 'single-point', label: 'Single-Point Lugs', price: 165, helper: 'Cleaner modern shell spacing.' },

  { value: 'low-mass', label: 'Low-Mass Lugs', price: 150, helper: 'More open, less visual weight.' },

  { value: 'premium-machined', label: 'Premium Machined Lugs', price: 375, helper: 'Elevated hardware direction.' },

  { value: 'custom-lug-review', label: 'Custom / Special Order', price: 525, helper: 'Requires sourcing review.' },

];

const HOOP_OPTIONS = [

  { value: 'diecast', label: 'Die-Cast Hoops', price: 0, helper: 'Focused, controlled, premium standard.' },

  { value: 'triple-flange-23', label: '2.3mm Triple-Flange', price: -120, helper: 'More open, lighter, classic feel.' },

  { value: 'triple-flange-30', label: '3.0mm Triple-Flange', price: -60, helper: 'Open but stronger than 2.3mm.' },

  { value: 'single-flange-clips', label: 'Single-Flange + Clips', price: 175, helper: 'Old-school feel, more specialty setup.' },

  { value: 'wood-hoops-maple', label: 'Maple Wood Hoops', price: 375, helper: 'Warmer, rounder, more dramatic look.' },

  { value: 'wood-hoops-premium', label: 'Premium Wood Hoops', price: 550, helper: 'Custom-stained or more visual wood hoop direction.' },

];

const HARDWARE_OPTIONS = [

  { value: 'Chrome', label: 'Chrome', price: 0, helper: 'Classic, bright, clean.' },

  { value: 'Black Nickel', label: 'Black Nickel', price: 125, helper: 'Darker, cooler, modern.' },

  { value: 'Brass / Gold', label: 'Brass / Gold', price: 225, helper: 'Warm premium statement.' },

  { value: 'Satin Chrome', label: 'Satin Chrome', price: 100, helper: 'Softer silver finish.' },

  { value: 'Mixed / Custom', label: 'Mixed / Custom', price: 300, helper: 'Special pairing, sourcing dependent.' },

];

const THROW_OFF_OPTIONS = [

  { value: 'trick-gs007', label: 'Trick GS007', price: 0, helper: 'Premium standard SoundLegend throw-off.' },

  { value: 'trick-gold', label: 'Trick GS007 Gold', price: 60, helper: 'Gold finish pairing.' },

  { value: 'inde', label: 'INDe Universal', price: -15, helper: 'Clean and reliable alternative.' },

  { value: 'dw-mag', label: 'DW MAG Direction', price: 25, helper: 'Modern magnetic-style feel.' },

  { value: 'ludwig-p88', label: 'Ludwig P88 Direction', price: -25, helper: 'Simple, practical, familiar.' },

  { value: 'nickelworks', label: 'Nickelworks / Boutique', price: 125, helper: 'Specialty option if available.' },

  { value: 'custom-review', label: 'Custom / Special Order', price: 175, helper: 'Requires sourcing review.' },

];

const BATTER_HEAD_OPTIONS = [

  { value: 'remo-controlled-sound', label: 'Remo Controlled Sound Coated', helper: 'Focused, familiar, controlled attack.' },

  { value: 'remo-ambassador', label: 'Remo Ambassador Coated', helper: 'Open, classic, responsive single-ply feel.' },

  { value: 'evans-g1', label: 'Evans G1 Coated', helper: 'Open, articulate, and balanced.' },

  { value: 'evans-hd-dry', label: 'Evans HD Dry', helper: 'Drier, tighter, more controlled.' },

  { value: 'aquarian-texture-coated', label: 'Aquarian Texture Coated', helper: 'Warm, slightly rounder coated feel.' },

  { value: 'guided', label: 'Dan’s Recommendation', helper: 'Chosen after reviewing your desired voice.' },

];

const RESONANT_HEAD_OPTIONS = [

  { value: 'remo-ambassador-snare-side', label: 'Remo Ambassador Hazy Snare Side', helper: 'Classic, sensitive, versatile.' },

  { value: 'evans-snare-side-300', label: 'Evans Snare Side 300', helper: 'Clean, modern, reliable response.' },

  { value: 'aquarian-classic-clear-snare', label: 'Aquarian Classic Clear Snare Side', helper: 'Balanced snare response and familiar feel.' },

  { value: 'guided', label: 'Dan’s Recommendation', helper: 'Chosen based on target sensitivity and control.' },

];

const WIRE_OPTIONS = [

  { value: 'puresound-custom-pro-20', label: 'PureSound Custom Pro Steel 20-Strand', helper: 'Balanced, articulate, versatile.' },

  { value: 'puresound-24', label: 'PureSound 24-Strand', helper: 'More wire presence and snare response.' },

  { value: 'puresound-16', label: 'PureSound 16-Strand', helper: 'Drier, more open shell tone.' },

  { value: 'canopus-vintage', label: 'Canopus Vintage Direction', helper: 'Premium wire character with nuanced feel.' },

  { value: 'guided', label: 'Dan’s Recommendation', helper: 'Chosen after reviewing touch and sound goals.' },

];

const PLAYER_TYPE_OPTIONS = [

  'Drummer',

  'Producer / Engineer',

  'Collector',

  'Artist / Band Leader',

  'Gift Buyer',

  'Just Exploring',

];

const SERIOUSNESS_OPTIONS = [

  'Just playing with the builder',

  'Curious, maybe later',

  'Considering a build',

  'Ready to discuss',

];

const getFinishDetails = (direction) =>

  FINISH_DETAIL_OPTIONS[direction] || FINISH_DETAIL_OPTIONS.natural;

const buildLineItems = (config) => {

  const diameter = getSelected(DIAMETER_OPTIONS, config.diameter);

  const depth = getSelected(DEPTH_OPTIONS, config.depth);

  const construction = getSelected(CONSTRUCTION_OPTIONS, config.construction);

  const staveSpecies = getSelected(STAVE_SPECIES_OPTIONS, config.staveSpecies);

  const outerVeneer = getSelected(OUTER_VENEER_OPTIONS, config.outerVeneer);

  const finishDetail = getSelected(getFinishDetails(config.finishDirection), config.finishDetail);

  const interior = getSelected(INTERIOR_FINISH_OPTIONS, config.interiorFinish);

  const badge = getSelected(BADGE_OPTIONS, config.badgeOption);

  const lug = getSelected(LUG_OPTIONS, config.lugType);

  const hoop = getSelected(HOOP_OPTIONS, config.hoopType);

  const hardware = getSelected(HARDWARE_OPTIONS, config.hardwareFinish);

  const throwOff = getSelected(THROW_OFF_OPTIONS, config.throwOff);

  const materialMultiplier =

    diameter.materialFactor * (Number(config.depth) / 5.5);

  const staveWoodCost = Math.round(staveSpecies.boardCost * materialMultiplier);

  const staveWoodMarkup = Math.round(staveWoodCost * 1.35);

  const hybridOuter = config.construction === 'hybrid' ? outerVeneer.price : 0;

  const items = [

    {

      label: `Base SoundLegend ${diameter.label} build`,

      amount: diameter.basePrice,

      note: 'Shell planning, shop setup, standard hardware path, fitting, edges, tuning, documentation.',

      type: 'base',

    },

    {

      label: `Depth adjustment: ${depth.label}`,

      amount: depth.price,

      note: depth.helper,

      type: 'depth',

    },

    {

      label: construction.label,

      amount: construction.baseAdd,

      note: construction.helper,

      type: 'construction',

    },

    {

      label: `${staveSpecies.label} stave material allowance`,

      amount: staveWoodMarkup,

      note: 'Scaled by diameter/depth and includes yield/waste allowance.',

      type: 'wood',

    },

    {

      label: config.construction === 'hybrid' ? outerVeneer.label : 'Outer shell component',

      amount: hybridOuter,

      note:

        config.construction === 'hybrid'

          ? 'Thin 1/8" steam-bent outer component for hybrid builds.'

          : 'Not used unless Hybrid Shell is selected.',

      type: 'wood',

      hiddenWhenZero: true,

    },

    {

      label: finishDetail.label,

      amount: finishDetail.price,

      note: finishDetail.helper,

      type: 'finish',

    },

    {

      label: interior.label,

      amount: interior.price,

      note: interior.helper,

      type: 'finish',

    },

    {

      label: badge.label,

      amount: badge.price,

      note: badge.helper,

      type: 'custom',

    },

    {

      label: lug.label,

      amount: lug.price,

      note: lug.helper,

      type: 'hardware',

    },

    {

      label: hoop.label,

      amount: hoop.price,

      note: hoop.helper,

      type: 'hardware',

    },

    {

      label: hardware.label,

      amount: hardware.price,

      note: hardware.helper,

      type: 'hardware',

    },

    {

      label: throwOff.label,

      amount: throwOff.price,

      note: throwOff.helper,

      type: 'hardware',

    },

    {

      label: 'Batter head / resonant head / wires',

      amount: 0,

      note: 'Included as a setup choice. No small upcharge games here.',

      type: 'included',

    },

    {

      label: 'LegacyVoice Read + consultation prep',

      amount: 0,

      note: 'Included with your request. No payment required to request the read.',

      type: 'included',

    },

  ];

  return items.filter((item) => !(item.hiddenWhenZero && item.amount === 0));

};

const getEstimate = (config) => {

  const construction = getSelected(CONSTRUCTION_OPTIONS, config.construction);

  const depth = getSelected(DEPTH_OPTIONS, config.depth);

  const finishDetail = getSelected(getFinishDetails(config.finishDirection), config.finishDetail);

  const interior = getSelected(INTERIOR_FINISH_OPTIONS, config.interiorFinish);

  const badge = getSelected(BADGE_OPTIONS, config.badgeOption);

  const lineItems = buildLineItems(config);

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const workshopHours =

    70 +

    Math.max(0, depth.hours) +

    construction.hours +

    finishDetail.hours +

    interior.hours +

    badge.hours;

  const timelineWeeks =

    10 +

    Math.ceil(Math.max(0, workshopHours - 70) / 8) +

    (config.finishDirection === 'resin' ? 2 : 0);

  return {

    total,

    workshopHours,

    timelineWeeks,

    lineItems,

  };

};

const SoundLegendProductDetail = () => {

  const location = useLocation();

  const [firstName, setFirstName] = useState('');

  const [email, setEmail] = useState('');

  const [phoneDigits, setPhoneDigits] = useState('');

  const [phoneFocused, setPhoneFocused] = useState(false);

  const [playerType, setPlayerType] = useState('Drummer');

  const [seriousness, setSeriousness] = useState('Just playing with the builder');

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [contactConsent, setContactConsent] = useState(false);

  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [open, setOpen] = useState(false);

  const [config, setConfig] = useState({

    diameter: '14',

    depth: '5.5',

    construction: 'stave',

    staveSpecies: 'maple',

    outerVeneer: 'maple-outer',

    voiceGoal: 'versatile',

    finishDirection: 'natural',

    finishDetail: 'natural-gloss',

    interiorFinish: 'natural-sanded',

    badgeOption: 'standard',

    lugType: 'vintage-tube',

    hoopType: 'diecast',

    hardwareFinish: 'Chrome',

    throwOff: 'trick-gs007',

    batterHead: 'remo-controlled-sound',

    resonantHead: 'remo-ambassador-snare-side',

    snareWires: 'puresound-custom-pro-20',

    notes: '',

  });

  useEffect(() => {

    const el =

      document.querySelector('.soundlegend-product-detail') ||

      document.documentElement;

    el.scrollTo({ top: 0, behavior: 'auto' });

  }, [location]);

  const activeFinishDetails = useMemo(

    () => getFinishDetails(config.finishDirection),

    [config.finishDirection]

  );

  const estimate = useMemo(() => getEstimate(config), [config]);

  const updateConfig = (key, value) => {

    setConfig((current) => {

      const next = {

        ...current,

        [key]: value,

      };

      if (key === 'finishDirection') {

        next.finishDetail = getFinishDetails(value)[0]?.value || 'natural-satin';

      }

      return next;

    });

  };

  const validate = () => {

    const missing = [];

    const issues = [];

    if (!firstName.trim()) missing.push('First Name');

    if (!email.trim()) missing.push('Email');

    if (email && !isEmailFormat(email)) issues.push('Valid Email');

    if (phoneDigits && phoneDigits.length !== 10) issues.push('Valid 10-digit Phone');

    if (!termsAccepted) issues.push('Terms and Privacy acknowledgement');

    if (!contactConsent) issues.push('Request-related email consent');

    return { missing, issues };

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    const { missing, issues } = validate();

    if (missing.length || issues.length) {

      const lines = [];

      if (missing.length) lines.push(`Missing required: ${missing.join(', ')}`);

      if (issues.length) lines.push(`Please fix: ${issues.join(', ')}`);

      alert(lines.join('\n'));

      return;

    }

    setOpen(true);

  };

  const selectedDiameter = getSelected(DIAMETER_OPTIONS, config.diameter);

  const selectedDepth = getSelected(DEPTH_OPTIONS, config.depth);

  const selectedVoiceGoal = getSelected(VOICE_GOALS, config.voiceGoal);

  const selectedConstruction = getSelected(CONSTRUCTION_OPTIONS, config.construction);

  const selectedSpecies = getSelected(STAVE_SPECIES_OPTIONS, config.staveSpecies);

  const selectedFinishDirection = getSelected(FINISH_DIRECTIONS, config.finishDirection);

  const selectedFinishDetail = getSelected(activeFinishDetails, config.finishDetail);

  return (

    <div className="soundlegend-product-detail">

      <img

        src="/resized-logos/soundlegend-white.png"

        alt="SOUNDLEGEND Series"

        className="soundlegend-header-image"

        decoding="async"

        fetchpriority="high"

      />

      <section className="sl-hero">

        <div className="sl-hero-copy">

          <span className="sl-eyebrow">Custom-built. Artist-led. One-on-one.</span>

          <h1 className="sl-title">Build the snare that sounds like your story.</h1>

          <p className="sl-lede">

            SoundLegend is Ober Artisan’s fully custom build experience — shaped

            around your playing style, sound goals, visual direction, and the

            feel you want under the stick.

          </p>

          <p>

            Explore the Discovery Workbench, see the flat estimated cost update

            in real time, and request a free LegacyVoice Read powered by the

            Ober LegacyPrint™ Voicing Engine.

          </p>

          <div className="sl-hero-actions">

            <a href="#sl-workbench" className="sl-primary-link">

              Start the Discovery Workbench

            </a>

            <a href="#sl-process" className="sl-secondary-link">

              How it works

            </a>

          </div>

        </div>

        <div className="sl-hero-media">

          <InlineFrame360 />

          <div className="sl-trustband" aria-label="SoundLegend assurances">

            <div className="tb-item">

              <span className="tb-icon">🇺🇸</span>

              <span className="tb-text">Handcrafted in Nashville, TN</span>

            </div>

            <div className="tb-item">

              <span className="tb-icon">✦</span>

              <span className="tb-text">Limited custom build slots</span>

            </div>

            <div className="tb-item">

              <span className="tb-icon">🎧</span>

              <span className="tb-text">LegacyPrint™ voice analysis</span>

            </div>

            <div className="tb-item">

              <span className="tb-icon">🛠</span>

              <span className="tb-text">70–80+ workshop hours per drum</span>

            </div>

          </div>

        </div>

      </section>

      <section className="sl-story-band" id="sl-process">

        <div className="sl-story-card">

          <span className="sl-section-kicker">The SoundLegend experience</span>

          <h2>Transparent before it becomes personal.</h2>

          <p>

            The Workbench is built around flat estimated pricing, line-item

            visibility, and plain language. Final pricing only changes if your

            consultation changes the scope, requires special sourcing, or adds

            a design detail that needs extra review.

          </p>

        </div>

        <div className="sl-process-grid">

          <article>

            <span>01</span>

            <h3>Explore your direction</h3>

            <p>Choose size, voice, shell direction, woods, finish, hardware, heads, wires, and custom details.</p>

          </article>

          <article>

            <span>02</span>

            <h3>See the cost build</h3>

            <p>Watch each decision update one estimated total with a detailed breakdown.</p>

          </article>

          <article>

            <span>03</span>

            <h3>Save the estimate</h3>

            <p>Request a free LegacyVoice Read and decide whether you want to talk through the build.</p>

          </article>

        </div>

      </section>

      <section className="sl-workbench" id="sl-workbench">

        <div className="sl-workbench-head">

          <span className="sl-section-kicker">Discovery Workbench</span>

          <h2>Shape a starting point.</h2>

          <p>

            This is not a checkout funnel. It is a transparent quote simulator

            for players, collectors, producers, and serious drum people who want

            to understand what a SoundLegend build might involve.

          </p>

        </div>

        <div className="sl-builder-layout">

          <div className="sl-builder-panel">

            <div className="sl-builder-section sl-builder-section--foundation">

              <div className="sl-builder-section-head">

                <span>01</span>

                <div>

                  <h3>Foundation</h3>

                  <p>Choose the shell size and depth family. We’ll keep the depth clean and readable.</p>

                </div>

              </div>

              <label>Diameter</label>

              <div className="sl-option-grid sl-option-grid--five">

                {DIAMETER_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--diameter ${

                      config.diameter === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('diameter', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    <em>Base {formatCurrency(option.basePrice)}</em>

                  </button>

                ))}

              </div>

              <label>Depth</label>

              <div className="sl-depth-select-grid">

                {DEPTH_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-depth-card ${

                      config.depth === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('depth', option.value)}

                  >

                    <strong>{option.label}</strong>

                    <span>{option.helper}</span>

                    {option.price !== 0 && (

                      <em>

                        {option.price > 0 ? '+' : '-'}

                        {formatCurrency(Math.abs(option.price))}

                      </em>

                    )}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

            </div>

            <div className="sl-builder-section sl-mood-section">

              <div className="sl-builder-section-head">

                <span>02</span>

                <div>

                  <h3>Voice mood</h3>

                  <p>Choose the musical direction before getting lost in hardware.</p>

                </div>

              </div>

              <div className="sl-mood-grid">

                {VOICE_GOALS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-mood-card ${

                      config.voiceGoal === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('voiceGoal', option.value)}

                  >

                    <span className="sl-mood-orb" />

                    <strong>{option.label}</strong>

                    <p>{option.helper}</p>

                    <small>{option.mood}</small>

                  </button>

                ))}

              </div>

            </div>

            <div className="sl-builder-section">

              <div className="sl-builder-section-head">

                <span>03</span>

                <div>

                  <h3>Shell architecture</h3>

                  <p>Choose the practical build path. We are not offering straight steam-bent or solid-only builds here.</p>

                </div>

              </div>

              <label>Construction Path</label>

              <div className="sl-construction-grid">

                {CONSTRUCTION_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-construction-card ${

                      config.construction === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('construction', option.value)}

                  >

                    <div className="sl-blueprint">

                      <BlueprintIcon type={option.icon} />

                    </div>

                    <strong>{option.label}</strong>

                    <p>{option.helper}</p>

                    <small>{option.leans}</small>

                    {option.baseAdd > 0 && <em>+{formatCurrency(option.baseAdd)}</em>}

                  </button>

                ))}

              </div>

              <label>Stave Core Species</label>

              <div className="sl-option-grid sl-option-grid--three">

                {STAVE_SPECIES_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.staveSpecies === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('staveSpecies', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    <em>Material base {formatCurrency(option.boardCost)}</em>

                  </button>

                ))}

              </div>

              {config.construction === 'hybrid' && (

                <>

                  <label>Hybrid 1/8" Outer Component</label>

                  <div className="sl-option-grid sl-option-grid--three">

                    {OUTER_VENEER_OPTIONS.map((option) => (

                      <button

                        key={option.value}

                        type="button"

                        className={`sl-option-tile sl-option-tile--detail ${

                          config.outerVeneer === option.value ? 'is-selected' : ''

                        }`}

                        onClick={() => updateConfig('outerVeneer', option.value)}

                      >

                        <span>{option.label}</span>

                        <small>{option.helper}</small>

                        <em>+{formatCurrency(option.price)}</em>

                      </button>

                    ))}

                  </div>

                </>

              )}

            </div>

            <div className="sl-builder-section sl-finish-section">

              <div className="sl-builder-section-head">

                <span>04</span>

                <div>

                  <h3>Finish mood</h3>

                  <p>More atmosphere, less sterile configurator. Pick a lane, then refine the treatment.</p>

                </div>

              </div>

              <label>Finish Direction</label>

              <div className="sl-finish-mood-grid">

                {FINISH_DIRECTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-finish-mood-card is-${option.value} ${

                      config.finishDirection === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('finishDirection', option.value)}

                  >

                    <span className="sl-finish-glow" />

                    <strong>{option.label}</strong>

                    <p>{option.helper}</p>

                  </button>

                ))}

              </div>

              <label>Finish Detail</label>

              <div className="sl-option-grid sl-option-grid--two">

                {activeFinishDetails.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.finishDetail === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('finishDetail', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

              <label>Interior Finish</label>

              <div className="sl-option-grid sl-option-grid--three">

                {INTERIOR_FINISH_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.interiorFinish === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('interiorFinish', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

            </div>

            <div className="sl-builder-section">

              <div className="sl-builder-section-head">

                <span>05</span>

                <div>

                  <h3>Signature and badge details</h3>

                  <p>Add personal markings, badge work, or an interior signature/logo.</p>

                </div>

              </div>

              <div className="sl-option-grid sl-option-grid--two">

                {BADGE_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.badgeOption === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('badgeOption', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

            </div>

            <div className="sl-builder-section">

              <div className="sl-builder-section-head">

                <span>06</span>

                <div>

                  <h3>Hardware and response</h3>

                  <p>Choose the starting hardware system. Exact sourcing can be reviewed later.</p>

                </div>

              </div>

              <label>Lug Type</label>

              <div className="sl-option-grid sl-option-grid--three">

                {LUG_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.lugType === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('lugType', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

              <label>Hoop Type</label>

              <div className="sl-option-grid sl-option-grid--three">

                {HOOP_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.hoopType === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('hoopType', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price < 0 && <em>-{formatCurrency(Math.abs(option.price))}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

              <label>Hardware Finish</label>

              <div className="sl-option-grid sl-option-grid--three">

                {HARDWARE_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.hardwareFinish === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('hardwareFinish', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

              <label>Snare Throw-Off</label>

              <div className="sl-option-grid sl-option-grid--three">

                {THROW_OFF_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.throwOff === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('throwOff', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    {option.price > 0 && <em>+{formatCurrency(option.price)}</em>}

                    {option.price < 0 && <em>-{formatCurrency(Math.abs(option.price))}</em>}

                    {option.price === 0 && <em>Included</em>}

                  </button>

                ))}

              </div>

            </div>

            <div className="sl-builder-section">

              <div className="sl-builder-section-head">

                <span>07</span>

                <div>

                  <h3>Heads and wires</h3>

                  <p>No nickel-and-dime upcharges here. These are setup choices, not checkout traps.</p>

                </div>

              </div>

              <label>Batter Head</label>

              <div className="sl-option-grid sl-option-grid--three">

                {BATTER_HEAD_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.batterHead === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('batterHead', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    <em>Included</em>

                  </button>

                ))}

              </div>

              <label>Resonant Head</label>

              <div className="sl-option-grid sl-option-grid--three">

                {RESONANT_HEAD_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.resonantHead === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('resonantHead', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    <em>Included</em>

                  </button>

                ))}

              </div>

              <label>Snare Wires</label>

              <div className="sl-option-grid sl-option-grid--three">

                {WIRE_OPTIONS.map((option) => (

                  <button

                    key={option.value}

                    type="button"

                    className={`sl-option-tile sl-option-tile--detail ${

                      config.snareWires === option.value ? 'is-selected' : ''

                    }`}

                    onClick={() => updateConfig('snareWires', option.value)}

                  >

                    <span>{option.label}</span>

                    <small>{option.helper}</small>

                    <em>Included</em>

                  </button>

                ))}

              </div>

            </div>

            <div className="sl-builder-section">

              <div className="sl-builder-section-head">

                <span>08</span>

                <div>

                  <h3>Notes for the shop</h3>

                  <p>Bring the human stuff: players, records, venues, sessions, references, worries, hopes.</p>

                </div>

              </div>

              <textarea

                className="sl-builder-notes"

                value={config.notes}

                onChange={(e) => updateConfig('notes', e.target.value)}

                placeholder="Example: I play mostly alt-country and studio sessions. I want something warm but articulate enough for brushes and ghost notes. I’m curious about walnut, a subtle scorched finish, and a simple inside signature."

              />

            </div>

          </div>

          <aside className="sl-estimate-panel">

            <div className="sl-estimate-card">

              <span className="sl-section-kicker">Estimated build cost</span>

              <h3>{formatCurrency(estimate.total)}</h3>

              <p>

                One estimated total based on your selections. Final pricing only

                changes if the consultation changes the scope, requires special

                sourcing, or adds approved custom work.

              </p>

              <div className="sl-estimate-lines">

                <div>

                  <span>Estimated timeline</span>

                  <strong>{estimate.timelineWeeks} weeks</strong>

                </div>

                <div>

                  <span>Workshop time</span>

                  <strong>{estimate.workshopHours}+ hours</strong>

                </div>

                <div>

                  <span>Availability</span>

                  <strong>Limited slots</strong>

                </div>

              </div>

              <div className="sl-current-config">

                <h4>Current direction</h4>

                <p>

                  {selectedDiameter.label} × {selectedDepth.label} •{' '}

                  {selectedConstruction.label} • {selectedSpecies.label}

                </p>

                <p>

                  {selectedFinishDirection.label} / {selectedFinishDetail.label} •{' '}

                  {selectedVoiceGoal.label}

                </p>

              </div>

              <div className="sl-price-breakdown">

                <div className="sl-price-breakdown-head">

                  <h4>Detailed breakdown</h4>

                  <span>{estimate.lineItems.length} lines</span>

                </div>

                {estimate.lineItems.map((item) => (

                  <div

                    key={`${item.label}-${item.amount}`}

                    className={`sl-price-line is-${item.type}`}

                  >

                    <div>

                      <span>{item.label}</span>

                      <small>{item.note}</small>

                    </div>

                    <strong>

                      {item.amount > 0 && `+${formatCurrency(item.amount)}`}

                      {item.amount < 0 && `-${formatCurrency(Math.abs(item.amount))}`}

                      {item.amount === 0 && 'Included'}

                    </strong>

                  </div>

                ))}

                <div className="sl-price-total-line">

                  <span>Estimated total</span>

                  <strong>{formatCurrency(estimate.total)}</strong>

                </div>

              </div>

              <a href="#sl-analysis-request" className="sl-estimate-cta">

                Save this estimate + request read

              </a>

            </div>

            <div className="sl-estimate-note">

              <strong>Labor note:</strong> SoundLegend builds typically involve

              70–80+ hands-on workshop hours. Complex finishes, hybrid shell

              work, special badges, deeper shells, and special hardware can

              increase the estimate.

            </div>

          </aside>

        </div>

      </section>

      <section className="sl-showcase-band">

        <div className="sl-showcase-head">

          <span className="sl-section-kicker">What you get</span>

          <h2>More than a custom snare.</h2>

          <p>

            SoundLegend is designed as a guided build experience — part

            instrument, part story, part portal, part sound discovery.

          </p>

        </div>

        <div className="sl-showcase-grid">

          <article>

            <LazyImg

              src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/soundlegend_showroom%2FSL-001%2Fgallery%2F0-IMG_1803.jpg?alt=media&token=f84c86d4-f111-4156-87c7-3b5e5992df28"

              alt="SoundLegend finished snare"

            />

            <h3>One-of-one build direction</h3>

            <p>Your drum is shaped around sound, feel, visual identity, and the way you actually play.</p>

          </article>

          <article>

            <LazyImg src="/placeholder/snare-dark.jpg" alt="SoundLegend mockup placeholder" />

            <h3>High-resolution mockup planning</h3>

            <p>Visual concepts, finish direction, and build ideas can be reviewed before the final proposal is approved.</p>

          </article>

          <article>

            <LazyImg src="/placeholder/snare-dark.jpg" alt="SoundLegend portal placeholder" />

            <h3>Private build portal</h3>

            <p>Active SoundLegend customers can receive portal access for build details, updates, files, and documentation.</p>

          </article>

        </div>

      </section>

      <section className="sl-analysis-request" id="sl-analysis-request">

        <div className="sl-request-copy">

          <span className="sl-section-kicker">Save your estimate</span>

          <h2>Request your free LegacyVoice Read.</h2>

          <p>

            Submit your Workbench direction and receive a free LegacyVoice Read

            powered by the Ober LegacyPrint™ Voicing Engine.

          </p>

          <p>

            No payment required. This just saves the estimate and gives Ober a

            starting point for reviewing your build direction.

          </p>

          <div className="sl-request-rules">

            <h3>Before you submit</h3>

            <ul>

              <li>This estimate is generated from your selections.</li>

              <li>Final pricing is confirmed after consultation and approved build details.</li>

              <li>Build slots are limited and not guaranteed.</li>

              <li>You can unsubscribe from marketing emails at any time.</li>

            </ul>

          </div>

        </div>

        <form className="sl-request-form" onSubmit={handleSubmit} noValidate>

          <div className="sl-form-head">

            <h3>Save this estimate</h3>

            <p>Light contact info only. No long intake wall here.</p>

          </div>

          <div className="sl-form-grid">

            <div className="sl-field">

              <label htmlFor="firstName">First Name *</label>

              <input

                type="text"

                id="firstName"

                value={firstName}

                onChange={(e) => setFirstName(e.target.value)}

                required

              />

            </div>

            <div className="sl-field">

              <label htmlFor="email">Email *</label>

              <input

                type="email"

                id="email"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                required

                autoComplete="email"

              />

            </div>

            <div className="sl-field">

              <label htmlFor="phone">Phone</label>

              <input

                type="tel"

                id="phone"

                inputMode="numeric"

                autoComplete="tel"

                placeholder="123-456-7890"

                value={phoneFocused ? phoneDigits : formatDashed(phoneDigits)}

                onFocus={() => setPhoneFocused(true)}

                onBlur={() => setPhoneFocused(false)}

                onChange={(e) => setPhoneDigits(onlyDigits(e.target.value))}

              />

            </div>

            <div className="sl-field">

              <label htmlFor="playerType">What best describes you?</label>

              <select

                id="playerType"

                value={playerType}

                onChange={(e) => setPlayerType(e.target.value)}

              >

                {PLAYER_TYPE_OPTIONS.map((option) => (

                  <option key={option} value={option}>

                    {option}

                  </option>

                ))}

              </select>

            </div>

            <div className="sl-field sl-field--full">

              <label htmlFor="seriousness">Where are you at?</label>

              <select

                id="seriousness"

                value={seriousness}

                onChange={(e) => setSeriousness(e.target.value)}

              >

                {SERIOUSNESS_OPTIONS.map((option) => (

                  <option key={option} value={option}>

                    {option}

                  </option>

                ))}

              </select>

            </div>

          </div>

          <div className="sl-consent-stack">

            <label className="sl-checkbox-row">

              <input

                type="checkbox"

                checked={termsAccepted}

                onChange={(e) => setTermsAccepted(e.target.checked)}

              />

              <span>

                I agree to the Terms and Privacy Policy and understand this

                estimate is not a final invoice.

              </span>

            </label>

            <label className="sl-checkbox-row">

              <input

                type="checkbox"

                checked={contactConsent}

                onChange={(e) => setContactConsent(e.target.checked)}

              />

              <span>

                I agree to receive emails related to this SoundLegend estimate,

                LegacyVoice Read, intake steps, and consultation details.

              </span>

            </label>

            <label className="sl-checkbox-row">

              <input

                type="checkbox"

                checked={marketingOptIn}

                onChange={(e) => setMarketingOptIn(e.target.checked)}

              />

              <span>

                I’d also like occasional Ober Artisan updates, build stories,

                product releases, and educational content. I can unsubscribe at

                any time.

              </span>

            </label>

          </div>

          <button type="submit" className="sl-cta">

            Save Estimate + Request Free Read

          </button>

        </form>

      </section>

      <Dialog open={open} onClose={() => setOpen(false)}>

        <DialogTitle>Estimate request captured</DialogTitle>

        <DialogContent>

          <Typography variant="body1" sx={{ mb: 1.5 }}>

            This is still the front-end version for now.

          </Typography>

          <Typography variant="body2" sx={{ mb: 1.25 }}>

            Next pass can save this estimate to Firestore and generate the

            questionnaire token.

          </Typography>

          <Typography variant="body2" color="text.secondary">

            Estimated build cost: <strong>{formatCurrency(estimate.total)}</strong>

          </Typography>

        </DialogContent>

        <DialogActions>

          <Button onClick={() => setOpen(false)} color="primary">

            Continue

          </Button>

        </DialogActions>

      </Dialog>

    </div>

  );

};

export default SoundLegendProductDetail;