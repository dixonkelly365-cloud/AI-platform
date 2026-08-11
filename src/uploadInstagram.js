// src/uploadInstagram.js
// Uploads output/final_video.mp4 to Instagram as a Reel, using the Graph API.
//
// Requirements (all one-time setup, see README):
// - An Instagram Business or Creator account, linked to a Facebook Page
// - A Meta Developer app with the instagram_content_publish permission
// - A long-lived access token and your Instagram Business Account ID
// - Your final video hosted at a PUBLIC url (Instagram fetches it directly —
//   it does not accept file uploads from your machine like YouTube does)

import 'dotenv/config';
import fs from 'fs';

const GRAPH_VERSION = 'v20.0';

async function uploadReel() {
  const { IG_ACCESS_TOKEN, IG_BUSINESS_ACCOUNT_ID, IG_PUBLIC_VIDEO_URL, VIDEO_TITLE } = process.env;

  if (!IG_ACCESS_TOKEN || !IG_BUSINESS_ACCOUNT_ID) {
    throw new Error('Set IG_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID in .env first (see README).');
  }
  if (!IG_PUBLIC_VIDEO_URL) {
    throw new Error(
      'Set IG_PUBLIC_VIDEO_URL in .env — Instagram fetches the video from a public URL, ' +
      'it does not accept a direct file upload. Host output/final_video.mp4 somewhere public first.'
    );
  }

  const storyboard = JSON.parse(fs.readFileSync('output/storyboard.json', 'utf-8'));
  const caption = `${VIDEO_TITLE || storyboard.title}\n\n${storyboard.scenes.map(s => s.narration).join(' ')}`;

  console.log('📤 Creating Instagram media container...');
  const createRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${IG_BUSINESS_ACCOUNT_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: IG_PUBLIC_VIDEO_URL,
        caption,
        access_token: IG_ACCESS_TOKEN,
      }),
    }
  ).then((r) => r.json());

  if (createRes.error) throw new Error(`Container creation failed: ${createRes.error.message}`);
  const containerId = createRes.id;
  console.log(`   Container created: ${containerId}`);

  console.log('⏳ Waiting for Instagram to process the video...');
  let status = 'IN_PROGRESS';
  while (status === 'IN_PROGRESS') {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${containerId}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`
    ).then((r) => r.json());
    status = statusRes.status_code;
    console.log(`   status: ${status}`);
    if (status === 'ERROR') throw new Error('Instagram failed to process the video.');
  }

  console.log('📮 Publishing...');
  const publishRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${IG_BUSINESS_ACCOUNT_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: IG_ACCESS_TOKEN }),
    }
  ).then((r) => r.json());

  if (publishRes.error) throw new Error(`Publish failed: ${publishRes.error.message}`);
  console.log(`✅ Published! Media ID: ${publishRes.id}`);
  return publishRes;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  uploadReel().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

export default uploadReel;
