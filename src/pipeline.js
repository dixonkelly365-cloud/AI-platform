// src/pipeline.js
// Runs the full pipeline end to end: story -> render (3D) -> narrate -> assemble -> upload.
// Usage: npm run pipeline
// Set PIPELINE_AUTO_UPLOAD=false in .env if you want to review the video
// before it goes to YouTube (recommended for your first few runs).

import 'dotenv/config';
import generateStoryFree from './generateStoryFree.js';
import fetchStockPhotos from './fetchStockPhotos.js';
import narrateAll from './tts.js';
import assemble from './assembleVideo.js';
import upload from './uploadYoutube.js';
import uploadReel from './uploadInstagram.js';

async function main() {
  console.log('=== Step 1/5: Generating story & storyboard ($0, no API) ===');
  generateStoryFree();

  console.log('\n=== Step 2/5: Fetching real photos (Ken Burns effect) ===');
  await fetchStockPhotos();

  console.log('\n=== Step 3/5: Generating narration audio ===');
  await narrateAll();

  console.log('\n=== Step 4/5: Assembling final video ===');
  const finalVideo = await assemble();
  console.log(`\n🎉 Video ready at: ${finalVideo}`);

  const autoUpload = (process.env.PIPELINE_AUTO_UPLOAD || 'false').toLowerCase() === 'true';
  const autoUploadIG = (process.env.PIPELINE_AUTO_UPLOAD_IG || 'false').toLowerCase() === 'true';

  if (autoUpload) {
    console.log('\n=== Step 5/5: Uploading to YouTube ===');
    await upload();
  } else {
    console.log('\n=== Step 5/5: YouTube upload skipped (PIPELINE_AUTO_UPLOAD is not "true") ===');
    console.log('Review output/final_video.mp4, then run: npm run upload');
  }

  if (autoUploadIG) {
    console.log('\n=== Bonus: Uploading Reel to Instagram ===');
    await uploadReel();
  } else {
    console.log('Instagram upload skipped (PIPELINE_AUTO_UPLOAD_IG is not "true"). Run: npm run upload:ig');
  }
}

main().catch((err) => {
  console.error('\n❌ Pipeline failed:', err.message);
  process.exit(1);
});
