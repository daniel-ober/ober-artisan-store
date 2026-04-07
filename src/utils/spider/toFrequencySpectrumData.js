// src/utils/spider/toFrequencySpectrumData.js

/**
 * Converts the new spider result into a simple 5-band frequency spectrum
 * for your existing FrequencySpectrum component.
 *
 * Output bands:
 * - low
 * - lowMid
 * - mid
 * - midHigh
 * - high
 *
 * Scale:
 * 0..1
 *
 * IMPORTANT:
 * This is a visual Ober tonal estimate, not FFT / measured acoustic data.
 */

const clamp01 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};

const scoreTo01 = (value) => clamp01((Number(value) - 1) / 9);

const round3 = (n) => Math.round(n * 1000) / 1000;

export function toFrequencySpectrumData(spiderResult) {
  const profile = spiderResult?.profile || {};

  const warmth = scoreTo01(profile.warmth ?? 5);
  const sustain = scoreTo01(profile.sustain ?? 5);
  const attack = scoreTo01(profile.attack ?? 5);
  const projection = scoreTo01(profile.projection ?? 5);
  const brightness = scoreTo01(profile.brightness ?? 5);
  const sensitivity = scoreTo01(profile.sensitivity ?? 5);
  const control = scoreTo01(profile.control ?? 5);

  /**
   * Heuristic mapping:
   *
   * low:
   * - boosted by warmth + sustain
   * - slightly reduced by brightness/control extremes
   *
   * lowMid:
   * - strongest link to warmth/body
   * - also helped by sustain and projection
   *
   * mid:
   * - shaped by projection + attack + control balance
   *
   * midHigh:
   * - driven by attack + projection + brightness
   * - slightly reduced by very high warmth
   *
   * high:
   * - mostly brightness + attack
   * - slightly reduced by warmth and excessive sustain
   */

  const low = clamp01(
    warmth * 0.46 +
    sustain * 0.28 +
    sensitivity * 0.08 +
    (1 - brightness) * 0.10 +
    (1 - control) * 0.08
  );

  const lowMid = clamp01(
    warmth * 0.42 +
    sustain * 0.22 +
    projection * 0.16 +
    sensitivity * 0.08 +
    (1 - brightness) * 0.12
  );

  const mid = clamp01(
    projection * 0.28 +
    attack * 0.22 +
    control * 0.18 +
    sustain * 0.12 +
    warmth * 0.10 +
    brightness * 0.10
  );

  const midHigh = clamp01(
    attack * 0.28 +
    projection * 0.22 +
    brightness * 0.26 +
    control * 0.12 +
    (1 - warmth) * 0.12
  );

  const high = clamp01(
    brightness * 0.46 +
    attack * 0.24 +
    projection * 0.12 +
    (1 - warmth) * 0.10 +
    (1 - sustain) * 0.08
  );

  return {
    low: round3(low),
    lowMid: round3(lowMid),
    mid: round3(mid),
    midHigh: round3(midHigh),
    high: round3(high),
    meta: {
      note: 'Estimated tonal band balance derived from Ober spider profile.',
      source: 'ober_spider_heuristic_v1',
    },
  };
}

export function toFrequencySpectrumArray(spiderResult) {
  const bands = toFrequencySpectrumData(spiderResult);

  return [
    bands.low,
    bands.lowMid,
    bands.mid,
    bands.midHigh,
    bands.high,
  ];
}

export default toFrequencySpectrumData;