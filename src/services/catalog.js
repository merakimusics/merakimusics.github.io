import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../catalog.json');
const CONFIG_FILE = path.resolve(__dirname, '../../config.json');
const EXPORTER_SCRIPT = path.resolve(__dirname, 'export_full_catalog.py');

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      brand: {
        youtubeChannelId: 'UC1QvOaUTD7USb8Rh3AeXUjw'
      }
    };
  }
}

export async function loadCatalog() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      lastSync: null,
      lastSpotlightId: null,
      videos: []
    };
  }
}

export async function saveCatalog(data) {
  const tmpFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpFile, DATA_FILE);
}

/**
 * Robust XML entry parser for YouTube RSS feed
 */
function parseRssXml(xmlText) {
  const entries = [];
  const entryBlocks = xmlText.split('<entry>');
  
  for (let i = 1; i < entryBlocks.length; i++) {
    const block = entryBlocks[i];
    
    const extractTag = (tag) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    const extractAttr = (tag, attr) => {
      const match = block.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i'));
      return match ? match[1] : '';
    };

    const videoId = extractTag('yt:videoId') || extractAttr('yt:videoId', 'value');
    const title = extractTag('title')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    const published = extractTag('published');
    const updated = extractTag('updated');
    const description = extractTag('media:description')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
      
    const thumbnailUrl = extractAttr('media:thumbnail', 'url') || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const views = parseInt(extractAttr('media:statistics', 'views') || '0', 10);
    const starCount = parseInt(extractAttr('media:starRating', 'count') || '0', 10);
    const starAverage = parseFloat(extractAttr('media:starRating', 'average') || '5.0');
    
    const link = extractAttr('link', 'href') || `https://www.youtube.com/watch?v=${videoId}`;
    const isShort = title.toLowerCase().includes('#shorts') || 
                    link.includes('/shorts/') || 
                    description.toLowerCase().includes('#shorts');

    if (videoId && title) {
      entries.push({
        id: videoId,
        title,
        description,
        publishedAt: published,
        updatedAt: updated,
        thumbnailUrl,
        url: link,
        views,
        rating: { count: starCount, average: starAverage },
        type: isShort ? 'short' : 'song'
      });
    }
  }

  return entries;
}

/**
 * Fetch all videos and shorts from channel using yt-dlp
 */
async function fetchAllViaYtDlp(channelUrl) {
  try {
    const { stdout } = await execAsync(`py "${EXPORTER_SCRIPT}" "${channelUrl}"`, { maxBuffer: 1024 * 1024 * 10 });
    return JSON.parse(stdout);
  } catch (err) {
    console.warn(`[Catalog] yt-dlp channel extraction warning: ${err.message}. Relying on RSS feed.`);
    return [];
  }
}

/**
 * Synchronizes catalog with full channel catalog and RSS feed
 */
export async function syncCatalog() {
  const config = await loadConfig();
  const channelUrl = config.brand?.socials?.youtube || 'https://www.youtube.com/@merakiMusics';
  const channelId = config.brand?.socials?.youtubeChannelId || 'UC1QvOaUTD7USb8Rh3AeXUjw';
  
  // 1. Fetch all videos from channel via yt-dlp
  const fullList = await fetchAllViaYtDlp(channelUrl);

  // 2. Fetch latest videos from RSS feed for rich descriptions
  let rssVideos = [];
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MerakiBot/1.0' }
    });
    if (response.ok) {
      const xml = await response.text();
      rssVideos = parseRssXml(xml);
    }
  } catch (e) {
    console.warn('[Catalog] RSS fetch skipped or failed:', e.message);
  }

  const rssMap = new Map(rssVideos.map(v => [v.id, v]));

  // Merge full list with RSS descriptions
  const combinedFetched = [];
  const processedIds = new Set();

  for (const item of fullList) {
    processedIds.add(item.id);
    const rss = rssMap.get(item.id);
    combinedFetched.push({
      id: item.id,
      title: item.title,
      description: rss ? rss.description : item.description || '',
      publishedAt: rss ? rss.publishedAt : item.publishedAt,
      thumbnailUrl: item.thumbnailUrl,
      url: item.url,
      views: item.views || (rss ? rss.views : 0),
      duration: item.duration,
      type: item.type
    });
  }

  // Any extra items in RSS not in fullList
  for (const r of rssVideos) {
    if (!processedIds.has(r.id)) {
      combinedFetched.push(r);
      processedIds.add(r.id);
    }
  }

  const catalog = await loadCatalog();
  const existingMap = new Map(catalog.videos.map(v => [v.id, v]));

  let newCount = 0;
  let updatedCount = 0;

  for (const fv of combinedFetched) {
    if (existingMap.has(fv.id)) {
      const existing = existingMap.get(fv.id);
      existing.title = fv.title;
      if (fv.description && !existing.description) existing.description = fv.description;
      existing.thumbnailUrl = fv.thumbnailUrl;
      if (fv.views) existing.views = fv.views;
      existing.type = fv.type;
      existing.url = fv.url;
      updatedCount++;
    } else {
      catalog.videos.push({
        ...fv,
        seoPackage: null,
        lastPromotedAt: null,
        promotionCount: 0,
        promotionHistory: []
      });
      newCount++;
    }
  }

  catalog.lastSync = new Date().toISOString();
  await saveCatalog(catalog);

  return {
    total: catalog.videos.length,
    newCount,
    updatedCount,
    lastSync: catalog.lastSync
  };
}

export async function getAllVideos() {
  const catalog = await loadCatalog();
  return catalog.videos;
}

export async function getVideoById(id) {
  const catalog = await loadCatalog();
  return catalog.videos.find(v => v.id === id) || null;
}

export async function saveVideoSeo(id, seoPackage) {
  const catalog = await loadCatalog();
  const video = catalog.videos.find(v => v.id === id);
  if (!video) throw new Error(`Video ${id} not found in catalog`);

  video.seoPackage = {
    ...seoPackage,
    generatedAt: new Date().toISOString()
  };

  await saveCatalog(catalog);
  return video;
}

export async function getNextSpotlightVideo() {
  const catalog = await loadCatalog();
  if (!catalog.videos || catalog.videos.length === 0) return null;

  const sorted = [...catalog.videos].sort((a, b) => {
    if (!a.lastPromotedAt && b.lastPromotedAt) return -1;
    if (a.lastPromotedAt && !b.lastPromotedAt) return 1;
    if (!a.lastPromotedAt && !b.lastPromotedAt) {
      return (b.views || 0) - (a.views || 0);
    }
    return new Date(a.lastPromotedAt).getTime() - new Date(b.lastPromotedAt).getTime();
  });

  return sorted[0];
}

export async function recordPromotion(id, platform, details = {}) {
  const catalog = await loadCatalog();
  const video = catalog.videos.find(v => v.id === id);
  if (!video) throw new Error(`Video ${id} not found`);

  const now = new Date().toISOString();
  video.lastPromotedAt = now;
  video.promotionCount = (video.promotionCount || 0) + 1;
  if (!video.promotionHistory) video.promotionHistory = [];

  video.promotionHistory.push({
    platform,
    timestamp: now,
    ...details
  });

  catalog.lastSpotlightId = id;
  await saveCatalog(catalog);
  return video;
}

export async function getStats() {
  const catalog = await loadCatalog();
  const total = catalog.videos.length;
  const songs = catalog.videos.filter(v => v.type === 'song').length;
  const shorts = catalog.videos.filter(v => v.type === 'short').length;
  const optimized = catalog.videos.filter(v => !!v.seoPackage).length;
  const totalViews = catalog.videos.reduce((acc, v) => acc + (v.views || 0), 0);

  return {
    total,
    songs,
    shorts,
    optimized,
    pending: total - optimized,
    totalViews,
    lastSync: catalog.lastSync,
    lastSpotlightId: catalog.lastSpotlightId
  };
}
