import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFullAutopilotCycle } from './services/autopilot.js';

export const runSpotlightCycle = runFullAutopilotCycle;
export { runFullAutopilotCycle };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../config.json');

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { scheduler: { cronExpression: '0 9 * * *' } };
  }
}

/**
 * Starts background daemon in 100% Autopilot Mode
 */
export async function startScheduler() {
  const config = await loadConfig();
  const cronExpr = config.scheduler?.cronExpression || '0 9 * * *';

  console.log('========================================================');
  console.log('   🌌 MERAKI MUSICS 100% AUTOPILOT DAEMON STARTED 🌌   ');
  console.log(`   Schedule Cron: "${cronExpr}" (Daily at 9:00 AM)`);
  console.log('   Running silently in the background...');
  console.log('========================================================\n');

  // Run immediate bootstrap cycle on boot
  console.log('⚡ Running initial bootstrap autopilot cycle...');
  try {
    await runFullAutopilotCycle();
  } catch (e) {
    console.error('Initial cycle warning:', e.message);
  }

  // Schedule recurring cron
  cron.schedule(cronExpr, async () => {
    try {
      await runFullAutopilotCycle();
    } catch (err) {
      console.error('❌ Error during scheduled autopilot run:', err);
    }
  });

  // Also check hourly for any new video uploads
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('📡 [Hourly Check] Polling YouTube channel for new uploads...');
      await runFullAutopilotCycle();
    } catch (err) {
      console.error('Hourly check error:', err);
    }
  });

  console.log(`🕒 Bot is now actively monitoring your channel 24/7.`);
  console.log(`   - Checks hourly for new uploads`);
  console.log(`   - Executes daily spotlight & syndication at ${cronExpr}`);
}

// Allow direct execution: `node src/scheduler.js`
if (process.argv[1] && process.argv[1].endsWith('scheduler.js')) {
  startScheduler().catch(console.error);
}
