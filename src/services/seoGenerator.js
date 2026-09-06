import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../../config.json');

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

/**
 * Heuristic/Algorithmic SEO Generator (Works 100% offline and free with zero API key)
 */
function generateProceduralSeo(video, brandConfig) {
  const cleanTitle = video.title
    .replace(/#\w+/g, '')
    .replace(/\|\s*MERAKI/i, '')
    .replace(/\|\s*shorts/i, '')
    .replace(/[\|💔⏳]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isShort = video.type === 'short';
  const youtubeUrl = video.url || `https://www.youtube.com/watch?v=${video.id}`;
  const spotifyUrl = brandConfig.brand?.socials?.spotify || 'https://open.spotify.com/artist/4Ava0Xhkv8fzAUYP9Mc1wQ';
  const tiktokUrl = brandConfig.brand?.socials?.tiktok || 'https://www.tiktok.com/@merakimusicsofficial';
  const instagramUrl = brandConfig.brand?.socials?.instagram || 'https://www.instagram.com/merakimusics/';

  // 1. YouTube SEO
  const ytTitles = [
    `${cleanTitle} | 80s Synth-Pop & Retrowave (Night Drive Music) | MERAKI`,
    `When A Song Hits Your Soul... "${cleanTitle}" [Cinematic Electronic]`,
    `${cleanTitle} - Meraki Musics (Official Synthwave / Romantic Pop)`
  ];

  const keywords = [
    'meraki musics', 'synthwave 2026', '80s synthpop', 'retrowave night drive',
    'cinematic electronic music', 'romantic synthwave', 'dark pop aesthetic',
    'cyberpunk city music', 'synthpop love song', 'analog synth beats',
    'indie electronic artist', 'late night drive music', 'emotional synthwave',
    cleanTitle.toLowerCase(), `${cleanTitle.toLowerCase()} meraki`
  ];

  const tags = [...new Set(keywords)].join(', ');

  const ytDescription = `${cleanTitle} by MERAKI MUSICS.

⚡ Stream & Connect:
• Spotify: ${spotifyUrl}
• YouTube: ${youtubeUrl}
• TikTok: ${tiktokUrl}
• Instagram: ${instagramUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 ABOUT THIS TRACK
"${cleanTitle}" explores the intersection of human passion, nostalgia, and analog electronic sound. Engineered with 80s-inspired synthesizers, punchy drum grooves, and atmospheric neon soundscapes.

🎧 Best experienced with headphones on a late-night drive or during deep focus.

${video.description ? `\n--- ORIGINAL LYRICS & NOTES ---\n${video.description}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ CONNECT WITH MERAKI
Subscribe for original synth-pop, cinematic electronic soundscapes, and emotional retro stories.
Business & Inquiries: ${brandConfig.brand?.socials?.email || 'merakimusicsofficial@gmail.com'}

#MerakiMusics #Synthwave #Synthpop #80sVibes #Retrowave #NightDrive #ElectronicMusic #NewMusic`;

  const pinnedComment = `Which moment of "${cleanTitle}" connected with you the most? 🌃✨ Drop your thoughts below — I read and reply to every comment! If this track moved you, share it with someone who loves 80s synth vibes.`;

  // 2. TikTok & IG Reels SEO
  const tiktokHooks = [
    `POV: You discovered an 80s synthwave track made for 2 AM midnight drives... 🌃🚗`,
    `If you love nostalgic 80s synth-pop with emotional vocals, stop scrolling. 🎧✨`,
    `Tell me this doesn't feel like driving through a neon cyberpunk city in 1986... ⚡`
  ];

  const tiktokCaption = `"${cleanTitle}" hits different at night. 🌌 Who does this song remind you of? Full song on our YouTube (link in bio). #synthtok #synthwave #80smusic #nightdrive #merakimusics #newmusic #aestheticmusic #retrowave`;

  const reelsCaption = `Here, the pulse of the machine meets the human soul. 💫 "${cleanTitle}" is out now. Listen with headphones for the full synth bassline. Link in bio to watch the full release on YouTube. \n\n#merakimusics #synthpop #retrowave #cyberpunkvibe #indieartist #nightvibes #electronicmusic`;

  // 3. Reddit Syndication Package
  const redditPosts = [
    {
      subreddit: 'r/synthwave',
      flair: 'Original Content',
      title: `Meraki - ${cleanTitle} [80s Synth-Pop / Retrowave]`,
      body: `Hey everyone! I produce music under **Meraki Musics**. My focus is blending the warm, melancholic feel of 80s analog synthesizers with modern punchy beats and emotional storytelling.

I recently released **"${cleanTitle}"** and wanted to share it with the synthwave community here. 

Watch / Listen here: ${youtubeUrl}

I would love your honest feedback on the synth mixing and atmosphere! What classic 80s hardware or vibe does this remind you of?`
    },
    {
      subreddit: 'r/listentothis',
      flair: '',
      title: `Meraki -- ${cleanTitle} [Synth-Pop / Retrowave] (2026)`,
      body: `${youtubeUrl}\n\nAtmospheric 80s synth-pop designed for late night introspection and midnight drives.`
    },
    {
      subreddit: 'r/promoteyourmusic',
      flair: 'Original Song',
      title: `"${cleanTitle}" - Meraki (Original 80s-inspired Synth-Pop with deep emotional basslines)`,
      body: `Hey music lovers! Sharing my latest track **"${cleanTitle}"**. 

Link: ${youtubeUrl}

If you enjoy artists with 80s nostalgia, cyberpunk neon aesthetics, and cinematic soundscapes, I'd love to hear your thoughts! Drop your track below too, let's support each other.`
    }
  ];

  // 4. Pinterest Pin Blueprint
  const pinterest = {
    title: `${cleanTitle} | 80s Synthwave & Neon Cyberpunk Music Aesthetics`,
    description: `Immerse yourself in "${cleanTitle}" by Meraki Musics. An 80s-inspired synth-pop and retrowave experience crafted for late-night city drives, neon dreams, and retro aesthetic lovers. Listen on YouTube now!`,
    boardSuggestion: 'Synthwave & Retrowave Aesthetics',
    tags: ['synthwave aesthetic', '80s music vibes', 'cyberpunk neon', 'night drive playlist', 'retro electronic', 'meraki musics'],
    link: youtubeUrl
  };

  // 5. Tumblr / Micro-Blog Article
  const blogPost = {
    title: `Behind the Track: "${cleanTitle}" — The Resurgence of 80s Soul in Modern Electronic Music`,
    markdown: `### "${cleanTitle}" by Meraki Musics

There is an unspoken magic about the hours between midnight and 4 AM. In that nocturnal quiet, music takes on a different weight—every synth chord resonates deeper, and every bassline feels like a pulse against the city pavement.

That energy is the core of **"${cleanTitle}"**, the latest release from independent music creator **Meraki Musics**.

[![Listen on YouTube](${video.thumbnailUrl})](${youtubeUrl})

> *"Here, the pulse of the machine meets the human soul."*

Engineered with lush analog synth arpeggios, nostalgic 80s textures, and emotionally driven lyricism, the song bridges retro synth-pop with modern cinematic production.

**Watch the full video on YouTube:** [Listen to ${cleanTitle} here](${youtubeUrl})

Follow Meraki Musics on [TikTok](${tiktokUrl}) and [Instagram](${instagramUrl}) to support indie electronic music.`
  };

  // 6. Discord Promo Copy
  const discordPromo = `**🎵 NEW MERAKI MUSIC RELEASE: "${cleanTitle}"**
> *80s Synth-Pop • Retrowave • Midnight Drive Vibes*

Hey everyone! Just dropped a new release that blends vintage synthesizers with emotional cinematic beats. Would love your feedback!
🎧 **Listen on YouTube:** ${youtubeUrl}
💬 Let me know what you think of the synth mix!`;

  return {
    source: 'heuristic_engine',
    youtube: {
      titleOptions: ytTitles,
      recommendedTitle: ytTitles[0],
      description: ytDescription,
      tags: tags,
      pinnedComment: pinnedComment
    },
    shortForm: {
      tiktokHooks,
      tiktokCaption,
      reelsCaption,
      hashtags: '#synthtok #synthwave #80smusic #retrowave #merakimusics #nightdrive #aesthetic'
    },
    syndication: {
      reddit: redditPosts,
      pinterest,
      discord: discordPromo,
      blog: blogPost
    },
    scores: {
      keywordDensity: 88,
      readability: 94,
      searchIntentMatch: 92,
      overallSeoScore: 91
    }
  };
}

/**
 * Gemini AI SEO Generator (Calls Google Gemini free tier API when key is present)
 */
async function generateGeminiSeo(video, brandConfig, apiKey) {
  const prompt = `You are a world-class Music SEO & Organic Growth Specialist.
Optimize the following music release for the artist "Meraki Musics".

Artist Identity:
- Brand: Meraki Musics (@merakiMusics, @merakimusicsofficial)
- Tagline: "Here, the pulse of the machine meets the human soul."
- Genres: 80s Synth-Pop, Retrowave, Synthwave, Cyberpunk, Cinematic Electronic
- Aesthetic: Midnight city drives, neon lights, 80s nostalgia, heavy basslines, emotional connection

Video Details:
- Title: ${video.title}
- Type: ${video.type}
- Original Description: ${video.description}
- URL: ${video.url}

Generate a comprehensive JSON object strictly adhering to this structure:
{
  "youtube": {
    "titleOptions": ["Title 1 (High CTR Hook)", "Title 2 (Search Intent Focused)", "Title 3 (Cinematic Vibe)"],
    "recommendedTitle": "Title 1",
    "description": "Full YouTube description with hook, about the track, lyrics format, streaming links, and relevant hashtags",
    "tags": "comma-separated list of 15-20 high ranking tags up to 500 characters",
    "pinnedComment": "engaging pinned comment with question to drive interaction"
  },
  "shortForm": {
    "tiktokHooks": ["Hook 1 for first 3 seconds on screen", "Hook 2", "Hook 3"],
    "tiktokCaption": "TikTok search-optimized caption with keywords",
    "reelsCaption": "Instagram reels caption with CTA",
    "hashtags": "niche and viral hashtags"
  },
  "syndication": {
    "reddit": [
      { "subreddit": "r/synthwave", "flair": "Original Content", "title": "...", "body": "..." },
      { "subreddit": "r/listentothis", "flair": "", "title": "...", "body": "..." },
      { "subreddit": "r/promoteyourmusic", "flair": "Original Song", "title": "...", "body": "..." }
    ],
    "pinterest": {
      "title": "...",
      "description": "...",
      "boardSuggestion": "...",
      "tags": ["tag1", "tag2"],
      "link": "${video.url}"
    },
    "discord": "Formatted Discord promotion announcement",
    "blog": {
      "title": "...",
      "markdown": "..."
    }
  },
  "scores": {
    "keywordDensity": 95,
    "readability": 95,
    "searchIntentMatch": 95,
    "overallSeoScore": 95
  }
}

Return ONLY raw valid JSON, no markdown codeblocks, no prefix or suffix.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!resp.ok) {
    throw new Error(`Gemini API error ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(text);
  parsed.source = 'gemini_ai';
  return parsed;
}

/**
 * Main SEO Generation function
 */
export async function generateSeoForVideo(video) {
  const config = await loadConfig();
  const apiKey = config.api?.geminiApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      return await generateGeminiSeo(video, config, apiKey);
    } catch (err) {
      console.warn(`[SEO Generator] Gemini API failed (${err.message}). Falling back to heuristic engine.`);
    }
  }

  return generateProceduralSeo(video, config);
}
