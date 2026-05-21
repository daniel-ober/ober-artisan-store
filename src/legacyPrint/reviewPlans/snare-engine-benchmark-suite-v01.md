# LegacyPrint Snare Engine Benchmark Suite v0.1

Generated: 2026-05-21T10:44:19.295Z

## Summary

- Engine version: legacyprint-snare-engine-v0.1
- Promoted records scored: 366
- Firestore writes: 0
- Benchmarks: 10/11 passed
- Assertions: 205/206 passed
- Assertion pass rate: 99.51%

## Benchmark Results

| Result | Benchmark | Scope | Assertions | Purpose |
|---|---|---:|---:|---|
| PASS | ludwig-acrolite-aluminum-dry-control | 2 records | 10/10 | Ludwig Acrolite should read controlled, sensitive, and drier than brass |
| FAIL | ludwig-black-beauty-brass-body | 7 records | 34/35 | Ludwig Black Beauty should read attack/sustain/brightness without behaving like aluminum |
| PASS | ludwig-legacy-mahogany-warmth | 4 records | 16/16 | Ludwig Legacy Mahogany should be warmth/sustain dominant |
| PASS | ludwig-classic-maple-balanced-wood | 4 records | 20/20 | Ludwig Classic Maple should read balanced warm/sensitive wood, not metal-bright |
| PASS | ahead-bell-brass-strong-metal | 15 records | 75/75 | AHEAD bell brass should read strong attack/sustain/projection with lower sensitivity than maple |
| PASS | dw-true-cast-bronze-mass-control | 4 records | 20/20 | DW True-Cast Bell Bronze should read attack/projection/control, not soft/warm wood |
| PASS | gretsch-brooklyn-maple-warmth | 4 records | 20/20 | Gretsch Brooklyn maple should read warm/sustain/sensitive, not steel-bright |
| PASS | steel-brighter-than-maple | 74 vs 52 | 3/3 | Steel family average should be brighter than maple family average |
| PASS | aluminum-more-control-than-brass | 20 vs 88 | 3/3 | Aluminum family average should be more controlled/drier than brass |
| PASS | deep-wood-warmer-than-shallow-wood | 9 vs 20 | 2/2 | Deep 14x8 wood snares should average warmer/sustainier than shallow 14x5 wood snares |
| PASS | diecast-more-control-than-tripleflanged | 122 vs 157 | 2/2 | Die-cast hoop family should average more controlled than triple-flanged |

# Failure Details

## ludwig-black-beauty-brass-body

Ludwig Black Beauty should read attack/sustain/brightness without behaving like aluminum

### Ludwig Black Beauty 3.5x14 14x3.5

Profile: {"attack":7.14,"brightness":6.66,"projection":6.22,"sustain":6.55,"warmth":5.43,"sensitivity":5.98,"control":5.83}
Top nodes: attack, brightness, sustain

| Pass | Expected | Actual |
|---|---|---|
| no | sustain >= 6.6 | 6.55 |
