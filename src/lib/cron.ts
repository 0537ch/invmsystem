import cron from 'node-cron';
import { broadcastSync } from '@/app/api/banner/events/route';

let cronInitialized = false;

export function startAutoSync() {
  if (cronInitialized) {
    return;
  }

  // eksekusi setiap jam 00:00
  cron.schedule('0 0 * * *', () => {
    try {
      const clientCount = broadcastSync();
      console.log(`[Auto-Sync] Scheduled sync completed: Synced to ${clientCount} display(s)`);
    } catch (error) {
      console.error('[Auto-Sync] Scheduled sync error:', error);
    }
  });

  cronInitialized = true;
  console.log('[Auto-Sync] Cron job scheduled: Every day at 00:00');
}

// Auto-start cron when module is loaded
startAutoSync();
