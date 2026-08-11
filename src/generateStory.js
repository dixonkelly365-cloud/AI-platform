// src/generateStory.js
// FREE, no-credit-card-ever story generator for the main history-facts
// channel — uses Google's Gemini API (genuinely free tier: no card
// required, doesn't expire, ~1,500 requests/day — far more than the 1/day
// this needs). Get a key in 2 minutes at https://aistudio.google.com/apikey
// (just sign in with a Google account, no billing setup at all).
//
// Generates short, surprising, hook-first REAL HISTORY FACTS — genuinely
// true historical events told with a dramatic, curiosity-driven angle
// (e.g. "Why the Titanic Didn't Have Enough Lifeboats," "The Fire That
// Rebuilt London," "The Cosmic Message in a Bottle"). Single narrator
// voice throughout — this channel does NOT use the multi-character
// dialogue system built for the separate Ghana Stories project.
//
// Auto-picks a genuinely new topic every run, tracking everything already
// covered in output-state/history-topics.json (committed back to the repo
// by the GitHub Actions workflow after each run) so it never repeats.
//
// HONEST NOTE: Google's free tier terms allow them to use free-tier
// prompts/outputs to improve their models (this doesn't apply to their
// paid tier) — worth knowing, unlike a paid API where that wouldn't happen.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
// Configurable so a future Google model rename/retirement (which happens
// periodically) is a one-line .env change, not a code fix.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const TOPICS_PATH = path.resolve('output-state/history-topics.json');

const SYSTEM_PROMPT = `You write short-form videos about REAL, TRUE history facts — genuinely
surprising, little-known, or dramatically-framed true historical events, inventions, disasters,
discoveries, or figures. Every fact must be real and historically accurate — no fabrication, no
fictional stories. Pick a genuinely interesting angle: a surprising cause, an overlooked detail,
an ironic twist, or a "wait, really?" fact most people don't know.

Output ONLY valid JSON (no markdown fences, no commentary) matching this schema:

{
  "topic_slug": string,
  "title": string,           // e.g. "Why the Titanic Didn't Have Enough Lifeboats | History Facts"
  "theme": string,
  "hook": string,              // opening line — see hook rules below, this is the single most
                                 // important line in the whole video
  "scenes": [
    {
      "id": string,
      "speaker": "narrator",   // single narrator throughout — no character dialogue
      "narration": string,     // the spoken line — factual, engaging, conversational tone
      "duration_seconds": number,
      "stockQuery": string     // 2-4 word search term — must be CONCRETE and SPECIFIC to
                                // exactly what this line describes (a specific object, place,
                                // or visual moment), not a generic category. "sinking ship
                                // lifeboats" beats "titanic disaster"; "gold coins pile" beats
                                // "wealth money". Picture the exact frame a viewer should see
                                // for this specific line, then search for that.
                                // fitting this specific line
    }
  ]
}

Rules:
- Pick a genuinely fresh topic NOT in the already-covered list you're given.
- **Hook rules — this is the highest-leverage part of the whole video.** A real proven
  example from this exact channel that performed far above every other video: "The sky that
  exploded" — 5 words, a genuine unanswered mystery, concrete/visceral nouns, zero explanation.
  Match that pattern exactly:
  - Aim for 4-8 words. Shorter is almost always stronger than longer.
  - It must be a genuine, unresolved mystery or tension — the viewer should NOT be able to
    guess the answer from the hook alone. If the hook basically explains the fact already,
    it's too weak — rewrite it.
  - Use concrete, visceral, simple nouns and verbs (a real thing that happened), not abstract
    framing. "The sky that exploded" beats "A strange atmospheric event" every time.
  - NEVER open with "Did you know," "Here's why," "This is the story of," or any other
    throat-clearing frame — start directly on the mystery itself.
  - Test it against this bar: would a stranger scrolling past stop specifically because they
    NEED to know what happens next? If not, it's not strong enough yet — try again before
    settling on it.
- 6-9 scenes, 35-55 seconds total (duration_seconds 5-7 each). Hook-first: scene 1 opens
  with the hook exactly as written above — no throat-clearing intros.
- Build genuine narrative momentum: setup the situation, reveal the surprising detail/twist,
  land on why it matters or what it means — not just a flat list of facts.
- **Loop-back ending**: the final line should echo or rhyme with the hook in some way — a
  callback, a rephrased version of the opening question now answered, or a closing image that
  connects back to the opening one. This makes the video feel like it could seamlessly
  restart, which encourages replays — a real, distinct positive signal separate from raw
  watch time.
- Every claim must be genuinely true and historically accurate. If uncertain about a specific
  detail, keep the language general rather than inventing a precise fact you're not sure of.
- Conversational, engaging tone — written to be spoken aloud, not read as an essay.
- Output nothing but the JSON object.`;

function loadUsedTopics() {
  try {
    return JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsedTopics(topics) {
  fs.mkdirSync(path.dirname(TOPICS_PATH), { recursive: true });
  fs.writeFileSync(TOPICS_PATH, JSON.stringify(topics, null, 2));
}

async function callGemini(userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2000 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Unexpected Gemini response shape: ${JSON.stringify(data).slice(0, 300)}`);
  return text;
}

async function generateStory() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com/apikey and add to .env.');
  }

  const usedTopics = loadUsedTopics();
  const userMessage = usedTopics.length
    ? `Already-covered topics, pick something genuinely different: ${usedTopics.join(', ')}`
    : 'Pick any genuinely surprising, true history fact.';

  const rawText = await callGemini(userMessage);
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  let storyboard;
  try {
    storyboard = JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse storyboard JSON. Raw response:\n', rawText);
    throw err;
  }

  usedTopics.push(storyboard.topic_slug || storyboard.theme || storyboard.title);
  saveUsedTopics(usedTopics);

  const outDir = path.resolve('output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'storyboard.json'), JSON.stringify(storyboard, null, 2));

  console.log(`✅ Storyboard generated: "${storyboard.title}" (${storyboard.scenes.length} scenes)`);
  console.log(`   Topics covered so far: ${usedTopics.length}`);
  console.log(`   Saved to output/storyboard.json`);
  return storyboard;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateStory().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

export default generateStory;
