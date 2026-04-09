const OpenAI = require('openai');

function clean(value = '') {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeBullets(text = '') {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[•*-]\s*/, '').trim())
    .filter(Boolean);
}

function normalizeParagraph(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function withTimeout(promise, ms, label = 'Request') {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateHybridChapterText({
  apiKey,
  model = 'gpt-5',
  payload,
  prompts,
  sectionKey,
}) {
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  if (!payload) {
    throw new Error('Missing payload');
  }

  const safeSectionKey = clean(sectionKey);

  if (!safeSectionKey) {
    throw new Error('Missing sectionKey');
  }

  const chapterOverviewPrompt = clean(prompts?.chapterOverview);
  const buildNotesPrompt = clean(prompts?.buildNotes);

  if (
    safeSectionKey === 'chapterOverview' &&
    !chapterOverviewPrompt
  ) {
    throw new Error('Missing chapterOverview prompt');
  }

  if (
    safeSectionKey === 'buildNotesStory' &&
    !buildNotesPrompt
  ) {
    throw new Error('Missing buildNotes prompt');
  }

  const client = new OpenAI({ apiKey });

  const systemPrompt = `
You are a high-end narrative writing engine for a custom drum build book.

Your writing must feel:
- deeply tailored
- emotionally intelligent
- musically literate
- craftsman-led
- elegant but grounded

Never sound corporate, generic, repetitive, or like templated AI copy.
Do not invent facts.
Only use details supported by the provided payload and prompt.
Return valid JSON only.
`.trim();

  let userPrompt = '';

  if (safeSectionKey === 'chapterOverview') {
    userPrompt = `
Generate only:
1. chapterOverview

INPUT PAYLOAD:
${JSON.stringify(payload, null, 2)}

OVERVIEW PROMPT:
${chapterOverviewPrompt}

Return JSON in exactly this shape:
{
  "chapterOverview": "string"
}
`.trim();
  } else if (safeSectionKey === 'buildNotesStory') {
    userPrompt = `
Generate only:
1. buildNotes

INPUT PAYLOAD:
${JSON.stringify(payload, null, 2)}

BUILD NOTES PROMPT:
${buildNotesPrompt}

Return JSON in exactly this shape:
{
  "buildNotes": ["bullet 1", "bullet 2", "bullet 3"]
}
`.trim();
  } else {
    throw new Error(`Unsupported sectionKey: ${safeSectionKey}`);
  }

  let response;

  try {
    response = await withTimeout(
      client.responses.create({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      25000,
      'OpenAI request'
    );
  } catch (err) {
    if (/timed out/i.test(err?.message || '')) {
      throw new Error('OpenAI request timed out');
    }
    throw err;
  }

  const rawText =
    response.output_text ||
    response.output
      ?.map((item) =>
        (item?.content || []).map((c) => c?.text || '').join(' ')
      )
      .join(' ') ||
    '';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Model returned non-JSON output: ${rawText}`);
  }

  if (safeSectionKey === 'chapterOverview') {
    return {
      chapterOverview: normalizeParagraph(parsed?.chapterOverview || ''),
      raw: rawText,
    };
  }

  return {
    buildNotes: Array.isArray(parsed?.buildNotes)
      ? parsed.buildNotes.map((item) => clean(item)).filter(Boolean)
      : normalizeBullets(parsed?.buildNotes || ''),
    raw: rawText,
  };
}

module.exports = {
  generateHybridChapterText,
};