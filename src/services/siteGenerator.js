import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCatalog } from './catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../../dist');
const CONFIG_FILE = path.resolve(__dirname, '../../config.json');

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      brand: { name: 'Meraki Musics' },
      seo: { siteBaseUrl: 'https://merakimusics.github.io' }
    };
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '3:45';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Builds the complete static SEO website into `dist/` with the Musize Musician theme
 */
export async function buildStaticSite() {
  const config = await loadConfig();
  const catalog = await loadCatalog();
  const baseUrl = config.seo?.siteBaseUrl || 'https://merakimusics.github.io';
  const brand = config.brand || {};
  const songs = catalog.videos.filter(v => v.type === 'song');
  const shorts = catalog.videos.filter(v => v.type === 'short');

  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.mkdir(path.join(DIST_DIR, 'tracks'), { recursive: true });
  await fs.mkdir(path.join(DIST_DIR, 'assets'), { recursive: true });

  // Synchronize assets from public/assets to dist/assets
  const publicAssetsDir = path.resolve(__dirname, '../../public/assets');
  try {
    const assetFiles = await fs.readdir(publicAssetsDir);
    for (const file of assetFiles) {
      await fs.copyFile(
        path.join(publicAssetsDir, file),
        path.join(DIST_DIR, 'assets', file)
      );
    }
  } catch (err) {
    console.warn('Warning syncing assets:', err.message);
  }

  const generatedUrls = [`${baseUrl}/`];

  // Primary featured track
  const featuredTrack = songs[0] || catalog.videos[0];

  // 1. Build Individual Track Pages
  for (const video of catalog.videos) {
    const slug = slugify(video.title.slice(0, 40)) || video.id;
    const pageFileName = `tracks/${slug}.html`;
    const pageUrl = `${baseUrl}/${pageFileName}`;
    generatedUrls.push(pageUrl);

    const seo = video.seoPackage || {};
    const title = seo.youtube?.recommendedTitle || video.title;
    const description = video.description || `Listen to ${video.title} by Meraki Musics. 80s Synth-pop, Retrowave, and Cinematic Electronic soundscapes.`;

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "MusicRecording",
          "@id": `${pageUrl}#music`,
          "name": video.title,
          "byArtist": {
            "@type": "MusicGroup",
            "name": brand.name || "Meraki Musics",
            "url": brand.socials?.youtube || "https://www.youtube.com/@merakiMusics"
          },
          "genre": brand.genres || ["Synth-pop", "Retrowave", "Synthwave"],
          "url": pageUrl
        },
        {
          "@type": "VideoObject",
          "@id": `${pageUrl}#video`,
          "name": title,
          "description": description.slice(0, 200),
          "thumbnailUrl": [video.thumbnailUrl],
          "uploadDate": video.publishedAt || "2026-08-01",
          "embedUrl": `https://www.youtube.com/embed/${video.id}`,
          "contentUrl": video.url
        }
      ]
    };

    const trackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Meraki Musics</title>
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
  <meta name="keywords" content="${escapeHtml(seo.youtube?.tags || 'synthwave, 80s synthpop, retrowave, meraki musics')}">
  <link rel="canonical" href="${pageUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}">
  <meta property="og:image" content="${video.thumbnailUrl}">
  <meta property="og:url" content="${pageUrl}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}">
  <meta name="twitter:image" content="${video.thumbnailUrl}">

  <!-- Google Fonts: Montserrat & Inter (Musize Style) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <!-- Favicon -->
  <link rel="icon" href="../assets/logo-emblem.jpg" type="image/jpeg">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(schemaData, null, 2)}
  </script>

  <style>
    :root {
      --color-primary: #00e5ff;
      --color-primary-hover: #00b4d8;
      --color-accent: #ff007f;
      --color-yellow: #ffd600;
      --color-dark: #0b0c10;
      --color-surface: #141722;
      --color-surface-hover: #1c2030;
      --color-border: rgba(255, 255, 255, 0.08);
      --color-text: #f8fafc;
      --color-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--color-dark);
      color: var(--color-text);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 80px;
    }
    h1, h2, h3, h4, .nav-link, .btn {
      font-family: 'Montserrat', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    /* Musize Sticky Header */
    header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(11, 12, 16, 0.95);
      backdrop-filter: blur(15px);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 3rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      font-size: 1.3rem;
      font-weight: 900;
      letter-spacing: 2px;
      color: #fff;
    }
    .logo span { color: var(--color-primary); }
    .nav-actions { display: flex; gap: 1rem; align-items: center; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.6rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
      border: 2px solid transparent;
    }
    .btn-primary {
      background: var(--color-primary);
      color: #000;
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.35);
    }
    .btn-primary:hover {
      background: #fff;
      transform: translateY(-2px);
      box-shadow: 0 0 35px rgba(0, 229, 255, 0.6);
    }
    .btn-outline {
      background: transparent;
      border-color: var(--color-border);
      color: #fff;
    }
    .btn-outline:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    main {
      flex: 1;
      max-width: 1000px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
      width: 100%;
    }
    .track-hero {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }
    .track-hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    }
    .kicker {
      color: var(--color-primary);
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 2px;
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 1.5rem;
      color: #fff;
    }
    .video-wrapper {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border: 1px solid var(--color-border);
    }
    .video-wrapper iframe {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      border: none;
    }
    .platform-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2.5rem;
    }
    .btn-yt { background: #ff0000; color: #fff; }
    .btn-sp { background: #1db954; color: #fff; }
    .btn-tt { background: #000; color: var(--color-primary); border: 1px solid var(--color-border); }
    .lyrics-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 2rem;
    }
    .lyrics-box h3 {
      color: var(--color-accent);
      font-size: 1.1rem;
      margin-bottom: 1.2rem;
    }
    .lyrics-box pre {
      font-family: inherit;
      white-space: pre-wrap;
      color: var(--color-muted);
      line-height: 1.8;
      font-size: 0.95rem;
    }
    footer {
      text-align: center;
      padding: 2.5rem;
      color: var(--color-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--color-border);
    }
  </style>
</head>
<body>
  <header>
    <a href="../index.html" class="logo">
      <img src="../assets/logo-emblem.jpg" alt="Meraki Logo" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(168,85,247,0.5); box-shadow: 0 0 12px rgba(168,85,247,0.4);">
      MERAKI MUSICS
    </a>
    <div class="nav-actions">
      <a href="../index.html#discography" class="btn btn-outline">&larr; Back To Discography</a>
      <a href="${video.url}" target="_blank" rel="noopener" class="btn btn-primary">Watch on YouTube</a>
    </div>
  </header>

  <main>
    <div class="track-hero">
      <div class="kicker">MERAKI MUSICS • 80S SYNTH-POP RELEASE</div>
      <h1>${escapeHtml(video.title)}</h1>
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${video.id}?autoplay=0&rel=0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
      </div>
      <div class="platform-buttons">
        <a href="${brand.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ'}" target="_blank" rel="noopener" class="btn btn-sp">Stream on Spotify</a>
        <a href="${video.url}" target="_blank" rel="noopener" class="btn btn-yt">Listen on YouTube</a>
        <a href="${brand.socials?.tiktok || '#'}" target="_blank" rel="noopener" class="btn btn-tt">TikTok Sounds</a>
        <a href="${brand.socials?.instagram || '#'}" target="_blank" rel="noopener" class="btn btn-outline">Instagram Reels</a>
      </div>
      <div class="lyrics-box">
        <h3>About This Release & Lyrics</h3>
        <pre>${escapeHtml(video.description || 'Engineered with 80s analog synthesizers, punchy basslines, and midnight city soundscapes.')}</pre>
      </div>
    </div>
  </main>

  <footer>
    &copy; ${new Date().getFullYear()} Meraki Musics. Where the pulse of the machine meets the human soul.
  </footer>
</body>
</html>`;

    await fs.writeFile(path.join(DIST_DIR, pageFileName), trackHtml, 'utf-8');
  }

  // 2. Build the Main Homepage (Faithfully replicating Musize Musician Template)
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meraki Musics | Official 80s Synth-Pop & Retrowave Artist</title>
  <meta name="description" content="Official website of Meraki Musics. Immersive 80s synth-pop, retrowave, cinematic electronic soundscapes, and midnight drive anthems.">
  <link rel="canonical" href="${baseUrl}/">

  <!-- Favicon -->
  <link rel="icon" href="assets/logo-emblem.jpg" type="image/jpeg">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Meraki Musics | 80s Synth-Pop & Retrowave">
  <meta property="og:description" content="Where the pulse of the machine meets the human soul. 80s-inspired synth-pop, cinematic electronic soundscapes, and cyberpunk beats.">
  <meta property="og:image" content="${baseUrl}/assets/hero-bg.jpg">
  <meta property="og:url" content="${baseUrl}/">

  <!-- Google Fonts: Montserrat (Headings) & Inter (Body Text) as used in Musize -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": "Meraki Musics",
    "description": "Where the pulse of the machine meets the human soul. 80s-inspired synth-pop and electronic soundscapes.",
    "url": "${baseUrl}/",
    "genre": ["80s Synth-pop", "Synthwave", "Retrowave", "Cinematic Electronic", "Cyberpunk"],
    "sameAs": [
      "${brand.socials?.youtube || ''}",
      "${brand.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ'}",
      "${brand.socials?.tiktok || ''}",
      "${brand.socials?.instagram || ''}"
    ]
  }
  </script>

  <style>
    :root {
      --color-primary: #00e5ff;          /* Musize Neon Cyan */
      --color-primary-glow: rgba(0, 229, 255, 0.4);
      --color-accent: #ff007f;           /* Electric Pink / Magenta */
      --color-accent-glow: rgba(255, 0, 127, 0.4);
      --color-yellow: #ffd600;           /* Pop Yellow Accent */
      
      --color-bg-dark: #090a0f;          /* Deep Obsidian Body */
      --color-card-dark: #12141d;        /* Charcoal Glass Panel */
      --color-card-hover: #181c28;       /* Highlight Panel */
      --color-border: rgba(255, 255, 255, 0.09);
      
      --color-text-white: #ffffff;
      --color-text-main: #f1f5f9;
      --color-text-muted: #94a3b8;
      --color-text-dim: #64748b;
      
      --transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--color-bg-dark);
      color: var(--color-text-main);
      overflow-x: hidden;
      line-height: 1.6;
      padding-bottom: 95px; /* Spacing for persistent player */
    }

    h1, h2, h3, h4, h5, .nav-link, .btn, .kicker, .track-title {
      font-family: 'Montserrat', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: var(--color-bg-dark); }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }

    /* ===================================================
       1. STICKY TOP HEADER (Musize Navbar)
       =================================================== */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(9, 10, 15, 0.94);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.1rem 4rem;
      transition: var(--transition);
    }
    .site-logo {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: 2px;
      color: var(--color-text-white);
    }
    .site-logo-img {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
      transition: var(--transition);
    }
    .site-logo:hover .site-logo-img {
      transform: scale(1.08);
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.7);
    }
    .hero-brand-logo {
      max-width: 380px;
      height: auto;
      margin-bottom: 1.8rem;
      filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.7));
    }
    .site-logo span { color: var(--color-primary); }

    .site-nav {
      display: flex;
      align-items: center;
      gap: 2.2rem;
    }
    .nav-link {
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      position: relative;
      padding: 0.4rem 0;
      transition: var(--transition);
    }
    .nav-link:hover, .nav-link.active {
      color: var(--color-text-white);
    }
    .nav-link.active::after, .nav-link:hover::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; width: 100%; height: 2px;
      background: var(--color-primary);
      box-shadow: 0 0 10px var(--color-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1.2rem;
    }
    .social-icon-btn {
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 1.1rem;
      transition: var(--transition);
    }
    .social-icon-btn:hover {
      color: var(--color-primary);
      transform: translateY(-2px);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.85rem 1.8rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      transition: var(--transition);
      border: 2px solid transparent;
    }
    .btn-primary {
      background: var(--color-primary);
      color: #000;
      box-shadow: 0 4px 20px var(--color-primary-glow);
    }
    .btn-primary:hover {
      background: #fff;
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(0, 229, 255, 0.6);
    }
    .btn-accent {
      background: var(--color-accent);
      color: #fff;
      box-shadow: 0 4px 20px var(--color-accent-glow);
    }
    .btn-accent:hover {
      background: #ff2a8d;
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(255, 0, 127, 0.6);
    }
    .btn-outline {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--color-text-white);
    }
    .btn-outline:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: rgba(0, 229, 255, 0.05);
      transform: translateY(-2px);
    }

    /* ===================================================
       2. HERO SECTION (Musize Full-Width Banner)
       =================================================== */
    .hero-section {
      position: relative;
      min-height: 85vh;
      display: flex;
      align-items: center;
      background: linear-gradient(180deg, rgba(9, 10, 15, 0.4) 0%, rgba(9, 10, 15, 0.95) 100%),
                  url('assets/hero-bg.jpg') center/cover no-repeat;
      padding: 5rem 4rem;
      overflow: hidden;
    }
    .hero-overlay-glow {
      position: absolute;
      top: 10%; right: 15%;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 0, 127, 0.25) 0%, rgba(0, 229, 255, 0.15) 50%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }
    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 850px;
    }
    .kicker {
      display: inline-block;
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: 3px;
      margin-bottom: 1.2rem;
      padding: 0.3rem 0.8rem;
      background: rgba(0, 229, 255, 0.1);
      border-left: 3px solid var(--color-primary);
    }
    .hero-title {
      font-size: 3.8rem;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -1px;
      color: var(--color-text-white);
      margin-bottom: 1.5rem;
    }
    .hero-title span {
      background: linear-gradient(135deg, var(--color-primary), #fff, var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.15rem;
      color: var(--color-text-muted);
      margin-bottom: 2.5rem;
      max-width: 650px;
      line-height: 1.7;
    }
    .hero-actions {
      display: flex;
      gap: 1.2rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 3.5rem;
    }
    .hero-platform-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }
    .platform-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-dim);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .platform-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-decoration: none;
      padding: 0.4rem 0.9rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      transition: var(--transition);
    }
    .platform-badge:hover {
      color: var(--color-text-white);
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    /* ===================================================
       3. FEATURED ALBUM & INTERACTIVE TRACKLIST (Signature Musize)
       =================================================== */
    .section-wrap {
      max-width: 1300px;
      margin: 6rem auto;
      padding: 0 3rem;
    }
    .section-head {
      text-align: center;
      margin-bottom: 4rem;
    }
    .section-head .kicker {
      margin-bottom: 0.5rem;
    }
    .section-head h2 {
      font-size: 2.6rem;
      font-weight: 900;
      color: var(--color-text-white);
      letter-spacing: 1px;
    }

    .featured-album-card {
      background: var(--color-card-dark);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      display: grid;
      grid-template-columns: 460px 1fr;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .album-art-column {
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      overflow: hidden;
    }
    .album-art-wrap {
      position: relative;
      width: 100%;
      max-width: 320px;
      aspect-ratio: 1/1;
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.8);
      z-index: 2;
    }
    .album-art-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    /* Vinyl disc sliding out */
    .vinyl-disc {
      position: absolute;
      top: 15px;
      right: -30px;
      width: 290px;
      height: 290px;
      border-radius: 50%;
      background: radial-gradient(circle, #000 20%, #111 25%, #000 40%, var(--color-accent) 41%, var(--color-accent) 45%, #000 46%);
      border: 2px solid #222;
      box-shadow: 0 10px 25px rgba(0,0,0,0.7);
      z-index: 1;
      animation: spin 12s linear infinite;
    }
    .album-meta-box {
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .album-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--color-accent);
      letter-spacing: 2px;
      margin-bottom: 0.6rem;
    }
    .album-title {
      font-size: 2.2rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 0.4rem;
    }
    .album-subinfo {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-bottom: 2rem;
    }

    /* Tracklist Table */
    .tracklist {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .track-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.8rem 1.2rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition);
    }
    .track-row:hover, .track-row.playing {
      background: rgba(0, 229, 255, 0.08);
      border-color: rgba(0, 229, 255, 0.3);
      transform: translateX(4px);
    }
    .track-left {
      display: flex;
      align-items: center;
      gap: 1.2rem;
    }
    .track-num {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-dim);
      width: 24px;
    }
    .btn-play-mini {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: #fff;
      transition: var(--transition);
    }
    .track-row:hover .btn-play-mini, .track-row.playing .btn-play-mini {
      background: var(--color-primary);
      color: #000;
      box-shadow: 0 0 12px var(--color-primary);
    }
    .track-name-wrap .name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }
    .track-name-wrap .genre {
      font-size: 0.75rem;
      color: var(--color-text-dim);
    }
    .track-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .track-duration {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }
    .track-listen-btn {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--color-primary);
      text-decoration: none;
      padding: 0.3rem 0.8rem;
      border: 1px solid rgba(0, 229, 255, 0.3);
      border-radius: 999px;
      transition: var(--transition);
    }
    .track-listen-btn:hover {
      background: var(--color-primary);
      color: #000;
    }

    /* ===================================================
       4. DISCOGRAPHY GRID (All 57 Releases with Filters)
       =================================================== */
    .filter-bar {
      display: flex;
      justify-content: center;
      gap: 0.8rem;
      margin-bottom: 3rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      padding: 0.6rem 1.4rem;
      color: var(--color-text-muted);
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
    }
    .filter-btn:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }
    .filter-btn.active {
      background: var(--color-primary);
      color: #000;
      border-color: var(--color-primary);
      box-shadow: 0 0 15px var(--color-primary-glow);
    }

    .discography-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    .release-card {
      background: var(--color-card-dark);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: var(--transition);
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }
    .release-card:hover {
      transform: translateY(-8px);
      border-color: var(--color-primary);
      box-shadow: 0 12px 35px rgba(0, 229, 255, 0.25);
    }
    .release-thumb {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      background: #000;
      overflow: hidden;
    }
    .release-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .release-card:hover .release-thumb img {
      transform: scale(1.08);
    }
    .release-badge {
      position: absolute;
      top: 12px; right: 12px;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      text-transform: uppercase;
      backdrop-filter: blur(4px);
    }
    .release-badge.song { background: rgba(255, 0, 127, 0.85); color: #fff; }
    .release-badge.short { background: rgba(0, 229, 255, 0.85); color: #000; }
    
    .play-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .release-card:hover .play-hover-overlay {
      opacity: 1;
    }
    .play-circle {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: 0 0 20px var(--color-primary);
    }
    .release-info {
      padding: 1.4rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .release-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.6rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.35;
    }
    .release-meta {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      font-size: 0.78rem;
      color: var(--color-text-dim);
    }

    /* ===================================================
       5. FEATURED VIDEO SHOWCASE (Full Bleed Cinematic Banner)
       =================================================== */
    .video-showcase-section {
      position: relative;
      background: linear-gradient(180deg, rgba(9, 10, 15, 0.7) 0%, rgba(9, 10, 15, 0.95) 100%),
                  url('https://i.ytimg.com/vi/ZezpkdBkOzk/hqdefault.jpg') center/cover no-repeat;
      padding: 8rem 2rem;
      text-align: center;
      margin: 6rem 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .video-showcase-content {
      max-width: 800px;
      margin: 0 auto;
    }
    .giant-play-btn {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 0 40px var(--color-primary);
      cursor: pointer;
      transition: var(--transition);
      border: none;
    }
    .giant-play-btn:hover {
      transform: scale(1.1);
      background: #fff;
      box-shadow: 0 0 60px rgba(0, 229, 255, 0.8);
    }
    .video-showcase-title {
      font-size: 2.8rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 1rem;
    }
    .video-showcase-desc {
      font-size: 1.1rem;
      color: var(--color-text-muted);
      margin-bottom: 2rem;
    }

    /* ===================================================
       6. ARTIST BIOGRAPHY & STORY (Musize Split Section)
       =================================================== */
    .artist-bio-section {
      max-width: 1300px;
      margin: 6rem auto;
      padding: 0 3rem;
      display: grid;
      grid-template-columns: 1fr 500px;
      gap: 5rem;
      align-items: center;
    }
    .bio-content h2 {
      font-size: 2.8rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    .bio-quote {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--color-primary);
      border-left: 3px solid var(--color-primary);
      padding-left: 1.2rem;
      margin-bottom: 1.8rem;
      font-style: italic;
    }
    .bio-text {
      color: var(--color-text-muted);
      font-size: 1.05rem;
      margin-bottom: 1.5rem;
      line-height: 1.8;
    }
    .bio-portrait-wrap {
      position: relative;
    }
    .bio-portrait-backdrop {
      position: absolute;
      top: -20px; right: -20px;
      width: 100%; height: 100%;
      background: var(--color-yellow);
      border-radius: 20px;
      z-index: 1;
    }
    .bio-portrait-img {
      position: relative;
      z-index: 2;
      width: 100%;
      aspect-ratio: 3/4;
      object-fit: cover;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }

    /* ===================================================
       7. CONTACT & PLATFORMS SECTION
       =================================================== */
    .contact-section {
      background: var(--color-card-dark);
      border-top: 1px solid var(--color-border);
      padding: 6rem 4rem;
      margin-top: 6rem;
    }
    .contact-wrap {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
    }
    .contact-col h3 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 1.5rem;
    }
    .contact-col p {
      color: var(--color-text-muted);
      margin-bottom: 2rem;
      font-size: 1rem;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.2rem;
    }
    .contact-icon {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(0, 229, 255, 0.1);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .contact-text a {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
    }

    /* Newsletter */
    .newsletter-form {
      display: flex;
      gap: 0.8rem;
      margin-top: 1.5rem;
    }
    .newsletter-input {
      flex: 1;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      padding: 0.85rem 1.4rem;
      color: #fff;
      font-family: inherit;
    }
    .newsletter-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 15px var(--color-primary-glow);
    }

    /* Footer */
    .site-footer {
      background: #050608;
      border-top: 1px solid var(--color-border);
      padding: 3rem 4rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: var(--color-text-dim);
    }
    .footer-socials { display: flex; gap: 1.2rem; }

    /* ===================================================
       8. PERSISTENT BOTTOM AUDIO / VIDEO PLAYER (Signature Musize)
       =================================================== */
    .persistent-player-bar {
      position: fixed;
      bottom: 0; left: 0; width: 100%;
      height: 84px;
      background: rgba(11, 12, 18, 0.98);
      backdrop-filter: blur(25px);
      border-top: 1px solid rgba(0, 229, 255, 0.3);
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 3rem;
      z-index: 9999;
    }
    .player-left {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      width: 320px;
    }
    .player-thumb {
      width: 52px; height: 52px;
      border-radius: 8px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .player-info .player-track-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 240px;
    }
    .player-info .player-artist-name {
      font-size: 0.75rem;
      color: var(--color-primary);
      font-weight: 600;
    }
    .player-center {
      flex: 1;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .player-controls {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .control-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-size: 1.1rem;
      cursor: pointer;
      transition: var(--transition);
    }
    .control-btn:hover { color: #fff; }
    .control-btn-play {
      width: 42px; height: 42px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      box-shadow: 0 0 15px var(--color-primary);
    }
    .control-btn-play:hover {
      background: #fff;
      transform: scale(1.08);
    }
    .progress-wrap {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--color-text-dim);
      font-weight: 600;
    }
    .progress-bar-container {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      position: relative;
      cursor: pointer;
    }
    .progress-bar-fill {
      height: 100%;
      width: 32%;
      background: var(--color-primary);
      border-radius: 999px;
      box-shadow: 0 0 8px var(--color-primary);
    }
    .player-right {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      width: 250px;
      justify-content: flex-end;
    }

    /* Video Lightbox Modal */
    .video-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      z-index: 10000;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .video-modal.active { display: flex; }
    .video-modal-content {
      position: relative;
      width: 100%;
      max-width: 960px;
      aspect-ratio: 16/9;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 0 50px rgba(0, 229, 255, 0.3);
    }
    .video-modal-content iframe {
      width: 100%; height: 100%; border: none;
    }
    .modal-close-btn {
      position: absolute;
      top: -45px; right: 0;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
    }

    /* Album Play Overlay */
    .album-art-wrap {
      position: relative;
      cursor: pointer;
    }
    .album-play-overlay {
      position: absolute;
      inset: 0;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .album-art-wrap:hover .album-play-overlay {
      opacity: 1;
    }
    .album-play-circle {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      padding-left: 6px;
      box-shadow: 0 0 30px var(--color-primary);
      transition: transform 0.2s ease;
    }
    .album-art-wrap:hover .album-play-circle {
      transform: scale(1.12);
    }
    .album-badge {
      cursor: pointer;
      transition: var(--transition);
    }
    .album-badge:hover {
      background: var(--color-accent);
      color: #fff;
      box-shadow: 0 0 15px var(--color-accent-glow);
    }
    .album-title {
      cursor: pointer;
      transition: var(--transition);
    }
    .album-title:hover {
      color: var(--color-primary);
    }

    /* ===================================================
       9. DOCKED AUDIO / VIDEO STREAM ENGINE (Now Playing)
       =================================================== */
    .audio-dock-widget {
      display: none;
      position: fixed;
      bottom: 96px;
      right: 28px;
      width: 320px;
      background: #0b0d16;
      border: 1px solid rgba(0, 229, 255, 0.45);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 229, 255, 0.2);
      z-index: 9998;
      flex-direction: column;
      transition: all 0.3s ease;
    }
    .audio-dock-widget.minimized {
      width: auto;
      max-width: 280px;
    }
    .audio-dock-widget.minimized .audio-dock-frame-wrap {
      display: none;
    }
    .audio-dock-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.85rem;
      background: rgba(18, 21, 33, 0.98);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      gap: 0.5rem;
    }
    .audio-dock-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .live-eq-dot {
      width: 8px; height: 8px;
      min-width: 8px;
      border-radius: 50%;
      background: var(--color-primary);
      box-shadow: 0 0 8px var(--color-primary);
      animation: eqPulse 1s infinite alternate;
    }
    @keyframes eqPulse {
      0% { transform: scale(0.85); opacity: 0.6; }
      100% { transform: scale(1.25); opacity: 1; box-shadow: 0 0 14px var(--color-primary); }
    }
    .audio-dock-controls {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .dock-action-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 2px 4px;
      transition: var(--transition);
      line-height: 1;
    }
    .dock-action-btn:hover {
      color: #fff;
      transform: scale(1.15);
    }
    .audio-dock-frame-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      background: #000;
    }
    .audio-dock-frame-wrap iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
    }

    @media (max-width: 1024px) {
      .site-header { padding: 1rem 2rem; }
      .site-nav { display: none; }
      .hero-title { font-size: 2.8rem; }
      .featured-album-card { grid-template-columns: 1fr; }
      .artist-bio-section { grid-template-columns: 1fr; }
      .contact-wrap { grid-template-columns: 1fr; }
      .persistent-player-bar { padding: 0 1.5rem; }
      .player-left { width: 200px; }
      .player-right { display: none; }
      .audio-dock-widget { right: 12px; bottom: 90px; width: 260px; }
    }
  </style>
</head>
<body>

  <!-- 1. STICKY HEADER -->
  <header class="site-header">
    <a href="#" class="site-logo">
      <img src="assets/logo-emblem.jpg" alt="Meraki Logo" class="site-logo-img">
      Meraki Musics
    </a>
    <nav class="site-nav">
      <a href="#home" class="nav-link active">Home</a>
      <a href="#featured" class="nav-link">Featured</a>
      <a href="#discography" class="nav-link">Discography (57)</a>
      <a href="#video" class="nav-link">Cinematic Video</a>
      <a href="#about" class="nav-link">About</a>
      <a href="#contact" class="nav-link">Contact</a>
    </nav>
    <div class="header-actions">
      <a href="${brand.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ'}" target="_blank" class="social-icon-btn" title="Spotify" style="color: #1db954;">🎧</a>
      <a href="${brand.socials?.youtube || '#'}" target="_blank" class="social-icon-btn" title="YouTube">▶</a>
      <a href="${brand.socials?.tiktok || '#'}" target="_blank" class="social-icon-btn" title="TikTok">📱</a>
      <a href="${brand.socials?.instagram || '#'}" target="_blank" class="social-icon-btn" title="Instagram">📷</a>
      <a href="#featured" class="btn btn-primary">Listen Now</a>
    </div>
  </header>

  <!-- 2. HERO SECTION -->
  <section id="home" class="hero-section">
    <div class="hero-overlay-glow"></div>
    <div class="hero-content">
      <div class="hero-logo-banner">
        <img src="assets/logo-banner.png" alt="Meraki Musics" class="hero-brand-logo">
      </div>
      <div class="kicker">OFFICIAL 80S SYNTH-POP &amp; RETROWAVE ARTIST</div>
      <h1 class="hero-title">WHERE THE PULSE OF THE MACHINE <span>MEETS THE HUMAN SOUL.</span></h1>
      <p class="hero-subtitle">
        Immersive, 80s-inspired synth-pop, cyberpunk basslines, and emotional cinematic soundscapes crafted for late-night city drives and deep introspection.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary" onclick="playTrackById('${featuredTrack.id}')">
          <span>▶</span> PLAY LATEST SINGLE
        </button>
        <a href="#discography" class="btn btn-outline">EXPLORE ALL 57 RELEASES &rarr;</a>
      </div>
      <div class="hero-platform-bar">
        <span class="platform-label">Stream on:</span>
        <a href="${brand.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ'}" target="_blank" class="platform-badge" style="border-color: #1db954; color: #1db954;">Spotify Artist</a>
        <a href="${brand.socials?.youtube || '#'}" target="_blank" class="platform-badge">YouTube Music</a>
        <a href="${brand.socials?.tiktok || '#'}" target="_blank" class="platform-badge">TikTok Sounds</a>
        <a href="${brand.socials?.instagram || '#'}" target="_blank" class="platform-badge">Instagram Reels</a>
        <a href="${baseUrl}/rss.xml" target="_blank" class="platform-badge">Pinterest RSS</a>
      </div>
    </div>
  </section>

  <!-- 3. FEATURED ALBUM & INTERACTIVE TRACKLIST (Musize Signature) -->
  <section id="featured" class="section-wrap">
    <div class="section-head">
      <div class="kicker">FEATURED RELEASE • OUT NOW</div>
      <h2>LATEST DISCOGRAPHY SPOTLIGHT</h2>
    </div>

    <div class="featured-album-card">
      <div class="album-art-column">
        <div class="album-art-wrap" onclick="playTrackById('${featuredTrack.id}')" title="Play ${escapeHtml(featuredTrack.title)}">
          <img src="${featuredTrack.thumbnailUrl}" alt="${escapeHtml(featuredTrack.title)}">
          <div class="album-play-overlay">
            <div class="album-play-circle">▶</div>
          </div>
        </div>
        <div class="vinyl-disc"></div>
      </div>
      <div class="album-meta-box">
        <span class="album-badge" onclick="playTrackById('${featuredTrack.id}')" title="Play Spotlight Single">SPOTLIGHT SINGLE 2026 ▶</span>
        <h3 class="album-title" onclick="playTrackById('${featuredTrack.id}')" title="Play ${escapeHtml(featuredTrack.title)}">${escapeHtml(featuredTrack.title)}</h3>
        <div class="album-subinfo">Label: Meraki Musics &bull; 80s Synth-Pop &bull; Night Drive Anthem</div>

        <!-- Interactive Playlist Widget -->
        <div class="tracklist">
          ${songs.slice(0, 6).map((s, idx) => `
            <div class="track-row" onclick="playTrackById('${s.id}')">
              <div class="track-left">
                <span class="track-num">${(idx + 1).toString().padStart(2, '0')}</span>
                <div class="btn-play-mini">▶</div>
                <div class="track-name-wrap">
                  <div class="name">${escapeHtml(s.title.slice(0, 36))}</div>
                  <div class="genre">80s Synth-Pop / Retrowave</div>
                </div>
              </div>
              <div class="track-right">
                <span class="track-duration">${formatDuration(s.duration)}</span>
                <a href="${baseUrl}/tracks/${slugify(s.title.slice(0, 40)) || s.id}.html" class="track-listen-btn">View Lyrics &rarr;</a>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="playTrackById('${featuredTrack.id}')" style="box-shadow: 0 0 20px var(--color-primary-glow);">
            <span>▶</span> Listen with Sound
          </button>
          <a href="${brand.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ'}" target="_blank" class="btn btn-primary" style="background: #1db954; color: #fff; box-shadow: 0 0 20px rgba(29, 185, 84, 0.4);">Stream on Spotify</a>
          <a href="${featuredTrack.url}" target="_blank" class="btn btn-accent">Watch on YouTube</a>
          <a href="#discography" class="btn btn-outline">View All Tracks</a>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. DISCOGRAPHY GRID (All 57 Releases with Filter Pills) -->
  <section id="discography" class="section-wrap">
    <div class="section-head">
      <div class="kicker">COMPLETE RELEASES CATALOG</div>
      <h2>DISCOGRAPHY &amp; MUSIC ARCHIVE</h2>
    </div>

    <!-- Musize Filter Bar -->
    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterReleases('all', this)">ALL RELEASES (${catalog.videos.length})</button>
      <button class="filter-btn" onclick="filterReleases('song', this)">ORIGINAL SONGS (${songs.length})</button>
      <button class="filter-btn" onclick="filterReleases('short', this)">SHORTS &amp; REELS (${shorts.length})</button>
    </div>

    <!-- Grid -->
    <div class="discography-grid" id="discographyGrid">
      ${catalog.videos.map(v => {
        const slug = slugify(v.title.slice(0, 40)) || v.id;
        return `
        <div class="release-card" data-type="${v.type}" onclick="playTrackById('${v.id}')">
          <div class="release-thumb">
            <img src="${v.thumbnailUrl}" alt="${escapeHtml(v.title)}" loading="lazy">
            <span class="release-badge ${v.type}">${v.type === 'song' ? '🎵 Song' : '⚡ Short'}</span>
            <div class="play-hover-overlay">
              <div class="play-circle">▶</div>
            </div>
          </div>
          <div class="release-info">
            <h4 class="release-title">${escapeHtml(v.title)}</h4>
            <div class="release-meta">
              <span>${v.duration ? formatDuration(v.duration) : 'Short'}</span>
              <span>${v.views ? `${v.views.toLocaleString()} views` : ''}</span>
            </div>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  </section>

  <!-- 5. FEATURED VIDEO SHOWCASE (Musize Full Bleed) -->
  <section id="video" class="video-showcase-section">
    <div class="video-showcase-content">
      <button class="giant-play-btn" onclick="openVideoModal('ZezpkdBkOzk')">▶</button>
      <div class="kicker">OFFICIAL MUSIC VIDEO SHOWCASE</div>
      <h2 class="video-showcase-title">ECHO THROUGH THE CODE</h2>
      <p class="video-showcase-desc">
        Dive into the cyberpunk neon aesthetic. Fast-paced analog synthesizers and heavy basslines built for the open highway after dark.
      </p>
      <button class="btn btn-primary" onclick="openVideoModal('ZezpkdBkOzk')">
        WATCH FULL SCREEN (4K)
      </button>
    </div>
  </section>

  <!-- 6. ARTIST BIOGRAPHY (Musize 2-Column Split Section) -->
  <section id="about" class="artist-bio-section">
    <div class="bio-content">
      <div class="kicker">ABOUT MERAKI MUSICS</div>
      <h2>THE SOUL OF THE MACHINE</h2>
      <div class="bio-quote">
        "Meraki is a Greek word meaning to do something with soul, creativity, or love—to leave a piece of yourself in your work."
      </div>
      <p class="bio-text">
        That is the foundation of Meraki Musics. We create immersive, 80s-inspired synth-pop, retrowave, and cinematic electronic soundscapes designed for midnight drives, neon-lit cityscapes, and deep introspection.
      </p>
      <p class="bio-text">
        Every release blends the warm, nostalgic sound of vintage analog synthesizers with modern punchy beats, heavy basslines, and emotionally resonant storytelling.
      </p>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <a href="${brand.socials?.youtube || '#'}" target="_blank" class="btn btn-primary">Subscribe on YouTube</a>
        <a href="#contact" class="btn btn-outline">Booking &amp; Sync</a>
      </div>
    </div>
    <div class="bio-portrait-wrap">
      <div class="bio-portrait-backdrop"></div>
      <img src="assets/artist-bio.jpg" alt="Meraki Musics Producer" class="bio-portrait-img">
    </div>
  </section>

  <!-- 7. CONTACT & PLATFORMS -->
  <section id="contact" class="contact-section">
    <div class="contact-wrap">
      <div class="contact-col">
        <h3>Connect &amp; Collaborate</h3>
        <p>For music licensing, sync opportunities in film &amp; games, press inquiries, or remix collaborations:</p>
        
        <div class="contact-item">
          <div class="contact-icon">✉</div>
          <div class="contact-text">
            <div>Direct Inquiries:</div>
            <a href="mailto:${brand.socials?.email || 'merakimusicsofficial@gmail.com'}">${brand.socials?.email || 'merakimusicsofficial@gmail.com'}</a>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">▶</div>
          <div class="contact-text">
            <div>YouTube Channel:</div>
            <a href="${brand.socials?.youtube || '#'}" target="_blank">@merakiMusics</a>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-icon">📱</div>
          <div class="contact-text">
            <div>TikTok &amp; Reels:</div>
            <a href="${brand.socials?.tiktok || '#'}" target="_blank">@merakimusicsofficial</a>
          </div>
        </div>
      </div>

      <div class="contact-col">
        <h3>Newsletter &amp; VIP Releases</h3>
        <p>Get notified about new synthwave releases, stems, and behind-the-scenes production notes before public drop.</p>
        <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Thank you for subscribing to Meraki Musics!');">
          <input type="email" placeholder="Enter your email address..." class="newsletter-input" required>
          <button type="submit" class="btn btn-primary">Subscribe</button>
        </form>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="site-footer">
    <div style="display: flex; flex-direction: column; gap: 0.8rem;">
      <img src="assets/logo-banner.png" alt="Meraki Musics" style="max-height: 48px; object-fit: contain; align-self: flex-start; filter: drop-shadow(0 0 15px rgba(168,85,247,0.5));">
      <div>&copy; ${new Date().getFullYear()} Meraki Musics. All rights reserved. Powered by Meraki SEO Engine.</div>
    </div>
    <div class="footer-socials">
      <a href="${brand.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ'}" target="_blank" class="social-icon-btn" style="color: #1db954;">Spotify</a>
      <a href="${brand.socials?.youtube || '#'}" target="_blank" class="social-icon-btn">YouTube</a>
      <a href="${brand.socials?.tiktok || '#'}" target="_blank" class="social-icon-btn">TikTok</a>
      <a href="${brand.socials?.instagram || '#'}" target="_blank" class="social-icon-btn">Instagram</a>
      <a href="${baseUrl}/sitemap.xml" target="_blank" class="social-icon-btn">Sitemap</a>
    </div>
  </footer>

  <!-- 8. DOCKED REAL AUDIO / VIDEO STREAM ENGINE (Musize Picture-in-Picture) -->
  <div id="audioDockWidget" class="audio-dock-widget">
    <div class="audio-dock-header">
      <div class="audio-dock-status">
        <span class="live-eq-dot"></span>
        <span id="dockTrackName">${escapeHtml(featuredTrack.title.slice(0, 24))}</span>
      </div>
      <div class="audio-dock-controls">
        <button onclick="toggleDockMinimize(event)" id="dockMinBtn" class="dock-action-btn" title="Minimize / Expand">🗕</button>
        <button onclick="closeAudioDock(event)" class="dock-action-btn" title="Stop & Close">✕</button>
      </div>
    </div>
    <div class="audio-dock-frame-wrap" id="dockFrameWrap">
      <iframe id="audioStreamIframe"
        src=""
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  </div>

  <!-- PERSISTENT BOTTOM AUDIO / VIDEO PLAYER BAR -->
  <div class="persistent-player-bar">
    <div class="player-left">
      <img id="barThumb" src="${featuredTrack.thumbnailUrl}" alt="Thumbnail" class="player-thumb">
      <div class="player-info">
        <div id="barTitle" class="player-track-name">${escapeHtml(featuredTrack.title)}</div>
        <div class="player-artist-name">Meraki Musics</div>
      </div>
    </div>

    <div class="player-center">
      <div class="player-controls">
        <button class="control-btn" onclick="prevTrack()" title="Previous Track">⏮</button>
        <button class="control-btn control-btn-play" id="barPlayBtn" onclick="togglePlay()" title="Play/Pause">▶</button>
        <button class="control-btn" onclick="nextTrack()" title="Next Track">⏭</button>
      </div>
      <div class="progress-wrap">
        <span id="currTime">0:00</span>
        <div class="progress-bar-container" onclick="seekTrack(event)">
          <div class="progress-bar-fill" id="barProgress"></div>
        </div>
        <span id="totalTime">${formatDuration(featuredTrack.duration)}</span>
      </div>
    </div>

    <div class="player-right">
      <button class="btn btn-outline" style="padding: 0.4rem 0.9rem; font-size: 0.75rem;" onclick="toggleDockMinimize(event)" id="barVideoBtn" title="Toggle Visualizer Dock">
        <span>📺</span> <span id="barVideoText">Video Dock</span>
      </button>
      <a id="barYtLink" href="${featuredTrack.url}" target="_blank" class="btn btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.75rem;">
        YouTube
      </a>
    </div>
  </div>

  <!-- VIDEO LIGHTBOX MODAL -->
  <div class="video-modal" id="videoModal" onclick="closeVideoModal(event)">
    <div class="video-modal-content">
      <button class="modal-close-btn" onclick="closeVideoModal(null, true)">&times;</button>
      <iframe id="modalIframe" src="" allowfullscreen allow="autoplay"></iframe>
    </div>
  </div>

  <!-- PLAYBACK JAVASCRIPT ENGINE -->
  <script>
    const catalogData = ${JSON.stringify(catalog.videos.map(v => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      url: v.url,
      type: v.type
    })))};

    let currentIndex = 0;
    let currentVideoId = catalogData[0].id;
    let isPlaying = false;
    let progressTimer = null;
    let secondsElapsed = 0;

    function playTrackById(id) {
      const idx = catalogData.findIndex(v => v.id === id);
      if (idx !== -1) {
        currentIndex = idx;
        loadTrack(catalogData[idx]);
      }
      startPlayback(id || (catalogData[currentIndex] && catalogData[currentIndex].id));
    }

    function loadTrack(track) {
      currentVideoId = track.id;
      document.getElementById('barThumb').src = track.thumbnailUrl;
      document.getElementById('barTitle').textContent = track.title;
      document.getElementById('barYtLink').href = track.url;
      document.getElementById('totalTime').textContent = formatSeconds(track.duration || 210);
      document.getElementById('currTime').textContent = '0:00';
      document.getElementById('barProgress').style.width = '0%';
      const dockName = document.getElementById('dockTrackName');
      if (dockName) dockName.textContent = track.title.slice(0, 24);
      secondsElapsed = 0;
    }

    function startPlayback(videoId) {
      const id = videoId || currentVideoId;
      const iframe = document.getElementById('audioStreamIframe');
      const dock = document.getElementById('audioDockWidget');

      isPlaying = true;
      document.getElementById('barPlayBtn').textContent = '⏸';

      if (dock) {
        dock.style.display = 'flex';
      }

      if (iframe) {
        if (iframe.src && iframe.src.indexOf('/embed/' + id) !== -1) {
          sendIframeCommand('playVideo');
        } else {
          iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&enablejsapi=1&rel=0&playsinline=1&controls=1';
        }
      }

      if (progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(() => {
        secondsElapsed++;
        const total = (catalogData[currentIndex] && catalogData[currentIndex].duration) || 210;
        const pct = Math.min((secondsElapsed / total) * 100, 100);
        document.getElementById('barProgress').style.width = pct + '%';
        document.getElementById('currTime').textContent = formatSeconds(secondsElapsed);
        if (secondsElapsed >= total) {
          nextTrack();
        }
      }, 1000);
    }

    function pausePlayback() {
      isPlaying = false;
      document.getElementById('barPlayBtn').textContent = '▶';
      sendIframeCommand('pauseVideo');
      if (progressTimer) clearInterval(progressTimer);
    }

    function togglePlay() {
      if (isPlaying) {
        pausePlayback();
      } else {
        startPlayback(currentVideoId);
      }
    }

    function sendIframeCommand(func, args = []) {
      const iframe = document.getElementById('audioStreamIframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: func,
          args: args
        }), '*');
      }
    }

    function nextTrack() {
      currentIndex = (currentIndex + 1) % catalogData.length;
      loadTrack(catalogData[currentIndex]);
      startPlayback(catalogData[currentIndex].id);
    }

    function prevTrack() {
      currentIndex = (currentIndex - 1 + catalogData.length) % catalogData.length;
      loadTrack(catalogData[currentIndex]);
      startPlayback(catalogData[currentIndex].id);
    }

    function seekTrack(event) {
      const bar = event.currentTarget;
      const rect = bar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const pct = Math.max(0, Math.min(clickX / rect.width, 1));
      const total = (catalogData[currentIndex] && catalogData[currentIndex].duration) || 210;
      secondsElapsed = Math.floor(total * pct);
      sendIframeCommand('seekTo', [secondsElapsed, true]);
      document.getElementById('barProgress').style.width = (pct * 100) + '%';
      document.getElementById('currTime').textContent = formatSeconds(secondsElapsed);
    }

    function toggleDockMinimize(e) {
      if (e) e.stopPropagation();
      const dock = document.getElementById('audioDockWidget');
      if (!dock) return;
      dock.classList.toggle('minimized');
      const isMin = dock.classList.contains('minimized');
      const minBtn = document.getElementById('dockMinBtn');
      if (minBtn) minBtn.textContent = isMin ? '🗖' : '🗕';
      const barText = document.getElementById('barVideoText');
      if (barText) barText.textContent = isMin ? 'Show Video' : 'Hide Video';
    }

    function closeAudioDock(e) {
      if (e) e.stopPropagation();
      pausePlayback();
      const dock = document.getElementById('audioDockWidget');
      const iframe = document.getElementById('audioStreamIframe');
      if (dock) dock.style.display = 'none';
      if (iframe) iframe.src = '';
    }

    function formatSeconds(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function filterReleases(type, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cards = document.querySelectorAll('.release-card');
      cards.forEach(c => {
        if (type === 'all' || c.dataset.type === type) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }

    function openVideoModal(vidId) {
      const modal = document.getElementById('videoModal');
      const iframe = document.getElementById('modalIframe');
      iframe.src = 'https://www.youtube.com/embed/' + (vidId || currentVideoId) + '?autoplay=1&rel=0';
      modal.classList.add('active');
    }

    function closeVideoModal(event, force = false) {
      if (force || event.target.id === 'videoModal') {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('modalIframe');
        iframe.src = '';
        modal.classList.remove('active');
      }
    }
  </script>
</body>
</html>`;

  await fs.writeFile(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf-8');

  // 3. Generate Sitemap XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${generatedUrls.map(u => `  <url>
    <loc>${u}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.endsWith('/') ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');

  // 4. Generate Robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
  await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf-8');

  // 5. Generate RSS 2.0 Feed for Pinterest Auto-Pinning & Syndication
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Meraki Musics - 80s Synth-Pop &amp; Retrowave</title>
    <link>${baseUrl}/</link>
    <description>Where the pulse of the machine meets the human soul. 80s-inspired synth-pop and electronic soundscapes.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${catalog.videos.slice(0, 30).map(v => {
      const slug = slugify(v.title.slice(0, 40)) || v.id;
      const pageUrl = `${baseUrl}/tracks/${slug}.html`;
      const seo = v.seoPackage || {};
      const title = seo.youtube?.recommendedTitle || v.title;
      return `
    <item>
      <title>${escapeHtml(title)}</title>
      <link>${pageUrl}</link>
      <guid isPermaLink="true">${pageUrl}</guid>
      <description><![CDATA[${v.description || title}]]></description>
      <media:content url="${v.thumbnailUrl}" medium="image"/>
      <media:thumbnail url="${v.thumbnailUrl}"/>
      <pubDate>${new Date(v.publishedAt || Date.now()).toUTCString()}</pubDate>
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;

  await fs.writeFile(path.join(DIST_DIR, 'rss.xml'), rssXml, 'utf-8');

  return {
    pageCount: generatedUrls.length,
    distDir: DIST_DIR,
    sitemap: `${baseUrl}/sitemap.xml`,
    rss: `${baseUrl}/rss.xml`
  };
}
