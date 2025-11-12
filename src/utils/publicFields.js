// utils/publicFields.js
export const LEGACY_PRIVATE_TEXT = '<p>Legacy is set to Private.</p>';

export function resolvePublicFields(showroomDoc) {
  const pub = showroomDoc?.public || {};
  const allowName = pub.showName === true;
  const allowStory = pub.showStory === true;

  const name = allowName
    ? (pub.displayName?.trim() || showroomDoc?.name || '—')
    : 'Anonymous Legend';

  const storyHtml = allowStory
    ? (pub.storyHtml?.trim() || showroomDoc?.specs?.story || '')
    : LEGACY_PRIVATE_TEXT;

  return { name, storyHtml, allowName, allowStory };
}