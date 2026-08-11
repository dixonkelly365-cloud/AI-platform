// src/uploadYoutube.js
// Uploads output/final_video.mp4 to YouTube using the refresh token
// obtained from `npm run auth`. Fully non-interactive after that point —
// this is the piece that lets the whole pipeline run unattended.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

async function upload() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const storyboard = JSON.parse(fs.readFileSync(path.resolve('output/storyboard.json'), 'utf-8'));
  const videoPath = path.resolve('output/final_video.mp4');

  if (!fs.existsSync(videoPath)) {
    throw new Error('output/final_video.mp4 not found — run the assemble step first.');
  }

  console.log(`📤 Uploading "${storyboard.title}" to YouTube...`);

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: process.env.VIDEO_TITLE || storyboard.title,
        description: `${storyboard.scenes.map(s => s.narration).join(' ')}\n\n#history #historyfacts #didyouknow`,
        tags: ['history facts', 'did you know', 'historical facts', 'interesting history'],
        categoryId: '27', // Education
      },
      status: {
        privacyStatus: process.env.PRIVACY_STATUS || 'private', // 'private' | 'unlisted' | 'public'
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  console.log(`✅ Uploaded! Video ID: ${res.data.id}`);
  console.log(`   https://youtu.be/${res.data.id}`);

  // REAL custom thumbnail, generated fresh for THIS video every time — the
  // old approach looked for a hand-made file matching the exact topic
  // name, which could never work since the topic is different every single
  // day. This was a genuine bug: custom thumbnails have effectively never
  // fired on this channel. Fixed by building a real one automatically:
  // the episode's own opening photo, with the hook line overlaid in bold,
  // high-contrast text — the standard, well-proven thumbnail technique.
  try {
    console.log('🖼  Generating custom thumbnail from this episode\'s own hook + photo...');
    const thumbPath = await generateThumbnail(storyboard);
    console.log(`🖼  Setting custom thumbnail (${thumbPath})...`);
    await youtube.thumbnails.set({
      videoId: res.data.id,
      media: { body: fs.createReadStream(thumbPath) },
    });
    console.log('   ✅ Thumbnail set.');
  } catch (err) {
    // Custom thumbnails require the YouTube account to be phone-verified —
    // if that hasn't been done, this fails gracefully rather than crashing
    // the whole upload (the video itself still uploads fine either way).
    console.log('   ⚠️  Could not set thumbnail (often requires phone-verifying your YouTube account):', err.message);
  }

  return res.data;
}

// Builds a real 1280x720 YouTube thumbnail from this specific episode:
// its own first scene's photo (already fetched for the video itself) as
// the background, with the hook line overlaid in bold white text with a
// dark outline — the standard high-CTR thumbnail pattern.
async function generateThumbnail(storyboard) {
  const { execSync } = await import('child_process');
  const firstScene = storyboard.scenes[0];
  const photoCandidates = [
    path.resolve('output/photos', `${firstScene.id}_a.jpg`),
    path.resolve('output/photos', `${firstScene.id}.jpg`),
  ];
  const bgPhoto = photoCandidates.find((p) => fs.existsSync(p));
  if (!bgPhoto) throw new Error('No source photo found to build a thumbnail from.');

  const hookText = (storyboard.hook || storyboard.title || '')
    .toUpperCase()
    .replace(/['"]/g, '')
    .slice(0, 60);

  // Wrap long hooks onto multiple lines so text doesn't run off the frame.
  const words = hookText.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > 22) {
      lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  // Position lines so the whole block is vertically centered in the lower
  // third, regardless of how many lines there are — the previous fixed
  // y-position ran text off the bottom of the frame with 2+ lines.
  const lineHeight = 100;
  const blockHeight = lines.length * lineHeight;
  const startY = 720 - 90 - blockHeight; // 90px margin from the bottom edge
  const drawtextFilters = lines.map((line, i) => {
    const escaped = line.replace(/:/g, '\\:').replace(/'/g, '');
    const yPos = startY + i * lineHeight;
    return `drawtext=text='${escaped}':fontsize=72:fontcolor=white:borderw=8:bordercolor=black:x=(w-text_w)/2:y=${yPos}:font=DejaVu-Sans-Bold`;
  }).join(',');

  const outPath = path.resolve('output/thumbnail.jpg');
  execSync(
    `ffmpeg -y -i "${bgPhoto}" -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,` +
    `eq=contrast=1.1:brightness=-0.02,${drawtextFilters}" -q:v 2 "${outPath}"`
  );
  return outPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  upload().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default upload;
