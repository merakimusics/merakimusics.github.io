import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const TOKENS_FILE = path.join(ROOT_DIR, 'youtube-tokens.json');
const CLIENT_SECRET_FILE = path.join(ROOT_DIR, 'client_secret.json');

/**
 * Checks if YouTube API credentials are configured
 */
export async function isYouTubeApiConfigured() {
  try {
    await fs.access(CLIENT_SECRET_FILE);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Updates video title, description, and tags directly on YouTube
 */
export async function updateYouTubeVideoDirect(videoId, seoPackage) {
  const configured = await isYouTubeApiConfigured();

  if (!configured) {
    return {
      updatedDirectly: false,
      reason: 'YouTube OAuth credentials (client_secret.json) not detected. Bot runs in semi-automated mode (copy-paste ready in dashboard).'
    };
  }

  try {
    // Read tokens
    const rawTokens = await fs.readFile(TOKENS_FILE, 'utf-8');
    const tokens = JSON.parse(rawTokens);
    const accessToken = tokens.access_token;

    const yt = seoPackage.youtube || {};
    const title = yt.recommendedTitle;
    const description = yt.description;
    const tags = yt.tags ? yt.tags.split(',').map(t => t.trim()) : [];

    const payload = {
      id: videoId,
      snippet: {
        title,
        description,
        tags,
        categoryId: '10' // Music Category
      }
    };

    const resp = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      throw new Error(`YouTube API returned ${resp.status}: ${await resp.text()}`);
    }

    const data = await resp.json();
    return {
      updatedDirectly: true,
      videoId,
      newTitle: data.snippet?.title
    };
  } catch (err) {
    return {
      updatedDirectly: false,
      error: err.message
    };
  }
}
