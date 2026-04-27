import React from 'react';

import { useNavigate } from 'react-router-dom';

import {

  AudioLines,

  Brain,

  Drum,

  Ear,

  Globe2,

  Handshake,

  LineChart,

  Store,

  Users,

  WandSparkles,

} from 'lucide-react';

import './LegacyPrintEnginePage.css';

const VALUE_CARDS = [

  {

    icon: Ear,

    title: 'Listen first',

    text:

      'LegacyPrint™ starts with the player, the room, the music, and the feel under the stick — not with a brand preference or a sales agenda.',

  },

  {

    icon: LineChart,

    title: 'Make sound easier to compare',

    text:

      'The engine translates drum behavior into clearer categories like attack, sustain, warmth, projection, brightness, sensitivity, and control.',

  },

  {

    icon: Handshake,

    title: 'Serve the whole drum community',

    text:

      'This tool is designed to help drummers, builders, shops, retailers, producers, educators, and competing brands speak with more clarity.',

  },

];

const HOW_IT_WORKS = [

  {

    eyebrow: '01',

    title: 'Capture the player’s language',

    text:

      'LegacyPrint™ begins with the way a drummer describes sound, feel, response, control, genre, room, recording needs, and personal preference.',

  },

  {

    eyebrow: '02',

    title: 'Translate feel into voicing traits',

    text:

      'The engine interprets that language into measurable tonal directions without pretending that music can be reduced to a single number.',

  },

  {

    eyebrow: '03',

    title: 'Compare against known drum behaviors',

    text:

      'Instead of asking whether one drum is “better,” LegacyPrint™ helps explain how different shell types, builds, edges, depths, hoops, and materials tend to behave.',

  },

  {

    eyebrow: '04',

    title: 'Guide better decisions',

    text:

      'The output gives players and builders a clearer starting point for choosing, designing, tuning, recording, or explaining a drum.',

  },

];

const AUDIENCE_CARDS = [

  {

    icon: Drum,

    title: 'For drummers',

    text:

      'Understand what you actually like, why certain drums feel right, and how to describe the sound in your head before spending serious money.',

    outcome:

      'Find drums with more confidence, fewer guesses, and better language.',

  },

  {

    icon: WandSparkles,

    title: 'For independent builders',

    text:

      'Use a clearer shared vocabulary when translating customer goals into shell choices, bearing edges, hardware, tuning range, and final build direction.',

    outcome:

      'Turn subjective requests into better build decisions.',

  },

  {

    icon: Store,

    title: 'For retailers and shops',

    text:

      'Help customers compare instruments based on feel and use case instead of price, brand familiarity, or generic product descriptions alone.',

    outcome:

      'Create a better buying experience and reduce mismatch.',

  },

  {

    icon: AudioLines,

    title: 'For producers and engineers',

    text:

      'Clarify what kind of drum voice fits a track, room, mic setup, arrangement, and player before the session starts.',

    outcome:

      'Choose and shape drum sounds with more intention.',

  },

  {

    icon: Globe2,

    title: 'For competing drum brands',

    text:

      'LegacyPrint™ is not meant to make every drum point back to Ober. It can help any builder explain what their own drums do well.',

    outcome:

      'Raise the language of the entire market.',

  },

  {

    icon: Users,

    title: 'For educators and students',

    text:

      'Teach players how construction, tuning, material, and response connect to what they hear and feel behind the kit.',

    outcome:

      'Build a stronger shared vocabulary around drums.',

  },

];

const AXIS_ITEMS = [

  {

    label: 'Attack',

    text: 'How quickly the drum speaks at the front of the note.',

  },

  {

    label: 'Sustain',

    text: 'How long the note carries after the initial strike.',

  },

  {

    label: 'Warmth',

    text: 'How much body, roundness, and low-mid character the drum produces.',

  },

  {

    label: 'Projection',

    text: 'How confidently the drum carries in a room, mix, or live setting.',

  },

  {

    label: 'Brightness',

    text: 'How much upper-end clarity, crack, and top-end presence is present.',

  },

  {

    label: 'Sensitivity',

    text: 'How easily the drum responds to touch, ghost notes, and dynamics.',

  },

  {

    label: 'Control',

    text: 'How focused, contained, and manageable the drum feels under the stick.',

  },

];

const LegacyPrintEnginePage = () => {

  const navigate = useNavigate();

  return (

    <main className="legacyprint-page">

      <section className="legacyprint-hero">

        <div className="legacyprint-hero-glow" aria-hidden="true" />

        <div className="legacyprint-shell legacyprint-hero-grid">

          <div className="legacyprint-hero-copy">

            <span className="legacyprint-kicker">

              Ober LegacyPrint™ Voicing Engine

            </span>

            <h1>

              A new language for understanding how a drum sounds, feels, and

              responds.

            </h1>

            <p className="legacyprint-lead">

              LegacyPrint™ is Ober Artisan’s unbiased drum interpretation and

              voicing engine — built to help players, builders, shops,

              producers, educators, and brands describe drums with more clarity,

              confidence, and shared language.

            </p>

            <div className="legacyprint-hero-actions">

              <button

                type="button"

                className="legacyprint-primary-btn"

                onClick={() => {

                  document

                    .getElementById('legacyprint-unlock')

                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

                }}

              >

                Unlock the tool

              </button>

              <button

                type="button"

                className="legacyprint-secondary-btn"

                onClick={() => navigate('/our-collection')}

              >

                See it in the collection

              </button>

            </div>

          </div>

          <aside className="legacyprint-hero-card">

            <span className="legacyprint-card-kicker">Core read</span>

            <h2>Not a ranking system. A translation system.</h2>

            <p>

              LegacyPrint™ does not decide what is “best.” It helps explain

              what is happening — and why a certain drum may feel right for a

              certain player, room, song, recording, or build goal.

            </p>

            <div className="legacyprint-mini-bars" aria-hidden="true">

              <div>

                <span>Attack</span>

                <i style={{ width: '78%' }} />

              </div>

              <div>

                <span>Warmth</span>

                <i style={{ width: '84%' }} />

              </div>

              <div>

                <span>Projection</span>

                <i style={{ width: '72%' }} />

              </div>

              <div>

                <span>Control</span>

                <i style={{ width: '88%' }} />

              </div>

            </div>

            <p className="legacyprint-card-note">

              Directional only — final sound will vary by wood, shell design,

              build, tuning, room, heads, wires, player, and recording context.

            </p>

          </aside>

        </div>

      </section>

      <section className="legacyprint-section">

        <div className="legacyprint-shell">

          <div className="legacyprint-section-head">

            <span className="legacyprint-kicker">What it is</span>

            <h2>A first-of-its-kind voicing interpreter for drums.</h2>

            <p>

              Drummers have always used words like warm, dry, fat, crisp, open,

              controlled, sensitive, dark, bright, punchy, vintage, modern, and

              musical. The problem is that those words often mean different

              things to different people. LegacyPrint™ helps bridge that gap.

            </p>

          </div>

          <div className="legacyprint-value-grid">

            {VALUE_CARDS.map((card) => {

              const Icon = card.icon;

              return (

                <article key={card.title} className="legacyprint-value-card">

                  <Icon size={24} aria-hidden="true" />

                  <h3>{card.title}</h3>

                  <p>{card.text}</p>

                </article>

              );

            })}

          </div>

        </div>

      </section>

      <section className="legacyprint-section legacyprint-section-dark">

        <div className="legacyprint-shell legacyprint-two-col">

          <div>

            <span className="legacyprint-kicker">Our position</span>

            <h2>Built by Ober. Not biased toward Ober.</h2>

          </div>

          <div className="legacyprint-rich-copy">

            <p>

              LegacyPrint™ is an Ober Artisan product and tool, but the engine

              is not designed to steer every answer back toward Ober drums. That

              would defeat the point.

            </p>

            <p>

              A great maple ply snare, a thoughtful brass shell, a vintage

              mahogany drum, a modern acrylic build, an independent stave shell,

              or a fully custom Ober SoundLegend can all have valid musical

              purpose. LegacyPrint™ exists to help explain those purposes more

              honestly.

            </p>

            <p>

              Our belief is simple: the drum world gets better when players can

              describe what they hear, builders can explain what they make, and

              shops can guide customers with more than brand names and price

              tags.

            </p>

          </div>

        </div>

      </section>

      <section className="legacyprint-section">

        <div className="legacyprint-shell">

          <div className="legacyprint-section-head">

            <span className="legacyprint-kicker">How it works</span>

            <h2>From player language to voicing direction.</h2>

            <p>

              LegacyPrint™ combines player input, drum construction logic,

              comparison profiles, and voicing heuristics into a clearer read of

              how a drum is likely to behave.

            </p>

          </div>

          <div className="legacyprint-steps">

            {HOW_IT_WORKS.map((step) => (

              <article key={step.eyebrow} className="legacyprint-step">

                <span>{step.eyebrow}</span>

                <h3>{step.title}</h3>

                <p>{step.text}</p>

              </article>

            ))}

          </div>

        </div>

      </section>

      <section className="legacyprint-section legacyprint-axis-section">

        <div className="legacyprint-shell">

          <div className="legacyprint-section-head">

            <span className="legacyprint-kicker">The language</span>

            <h2>Seven core dimensions of drum feel and sound.</h2>

            <p>

              These are not meant to replace the ear. They create a shared

              reference point so players, builders, and shops can have a better

              conversation.

            </p>

          </div>

          <div className="legacyprint-axis-grid">

            {AXIS_ITEMS.map((axis) => (

              <article key={axis.label} className="legacyprint-axis-card">

                <h3>{axis.label}</h3>

                <p>{axis.text}</p>

              </article>

            ))}

          </div>

        </div>

      </section>

      <section className="legacyprint-section legacyprint-section-dark">

        <div className="legacyprint-shell">

          <div className="legacyprint-section-head">

            <span className="legacyprint-kicker">Who it helps</span>

            <h2>Designed for the full drum ecosystem.</h2>

            <p>

              LegacyPrint™ is bigger than one product page. It can become a

              shared interpretation layer for anyone trying to understand,

              explain, sell, build, record, or choose drums more intelligently.

            </p>

          </div>

          <div className="legacyprint-audience-grid">

            {AUDIENCE_CARDS.map((card) => {

              const Icon = card.icon;

              return (

                <article key={card.title} className="legacyprint-audience-card">

                  <div className="legacyprint-audience-icon">

                    <Icon size={22} aria-hidden="true" />

                  </div>

                  <h3>{card.title}</h3>

                  <p>{card.text}</p>

                  <strong>{card.outcome}</strong>

                </article>

              );

            })}

          </div>

        </div>

      </section>

      <section className="legacyprint-section">

        <div className="legacyprint-shell legacyprint-mission-card">

          <div>

            <span className="legacyprint-kicker">The mission</span>

            <h2>

              Build world-class handcrafted drums — and help the entire market

              speak about drums better.

            </h2>

          </div>

          <div className="legacyprint-rich-copy">

            <p>

              Ober Artisan’s mission is not only to build some of the most

              thoughtful handcrafted stave drums available. It is also to open

              the door to a deeper, more useful way of understanding the art of

              drums.

            </p>

            <p>

              If LegacyPrint™ helps a drummer make a better choice, helps an

              independent builder explain their work, helps a shop serve a

              customer better, or helps another brand define its own voice more

              clearly, that is a win for the instrument.

            </p>

          </div>

        </div>

      </section>

      <section id="legacyprint-unlock" className="legacyprint-unlock">

        <div className="legacyprint-shell legacyprint-unlock-card">

          <div className="legacyprint-unlock-copy">

            <span className="legacyprint-kicker">Interested in access?</span>

            <h2>Unlock the unbiased LegacyPrint™ tool.</h2>

            <p>

              We are exploring ways to make LegacyPrint™ available beyond Ober

              product pages — for drummers, independent builders, shops,

              retailers, producers, educators, and drum brands that want a more

              useful language around sound and feel.

            </p>

          </div>

          <div className="legacyprint-unlock-list">

            <article>

              <h3>Help drummers</h3>

              <p>

                Find the right instrument, describe their preferences, and make

                more confident buying or build decisions.

              </p>

            </article>

            <article>

              <h3>Help independent shops</h3>

              <p>

                Translate customer language into clearer recommendations,

                comparisons, and setup direction.

              </p>

            </article>

            <article>

              <h3>Help retailers and brands</h3>

              <p>

                Explain product lines with more nuance, more trust, and less

                dependence on generic marketing language.

              </p>

            </article>

            <button

              type="button"

              className="legacyprint-primary-btn legacyprint-unlock-btn"

              onClick={() => navigate('/contact')}

            >

              Request LegacyPrint™ access

            </button>

          </div>

        </div>

      </section>

    </main>

  );

};

export default LegacyPrintEnginePage;