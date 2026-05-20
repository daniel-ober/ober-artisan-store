import assert from 'node:assert/strict';

import { applyConstructionModifierLayer } from '../src/utils/legacyPrint/applyConstructionModifierLayer.js';

const baseMaple = {

  attack: 6,

  brightness: 5.8,

  projection: 6,

  sustain: 5.8,

  warmth: 6.4,

  sensitivity: 6,

  control: 5.8,

};

const score = (constructionType, extra = {}) =>

  applyConstructionModifierLayer({

    baseNodes: baseMaple,

    constructionType,

    ...extra,

  });

const stave = score('stave');

const ply = score('ply');

const block = score('segmented-block');

assert(stave.nodes.projection > ply.nodes.projection);

assert(stave.nodes.sensitivity > ply.nodes.sensitivity);

assert(ply.nodes.control > stave.nodes.control);

assert(block.nodes.control > stave.nodes.control);

assert(block.nodes.projection < stave.nodes.projection);

assert(block.nodes.projection > ply.nodes.projection);

assert(block.nodes.attack >= ply.nodes.attack);

const coreOnly = score('stave');

const feuzonHybrid = score('stave', {

  hybridExteriorConstructionType: 'steam-bent',

  hybridExteriorShare: 0.25,

});

assert(feuzonHybrid.nodes.warmth >= coreOnly.nodes.warmth);

assert(feuzonHybrid.nodes.sustain >= coreOnly.nodes.sustain);

const movement = feuzonHybrid.constructionMeta.averageAbsoluteConstructionMovement;

assert(movement <= 0.468);

for (const node of Object.keys(baseMaple)) {

  const delta = Math.abs(feuzonHybrid.nodes[node] - baseMaple[node]);

  assert(delta <= 0.5, `${node} moved too far: ${delta}`);

}

console.log('✅ Phase 3M construction modifier synthetic fixtures passed');

console.table({

  stave_projection: stave.nodes.projection,

  ply_projection: ply.nodes.projection,

  stave_sensitivity: stave.nodes.sensitivity,

  ply_control: ply.nodes.control,

  block_projection: block.nodes.projection,

  block_control: block.nodes.control,

  feuzon_warmth: feuzonHybrid.nodes.warmth,

  feuzon_sustain: feuzonHybrid.nodes.sustain,

  feuzon_avg_movement: movement,

});