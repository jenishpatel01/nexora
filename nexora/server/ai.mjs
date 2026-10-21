// Fresh questions from Groq (free tier). Every match asks for new content, so questions do not repeat.
// Needs GROQ_API_KEY. Without it (or when Groq fails) generateRounds() returns null and the game uses its built-in banks.
import { randomInt } from 'node:crypto'

const API_KEY = (process.env.GROQ_API_KEY || '').trim()
const BASE = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
const MODELS = [(process.env.GROQ_MODEL || '').trim() || 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']
export const aiEnabled = Boolean(API_KEY)

const pickRandom = (list, n) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]] }
  return a.slice(0, n)
}

/* ------------------------------ prompt material ------------------------------ */
const CODING_TOPICS = ['JavaScript quirks', 'Python behaviour', 'SQL queries', 'TypeScript types', 'Big-O complexity', 'recursion', 'array and string methods', 'Git', 'HTML and CSS', 'data structures', 'sorting and searching', 'async code and promises', 'Java or C# basics', 'bash and the command line', 'HTTP and APIs', 'off-by-one and loop bugs', 'scope and closures', 'regular expressions']
const KNOWLEDGE_TOPICS = {
  Science: ['space', 'human body', 'chemistry', 'physics', 'animals', 'earth and weather', 'inventions', 'plants'],
  History: ['ancient world', 'world wars', 'explorers', 'empires', 'revolutions', 'inventors', 'medieval times', 'modern history'],
  Sports: ['football', 'cricket', 'olympics', 'basketball', 'tennis', 'athletics records', 'world cups', 'motorsport'],
  General: ['geography', 'food', 'music', 'movies', 'languages', 'art', 'technology', 'famous landmarks'],
}
const DEBATE_TOPICS = ['technology', 'education', 'work', 'cities and transport', 'health', 'environment', 'media', 'money', 'sports', 'food', 'science policy', 'culture', 'law', 'travel']
const ROAST_THEMES = ['bad cooking', 'always being late', 'phone addiction', 'terrible taste in music', 'gym habits', 'procrastination', 'gaming skills', 'fashion', 'driving', 'bad jokes', 'messy room', 'social media', 'weather complaints', 'being a know-it-all', 'sleeping habits']
const BUSINESS_SECTORS = ['a coffee chain', 'a food delivery app', 'a streaming service', 'an electric scooter startup', 'a fitness brand', 'an online bookstore', 'a bakery', 'a game studio', 'a travel agency', 'a clothing label', 'a pet-supplies shop', 'a smart-home gadget company', 'a meal-kit company', 'a language-learning app']

const SYSTEM = 'You write content for a competitive trivia and skills game. Reply with one JSON object only, no markdown. Content must be accurate, original, clear and family friendly.'

const quizShape = '{"prompt": string, "options": [4 short strings], "answer": index 0-3 of the correct option, "why": one-sentence explanation'

function promptFor(arena, avoid) {
  const avoidText = avoid.length ? `\nDo not repeat or closely resemble these recent questions:\n${avoid.map((a) => `- ${a}`).join('\n')}` : ''
  const tail = `${avoidText}\nVariety token: ${randomInt(1e9)}. Make every item different from the others.`
  switch (arena) {
    case 'coding': {
      const topics = pickRandom(CODING_TOPICS, 5).join('; ')
      return `Write 5 multiple-choice programming questions, one per topic in this list (reuse a topic if needed): ${topics}.
Mix: what does this code print, which line has the bug, and time complexity. Keep code under 8 short lines.
Return {"items":[{"prompt": string, "code": optional string with the snippet, "options": [4 short strings], "answer": 0-3, "why": one sentence}]}. Exactly one option is correct.${tail}`
    }
    case 'knowledge': {
      const cats = Object.keys(KNOWLEDGE_TOPICS)
      const lines = cats.map((c) => `${c}: ${pickRandom(KNOWLEDGE_TOPICS[c], 2).join(', ')}`).join('\n')
      return `Write 5 general-knowledge multiple-choice questions: one each for Science, History, Sports and General, plus one extra for any of them. Lean on these areas:\n${lines}
Medium difficulty, one clearly correct answer, no trick wording.
Return {"items":[{"category": "Science"|"History"|"Sports"|"General", "prompt": string, "options": [4 short strings], "answer": 0-3, "why": one sentence}]}.${tail}`
    }
    case 'mind':
      return `Write 4 brain-teaser multiple-choice questions: 2 of type "pattern" (number or letter sequence: what comes next?) and 2 of type "logic" (short deduction puzzle). Short and solvable in 15 seconds.
Return {"items":[{"type": "pattern"|"logic", "prompt": string, "options": [4 short strings], "answer": 0-3, "why": one sentence showing the rule}]}. Exactly one option is correct.${tail}`
    case 'debate': {
      const topics = pickRandom(DEBATE_TOPICS, 5).join('; ')
      return `Write 5 debate rounds, one per topic area (reuse if needed): ${topics}.
Each round: a motion, the opponent's one-sentence argument against the player, and 4 possible replies the player can pick. Replies range from a strong, specific, evidence-based rebuttal to a weak one (personal attack, slogan, overclaim, vague).
Return {"items":[{"motion": string, "quote": opponent's argument, "options":[{"text": reply under 40 words, "value": integer 0-10 quality, "tag": 1-2 word label like Evidence or Overclaim, "note": short judge comment}]}]}.
Use values near 9, 6, 3 and 1 across the 4 options of each round, in random order.${tail}`
    }
    case 'roast': {
      const themes = pickRandom(ROAST_THEMES, 5).join('; ')
      return `Write 5 friendly roast-battle rounds, one per theme (reuse if needed): ${themes}.
Each round: the opponent's playful roast line aimed at the player, and 4 comeback options. Light-hearted only: no insults about appearance, race, religion, gender, disability or family; no profanity.
Return {"items":[{"quote": opponent's roast, "options":[{"text": comeback under 25 words, "value": integer 0-10 how well it lands, "tag": 1-2 word label like "Mic drop", "note": short crowd reaction}]}]}.
Use values near 9, 6, 3 and 1 across the 4 comebacks, in random order. The best one turns the roast around cleverly.${tail}`
    }
    case 'business': {
      const sectors = pickRandom(BUSINESS_SECTORS, 5).join('; ')
      return `Write 5 business-strategy decisions for a growing company, in this order of stages: Launch, Growth, Crisis, Takeover, Exit. Set each in a different business: ${sectors}.
Each: a situation (one or two sentences) and 4 possible calls (short, under 14 words), each with market-share change "share" (number from -3 to 3), brand trust change "trust" (integer -3 to 3) and a one-sentence "note" on why. Make one clearly strongest, one decent, and two flawed or risky.
Return {"items":[{"context": situation, "options":[{"text": string, "share": number, "trust": integer, "note": string}]}]}. Options in random order.${tail}`
    }
    default: return null
  }
}

/* -------------------------------- validation -------------------------------- */
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, (c) => (c === '\n' ? '\n' : ' ')).trim().slice(0, max) : '')
const textOf = (v, max) => str(v, max).replace(/\s+/g, ' ')
const clampN = (n, a, b) => Math.max(a, Math.min(b, n))

function quiz(raw, { time, category }) {
  if (!raw || typeof raw !== 'object') return null
  const options = Array.isArray(raw.options) ? raw.options.map((o) => textOf(typeof o === 'number' ? String(o) : o, 90)) : []
  const answer = Number(raw.answer)
  const prompt = textOf(raw.prompt, 220)
  if (options.length !== 4 || options.some((o) => !o) || new Set(options.map((o) => o.toLowerCase())).size !== 4) return null
  if (!Number.isInteger(answer) || answer < 0 || answer > 3 || prompt.length < 8) return null
  const out = { kind: 'quiz', prompt, options, answer, why: textOf(raw.why, 220) || 'That is the correct answer.', time }
  const code = str(raw.code, 400)
  if (code) out.code = code
  if (category) out.category = category
  return out
}

function pickOptions(raw, mapOpt) {
  const list = Array.isArray(raw) ? raw.map(mapOpt).filter(Boolean) : []
  if (list.length !== 4) return null
  return list.map((o, i) => ({ ...o, id: String.fromCharCode(97 + i) }))
}

function pick(raw, { time, prompt, stage, context, quote }) {
  if (!raw || typeof raw !== 'object') return null
  let options
  if (stage) {
    // business: value and tag come from share and trust, the same formula the built-in bank uses
    options = pickOptions(raw.options, (o) => {
      const text = textOf(o?.text, 120)
      const share = Math.round(clampN(Number(o?.share), -3, 3) * 10) / 10
      const trust = Math.round(clampN(Number(o?.trust), -3, 3))
      if (!text || !Number.isFinite(share) || !Number.isFinite(trust)) return null
      return { text, share, trust, note: textOf(o?.note, 160) || 'A fair call.', value: clampN(Math.round(5 + share * 1.4 + trust), 0, 10), tag: share >= 0 ? `+${share.toFixed(1)}% share` : `${share.toFixed(1)}% share` }
    })
  } else {
    options = pickOptions(raw.options, (o) => {
      const text = textOf(o?.text, 260)
      const value = Math.round(Number(o?.value))
      if (!text || !Number.isFinite(value)) return null
      return { text, value: clampN(value, 0, 10), tag: textOf(o?.tag, 24) || undefined, note: textOf(o?.note, 160) || undefined }
    })
  }
  if (!options) return null
  if (new Set(options.map((o) => o.text.toLowerCase())).size !== 4) return null
  // a round where every option scores the same is not a real choice
  if (new Set(options.map((o) => o.value)).size < 3) return null
  const out = { kind: 'pick', context: context(raw), prompt, options, time }
  if (!out.context) return null
  if (quote) {
    // debate and roast rounds need the opponent's line
    const q = quote(raw)
    if (!q) return null
    out.quote = q
  }
  if (stage) out.stage = stage
  return out
}

const BUSINESS_STAGES = ['Launch', 'Growth', 'Crisis', 'Takeover', 'Exit']

const normalizers = {
  coding: (items) => items.map((r) => quiz(r, { time: 20 })),
  knowledge: (items) => items.map((r) => quiz(r, { time: 12, category: ['Science', 'History', 'Sports', 'General'].includes(r?.category) ? r.category : 'General' })),
  mind: (items) => items.map((r) => quiz(r, { time: 15, category: r?.type === 'pattern' ? 'pattern' : 'logic' })),
  debate: (items) => items.map((r) => pick(r, { time: 25, prompt: 'Pick your reply', context: (x) => textOf(x.motion, 140), quote: (x) => textOf(x.quote, 200) })),
  roast: (items) => items.map((r) => pick(r, { time: 20, prompt: 'Fire back', context: () => 'Friendly roast battle', quote: (x) => textOf(x.quote, 200) })),
  business: (items) => items.map((r, i) => pick(r, { time: 25, prompt: 'Make the call', stage: BUSINESS_STAGES[i] ?? 'Growth', context: (x) => textOf(x.context, 260) })),
}

async function callGroq(model, prompt, timeoutMs) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model, temperature: 1, max_tokens: 6000, response_format: { type: 'json_object' },
      // gpt-oss models think before answering; keep that short so questions arrive fast
      ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300)
    throw new Error(`Groq ${model} returned ${res.status} ${detail}`)
  }
  const body = await res.json()
  const parsed = JSON.parse(body?.choices?.[0]?.message?.content ?? '{}')
  return Array.isArray(parsed.items) ? parsed.items : []
}

/**
 * Fresh rounds for an arena, as the game's own round objects (quiz / pick).
 * `avoid` is a list of recently seen prompts to steer away from. Returns null when AI is unavailable or fails.
 */
export async function generateRounds(arena, avoid = []) {
  if (!aiEnabled || !normalizers[arena]) return null
  const recent = (Array.isArray(avoid) ? avoid : []).slice(0, 24).map((a) => textOf(a, 80)).filter(Boolean)
  const prompt = promptFor(arena, recent)
  for (const [i, model] of MODELS.entries()) {
    try {
      const raw = await callGroq(model, prompt, i === 0 ? 8000 : 4000)
      const items = normalizers[arena](raw.slice(0, 8)).filter(Boolean)
      if (items.length >= 3) return items
      console.warn(`AI (${model}) gave ${items.length} usable ${arena} items`)
    } catch (e) {
      console.warn(`AI request failed (${model}): ${e.message}`)
    }
  }
  return null
}
