// src/utils/storyEngineSuggestionHelpers.js

const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, Number(value || 0)));

export function formatSuggestionConfidence(confidence = 0) {
  return `${Math.round(clamp(confidence) * 100)}%`;
}

export function getRecommendationNode(engineRecord, recommendationKey) {
  return engineRecord?.recommendations?.[recommendationKey] || null;
}

export function getFieldNodeByPath(obj, path) {
  if (!obj || !path) return null;

  return path.split('.').reduce((acc, key) => {
    if (acc == null) return null;
    return acc[key];
  }, obj);
}

export function getMappedFieldSuggestion({
  engineRecord,
  sectionKey,
  fieldKey,
  recommendationKey,
}) {
  if (!recommendationKey) {
    return {
      suggestedValue: '',
      confidence: 0,
      rationale: [],
      hasSuggestion: false,
    };
  }

  const recommendation = getRecommendationNode(engineRecord, recommendationKey);
  const primary = recommendation?.primary;

  if (!primary?.value) {
    return {
      suggestedValue: '',
      confidence: 0,
      rationale: [],
      hasSuggestion: false,
    };
  }

  return {
    suggestedValue: primary.value,
    confidence: primary.confidence || 0,
    rationale: primary.rationale || [],
    hasSuggestion: true,
  };
}

export function getBuildSpecSuggestion(engineRecord, recommendationKey) {
  const recommendation = getRecommendationNode(engineRecord, recommendationKey);
  const primary = recommendation?.primary;

  if (!primary?.value) {
    return {
      suggestedValue: '',
      confidence: 0,
      rationale: [],
      hasSuggestion: false,
    };
  }

  return {
    suggestedValue: primary.value,
    confidence: primary.confidence || 0,
    rationale: primary.rationale || [],
    hasSuggestion: true,
  };
}