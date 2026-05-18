export function normalizeSlug(value = '') {

  return String(value)

    .trim()

    .toLowerCase()

    .replace(/['"]/g, '')

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/^-+|-+$/g, '');

}