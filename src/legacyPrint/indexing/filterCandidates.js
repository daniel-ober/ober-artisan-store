export function filterCandidatesByIndex(candidates = [], targetIndex = {}) {

  return candidates.filter((c) => {

    const idx = c.voiceIndex;

    if (!idx) return true; // fallback safe mode

    // FAST FILTER RULES

    if (targetIndex.warmthBand && idx.warmthBand !== targetIndex.warmthBand) {

      return false;

    }

    if (targetIndex.brightnessBand && idx.brightnessBand !== targetIndex.brightnessBand) {

      return false;

    }

    if (targetIndex.isDry && idx.isDry !== targetIndex.isDry) {

      return false;

    }

    if (targetIndex.isControlled && idx.isControlled !== targetIndex.isControlled) {

      return false;

    }

    return true;

  });

}