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
  } catch (e) {
    return {};
  }
}

/**
 * Dispatches rich announcement embed to Discord Webhooks
 */
export async function broadcastToDiscord(video, seoPackage) {
  const config = await loadConfig();
  const webhookUrl = config.api?.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return {
      dispatched: false,
      reason: 'No Discord webhook URL configured in config.json'
    };
  }

  const seo = seoPackage || video.seoPackage || {};
  const title = seo.youtube?.recommendedTitle || video.title;
  const ytUrl = video.url || `https://www.youtube.com/watch?v=${video.id}`;
  const brand = config.brand || {};

  const embed = {
    title: `⚡ Meraki Musics Spotlight: ${title}`,
    url: ytUrl,
    description: (video.description || seo.youtube?.description || 'Atmospheric 80s synth-pop and retrowave soundscapes.').slice(0, 240) + '...',
    color: 0xff2a85, // Neon Magenta
    fields: [
      {
        name: '🎵 Genre',
        value: '80s Synth-pop / Retrowave',
        inline: true
      },
      {
        name: '⚡ Format',
        value: video.type === 'short' ? 'Vertical Short / Reel' : 'Full Track Release',
        inline: true
      },
      {
        name: '🔗 Connect',
        value: `[YouTube](${ytUrl}) • [TikTok](${brand.socials?.tiktok || '#'}) • [Instagram](${brand.socials?.instagram || '#'})`,
        inline: false
      }
    ],
    image: {
      url: video.thumbnailUrl
    },
    footer: {
      text: 'Meraki Musics • Where the pulse of the machine meets the human soul.'
    },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Meraki SEO Bot',
        avatar_url: 'https://i.ytimg.com/vi/4plhvUQnq5s/hqdefault.jpg',
        embeds: [embed]
      })
    });

    return {
      dispatched: res.ok,
      status: res.status
    };
  } catch (err) {
    return {
      dispatched: false,
      error: err.message
    };
  }
}
