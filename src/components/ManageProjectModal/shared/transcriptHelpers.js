export const normalizePersonName = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractFirstName = (value = '') => {
  const normalized = normalizePersonName(value);
  return normalized.split(' ')[0] || '';
};

export const mapSpeakerLabelToRole = (label, artistName = '') => {
  const normalized = normalizePersonName(label);
  const artistFirst = extractFirstName(artistName);

  if (!normalized) return artistName || 'Artist';

  if (
    [
      'craftsman',
      'dan',
      'builder',
      'host',
      'maker',
      'ober',
      'ober artisan',
    ].includes(normalized)
  ) {
    return 'Ober Artisan';
  }

  if (['artist', 'customer', 'client', 'caller'].includes(normalized)) {
    return artistName || 'Artist';
  }

  if (artistFirst && normalized === artistFirst) {
    return artistName || 'Artist';
  }

  return artistName || 'Artist';
};

export const buildSmartTranscriptTurns = (rawText, artistName = '') => {
  const text = String(rawText || '').replace(/\r/g, '').trim();

  if (!text) return [];

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const explicitSpeakerLines = lines.filter((line) =>
    /^[A-Za-z][A-Za-z\s'-]{1,40}:\s+/.test(line)
  );

  if (explicitSpeakerLines.length >= 2) {
    return explicitSpeakerLines.map((line, idx) => {
      const match = line.match(
        /^([A-Za-z][A-Za-z\s'-]{1,40}):\s+([\s\S]+)$/
      );
      const rawSpeaker = match?.[1] || '';
      const content = match?.[2] || line;

      return {
        id: `turn-${idx}`,
        speaker: mapSpeakerLabelToRole(rawSpeaker, artistName),
        text: content.trim(),
      };
    });
  }

  return [
    {
      id: 'turn-0',
      speaker: 'Ober Artisan',
      text,
    },
  ];
};

export function splitTranscriptIntoChunks(text = '', maxChars = 3500) {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];

  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if ((current + '\n\n' + paragraph).length <= maxChars) {
      current += `\n\n${paragraph}`;
    } else {
      chunks.push(current);
      current = paragraph;
    }
  }

  if (current) chunks.push(current);

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];

    const pieces = [];
    let start = 0;

    while (start < chunk.length) {
      pieces.push(chunk.slice(start, start + maxChars));
      start += maxChars;
    }

    return pieces;
  });
}

export function mergeAdjacentTurns(turns = []) {
  const merged = [];

  turns.forEach((turn, idx) => {
    const speaker = String(turn?.speaker || '').trim();
    const text = String(turn?.text || '').trim();
    const uncertain = !!turn?.uncertain;

    if (!speaker || !text) return;

    const prev = merged[merged.length - 1];

    if (prev && prev.speaker === speaker) {
      prev.text = `${prev.text} ${text}`.trim();
      prev.uncertain = prev.uncertain || uncertain;
      return;
    }

    merged.push({
      id: `turn-${idx}`,
      speaker,
      text,
      uncertain,
    });
  });

  return merged.map((turn, idx) => ({
    ...turn,
    id: `turn-${idx}`,
  }));
}