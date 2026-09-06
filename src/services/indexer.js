import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../../config.json');
const LOG_FILE = path.resolve(__dirname, '../../indexing-log.json');

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { seo: { siteBaseUrl: 'https://merakimusics.github.io', indexNowKey: 'meraki-bot-key' } };
  }
}

async function logIndexAction(action, data) {
  let logs = [];
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    logs = JSON.parse(raw);
  } catch (e) {
    logs = [];
  }
  logs.unshift({
    action,
    timestamp: new Date().toISOString(),
    data
  });
  // Keep last 50 logs
  logs = logs.slice(0, 50);
  await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

/**
 * Submits URL list to IndexNow (Bing, Yandex, Seznam, Naver)
 */
export async function submitToIndexNow(urlList) {
  const config = await loadConfig();
  const siteUrl = config.seo?.siteBaseUrl || 'https://merakimusics.github.io';
  const parsedUrl = new URL(siteUrl);
  const host = parsedUrl.host;
  const key = config.seo?.indexNowKey || 'meraki-indexnow-key-2026';

  const payload = {
    host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList: Array.isArray(urlList) ? urlList : [urlList]
  };

  try {
    const resp = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const status = resp.status;
    const isSuccess = status === 200 || status === 202;
    const result = {
      status,
      success: isSuccess,
      urlsSubmitted: payload.urlList.length
    };

    await logIndexAction('IndexNow Submission', result);
    return result;
  } catch (err) {
    const errorResult = { success: false, error: err.message };
    await logIndexAction('IndexNow Failed', errorResult);
    return errorResult;
  }
}

/**
 * Pings Google Search sitemap endpoint
 */
export async function pingSearchEngines(sitemapUrl) {
  const config = await loadConfig();
  const sitemap = sitemapUrl || `${config.seo?.siteBaseUrl || 'https://merakimusics.github.io'}/sitemap.xml`;
  const results = [];

  // Google ping
  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`;
    const resp = await fetch(googlePingUrl, { method: 'GET' });
    results.push({ engine: 'Google', status: resp.status, success: resp.ok });
  } catch (err) {
    results.push({ engine: 'Google', error: err.message, success: false });
  }

  await logIndexAction('Sitemap Ping', results);
  return results;
}

export async function getIndexingLogs() {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
