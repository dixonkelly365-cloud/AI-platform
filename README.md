# AI Video Pipeline: Real Stories, Real Photos, Automated

A real, runnable pipeline that:
1. **Writes a funny, dramatic, twist-driven story** — modern everyday-life stories set in Ghana
   with simple Ghanaian character names, a genuine twist, and a moral lesson at the end (via
   Google's free Gemini API — unlimited unique premises, no card ever), or from a set of
   hand-written history-fact stories (free fallback if no API key is set)
2. **Finds real, matching photos** for each line (free, via Pexels)
3. **Animates them** with a Ken Burns slow-zoom effect, cinematic color grading, film grain,
   and letterbox bars
4. **Narrates it with a full voice cast** — each character gets their own distinct voice, not
   one narrator reading all dialogue (Nigerian-English accent by default; no Ghanaian-accent
   voice currently exists, so this is the closest real West African option available)
5. **Adds cinematic background music** (an original synthesized chord progression, royalty-free)
6. **Burns in captions**
7. **Uploads automatically** to YouTube (and optionally Instagram), on a daily schedule,
   running on GitHub's servers — not your computer

## Honest expectations

- Visuals are **real stock photography**, not custom animation or AI-generated video. A slow
  zoom over a real photo while the narrator speaks — a real, professional technique (used in
  actual documentaries), but it's stills brought to life with camera motion, not moving footage.
- Photos are **thematically matched** to each line's mood/setting, not staged photos of the
  specific fictional characters/events in the story (stock libraries have real photography,
  not custom photos of your story's characters).
- **The same character will NOT look visually identical scene to scene.** Each scene's photo is
  a separate real stock photo search — "Kofi" won't be recognizably the same person in every
  shot, since there's no custom character model behind this (that would require a tool like
  Kling or Runway, which cost money and weren't part of this build). What IS consistent: each
  character's *voice* stays the same throughout the episode.
- Narration uses a free neural TTS voice — good and natural, but still recognizably AI to some
  listeners.
- **Known inconsistency worth knowing:** the free 6-story fallback (`generateStoryFree.js`,
  used only if `GEMINI_API_KEY` isn't set) is still history-facts content from an earlier
  version of this project — it hasn't been updated to match the new everyday-African-stories
  direction. Since you already have Gemini working, this fallback rarely triggers for you, but
  if you ever disable the API key, you'd get history facts instead until this is updated too.
- The free 6-story rotation gives genuine variety for about a week of daily posts, then starts
  repeating. **Recommended, and genuinely free (no card, ever):** `generateStory.js` uses
  Google's Gemini API to auto-pick a fresh topic every run, tracking everything already
  covered so it never repeats. Get a key in 2 minutes at https://aistudio.google.com/apikey.
- No AI tool, including this one, can guarantee views or virality. This pipeline handles
  production and posting; growth depends on consistency and audience-building over time.

## Setup

**Finding the credentials file:** this project needs a file called `.env` for your API keys.
Since files starting with a dot are often hidden or stripped by unzip tools (especially on
phones/some browsers), there's also a copy called **`env.example.txt`** at the top level of
this folder — same content, easier to find. Rename either one to `.env` and fill in your
real values.

### 1. Install prerequisites
```bash
npm install
```
Also install ffmpeg:
```bash
# Mac
brew install ffmpeg
# Linux
sudo apt install ffmpeg
# Windows: download from https://ffmpeg.org/download.html and add to PATH
```

### 2. Get a free Pexels API key (required — this is how real photos are found)
1. Go to https://www.pexels.com/api/ and sign up (instant approval, no cost, no card)
2. Copy your API key into `.env` as `PEXELS_API_KEY`

### 3. Get YouTube API credentials
1. Go to https://console.cloud.google.com/ → create a project
2. Enable the **YouTube Data API v3**
3. Configure the OAuth consent screen (now called "Google Auth Platform"): choose **External**
   audience, add yourself as a test user (Testing mode works indefinitely for personal use,
   no Google review needed)
4. Create an **OAuth Client ID** (Web application or Desktop app both work — if Web application,
   add `http://localhost:8085/oauth2callback` as an authorized redirect URI)
5. Copy the Client ID and Secret into `.env`
6. Run once: `npm run auth` — opens a browser, you log in and approve, and it prints a
   `YOUTUBE_REFRESH_TOKEN` to paste into `.env`. One-time only.
7. **Your YouTube account needs an actual channel created** (not just a Google login) — if you
   get a `youtubeSignupRequired` error, go to youtube.com and create your channel first, then
   redo step 6.

### 4. (Optional but recommended) Free Gemini API key for genuinely unlimited unique topics
Go to https://aistudio.google.com/apikey, sign in with any Google account, create a key —
**no credit card, no billing setup, ever, for this free tier.** Add it to `.env` as
`GEMINI_API_KEY`. Without this, the free 6-story rotation (`generateStoryFree.js`) is used
automatically. **With it**, `generateStory.js` automatically picks a fresh topic every run —
tracks everything already covered and asks Gemini to pick something genuinely different, so
the series never repeats, with zero manual topic input and zero cost.

## Running it

**Full run** (free content, real photos, uploads to YouTube):
```bash
npm run pipeline
```

**Or step by step** (useful for checking quality at each stage):
```bash
node src/generateStoryFree.js   # writes output/storyboard.json — read it, tweak it if you like
npm run fetch-photos             # downloads output/photos/<scene>.jpg per scene
npm run narrate                  # generates output/audio/<scene>.mp3
npm run assemble                 # produces output/final_video.mp4 — watch it!
npm run upload                   # pushes it to YouTube
```

**Using the Gemini generator instead** (auto-picks a fresh topic each time, free):
```bash
node src/generateStory.js
npm run fetch-photos
npm run narrate
npm run assemble
npm run upload
```

## Fully automated, unattended, running on GitHub (not your computer)

`.github/workflows/auto-post.yml` runs the whole pipeline daily on GitHub's own servers —
your computer doesn't need to be on.

Setup:
1. Push this project to a GitHub repo.
2. Repo → **Settings → Secrets and variables → Actions** → add:
   `PEXELS_API_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`,
   `YOUTUBE_REFRESH_TOKEN` (same values as your local `.env`).
3. That's it — it runs on the schedule in the workflow file (`cron:` line — daily by default),
   and you can also trigger it manually anytime from the repo's **Actions** tab.
4. Every run also saves the video as a downloadable "artifact" on the Actions run page.

**Making videos public:** by default, `PRIVACY_STATUS` in the workflow is set to `private` so
you can review quality first. Once you're happy with it, edit that line to `public` in
`.github/workflows/auto-post.yml`. Any already-posted private videos need to be switched
individually in YouTube Studio → Content → Visibility.

## TikTok

TikTok posting lives in a **separate project/repo** (different content — true love stories
instead of history facts, matched to a different platform/audience), not part of this repo.

## Kling AI (real AI-generated video with character consistency)

Optional, and the biggest visual quality jump this project supports — genuine AI-generated
video motion per scene, WITH each named character kept recognizably consistent across every
scene they appear in (not the same plain stock-photo pipeline where a different-looking
person shows up in every shot).

### How character consistency actually works
Each character gets **one real reference photo** (found once via Pexels, based on their
gender), which is then reused as the starting image for every single scene that character
speaks in (via Kling's image-to-video mode). Narrator/establishing scenes use plain
text-to-video since there's no specific character to anchor.

**Honest limit, confirmed via research, not guessed:** this makes the character
*recognizably* consistent — same general face, build, look — not pixel-perfect identical in
every frame. Expect natural minor variation (angle, lighting, expression) across scenes, not
zero variation. Multiple independent sources describe this as a real, current limitation of
AI video generation generally, not something specific to this implementation.

### Setup
1. Sign up at kling.ai (regular account) — you can test quality for free with limited daily
   generations on the website before committing to the API.
2. Get API access **separately** at **https://kling.ai/dev/api-key** — this is a different
   product from the regular web account, with its own credits/billing. Having website credits
   does NOT automatically grant API access.
3. Create an API key — Kling's current (newer, simpler) method gives you a single key, used
   directly as a Bearer token. (Their dashboard may also offer an older "Access Key + Secret
   Key" method labeled "legacy" — if you see that instead, let me know and the code can be
   switched to match.)
4. Add it to `.env`:
   ```
   KLING_API_KEY=your_key_here
   ```
5. **`PEXELS_API_KEY` is also required** for this path now (used to find each character's
   reference photo) — you already have this from the photo pipeline, no new signup needed.
6. That's it — `src/fetchKlingClips.js` and `src/assembleVideoKling.js` automatically take
   over from the photo pipeline once `KLING_API_KEY` is set (both locally and in GitHub
   Actions, once you add it as a repo secret too).

### Honest cost and technical notes
- **This costs real money per video** — unlike Gemini/Pexels, there's no free tier for the
  API itself. Budget roughly the cost of your episode length × Kling's per-second rate (check
  current pricing at kling.ai — it changes).
- Video generation is **slow** (polling-based, each scene can take 1-5 minutes) — a full
  7-9 scene episode may take 20-40+ minutes to generate, which is why the GitHub Actions
  timeout was extended to 75 minutes for this path.
- **I could not test this against Kling's live API myself** (my dev environment can't reach
  it) — the code is built from Kling's current published documentation and cross-checked
  against multiple independent sources, but this gets its first real live test on your end.
  If the request/response shape has changed since, Kling's API will return a clear error
  message we can debug together.
- `KLING_MODEL` in `.env` lets you pick a different model tier (faster/cheaper vs.
  higher-quality) — check kling.ai's current model list for options.

## Instagram

1. Convert your Instagram account to Business/Creator, link a Facebook Page.
2. https://developers.facebook.com/ → create an app → add "Instagram Graph API" product.
3. Generate a long-lived access token with `instagram_content_publish` permission, find your
   Instagram Business Account ID (Graph API Explorer).
4. Put both in `.env` as `IG_ACCESS_TOKEN` / `IG_BUSINESS_ACCOUNT_ID`.
5. Instagram fetches the video from a public URL rather than accepting a direct upload — in
   the automated GitHub Actions version, the workflow handles this itself by pushing the
   finished video to a `media` branch in your own repo and using its raw GitHub URL. **This
   means your GitHub repo needs to be public** for the Instagram step to work automatically.
   If you'd rather keep the repo private, skip this step in the workflow and post manually
   with `npm run upload:ig` after downloading each day's video artifact instead.

## Customizing

- `src/generateStoryFree.js` — the 6 hand-written stories and their photo search queries.
  Add more stories here to reduce repetition.
- `src/assembleVideo.js` — Ken Burns zoom speed/direction, color grading (`CINEMATIC_LOOK` env
  var to toggle), caption styling, letterbox bars.
- `src/tts.js` — `NARRATOR_VOICE` env var to change the narrator's voice (default
  `en-NG-EzinneNeural`, Nigerian English). Character dialogue voices are auto-assigned per
  episode from a pool of real African-accented voices (`en-NG-AbeoNeural`,
  `en-KE-AsiliaNeural`/`en-KE-ChilembaNeural`, `en-ZA-LeahNeural`/`en-ZA-LukeNeural`,
  `en-TZ-ImaniNeural`/`en-TZ-ElimuNeural`) based on each character's gender — edit the
  `MALE_VOICES`/`FEMALE_VOICES` arrays in `src/tts.js` to change the pool.
- `assets/bgm_loop.wav` — the background music loop. Replace with your own royalty-free track
  if you want.
- `.env` — resolution, frame rate, title, privacy status, `BACKGROUND_MUSIC` and
  `CINEMATIC_LOOK` toggles.

## Project structure
```
ai-video-pipeline/
├── .env.example / env.example.txt
├── package.json
├── assets/
│   └── bgm_loop.wav            # synthesized cinematic background music loop
├── src/
│   ├── generateStoryFree.js    # free, $0: 6 hand-written history-fact stories
│   ├── generateStory.js        # optional free (Gemini API, no card ever): unlimited topics
│   ├── fetchStockPhotos.js     # Pexels API -> real photos matched per scene
│   ├── tts.js                  # narration -> .mp3 files (free neural voice)
│   ├── assembleVideo.js        # Ken Burns effect + grading + music + captions -> final_video.mp4
│   ├── authYoutube.js / uploadYoutube.js
│   ├── uploadInstagram.js
│   └── pipeline.js             # runs all of the above in order
├── .github/workflows/auto-post.yml   # daily automation, runs on GitHub's servers
└── output/                     # generated at runtime (storyboard, photos, audio, video)
```
