# OBER LEGACYPRINT™ Phase 3S-2 Refined Read-Only Audit

Generated: 2026-05-20T01:48:17.138Z

Collection: `snareReferenceDrums`

## Summary

| Category | Count |

|---|---:|

| Records scanned | 1551 |

| Numeric validity issues | 63 |

| Duplicate groups | 3 |

| Confidence label issues | 0 |

| Missing high-value fields | 4299 |

| Future score recalculation queue | 1306 |

## Refined Flat-vs-Nested Categories

| Category | Count |

|---|---:|

| Mirror match | 835 |

| Normalization equivalent | 0 |

| Missing mirror | 10505 |

| True mismatch | 2744 |

| Nested missing / flat available | 10187 |

| Flat missing / nested available | 5198 |

## Numeric Validity Reclassification

| Category | Count |

|---|---:|

| Parser corruption | 63 |

| Ingest bug | 0 |

| Manual review | 0 |

## Duplicate Group Reclassification

| Category | Count |

|---|---:|

| True duplicate | 1 |

| Intentional variant | 0 |

| Uncertain/manual review | 2 |

## True Cleanup Candidate Counts

| Candidate Type | Count |

|---|---:|

| Numeric parser corruption | 63 |

| Numeric ingest bug | 0 |

| Flat/nested true mismatch | 2744 |

| Nested missing / flat available | 10187 |

| True duplicate groups | 1 |

## Recommendation

Cleanup patches should only begin after the true mismatch, parser corruption, ingest bug, and true duplicate records are manually reviewed from the JSON detail report. Mirror matches, normalization equivalents, and flat-missing/nested-available cases should not be treated as cleanup blockers.

## Notes

- Nested canonical fields are favored over flat legacy mirrors.

- Flat fields are treated as display/search/legacy mirrors unless nested canonical values are missing.

- No Firestore writes were performed.

- No rescoring was performed.

- Future score recalculation queue was preserved only as a later review queue.

