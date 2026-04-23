// src/data/catalog/woods.catalog.js

import {
  createCatalogFact,
  createEvidenceSource,
  createReferenceCatalogItem,
  FACT_CONFIDENCE,
  REFERENCE_CATEGORIES,
  SOURCE_TYPES,
} from '../schemas/referenceCatalogItem.schema.js';

const WD = (slug, label) =>
  createEvidenceSource({
    label,
    url: `https://www.wood-database.com/${slug}/`,
    sourceType: SOURCE_TYPES.MATERIAL_DATABASE,
    confidence: FACT_CONFIDENCE.MEDIUM,
  });

function woodItem({
  id,
  label,
  botanicalName = '',
  aliases = [],
  averageDriedWeightLbsFt3 = null,
  specificGravity = null,
  jankaLbf = null,
  steamBending = '',
  workability = '',
  stability = '',
  durability = '',
  appearance = '',
  sourcingNotes = '',
  tonalSummary = '',
  structuralNotes = '',
  sourceMeta = [],
  tags = [],
  notes = '',
}) {
  return createReferenceCatalogItem({
    id,
    category: REFERENCE_CATEGORIES.WOOD,
    label,
    aliases,
    facts: {
      commonName: createCatalogFact({
        value: label,
        confidence: FACT_CONFIDENCE.HIGH,
      }),
      botanicalName: createCatalogFact({
        value: botanicalName,
        confidence: botanicalName ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
      steamBending: createCatalogFact({
        value: steamBending,
        confidence: steamBending ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
      workability: createCatalogFact({
        value: workability,
        confidence: workability ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
      stability: createCatalogFact({
        value: stability,
        confidence: stability ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
      naturalDurability: createCatalogFact({
        value: durability,
        confidence: durability ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
      appearance: createCatalogFact({
        value: appearance,
        confidence: appearance ? FACT_CONFIDENCE.LOW : FACT_CONFIDENCE.LOW,
      }),
      sourcingNotes: createCatalogFact({
        value: sourcingNotes,
        confidence: sourcingNotes ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
    },
    physicalProperties: {
      averageDriedWeightLbsFt3: createCatalogFact({
        value: averageDriedWeightLbsFt3,
        unit: 'lb/ft³',
        confidence:
          averageDriedWeightLbsFt3 !== null
            ? FACT_CONFIDENCE.MEDIUM
            : FACT_CONFIDENCE.LOW,
      }),
      specificGravity: createCatalogFact({
        value: specificGravity,
        confidence:
          specificGravity !== null ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
      jankaLbf: createCatalogFact({
        value: jankaLbf,
        unit: 'lbf',
        confidence: jankaLbf !== null ? FACT_CONFIDENCE.MEDIUM : FACT_CONFIDENCE.LOW,
      }),
    },
    tonalDescriptors: {
      tonalSummary: createCatalogFact({
        value: tonalSummary,
        confidence: FACT_CONFIDENCE.LOW,
        notes: 'Ober editorial descriptor derived from physical properties + build experience; not lab-measured acoustic fact.',
      }),
      structuralNotes: createCatalogFact({
        value: structuralNotes,
        confidence: FACT_CONFIDENCE.LOW,
        notes: 'Ober editorial descriptor for shell-building context.',
      }),
    },
    compatibility: {
      tags: createCatalogFact({
        value: tags,
        confidence: FACT_CONFIDENCE.LOW,
      }),
    },
    sourceMeta,
    tags,
    notes,
  });
}

export const WOODS_CATALOG = [
  woodItem({
    id: 'maple',
    label: 'Maple',
    botanicalName: 'Acer saccharum / Acer spp.',
    aliases: ['Hard Maple', 'Sugar Maple'],
    averageDriedWeightLbsFt3: 44,
    specificGravity: 0.63,
    jankaLbf: 1450,
    steamBending: 'Generally good.',
    workability: 'Machines well and is commonly used in instrument making.',
    stability: 'Generally stable when dried and processed well.',
    durability: 'Non-durable to perishable outdoors; fine for instrument use indoors.',
    appearance: 'Cream to light tan with subtle grain.',
    tonalSummary:
      'Often treated by builders as a balanced, articulate, versatile shell wood.',
    structuralNotes:
      'Strong baseline species for predictable shell behavior and hybrid pairings.',
    sourceMeta: [WD('hard-maple', 'The Wood Database — Hard Maple')],
    tags: ['balanced', 'versatile', 'benchmark', 'hybrid-friendly'],
  }),

  woodItem({
    id: 'walnut',
    label: 'Walnut',
    botanicalName: 'Juglans nigra',
    aliases: ['Black Walnut'],
    averageDriedWeightLbsFt3: 38,
    specificGravity: 0.55,
    jankaLbf: 1010,
    steamBending: 'Generally reported as good.',
    workability: 'Usually works easily with machine and hand tools.',
    stability: 'Generally stable in service.',
    durability: 'Moderately durable.',
    appearance: 'Chocolate brown to purplish brown heartwood.',
    tonalSummary:
      'Often associated by builders with fuller warmth and smoother top-end emphasis than maple.',
    structuralNotes:
      'Useful when the build direction calls for richness without getting overly soft in feel.',
    sourceMeta: [WD('black-walnut', 'The Wood Database — Black Walnut')],
    tags: ['warm', 'rich', 'balanced', 'premium-visual'],
  }),

  woodItem({
    id: 'cherry',
    label: 'Cherry',
    botanicalName: 'Prunus serotina',
    aliases: ['Black Cherry'],
    averageDriedWeightLbsFt3: 35,
    specificGravity: 0.50,
    jankaLbf: 950,
    steamBending: 'Generally good.',
    workability: 'Very workable and commonly considered pleasant to machine.',
    stability: 'Generally stable.',
    durability: 'Moderately durable for interior use contexts.',
    appearance: 'Pinkish brown to rich reddish brown that darkens with age.',
    tonalSummary:
      'Often treated as a slightly warmer, sweeter alternative to maple with good balance.',
    structuralNotes:
      'Strong aesthetic and tonal candidate when the brief wants refinement over aggression.',
    sourceMeta: [WD('black-cherry', 'The Wood Database — Black Cherry')],
    tags: ['warm', 'sweet', 'balanced', 'refined'],
  }),

  woodItem({
    id: 'mahogany',
    label: 'Mahogany',
    botanicalName: 'Swietenia spp. / Khaya spp. (varies by source)',
    aliases: ['African Mahogany', 'Genuine Mahogany'],
    averageDriedWeightLbsFt3: 31,
    specificGravity: 0.50,
    jankaLbf: 800,
    steamBending: 'Varies by species, often workable.',
    workability: 'Typically machines and sands well.',
    stability: 'Generally stable when dry.',
    durability: 'Ranges by species, often moderate.',
    appearance: 'Reddish brown with open grain.',
    tonalSummary:
      'Often associated with warmth, body, and a softer attack profile in instrument making conversations.',
    structuralNotes:
      'A good candidate when chasing body, depth, and a less clinical presentation.',
    sourceMeta: [
      WD('african-mahogany', 'The Wood Database — African Mahogany'),
      WD('genuine-mahogany', 'The Wood Database — Genuine Mahogany'),
    ],
    tags: ['warm', 'body', 'vintage-leaning', 'round'],
  }),

  woodItem({
    id: 'birch',
    label: 'Birch',
    botanicalName: 'Betula alleghaniensis / Betula spp.',
    aliases: ['Yellow Birch'],
    averageDriedWeightLbsFt3: 43,
    specificGravity: 0.62,
    jankaLbf: 1260,
    steamBending: 'Fair to good depending on species and stock.',
    workability: 'Generally machines well, can burn if feed rates are off.',
    stability: 'Moderately stable.',
    durability: 'Non-durable outdoors; fine for instrument contexts indoors.',
    appearance: 'Pale cream to light golden brown.',
    tonalSummary:
      'Commonly treated by drum builders as more focused and articulate, with clear attack.',
    structuralNotes:
      'Strong option when definition, presence, and recording clarity are priorities.',
    sourceMeta: [WD('yellow-birch', 'The Wood Database — Yellow Birch')],
    tags: ['focused', 'articulate', 'clear', 'recording-friendly'],
  }),

  woodItem({
    id: 'oak',
    label: 'Oak',
    botanicalName: 'Quercus spp.',
    aliases: ['White Oak', 'Red Oak'],
    averageDriedWeightLbsFt3: 47,
    specificGravity: 0.68,
    jankaLbf: 1360,
    steamBending: 'Often good, especially white oak.',
    workability: 'Strong and workable, though dense and heavy.',
    stability: 'Good dimensional performance when processed correctly.',
    durability: 'Moderate to high depending on species.',
    appearance: 'Pronounced open grain with strong figure.',
    tonalSummary:
      'Often approached as a denser, stronger-feeling wood with powerful presence.',
    structuralNotes:
      'Useful for tougher, punchier builds where authority and durability matter.',
    sourceMeta: [
      WD('white-oak', 'The Wood Database — White Oak'),
      WD('red-oak', 'The Wood Database — Red Oak'),
    ],
    tags: ['dense', 'strong', 'authoritative', 'durable'],
  }),

  woodItem({
    id: 'ash',
    label: 'Ash',
    botanicalName: 'Fraxinus americana / Fraxinus spp.',
    aliases: ['White Ash'],
    averageDriedWeightLbsFt3: 42,
    specificGravity: 0.60,
    jankaLbf: 1320,
    steamBending: 'Generally good.',
    workability: 'Machines well and bends reasonably well.',
    stability: 'Moderately stable.',
    durability: 'Non-durable to perishable outdoors.',
    appearance: 'Light-colored with pronounced grain.',
    tonalSummary:
      'Often described as lively and open with strong projection and visible grain character.',
    structuralNotes:
      'Attractive when the build needs energy, openness, and visual texture.',
    sourceMeta: [WD('white-ash', 'The Wood Database — White Ash')],
    tags: ['lively', 'open', 'projecting', 'pronounced-grain'],
  }),

    woodItem({
    id: 'acacia',
    label: 'Acacia',
    botanicalName: 'Acacia koa / Acacia spp. (varies by source)',
    aliases: ['Koa-family Acacia'],
    averageDriedWeightLbsFt3: 41,
    specificGravity: 0.60,
    jankaLbf: 1750,
    steamBending: 'Moderate; depends heavily on species and stock.',
    workability: 'Can machine well, though interlocked grain may require care.',
    stability: 'Generally moderate to good when dried well.',
    durability: 'Moderate to durable depending on species.',
    appearance: 'Golden to medium brown with strong figure potential.',
    tonalSummary:
      'Often treated as a balanced, lively hardwood with a blend of warmth, articulation, and visual richness.',
    structuralNotes:
      'Useful as a character wood when the build wants visual figure and a balanced but confident tonal direction.',
    sourceMeta: [WD('acacia', 'The Wood Database — Acacia')],
    tags: ['balanced', 'lively', 'figured', 'character-wood'],
  }),

  woodItem({
    id: 'beech',
    label: 'Beech',
    botanicalName: 'Fagus grandifolia / Fagus sylvatica',
    aliases: ['European Beech', 'American Beech'],
    averageDriedWeightLbsFt3: 45,
    specificGravity: 0.64,
    jankaLbf: 1300,
    steamBending: 'Generally very good.',
    workability: 'Machines well, though movement control matters.',
    stability: 'Can move in service if not processed carefully.',
    durability: 'Non-durable outdoors; suitable for interior/instrument use.',
    appearance: 'Pale cream to pinkish brown with subtle, even grain.',
    tonalSummary:
      'Often treated as focused, balanced, and punchy with respectable warmth and clean attack.',
    structuralNotes:
      'A strong shell candidate when consistency, bendability, and controlled presence are priorities.',
    sourceMeta: [
      WD('european-beech', 'The Wood Database — European Beech'),
      WD('american-beech', 'The Wood Database — American Beech'),
    ],
    tags: ['balanced', 'focused', 'punchy', 'bend-friendly'],
  }),

  woodItem({
    id: 'jatoba',
    label: 'Jatoba',
    botanicalName: 'Hymenaea courbaril',
    aliases: ['Brazilian Cherry'],
    averageDriedWeightLbsFt3: 56,
    specificGravity: 0.91,
    jankaLbf: 2690,
    steamBending: 'Difficult because of density.',
    workability: 'Dense and hard on tools; machining requires care.',
    stability: 'Moderately stable once dried.',
    durability: 'Very durable.',
    appearance: 'Orange-brown to deep reddish brown.',
    tonalSummary:
      'Often treated as a dense, projecting, sustaining hardwood with strong authority and stiffness.',
    structuralNotes:
      'Best used deliberately when a build calls for density, confidence, and strong structural seriousness.',
    sourceMeta: [WD('jatoba', 'The Wood Database — Jatoba')],
    tags: ['dense', 'projecting', 'sustaining', 'authoritative'],
  }),

  woodItem({
    id: 'kapur',
    label: 'Kapur',
    botanicalName: 'Dryobalanops spp.',
    averageDriedWeightLbsFt3: 46,
    specificGravity: 0.69,
    jankaLbf: 1390,
    steamBending: 'Moderate; not usually considered an easy bending wood.',
    workability: 'Can be workable, though silica content may dull cutters.',
    stability: 'Moderate.',
    durability: 'Moderately durable to durable.',
    appearance: 'Reddish brown to purplish brown.',
    tonalSummary:
      'Often treated as a balanced-to-firm hardwood with solid projection, decent warmth, and good tonal backbone.',
    structuralNotes:
      'Useful when the build wants something less common than maple/oak but still structurally confident.',
    sourceMeta: [WD('kapur', 'The Wood Database — Kapur')],
    tags: ['balanced', 'firm', 'projecting', 'less-common'],
  }),

  woodItem({
    id: 'leopardwood',
    label: 'Leopardwood',
    botanicalName: 'Roupala montana',
    averageDriedWeightLbsFt3: 46,
    specificGravity: 0.75,
    jankaLbf: 2150,
    steamBending: 'Moderate to difficult depending on stock.',
    workability: 'Can machine well, though tearout may occur with figured grain.',
    stability: 'Moderate.',
    durability: 'Moderately durable.',
    appearance: 'Distinct flecked “lace” pattern with strong visual identity.',
    tonalSummary:
      'Often treated as a present, articulate hardwood with notable visual drama and balanced tonal strength.',
    structuralNotes:
      'A compelling specialty wood when the shell should look visually unmistakable without losing tonal seriousness.',
    sourceMeta: [WD('leopardwood', 'The Wood Database — Leopardwood')],
    tags: ['articulate', 'visual-statement', 'specialty', 'balanced-strength'],
  }),

  woodItem({
    id: 'mango',
    label: 'Mango',
    botanicalName: 'Mangifera indica',
    averageDriedWeightLbsFt3: 36,
    specificGravity: 0.56,
    jankaLbf: 1070,
    steamBending: 'Moderate; not commonly referenced as a premier bending wood.',
    workability: 'Generally workable with some variability in grain.',
    stability: 'Moderate.',
    durability: 'Moderately durable.',
    appearance: 'Often highly figured with dramatic color variation.',
    tonalSummary:
      'Often treated as warm-leaning and resonant with a pleasing balance of body and softness.',
    structuralNotes:
      'Useful when the build wants visual uniqueness and a slightly warmer, more open tonal posture.',
    sourceMeta: [WD('mango', 'The Wood Database — Mango')],
    tags: ['warm', 'resonant', 'figured', 'open'],
  }),

  woodItem({
    id: 'poplar',
    label: 'Poplar',
    botanicalName: 'Liriodendron tulipifera / Populus spp. (varies by source)',
    aliases: ['Yellow Poplar', 'Tulip Poplar'],
    averageDriedWeightLbsFt3: 29,
    specificGravity: 0.42,
    jankaLbf: 540,
    steamBending: 'Moderate.',
    workability: 'Very easy to machine and work.',
    stability: 'Generally stable for interior use.',
    durability: 'Non-durable.',
    appearance: 'Creamy pale wood with green, gray, or brown streaking.',
    tonalSummary:
      'Often treated as softer, warmer, and less aggressive than denser shell woods.',
    structuralNotes:
      'Useful for lighter-weight concepts or blended recipes, but not usually the first choice for maximum authority or projection.',
    sourceMeta: [
      WD('yellow-poplar', 'The Wood Database — Yellow Poplar'),
      WD('black-poplar', 'The Wood Database — Black Poplar'),
    ],
    tags: ['soft', 'warm', 'lighter-weight', 'blend-friendly'],
  }),

  woodItem({
    id: 'bubinga',
    label: 'Bubinga',
    botanicalName: 'Guibourtia demeusei / tessmannii / pellegriniana',
    averageDriedWeightLbsFt3: 56,
    specificGravity: 0.89,
    jankaLbf: 2410,
    steamBending: 'Can be difficult due to density.',
    workability: 'Dense and can be more demanding on tools.',
    stability: 'Generally stable once dry.',
    durability: 'Moderately durable to durable depending on stock.',
    appearance: 'Reddish brown with dramatic figuring options.',
    sourcingNotes:
      'Check sourcing and trade restrictions carefully before using.',
    tonalSummary:
      'Typically treated as a dense, strong, lower-forward premium species with serious presence.',
    structuralNotes:
      'Great for dramatic premium builds, but should be used intentionally due to density and sourcing considerations.',
    sourceMeta: [WD('bubinga', 'The Wood Database — Bubinga')],
    tags: ['dense', 'premium', 'present', 'low-forward'],
  }),

  woodItem({
    id: 'purpleheart',
    label: 'Purpleheart',
    botanicalName: 'Peltogyne spp.',
    averageDriedWeightLbsFt3: 56,
    specificGravity: 0.86,
    jankaLbf: 2520,
    steamBending: 'Can be challenging because of density.',
    workability: 'Dense and sometimes difficult to machine cleanly.',
    stability: 'Generally stable once processed.',
    durability: 'Very durable.',
    appearance: 'Vivid purple heartwood that darkens over time.',
    tonalSummary:
      'Often treated as a strong, dense, articulate accent species rather than a casual default.',
    structuralNotes:
      'Excellent for targeted use where visual statement and stiffness matter.',
    sourceMeta: [WD('purpleheart', 'The Wood Database — Purpleheart')],
    tags: ['dense', 'accent-species', 'visual-statement', 'articulate'],
  }),

  woodItem({
    id: 'wenge',
    label: 'Wenge',
    botanicalName: 'Millettia laurentii',
    averageDriedWeightLbsFt3: 55,
    specificGravity: 0.88,
    jankaLbf: 1630,
    steamBending: 'Generally difficult / caution advised.',
    workability: 'Can be brittle and splinter-prone; dust can be irritating.',
    stability: 'Generally stable in service.',
    durability: 'Very durable.',
    appearance: 'Dark brown with dramatic nearly black striping.',
    sourcingNotes: 'Use with care around sourcing, dust safety, and processing.',
    tonalSummary:
      'Often considered a strong, complex, articulate premium species with rich low-mid authority.',
    structuralNotes:
      'Best used intentionally and carefully rather than casually, especially in mixed-species concepts.',
    sourceMeta: [WD('wenge', 'The Wood Database — Wenge')],
    tags: ['premium', 'complex', 'low-mid-rich', 'dark-visual'],
  }),

  woodItem({
    id: 'padauk',
    label: 'Padauk',
    botanicalName: 'Pterocarpus soyauxii',
    aliases: ['African Padauk'],
    averageDriedWeightLbsFt3: 47,
    specificGravity: 0.72,
    jankaLbf: 1725,
    steamBending: 'Moderate; depends on stock.',
    workability: 'Generally machines well but dust can be irritating.',
    stability: 'Moderately stable.',
    durability: 'Very durable.',
    appearance: 'Bright orange-red to reddish brown.',
    tonalSummary:
      'Commonly approached as a strong, warm-but-present species with visual boldness.',
    structuralNotes:
      'Useful when a build needs both visual drama and structural confidence.',
    sourceMeta: [WD('african-padauk', 'The Wood Database — African Padauk')],
    tags: ['bold', 'warm', 'present', 'visual-statement'],
  }),

  woodItem({
    id: 'sapele',
    label: 'Sapele',
    botanicalName: 'Entandrophragma cylindricum',
    averageDriedWeightLbsFt3: 42,
    specificGravity: 0.64,
    jankaLbf: 1510,
    steamBending: 'Moderate to good.',
    workability: 'Generally workable, interlocked grain can tear out.',
    stability: 'Moderately stable.',
    durability: 'Moderately durable.',
    appearance: 'Medium to dark reddish brown with ribbon figure possibilities.',
    tonalSummary:
      'Often treated as a balanced warm species with a little more clarity than typical mahogany assumptions.',
    structuralNotes:
      'Good candidate where warmth is desired without losing definition.',
    sourceMeta: [WD('sapele', 'The Wood Database — Sapele')],
    tags: ['balanced', 'warm', 'clearer-than-mahogany', 'ribbon-figure'],
  }),
];

export function getWoodById(id) {
  return WOODS_CATALOG.find((item) => item.id === id) || null;
}

export function getWoodByLabel(label) {
  const target = String(label || '').trim().toLowerCase();
  if (!target) return null;

  return (
    WOODS_CATALOG.find((item) => {
      const labelMatch = item.label.toLowerCase() === target;
      const aliasMatch = Array.isArray(item.aliases)
        ? item.aliases.some((alias) => String(alias).trim().toLowerCase() === target)
        : false;

      return labelMatch || aliasMatch;
    }) || null
  );
}

export function getWoodFact(wood, key, fallback = null) {
  return wood?.facts?.[key]?.value ?? fallback;
}

export function getWoodPhysicalProperty(wood, key, fallback = null) {
  return wood?.physicalProperties?.[key]?.value ?? fallback;
}

export default WOODS_CATALOG;