// src/generateStoryFree.js
// Generates a short-form HISTORY FACTS storyboard with ZERO API calls,
// ZERO cost, fully unattended-safe. Picks from a set of hand-written,
// fact-checked short stories — quality controlled by being hand-written,
// not randomly assembled — only which story (and photo variety) is
// randomized.
//
// IMPORTANT HONESTY NOTE: the photos used (via fetchStockPhotos.js, from
// Pexels) are real photography but are NOT archival/historical photos of
// the actual events — Pexels is a contemporary stock photo library, not a
// history archive. stockQuery values below are chosen to be thematically
// and visually appropriate (period-relevant architecture, objects, scenes)
// rather than literal depictions of the specific historical moment. This
// is an honest limitation worth knowing, not something hidden from you.

import fs from 'fs';
import path from 'path';

// Each story: a hook-first structure (short-form pacing — grab attention
// immediately, escalate, punchy payoff), fact-checked content, and a
// stockQuery per scene for thematically appropriate real photography.
const STORIES = [
  {
    topic: 'great-fire-of-london',
    title: 'The Fire That Rebuilt London | History Facts',
    scenes: [
      { narration: 'In 1666, one bakery fire nearly destroyed an entire city.', stockQuery: 'old bakery bread oven fire' },
      { narration: "It started in Thomas Farriner's bakery on Pudding Lane, London.", stockQuery: 'narrow old european street' },
      { narration: 'London\'s houses were packed together, built from wood and tar.', stockQuery: 'old wooden houses narrow street' },
      { narration: 'The fire spread for four days, destroying over 13,000 homes.', stockQuery: 'fire flames burning night' },
      { narration: 'Only six people were officially recorded as having died.', stockQuery: 'london historic architecture' },
      { narration: 'London was rebuilt with brick and stone — safer, and still standing.', stockQuery: 'london city skyline historic buildings' },
    ],
  },
  {
    topic: 'library-of-alexandria',
    title: 'The Library That Held the Ancient World | History Facts',
    scenes: [
      { narration: 'Ancient Egypt once held the largest library the world had seen.', stockQuery: 'ancient library scrolls books' },
      { narration: 'The Library of Alexandria may have held 400,000 scrolls.', stockQuery: 'ancient scrolls manuscripts' },
      { narration: 'Ships docking in Alexandria had their books copied by law.', stockQuery: 'ancient harbor ships mediterranean' },
      { narration: 'Scholars there mapped the stars and measured the Earth\'s size.', stockQuery: 'ancient astronomy stars night sky' },
      { narration: 'No one knows exactly how or when it was finally lost.', stockQuery: 'ancient ruins columns egypt' },
      { narration: 'Its idea still shapes every library built since.', stockQuery: 'modern library books shelves' },
    ],
  },
  {
    topic: 'great-wall-workers',
    title: "The Wall Built By a Million Hands | History Facts", 
    scenes: [
      { narration: 'One wall in China stretches over 13,000 miles long.', stockQuery: 'great wall china mountains' },
      { narration: 'It was built and rebuilt across more than 2,000 years.', stockQuery: 'ancient stone wall mountains' },
      { narration: 'Soldiers, prisoners, and peasants all worked on its construction.', stockQuery: 'stone masonry construction historic' },
      { narration: 'Some workers who died were said to be buried within it.', stockQuery: 'misty mountains china landscape' },
      { narration: 'From space, it\'s not actually visible to the naked eye — a popular myth.', stockQuery: 'earth from space stars' },
      { narration: 'Today it\'s one of the most visited landmarks on Earth.', stockQuery: 'great wall china tourists' },
    ],
  },
  {
    topic: 'titanic-lifeboats',
    title: 'Why the Titanic Didn\'t Have Enough Lifeboats | History Facts',
    scenes: [
      { narration: 'The Titanic carried lifeboats for less than half its passengers.', stockQuery: 'old ship lifeboat vintage' },
      { narration: 'Regulations at the time were based on outdated ship sizes.', stockQuery: 'old maritime law documents' },
      { narration: 'The rules hadn\'t kept up with how large ships had become.', stockQuery: 'large ocean liner ship' },
      { narration: 'On April 15th, 1912, the ship struck an iceberg and sank.', stockQuery: 'iceberg ocean cold' },
      { narration: 'More than 1,500 people lost their lives that night.', stockQuery: 'dark ocean night waves' },
      { narration: 'After the disaster, lifeboat laws changed for every ship at sea.', stockQuery: 'modern cruise ship ocean' },
    ],
  },
  {
    topic: 'pompeii-preserved',
    title: 'The City Frozen in a Single Day | History Facts',
    scenes: [
      { narration: 'In 79 AD, an entire Roman city was buried in minutes.', stockQuery: 'volcano eruption ash' },
      { narration: 'Mount Vesuvius erupted, burying the city of Pompeii in ash.', stockQuery: 'volcano mountain landscape' },
      { narration: 'The ash preserved buildings, art, and everyday objects perfectly.', stockQuery: 'ancient roman ruins columns' },
      { narration: 'Bread was found still sitting in an oven, untouched for centuries.', stockQuery: 'old stone oven bakery' },
      { narration: 'The site wasn\'t rediscovered again for over 1,500 years.', stockQuery: 'archaeological excavation ruins' },
      { narration: 'Today it gives us the clearest window we have into Roman daily life.', stockQuery: 'ancient roman architecture ruins' },
    ],
  },
  {
    topic: 'printing-press',
    title: 'The Machine That Changed What People Knew | History Facts',
    scenes: [
      { narration: 'Before the 1400s, every single book had to be copied by hand.', stockQuery: 'old handwritten manuscript book' },
      { narration: 'That meant books were rare, slow to make, and very expensive.', stockQuery: 'antique books library old' },
      { narration: 'Johannes Gutenberg built a press using reusable metal letters.', stockQuery: 'old printing press machine' },
      { narration: 'One press could now produce hundreds of copies of a single page.', stockQuery: 'old printed pages paper' },
      { narration: 'Within 50 years, millions of books existed across Europe.', stockQuery: 'old library shelves books' },
      { narration: 'It\'s still considered one of the most important inventions in history.', stockQuery: 'open book reading' },
    ],
  },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const OUTRO_LINES = [
  'History is full of stories like this one. Follow for more.',
  'That\'s one story history almost forgot. Follow for more.',
  'True stories, every time. Follow for the next one.',
];
const OUTRO_QUERIES = ['old library books shelves', 'vintage globe map', 'antique books candle'];

function buildStoryboard() {
  const story = pick(STORIES);

  const scenes = story.scenes.map((s, i) => ({
    id: `scene${i + 1}`,
    narration: s.narration,
    duration_seconds: 6.5,
    stockQuery: s.stockQuery,
  }));

  // Outro/CTA scene — genuinely helps with "will people watch/return":
  // a clear, low-friction ask at the end is one of the few reliably
  // effective growth levers, and it also extends runtime a bit for
  // breathing room without diluting the fact content itself.
  scenes.push({
    id: 'outro',
    narration: pick(OUTRO_LINES),
    duration_seconds: 4,
    stockQuery: pick(OUTRO_QUERIES),
  });

  return {
    title: story.title,
    theme: story.topic,
    hook: story.scenes[0].narration,
    scenes,
  };
}

function generateStoryFree() {
  const storyboard = buildStoryboard();
  const outDir = path.resolve('output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'storyboard.json'), JSON.stringify(storyboard, null, 2));
  console.log(`✅ [$0 mode] Storyboard generated: "${storyboard.title}"`);
  console.log(`   Saved to output/storyboard.json (no API call made)`);
  return storyboard;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateStoryFree();
}

export default generateStoryFree;
