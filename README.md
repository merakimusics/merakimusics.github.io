# 🌌 Meraki Musics SEO & Organic Distribution Bot

Automated background SEO engine, search-indexer, and syndication bot tailored specifically for **Meraki Musics** (@merakiMusics, @merakimusicsofficial).

Built for 80s Synth-pop, Retrowave, Cyberpunk, and Cinematic Electronic music discovery.

---

## ⚡ Key Capabilities

1. **Zero-Cost Catalog Tracking**:
   - Automatically monitors the YouTube RSS feed (`UC1QvOaUTD7USb8Rh3AeXUjw`).
   - Tracks both full songs and vertical shorts/reels with zero API quotas or credentials.

2. **AI & Heuristic Multi-Platform SEO Generator**:
   - **YouTube SEO**: High-CTR A/B titles, 500-character search tags, structured lyric descriptions, pinned comment hooks.
   - **TikTok & Instagram Reels**: 3-second pattern-interrupt visual hooks, keyword search captions, 4-tier hashtag stacks.
   - **Reddit Syndication**: Platform-compliant post templates for `r/synthwave`, `r/retrowave`, `r/listentothis`, `r/promoteyourmusic` that respect community rules without getting flagged as spam.
   - **Pinterest & Micro-Blogs**: Rich Pin metadata and Tumblr/Medium storytelling articles designed for authoritative external backlinks.

3. **Free Static SEO Web Hub & Schema.org Rich Markup**:
   - Generates standalone, mobile-responsive HTML pages in `dist/` for every track in your catalog.
   - Injects full **JSON-LD Schema.org** (`MusicRecording`, `MusicGroup`, `VideoObject`).
   - Ready to deploy to **GitHub Pages**, **Cloudflare Pages**, or **Vercel** 100% free forever.

4. **Instant Search Engine Indexing (IndexNow Protocol)**:
   - Dispatches URLs directly to Microsoft Bing, Yandex, and Seznam via **IndexNow** without waiting weeks for organic web crawlers.
   - Pings Google Search sitemap endpoint on new releases.

5. **Background Automation & Scheduling**:
   - **Daily Spotlight Mode**: Automatically picks 1 track or short per day on rotation, refreshes its SEO package, rebuilds the static hub, and logs promotion history.
   - Configurable cron schedule (default: `0 9 * * *` at 9:00 AM daily).

---

## 🚀 Quick Start

### 1. Launch Interactive Dashboard (Web UI)
Double-click `run_dashboard.bat` or run:
```bash
npm start
```
Then visit **http://localhost:3000** in your browser:
- **Overview & Spotlight**: Channel stats, views, and 1-click spotlight runner.
- **Catalog & SEO Studio**: Inspect any track, filter by Songs vs Shorts, and use 1-click **Copy Title**, **Copy Caption**, **Copy Tags**, **Copy Reddit Post**.
## 🚀 Quick Start (Zero-Touch Autopilot)

### 1. The "Do Nothing" 100% Autopilot Runner
Simply double-click **`run_autopilot.bat`** (or run `npm run daemon`):
```bash
run_autopilot.bat
```
- The bot boots, syncs all **57+ tracks**, ensures SEO packages are generated, rebuilds the static hub, dispatches **IndexNow** search engine pings, and checks your channel **hourly** for new releases.
- You can minimize the window; it runs silently in the background 24/7 without needing you to do anything.

### 2. Interactive Control Dashboard (Web UI)
Double-click **`run_dashboard.bat`** (or run `npm start`):
Visit **http://localhost:3000**:
- **Overview**: View all 57 tracks, 4,480+ channel views, and daily spotlight rotation.
- **Catalog Studio**: Inspect any of the 12 songs or 45 shorts, filter, and 1-click copy metadata.
- **Static Hub Preview**: Visit **http://localhost:3000/preview** to preview all 58 standalone HTML pages.

### 3. Command Line Interface (CLI)
You can also run any action directly from terminal:
```bash
node src/cli.js autopilot     # Run complete 100% zero-touch autopilot cycle
node src/cli.js sync          # Sync catalog from YouTube feed (all 57+ tracks)
node src/cli.js list          # List all 57 tracks and SEO status
node src/cli.js spotlight     # Run 1-track daily spotlight routine
node src/cli.js optimize-all  # Generate SEO packages for all tracks
node src/cli.js build-site    # Generate static SEO website with Schema.org & RSS
node src/cli.js index         # Dispatch IndexNow to Bing & Google
node src/cli.js stats         # View catalog metrics and sync status
```

---

## 🌐 Deploying the Free Static SEO Hub to GitHub Pages

1. Create a free GitHub repository (e.g. `merakimusics.github.io`).
2. Push the contents of the `dist/` folder to the repository.
3. Enable **GitHub Pages** under repository settings.
4. Your music catalog is now live on the open web with permanent backlinks, Google Video carousels, and search indexing!

---

## ⚙️ Configuration (`config.json`)

- `brand.socials`: Links to your YouTube, TikTok, Instagram, and contact email.
- `scheduler.cronExpression`: Set schedule time (e.g. `0 9 * * *` for 9 AM daily).
- `api.geminiApiKey`: Optional Google Gemini API key from [Google AI Studio](https://aistudio.google.com/) for ultra-custom AI copywriting. If left empty, the built-in heuristic engine runs completely free offline!
