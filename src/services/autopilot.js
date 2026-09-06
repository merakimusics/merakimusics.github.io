import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncCatalog, getNextSpotlightVideo, saveVideoSeo, recordPromotion, getAllVideos } from './catalog.js';
import { generateSeoForVideo } from './seoGenerator.js';
import { buildStaticSite } from './siteGenerator.js';
import { submitToIndexNow, pingSearchEngines } from './indexer.js';
import { broadcastToDiscord } from './webhookDispatcher.js';
import { autoDeployToGitHub } from './gitDeploy.js';
import { updateYouTubeVideoDirect } from './youtubeDirect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.resolve(__dirname, '../../autopilot-log.json');

async function logAutopilotRun(summary) {
  let logs = [];
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    logs = JSON.parse(raw);
  } catch (e) {
    logs = [];
  }
  logs.unshift({
    timestamp: new Date().toISOString(),
    ...summary
  });
  logs = logs.slice(0, 50);
  await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

/**
 * 100% Zero-Touch Autopilot Routine
 */
export async function runFullAutopilotCycle() {
  const startTime = Date.now();
  console.log('\n======================================================');
  console.log(`🚀 [${new Date().toLocaleTimeString()}] EXECUTING 100% AUTOPILOT CYCLE`);
  console.log('======================================================\n');

  // Step 1: Ingest complete catalog
  console.log('📡 [1/6] Ingesting all channel tracks & shorts...');
  const syncRes = await syncCatalog();
  console.log(`   ✅ Catalog synchronized: ${syncRes.total} total tracks.`);

  // Step 2: Ensure any unoptimized tracks are optimized
  console.log('🧠 [2/6] Checking for unoptimized tracks...');
  const allVideos = await getAllVideos();
  let newlyOptimized = 0;
  for (const v of allVideos) {
    if (!v.seoPackage) {
      const seo = await generateSeoForVideo(v);
      await saveVideoSeo(v.id, seo);
      newlyOptimized++;
    }
  }
  if (newlyOptimized > 0) {
    console.log(`   ✅ Auto-generated SEO packages for ${newlyOptimized} new tracks.`);
  } else {
    console.log('   ✅ All 57+ tracks have up-to-date SEO packages.');
  }

  // Step 3: Pick Spotlight Video & Direct Update
  console.log('⭐ [3/6] Rotating Daily Spotlight track...');
  const spotlight = await getNextSpotlightVideo();
  if (spotlight) {
    console.log(`   🎯 Selected: "${spotlight.title}" (${spotlight.id})`);
    
    // Direct YouTube update attempt (if credentials exist)
    const ytUpdateRes = await updateYouTubeVideoDirect(spotlight.id, spotlight.seoPackage);
    if (ytUpdateRes.updatedDirectly) {
      console.log(`   🎉 Directly updated YouTube video live via API: "${ytUpdateRes.newTitle}"`);
    } else {
      console.log(`   ℹ️ Direct YouTube update: ${ytUpdateRes.reason || ytUpdateRes.error || 'Ready for copy-paste'}`);
    }

    // Record promotion
    await recordPromotion(spotlight.id, 'autopilot_daily_spotlight', {
      title: spotlight.title,
      type: spotlight.type
    });
  }

  // Step 4: Re-build Static SEO Hub & RSS
  console.log('🌐 [4/6] Re-building static SEO Hub with Schema.org & Pinterest RSS...');
  const siteRes = await buildStaticSite();
  console.log(`   ✅ Generated ${siteRes.pageCount} static HTML pages + sitemap + rss.xml`);

  // Step 5: Search Engine Indexing (IndexNow + Google)
  console.log('⚡ [5/6] Dispatching IndexNow to Bing, Yandex & Google...');
  const indexRes = await submitToIndexNow([siteRes.sitemap.replace('/sitemap.xml', '/')]);
  const pingRes = await pingSearchEngines(siteRes.sitemap);
  console.log(`   ✅ IndexNow status: ${indexRes.status || 'dispatched'}. Search engines notified.`);

  // Step 6: Multi-Channel Syndication (Discord & GitHub Auto-Deploy)
  console.log('📣 [6/6] Multi-channel syndication & auto-deployment...');
  let discordRes = { dispatched: false, reason: 'Skipped' };
  if (spotlight) {
    discordRes = await broadcastToDiscord(spotlight, spotlight.seoPackage);
    if (discordRes.dispatched) {
      console.log('   🎉 Broadcasted rich embed to Discord community!');
    } else {
      console.log(`   ℹ️ Discord: ${discordRes.reason || discordRes.error || 'Configured'}`);
    }
  }

  const gitRes = await autoDeployToGitHub();
  if (gitRes.deployed) {
    console.log('   🎉 Auto-pushed static pages to GitHub Pages!');
  } else {
    console.log(`   ℹ️ Git deploy: ${gitRes.reason || 'Local dist/ updated'}`);
  }

  const durationMs = Date.now() - startTime;
  const summary = {
    totalVideos: syncRes.total,
    spotlightTrack: spotlight ? { id: spotlight.id, title: spotlight.title } : null,
    staticPagesGenerated: siteRes.pageCount,
    indexNowAccepted: indexRes.success !== false,
    durationSeconds: (durationMs / 1000).toFixed(1)
  };

  await logAutopilotRun(summary);

  console.log('\n======================================================');
  console.log(`🎉 AUTOPILOT CYCLE COMPLETE in ${summary.durationSeconds}s!`);
  console.log(`   Bot is now active in background waiting for next cycle.`);
  console.log('======================================================\n');

  return summary;
}
