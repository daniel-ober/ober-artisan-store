export const STORYPOINT_KEYS = [
  'overview',
  'artistDirection',
  'craftsmanDirection',
  'build',
  'voice',
  'archive',
];

export const STORY_INTAKE_DOMAIN_KEYS = [
  'consultationRecord',
  'artistMusicalContext',
  'tonalDirection',
  'feelPlayingExperience',
  'visualDirection',
  'buildDirection',
  'inspirationStoryIdentity',
  'prioritiesTradeoffs',
  'builderInterpretation',
  'callTranscriptionSourceNotes',
];

export const PROJECT_STAGE_STORY_FRAMEWORK = {
  discoveryDesign: {
    stageKey: 'discoveryDesign',
    chapterNumber: 1,
    chapterTitle: 'Discovery & Design',
    chapterLabel: 'Chapter I',
    chapterTheme: 'Identity begins before materials move.',
    chapterPurpose:
      'This chapter defines the build at its most human starting point: listening well, reading the artist honestly, and identifying what this instrument is truly being asked to become.',
    chapterStoryCore:
      'This is where the instrument begins as conversation, intuition, and possibility. Nothing permanent has been shaped yet, but the most important work is already underway: learning what belongs in the build and what does not. This chapter is about discernment. It is where direction becomes clearer, language becomes more useful, and the first honest outline of the drum starts to appear.',
    oberVisionCore:
      'At Ober Artisan, Discovery & Design is where I protect against building a drum that is technically impressive but personally disconnected. My goal here is to identify the emotional, sonic, visual, and practical truths that should guide every later decision. This chapter is not about rushing into specs. It is about hearing clearly enough to build with purpose.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on the player’s world, what matters most in feel and tone, what visual anchors appear early, and where guidance is needed most. This chapter should make it clear that the build is being shaped around a real person, not a generic spec sheet.',
    relevantIntakeDomains: [
      'consultationRecord',
      'artistMusicalContext',
      'tonalDirection',
      'feelPlayingExperience',
      'visualDirection',
      'inspirationStoryIdentity',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'callTranscriptionSourceNotes',
    ],
    overview: {
      oberVisionPrompt:
        'Describe the Ober philosophy for discovery: deep listening, restraint, discernment, and setting the build’s true direction before permanent choices are made.',
      tailoredVisionPrompt:
        'Explain how the first call, intake, and artist priorities are shaping the identity of this specific build.',
    },
    artistDirection: {
      focus:
        'What the player is reaching for musically, emotionally, visually, and practically.',
    },
    craftsmanDirection: {
      focus:
        'How the builder interprets the artist, spots the real priorities, and begins defining the right lane for the instrument.',
    },
    build: {
      focus:
        'Initial shell ideas, possible materials, and the earliest spec instincts that begin forming here.',
    },
    voice: {
      focus:
        'The early tonal target: what the instrument should eventually feel and sound like, before exact construction is finalized.',
    },
    archive: {
      focus:
        'Consultation notes, transcript excerpts, call details, references, and early sketches of the build’s identity.',
    },
  },

  commitmentPortal: {
    stageKey: 'commitmentPortal',
    chapterNumber: 2,
    chapterTitle: 'Commitment & Portal Setup',
    chapterLabel: 'Chapter II',
    chapterTheme: 'The project becomes real.',
    chapterPurpose:
      'This chapter marks the transition from interest to commitment. The build is no longer a possibility being discussed — it becomes an active, documented journey with structure, accountability, and a dedicated place for the story to unfold.',
    chapterStoryCore:
      'This chapter is where intention becomes real enough to carry responsibility. The artist commits. The portal opens. The build moves out of the abstract and into a shared structure that can hold both craftsmanship and trust. What started as a conversation now gains sequence, documentation, and a place to live.',
    oberVisionCore:
      'At Ober Artisan, commitment is not treated as a transaction alone. It is the moment the project begins carrying mutual responsibility. This chapter exists to create clarity, momentum, and respect for the process. The portal is not just a dashboard — it is the record of a relationship between artist, instrument, and maker.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on what the commitment means for this specific artist, what expectations need to be honored, and how the portal becomes part of the personalized SoundLegend experience.',
    relevantIntakeDomains: [
      'consultationRecord',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'callTranscriptionSourceNotes',
    ],
    overview: {
      oberVisionPrompt:
        'Describe commitment as the moment the build becomes real, documented, and accountable.',
      tailoredVisionPrompt:
        'Explain what this commitment means for this artist and why formalizing the journey matters in this case.',
    },
    artistDirection: {
      focus:
        'What confidence, trust, and clarity the artist needs at this stage.',
    },
    craftsmanDirection: {
      focus:
        'How the builder creates structure, expectation alignment, and a stable starting point for the work ahead.',
    },
    build: {
      focus:
        'Administrative and directional lock-in steps that make later craftsmanship possible.',
    },
    voice: {
      focus:
        'How early alignment and commitment protect the eventual sound and feel from confusion or drift.',
    },
    archive: {
      focus:
        'Deposit/payment milestones, agreements, portal setup confirmations, intake completeness, and communication records.',
    },
  },

  woodVisionLockIn: {
    stageKey: 'woodVisionLockIn',
    chapterNumber: 3,
    chapterTitle: 'Wood & Vision Lock-In',
    chapterLabel: 'Chapter III',
    chapterTheme: 'Materials begin carrying identity.',
    chapterPurpose:
      'This chapter solidifies the build’s visual and material direction. It is where the instrument begins to narrow into a more exact self through wood choice, finish intent, and final design conviction.',
    chapterStoryCore:
      'This chapter is where the build starts to trade possibility for precision. Materials stop being abstract ideas and begin carrying real consequence. Wood choice, visual direction, and final spec conviction all begin locking into place here. The drum starts revealing not just what it can be, but what it should be.',
    oberVisionCore:
      'At Ober Artisan, wood and vision are never separated. Material is not just structure; it is personality, response, visual presence, and future voice. This chapter exists to ensure that the chosen direction is not merely beautiful or interesting, but deeply right for the instrument being built.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on how the chosen woods, finishes, and visual priorities support this artist’s identity, tonal goals, and emotional connection to the instrument.',
    relevantIntakeDomains: [
      'artistMusicalContext',
      'tonalDirection',
      'visualDirection',
      'buildDirection',
      'inspirationStoryIdentity',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'callTranscriptionSourceNotes',
    ],
    overview: {
      oberVisionPrompt:
        'Describe wood and finish lock-in as the moment material, beauty, and purpose begin aligning into one coherent direction.',
      tailoredVisionPrompt:
        'Explain why the selected woods and visual direction make sense for this particular artist and build.',
    },
    artistDirection: {
      focus:
        'What visual identity, emotional tone, and sonic expectations the chosen materials need to support.',
    },
    craftsmanDirection: {
      focus:
        'How wood selection and design lock-in are interpreted through practicality, aesthetics, and sound.',
    },
    build: {
      focus:
        'Shell material choices, veneer direction, hardware finish alignment, and final spec freeze decisions.',
    },
    voice: {
      focus:
        'How material choices begin setting the tonal lane, response profile, and future character of the drum.',
    },
    archive: {
      focus:
        'Wood samples, finish references, reference images, spec confirmations, and lock-in notes.',
    },
  },

  rawShellCreation: {
    stageKey: 'rawShellCreation',
    chapterNumber: 4,
    chapterTitle: 'Raw Shell Creation',
    chapterLabel: 'Chapter IV',
    chapterTheme: 'Structure begins to take physical form.',
    chapterPurpose:
      'This chapter is where the shell first becomes real in physical form. The instrument is no longer only a plan — it begins existing as structure, proportion, geometry, and craftsmanship under tension.',
    chapterStoryCore:
      'This chapter is where the shell first enters the world as something tangible. The ideas have to become structure now. Measurements matter. Angles matter. Fit matters. This is not yet the finished instrument, but it is the first moment the build starts carrying weight in the hands instead of only in the imagination.',
    oberVisionCore:
      'At Ober Artisan, raw shell creation is where honesty begins showing up in the work. There is nowhere to hide here. The shell has to be built with discipline, consistency, and respect for the instrument it is trying to become. This chapter establishes the physical truth every later decision will depend on.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on how the shell structure is being formed to support this artist’s chosen depth, response goals, tonal authority, and overall build identity.',
    relevantIntakeDomains: [
      'tonalDirection',
      'feelPlayingExperience',
      'buildDirection',
      'prioritiesTradeoffs',
      'builderInterpretation',
    ],
    overview: {
      oberVisionPrompt:
        'Describe raw shell creation as the first chapter where discipline, geometry, and material truth begin carrying the build.',
      tailoredVisionPrompt:
        'Explain how shell structure and size are being shaped to serve this artist’s sound and feel priorities.',
    },
    artistDirection: {
      focus:
        'What the chosen shell form needs to support in real-world playing and sonic character.',
    },
    craftsmanDirection: {
      focus:
        'How shell depth, structure, and geometry are translated from concept into disciplined physical form.',
    },
    build: {
      focus:
        'Stave prep, joinery, shell assembly, raw geometry, and the first true physical body of the instrument.',
    },
    voice: {
      focus:
        'How shell dimensions and structure begin shaping body, authority, projection, and response.',
    },
    archive: {
      focus:
        'Material prep photos, shell assembly captures, raw shell progress, and notes about structural milestones.',
    },
  },

  shellTrueingTorchTune: {
    stageKey: 'shellTrueingTorchTune',
    chapterNumber: 5,
    chapterTitle: 'Shell Trueing & Torch Tune',
    chapterLabel: 'Chapter V',
    chapterTheme: 'Precision becomes behavior.',
    chapterPurpose:
      'This chapter refines the shell into something that behaves like an instrument rather than merely existing as structure. Accuracy, correction, consistency, and responsiveness all become critical here.',
    chapterStoryCore:
      'This chapter is where discipline meets sensitivity. The shell may already exist, but now it has to be corrected, refined, and brought into honest alignment. Trueing is not glamorous work, but it is sacred work. This is where I pay attention to the shell’s willingness to cooperate. I am looking for accuracy, consistency, and the subtle signs that the shell is starting to respond like an instrument instead of just a structure. Small variations matter here. Tiny errors in geometry can become major frustrations in tuning, feel, and response. This is the chapter where the shell learns how to behave.',
    oberVisionCore:
      'At Ober Artisan, shell trueing is one of the most important expressions of respect in the build. This phase exists to remove hidden future frustrations before they become part of the instrument’s life. The goal is not perfection for vanity’s sake, but alignment that allows the drum to tune honestly, respond consistently, and carry itself with confidence.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on what this specific shell needs in order to preserve the artist’s desired balance of body, control, articulation, and feel. This is where deeper shells, focused response goals, or particular playing demands start becoming physically protected.',
    relevantIntakeDomains: [
      'tonalDirection',
      'feelPlayingExperience',
      'buildDirection',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'callTranscriptionSourceNotes',
    ],
    overview: {
      oberVisionPrompt:
        'Describe shell trueing as sacred precision work that protects tuning honesty, feel, and long-term instrument behavior.',
      tailoredVisionPrompt:
        'Explain what this shell specifically needs in order to support the artist’s response goals, control, and tonal balance.',
    },
    artistDirection: {
      focus:
        'What aspects of consistency, control, and feel matter most for the player in this phase.',
    },
    craftsmanDirection: {
      focus:
        'How the builder corrects, refines, and aligns the shell in ways that directly support the intended response.',
    },
    build: {
      focus:
        'Trueing, refinement, shell correction, surface prep, and any heat/torch-based tuning or shell response work.',
    },
    voice: {
      focus:
        'How tiny geometric and structural refinements affect tuning ease, attack, body, and responsiveness.',
    },
    archive: {
      focus:
        'Trueing progress, shell correction notes, measurement captures, and before/after refinement milestones.',
    },
  },

  exteriorArtFinish: {
    stageKey: 'exteriorArtFinish',
    chapterNumber: 6,
    chapterTitle: 'Exterior Art & Finish',
    chapterLabel: 'Chapter VI',
    chapterTheme: 'The visual identity becomes undeniable.',
    chapterPurpose:
      'This chapter is where the instrument’s outward identity comes fully into view. Veneer, accent work, finish treatment, and aesthetic discipline all converge here.',
    chapterStoryCore:
      'This chapter is where the instrument begins to wear its identity openly. The structure may already be sound, but now the exterior has to become worthy of the story it carries. This is not decoration for its own sake. This is visual language. It is where surface becomes memory, character, and emotional presence. Every move here has to protect the dignity of the build while letting its individuality speak clearly.',
    oberVisionCore:
      'At Ober Artisan, exterior work is not separate from craftsmanship — it is craftsmanship. The finish has to do more than impress. It has to feel intentional, honest, and proportionate to the instrument underneath it. The goal in this chapter is a visual identity that feels personal, elevated, and coherent from every angle.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on how finish direction, burl/resin/acrylic work, veneer, and hardware pairing all support this artist’s unique visual language and emotional connection to the build.',
    relevantIntakeDomains: [
      'visualDirection',
      'inspirationStoryIdentity',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'callTranscriptionSourceNotes',
    ],
    overview: {
      oberVisionPrompt:
        'Describe exterior art and finish as the chapter where beauty, restraint, and identity all have to align.',
      tailoredVisionPrompt:
        'Explain how this build’s finish direction and visual treatment are being shaped specifically for the artist’s taste, identity, and priorities.',
    },
    artistDirection: {
      focus:
        'What the artist wants to feel when seeing the drum for the first time and living with it visually over time.',
    },
    craftsmanDirection: {
      focus:
        'How aesthetic choices are interpreted with restraint, composition, and respect for the instrument.',
    },
    build: {
      focus:
        'Surface prep, veneer work, accent integration, clear coats, curing, and visual detailing.',
    },
    voice: {
      focus:
        'How exterior treatment supports identity, inspiration, and perceived character without compromising the instrument’s integrity.',
    },
    archive: {
      focus:
        'Finish references, veneer captures, accent progress, curing milestones, and visual reveal moments.',
    },
  },

  edgesSnareBeds: {
    stageKey: 'edgesSnareBeds',
    chapterNumber: 7,
    chapterTitle: 'Edges & Snare Beds',
    chapterLabel: 'Chapter VII',
    chapterTheme: 'Contact points define the instrument’s honesty.',
    chapterPurpose:
      'This chapter defines the critical edge geometry and snare bed shaping that determine how the drum seats, speaks, and responds under tension.',
    chapterStoryCore:
      'This chapter is where the shell meets consequence. Bearing edges and snare beds are small in scale, but enormous in effect. These contact points decide how honestly the heads seat, how willingly the shell opens up, and how naturally the drum responds. This is precision work with no room for casual execution. The instrument learns how to speak through details this small.',
    oberVisionCore:
      'At Ober Artisan, bearing edges and snare beds are treated as some of the most sensitive and defining moves in the build. These details determine whether the instrument feels frustrating, average, or alive. The goal in this chapter is to create contact points that are accurate, musical, and appropriate for the drum’s intended voice.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on how edge and snare bed shaping are tuned toward this artist’s desired sensitivity, crack, body, tuning comfort, and rim-related feel.',
    relevantIntakeDomains: [
      'tonalDirection',
      'feelPlayingExperience',
      'buildDirection',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'callTranscriptionSourceNotes',
    ],
    overview: {
      oberVisionPrompt:
        'Describe edges and snare beds as the hidden precision points that control seating, sensitivity, and truthful response.',
      tailoredVisionPrompt:
        'Explain how these cuts are being shaped to support this specific artist’s touch, tuning expectations, and response priorities.',
    },
    artistDirection: {
      focus:
        'What the player needs from the drum in sensitivity, crack, consistency, and contact feel.',
    },
    craftsmanDirection: {
      focus:
        'How edge profile and snare bed shaping are interpreted to serve both shell character and player need.',
    },
    build: {
      focus:
        'Bearing edge cutting, bed shaping, head seating checks, and tolerance validation.',
    },
    voice: {
      focus:
        'How edge and bed geometry affect articulation, sensitivity, tuning ease, wire response, and attack.',
    },
    archive: {
      focus:
        'Edge profiles, snare bed captures, seating tests, and notes about precision and fit.',
    },
  },

  hardwareAssembly: {
    stageKey: 'hardwareAssembly',
    chapterNumber: 8,
    chapterTitle: 'Hardware & Assembly',
    chapterLabel: 'Chapter VIII',
    chapterTheme: 'The instrument becomes playable.',
    chapterPurpose:
      'This chapter brings the instrument together as a complete working drum. Hardware, heads, wires, alignment, and final fit all converge here.',
    chapterStoryCore:
      'This chapter is where the instrument finally starts acting like itself in full. Separate pieces now have to work together without friction. The shell, hardware, heads, and wires all begin sharing responsibility for the drum’s response. This is where fit, alignment, and discipline either confirm the quality of the build or expose weaknesses. The instrument becomes playable here, but more importantly, it becomes coherent.',
    oberVisionCore:
      'At Ober Artisan, assembly is not treated as simple installation. It is the phase where earlier craftsmanship proves whether it can coexist cleanly under real tension and real use. The goal here is a drum that feels unified, reliable, and physically resolved — not just complete on paper.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on how chosen hardware, hoops, heads, and wire decisions support this artist’s visual direction, tactile priorities, and tonal behavior.',
    relevantIntakeDomains: [
      'visualDirection',
      'buildDirection',
      'feelPlayingExperience',
      'tonalDirection',
      'prioritiesTradeoffs',
      'builderInterpretation',
    ],
    overview: {
      oberVisionPrompt:
        'Describe assembly as the chapter where everything either comes together honestly or reveals where it does not fit.',
      tailoredVisionPrompt:
        'Explain how the selected hardware and assembly decisions serve this artist’s visual goals, feel preferences, and desired function.',
    },
    artistDirection: {
      focus:
        'What needs to feel dependable, visually right, and inspiring once the instrument is assembled.',
    },
    craftsmanDirection: {
      focus:
        'How component choice and installation are handled to preserve alignment, response, and long-term reliability.',
    },
    build: {
      focus:
        'Hardware layout, drilling/alignment, lug and strainer install, head fitting, wire install, and final assembly.',
    },
    voice: {
      focus:
        'How assembly choices influence tension feel, shell openness, consistency, and final playability.',
    },
    archive: {
      focus:
        'Assembly progress, hardware detail shots, fit checks, and final pre-tuning captures.',
    },
  },

  legacyTuningMedia: {
    stageKey: 'legacyTuningMedia',
    chapterNumber: 9,
    chapterTitle: 'Legacy Tuning & Media',
    chapterLabel: 'Chapter IX',
    chapterTheme: 'The instrument learns its voice in public.',
    chapterPurpose:
      'This chapter finalizes the playable voice of the drum and captures its story through media. The build becomes both heard and remembered here.',
    chapterStoryCore:
      'This chapter is where the instrument finally speaks in its own complete voice. Tension, balance, shell character, wire response, and player feel all come together in a form that can be heard and shared. This is also the chapter where the build becomes visible as legacy. Media matters here because memory matters. The instrument is no longer only being completed — it is being introduced.',
    oberVisionCore:
      'At Ober Artisan, tuning and media are not afterthoughts. This phase exists to reveal the instrument truthfully and beautifully. The goal is not to force a sound that is unnatural to the shell, but to help the drum arrive at a voice that feels honest, compelling, and worth preserving.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on how tuning choices and final presentation highlight the voice this artist actually needs — not just the most impressive sound in isolation.',
    relevantIntakeDomains: [
      'artistMusicalContext',
      'tonalDirection',
      'feelPlayingExperience',
      'inspirationStoryIdentity',
      'prioritiesTradeoffs',
      'builderInterpretation',
    ],
    overview: {
      oberVisionPrompt:
        'Describe tuning and media as the point where the drum’s final voice is revealed and preserved.',
      tailoredVisionPrompt:
        'Explain how final tuning and presentation choices are serving this artist’s actual use case, feel, and identity.',
    },
    artistDirection: {
      focus:
        'What the artist needs to hear and feel from the drum once it reaches its revealed voice.',
    },
    craftsmanDirection: {
      focus:
        'How tuning is approached with restraint, honesty, and respect for the shell’s true character.',
    },
    build: {
      focus:
        'Head seating refinement, tuning passes, media capture, content gathering, and final reveal preparation.',
    },
    voice: {
      focus:
        'The final playable voice: attack, body, tuning personality, wire response, and expressive range.',
    },
    archive: {
      focus:
        'Final media, tuning clips, beauty shots, reveal assets, and documented voice captures.',
    },
  },

  finalQAPackagingDelivery: {
    stageKey: 'finalQAPackagingDelivery',
    chapterNumber: 10,
    chapterTitle: 'Final QA, Packaging & Delivery',
    chapterLabel: 'Chapter X',
    chapterTheme: 'The build leaves the bench and enters the artist’s life.',
    chapterPurpose:
      'This chapter closes the workshop side of the journey with final inspection, packaging care, and delivery preparation.',
    chapterStoryCore:
      'This chapter is where the instrument leaves my control and enters the artist’s world. That transition has to be handled with care, honesty, and closure. Final quality checks are not ceremonial. Packaging is not routine. Delivery is not a formality. This chapter is the last responsibility I hold before the drum begins collecting the life it was built for.',
    oberVisionCore:
      'At Ober Artisan, the final chapter is treated with the same seriousness as the first. The instrument should leave the bench complete in craft, clear in identity, and protected in transit. The goal here is a handoff that feels worthy of everything that came before it.',
    tailoredVisionFocus:
      'The tailored story in this chapter should focus on what this specific artist is receiving, what has been protected for them throughout the build, and how the instrument is being released into their hands with intention.',
    relevantIntakeDomains: [
      'consultationRecord',
      'prioritiesTradeoffs',
      'builderInterpretation',
      'inspirationStoryIdentity',
    ],
    overview: {
      oberVisionPrompt:
        'Describe the final chapter as a careful handoff from builder to artist, with quality, protection, and closure at the center.',
      tailoredVisionPrompt:
        'Explain what this final handoff means for this artist and what the instrument is now ready to carry into their life.',
    },
    artistDirection: {
      focus:
        'What the artist is ultimately receiving and what the drum is now ready to support in their world.',
    },
    craftsmanDirection: {
      focus:
        'How final inspection, packaging, and release are handled with care and accountability.',
    },
    build: {
      focus:
        'Final QA, packing, documentation, shipping prep, and completion milestones.',
    },
    voice: {
      focus:
        'How final checks protect the integrity of the voice and ensure the instrument arrives ready to serve.',
    },
    archive: {
      focus:
        'Final QC records, packaging captures, shipment milestones, and handoff documentation.',
    },
  },
};

export function getProjectStageStoryFramework(stageKey) {
  return PROJECT_STAGE_STORY_FRAMEWORK[stageKey] || null;
}

export function getAllProjectStageStoryFramework() {
  return PROJECT_STAGE_STORY_FRAMEWORK;
}

export function getStageRelevantIntakeDomains(stageKey) {
  return getProjectStageStoryFramework(stageKey)?.relevantIntakeDomains || [];
}

export function getStageStoryFrameworkFocus(stageKey, storypointKey) {
  const framework = getProjectStageStoryFramework(stageKey);
  if (!framework) return null;
  return framework?.[storypointKey] || null;
}