#!/usr/bin/env node
import { syncCatalog, getAllVideos, getVideoById, saveVideoSeo, getStats } from './services/catalog.js';
import { generateSeoForVideo } from './services/seoGenerator.js';
import { buildStaticSite } from './services/siteGenerator.js';
import { submitToIndexNow, pingSearchEngines } from './services/indexer.js';
import { runSpotlightCycle } from './scheduler.js';

const command = process.argv[2] || 'help';

async function main() {
  switch (command) {
    case 'sync': {
      console.log('📡 Fetching videos from Meraki Musics YouTube feed...');
      const res = await syncCatalog();
      console.log(`✅ Synced! Total videos: ${res.total} (New: ${res.newCount}, Updated: ${res.updatedCount})`);
      break;
    }

    case 'list': {
      const videos = await getAllVideos();
      console.log('\n================== MERAKI MUSICS CATALOG ==================');
      videos.forEach((v, idx) => {
        const seoBadge = v.seoPackage ? '✨ Optimized' : '⚪ Unoptimized';
        const typeBadge = v.type === 'short' ? '[Short]' : '[Song] ';
        console.log(`${(idx + 1).toString().padStart(2, ' ')}. ${typeBadge} ${v.id} | ${v.title.slice(0, 48).padEnd(48, ' ')} | ${seoBadge} | ${v.views || 0} views`);
      });
      console.log('===========================================================\n');
      break;
    }

    case 'spotlight': {
      await runSpotlightCycle();
      break;
    }

    case 'optimize': {
      const id = process.argv[3];
      if (!id) {
        console.error('❌ Please provide a video ID: node src/cli.js optimize <videoId>');
        process.exit(1);
      }
      const video = await getVideoById(id);
      if (!video) {
        console.error(`❌ Video ID ${id} not found in catalog.`);
        process.exit(1);
      }
      console.log(`🧠 Generating SEO for "${video.title}"...`);
      const seo = await generateSeoForVideo(video);
      await saveVideoSeo(id, seo);
      console.log('\n🎯 OPTIMIZED PACKAGE:');
      console.log('-----------------------------------------------------------');
      console.log('Recommended Title:', seo.youtube.recommendedTitle);
      console.log('TikTok Hook:', seo.shortForm.tiktokHooks[0]);
      console.log('Tags Preview:', seo.youtube.tags.slice(0, 80) + '...');
      console.log('Overall SEO Score:', seo.scores.overallSeoScore, '/ 100');
      console.log('-----------------------------------------------------------\n');
      break;
    }

    case 'optimize-all': {
      console.log('🧠 Optimizing entire catalog...');
      const videos = await getAllVideos();
      let count = 0;
      for (const v of videos) {
        process.stdout.write(`Optimizing [${++count}/${videos.length}] ${v.title.slice(0, 30)}... `);
        const seo = await generateSeoForVideo(v);
        await saveVideoSeo(v.id, seo);
        console.log(`Done! Score: ${seo.scores.overallSeoScore}`);
      }
      console.log(`\n🎉 Successfully optimized all ${videos.length} videos!\n`);
      break;
    }

    case 'build-site': {
      console.log('🌐 Building static SEO web hub...');
      const res = await buildStaticSite();
      console.log(`✅ Static hub built successfully!`);
      console.log(`📁 Directory: ${res.distDir}`);
      console.log(`📄 Pages: ${res.pageCount}`);
      console.log(`🗺️ Sitemap: ${res.sitemap}`);
      break;
    }

    case 'index': {
      console.log('⚡ Notifying search engines...');
      const indexRes = await submitToIndexNow(['https://merakimusics.github.io/']);
      const pingRes = await pingSearchEngines();
      console.log('IndexNow result:', indexRes);
      console.log('Sitemap ping result:', pingRes);
      break;
    }

    case 'stats': {
      const stats = await getStats();
      console.log('\n📊 MERAKI SEO BOT STATS:');
      console.log('--------------------------------');
      console.log(`Total Videos Tracked: ${stats.total}`);
      console.log(`Full Songs:           ${stats.songs}`);
      console.log(`Shorts / Reels:       ${stats.shorts}`);
      console.log(`SEO Optimized:        ${stats.optimized}`);
      console.log(`Pending Optimization: ${stats.pending}`);
      console.log(`Total Views Tracked:  ${stats.totalViews}`);
      console.log(`Last Sync:            ${stats.lastSync || 'Never'}`);
      console.log('--------------------------------\n');
      break;
    }

    case 'autopilot': {
      const { runFullAutopilotCycle } = await import('./services/autopilot.js');
      await runFullAutopilotCycle();
      break;
    }

    default: {
      console.log(`
Meraki Musics SEO Bot CLI Usage:
  node src/cli.js autopilot     - Run 100% zero-touch autopilot cycle (sync, SEO, hub, IndexNow, syndication)
  node src/cli.js sync          - Fetch latest videos from YouTube (all 57+ tracks)
  node src/cli.js list          - List catalog videos and SEO status
  node src/cli.js spotlight     - Run 1-track daily spotlight routine
  node src/cli.js optimize <id> - Generate SEO package for specific video
  node src/cli.js optimize-all  - Generate SEO packages for all videos
  node src/cli.js build-site    - Build static SEO website with Schema.org & RSS
  node src/cli.js index         - Submit URLs to IndexNow and ping Google
  node src/cli.js stats         - Display catalog statistics
      `);
    }
  }
}

main().catch(err => {
  console.error('❌ CLI Error:', err);
  process.exit(1);
});
