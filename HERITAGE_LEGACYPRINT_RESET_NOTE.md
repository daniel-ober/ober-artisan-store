
# Heritage LegacyPrint Reset Note

## Current mission

Stabilize and validate the Heritage LegacyPrint system:

- VoiceMapping

- Voice Threading

- LegacyTuning

- LegacyPrint Read

## Current known-good state

- Codex UI changes were reverted.

- Heritage thread visuals are back on screen.

- Terminal tests confirm the Voice Thread engine changes correctly:

  - 12" x 5.0" / 8 lugs / 16 - 10mm / Triple Flange / Chrome / Medium Torch

    -> Compact, quick, lean response

  - 14" x 6.5" / 10 lugs / 20 - 12mm / Die-Cast / Chrome / Blackened

    -> Shorter note with firm response

- Build passes with existing app-wide warnings.

## Important decision

Do not use Codex for this section right now.

Work from terminal and direct file edits only.

## Next pickup point

Create a proper terminal audit workflow for Heritage so we can validate:

1. VoiceMapping axis movement

2. Voice Thread top/current relationships

3. LegacyTuning range movement

4. LegacyPrint readout copy

5. Golden-case expected outputs

Desired command:

npm run heritage:voice:audit

## Files likely involved

- src/components/HeritageProductDetail.js

- src/utils/legacyPrint/buildHeritageVoiceRead.js

- src/utils/legacyPrint/buildVoiceThreadReadout.js

- src/utils/legacyPrint/heritageKeyRelationships.js

- scripts/test-heritage-voice-read.mjs

- package.json

