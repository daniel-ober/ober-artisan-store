import fs from 'fs';

import path from 'path';

const ROOT = process.cwd();

const LEGACY_DIR = path.join(ROOT, 'src/utils/legacyPrint');

const read = (file) => fs.readFileSync(file, 'utf8');

const walk = (dir) =>

  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(full);

    return entry.name.endsWith('.js') || entry.name.endsWith('.mjs') ? [full] : [];

  });

const files = walk(LEGACY_DIR);

const constructionCallFiles = files.filter((file) =>

  read(file).includes('applyConstructionModifierLayer')

);

if (!constructionCallFiles.length) {

  throw new Error('No resolver file calls applyConstructionModifierLayer.');

}

const resolverFiles = constructionCallFiles.filter(

  (file) => !file.endsWith('applyConstructionModifierLayer.js')

);

if (resolverFiles.length !== 1) {

  throw new Error(

    `Expected exactly 1 resolver-level construction call site, found ${resolverFiles.length}:\n${resolverFiles.join('\n')}`

  );

}

const resolverFile = resolverFiles[0];

const source = read(resolverFile);

const callMatches = [...source.matchAll(/applyConstructionModifierLayer\s*\(/g)];

if (callMatches.length !== 1) {

  throw new Error(

    `Expected applyConstructionModifierLayer to run exactly once in resolver path, found ${callMatches.length}.`

  );

}

const callIndex = callMatches[0].index;

const before = source.slice(0, callIndex);

const after = source.slice(callIndex);

const materialMarkers = [

  /material/i,

  /coreShell/i,

  /shellVoice/i,

  /baseVoice/i,

  /materialProfile/i,

  /resolve.*material/i,

];

const laterModifierMarkers = [

  /thickness/i,

  /diameter/i,

  /depth/i,

  /size/i,

  /bearing/i,

  /snareBed/i,

  /hoop/i,

  /head/i,

  /wire/i,

];

const beforeMaterialHits = materialMarkers.filter((rx) => rx.test(before));

const beforeLaterHits = laterModifierMarkers.filter((rx) => rx.test(before));

const afterLaterHits = laterModifierMarkers.filter((rx) => rx.test(after));

if (!beforeMaterialHits.length) {

  throw new Error(

    `Construction appears to run before material/core shell voice is established in ${path.relative(ROOT, resolverFile)}.`

  );

}

if (beforeLaterHits.length) {

  throw new Error(

    `Construction appears after one or more later modifiers in ${path.relative(ROOT, resolverFile)}:\n${beforeLaterHits.map(String).join(', ')}`

  );

}

if (!afterLaterHits.length) {

  throw new Error(

    `Could not verify later modifiers run after construction in ${path.relative(ROOT, resolverFile)}.`

  );

}

const layerFile = path.join(LEGACY_DIR, 'applyConstructionModifierLayer.js');

if (!fs.existsSync(layerFile)) {

  throw new Error('Missing applyConstructionModifierLayer.js.');

}

const layerSource = read(layerFile);

const feuzonMarkers = [/feuzon/i, /hybrid/i, /exterior/i];

const capMarkers = [/cap/i, /clamp/i, /max/i, /limit/i];

const hasFeuzonLogic = feuzonMarkers.some((rx) => rx.test(layerSource));

const hasCapLogic = capMarkers.some((rx) => rx.test(layerSource));

if (hasFeuzonLogic && !hasCapLogic) {

  throw new Error('FEUZØN/exterior-shell construction logic exists, but no cap/clamp/limit marker was found.');

}

console.log('✅ Phase 3O resolver layer-order verification passed');

console.table({

  resolverFile: path.relative(ROOT, resolverFile),

  constructionCallCount: callMatches.length,

  materialBeforeConstruction: beforeMaterialHits.length > 0,

  laterModifiersAfterConstruction: afterLaterHits.length > 0,

  laterModifiersBeforeConstruction: beforeLaterHits.length,

  feuzonExteriorCapCheck: hasFeuzonLogic ? 'capped marker found' : 'no FEUZØN-specific logic in layer file',

});