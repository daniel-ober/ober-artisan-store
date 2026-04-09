// src/utils/storyEngineHybridPrompts.js

function asBullets(items = []) {
  return (items || []).filter(Boolean).map((item) => `- ${item}`).join('\n');
}

function buildCommonContext(payload) {
  return `
ARTIST
- Name: ${payload.artist.name}
- Player profile: ${payload.artist.playerProfile}
- Genres: ${(payload.artist.genreContext || []).join(', ')}
- Desired outcome: ${payload.artist.desiredOutcome}
- Influences / references: ${(payload.artist.influenceReferences || []).join(', ')}

BUILD
- Project name: ${payload.build.projectName}
- Size: ${payload.build.sizeLabel}
- Shell construction: ${payload.build.shellConstruction}
- Primary wood: ${payload.build.primaryWood}
- Secondary wood: ${payload.build.secondaryWood}
- Bearing edge: ${payload.build.bearingEdge}
- Hoop type: ${payload.build.hoopType}
- Lug count: ${payload.build.lugCount}
- Tuning approach: ${payload.build.tuningApproach}
- Finish system: ${payload.build.finishSystem}
- Hardware finish: ${payload.build.hardwareFinish}
- Visual mood: ${(payload.build.visualMood || []).join(', ')}
- Finish direction: ${(payload.build.finishDirection || []).join(', ')}

SOUND PROFILE
- Response priorities: ${(payload.soundProfile.responsePriorities || []).join(', ')}
- Tonal goals: ${(payload.soundProfile.tonalGoals || []).join(', ')}
- Attack: ${payload.soundProfile.attack}
- Body: ${payload.soundProfile.body}
- Sensitivity: ${payload.soundProfile.sensitivity}
- Sustain: ${payload.soundProfile.sustain}
- Projection: ${payload.soundProfile.projection}
- Tuning range: ${payload.soundProfile.tuningRange}
- Articulation: ${payload.soundProfile.articulation}
- Feel: ${payload.soundProfile.feel}

CHAPTER
- Chapter key: ${payload.chapter.key}
- Chapter label: ${payload.chapter.label}
- Chapter purpose: ${payload.chapter.purpose}
`.trim();
}

export function buildHybridChapterOverviewPrompt(payload) {
  return `
You are writing a premium chapter overview for a custom snare drum build book.

Your job is to write ONE short, tailored paragraph for this exact chapter.
It must feel human, intentional, musical, and specific to this artist and this build.
It should sound elevated, but never generic, cheesy, or corporate.

RULES
- 70 to 110 words
- one paragraph only
- no bullet points
- no clichés
- do not use phrases like "what matters most here" unless absolutely necessary
- do not repeat stock phrasing from other chapters
- this chapter must feel distinct from the others
- stay grounded in the facts provided
- do not invent artist biography or false backstory
- write with a refined, slightly poetic craftsman tone

${buildCommonContext(payload)}

Return only the paragraph.
`.trim();
}

export function buildHybridBuildNotesPrompt(payload) {
  return `
You are writing private build notes as if the craftsman jotted them during the build.

Your job is to write concise, sharp, tailored bullet notes for this chapter.
These should feel like real workshop notes: observant, intentional, specific, not polished marketing copy.

RULES
- 4 to 6 bullets
- each bullet should be one sentence or sentence fragment
- practical, musical, slightly poetic when useful
- avoid generic wording
- no repeated opening phrases
- no fake facts
- write as if the craftsman is documenting what matters in this chapter
- make the notes feel specific to this artist and build

${buildCommonContext(payload)}

Return only the bullets.
`.trim();
}