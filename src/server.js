import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { 
  syncCatalog, 
  getAllVideos, 
  getVideoById, 
  saveVideoSeo, 
  getStats,
  recordPromotion
} from './services/catalog.js';
import { generateSeoForVideo } from './services/seoGenerator.js';
import { buildStaticSite } from './services/siteGenerator.js';
import { submitToIndexNow, pingSearchEngines, getIndexingLogs } from './services/indexer.js';
import { runSpotlightCycle } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(ROOT_DIR, 'config.json');
const SCHEDULER_LOG = path.join(ROOT_DIR, 'scheduler-log.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(ROOT_DIR, 'public')));
app.use('/preview', express.static(path.join(ROOT_DIR, 'dist')));

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await getAllVideos();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await getVideoById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncCatalog();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spotlight', async (req, res) => {
  try {
    const result = await runSpotlightCycle();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimize/:id', async (req, res) => {
  try {
    const video = await getVideoById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    const seo = await generateSeoForVideo(video);
    await saveVideoSeo(video.id, seo);
    res.json({ success: true, video: await getVideoById(video.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimize-all', async (req, res) => {
  try {
    const videos = await getAllVideos();
    let count = 0;
    for (const v of videos) {
      const seo = await generateSeoForVideo(v);
      await saveVideoSeo(v.id, seo);
      count++;
    }
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/build-site', async (req, res) => {
  try {
    const result = await buildStaticSite();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/index', async (req, res) => {
  try {
    const configRaw = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configRaw);
    const siteUrl = config.seo?.siteBaseUrl || 'https://merakimusics.github.io';
    const indexRes = await submitToIndexNow([`${siteUrl}/`]);
    const pingRes = await pingSearchEngines(`${siteUrl}/sitemap.xml`);
    res.json({ indexNow: indexRes, sitemap: pingRes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(raw);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    res.json({ success: true, config: newConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    let schedulerLogs = [];
    try {
      const raw = await fs.readFile(SCHEDULER_LOG, 'utf-8');
      schedulerLogs = JSON.parse(raw);
    } catch (e) {}

    const indexLogs = await getIndexingLogs();
    res.json({ scheduler: schedulerLogs, indexing: indexLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌌 MERAKI MUSICS SEO DASHBOARD RUNNING ON:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 Static SEO Hub Preview: http://localhost:${PORT}/preview`);
    console.log(`======================================================\n`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}
