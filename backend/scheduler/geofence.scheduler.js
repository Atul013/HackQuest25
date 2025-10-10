/**
 * Geofence Cleanup Scheduler
 * Runs periodic jobs to clean up stale subscriptions and maintain system health
 */

const cron = require('node-cron');
const geofencingService = require('../services/geofencing.service');

class GeofenceScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.warn('⚠️ Scheduler already running');
      return;
    }

    console.log('⏰ Starting geofence scheduler...');

    // Job 1: Cleanup stale subscriptions (every 5 minutes)
    const cleanupJob = cron.schedule('*/5 * * * *', async () => {
      console.log('🧹 Running cleanup job...');
      try {
        await geofencingService.runCleanupJob();
      } catch (error) {
        console.error('Cleanup job failed:', error);
      }
    });
    this.jobs.push({ name: 'cleanup', job: cleanupJob });

    // Job 2: Refresh geofence cache (every 30 minutes)
    const cacheRefreshJob = cron.schedule('*/30 * * * *', async () => {
      console.log('🔄 Refreshing geofence cache...');
      try {
        await geofencingService.initializeCache();
      } catch (error) {
        console.error('Cache refresh failed:', error);
      }
    });
    this.jobs.push({ name: 'cache_refresh', job: cacheRefreshJob });

    // Job 3: Generate analytics (every hour)
    const analyticsJob = cron.schedule('0 * * * *', async () => {
      console.log('📊 Generating geofence analytics...');
      try {
        await this.generateAnalytics();
      } catch (error) {
        console.error('Analytics job failed:', error);
      }
    });
    this.jobs.push({ name: 'analytics', job: analyticsJob });

    // Job 4: Health check (every 15 minutes)
    const healthCheckJob = cron.schedule('*/15 * * * *', async () => {
      console.log('🏥 Running health check...');
      try {
        await this.runHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    });
    this.jobs.push({ name: 'health_check', job: healthCheckJob });

    this.isRunning = true;
    console.log(`✅ Started ${this.jobs.length} scheduled jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('🛑 Stopping geofence scheduler...');
    
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`  Stopped: ${name}`);
    });

    this.jobs = [];
    this.isRunning = false;
    console.log('✅ Scheduler stopped');
  }

  /**
   * Generate analytics for all venues
   */
  async generateAnalytics() {
    const db = require('../database/db');
    
    try {
      // Calculate daily stats
      const dailyStats = await db.query(`
        SELECT 
          venue_id,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(EXTRACT(EPOCH FROM (unsubscribed_at - subscribed_at))) as avg_duration_seconds,
          COUNT(*) as total_visits
        FROM subscriptions
        WHERE subscribed_at > NOW() - INTERVAL '24 hours'
        GROUP BY venue_id
      `);

      console.log(`📈 Generated stats for ${dailyStats.rows.length} venues`);

      // Store in analytics table (if exists)
      for (const stat of dailyStats.rows) {
        await db.query(`
          INSERT INTO venue_analytics (
            venue_id, 
            date, 
            unique_users, 
            avg_duration_seconds, 
            total_visits
          )
          VALUES ($1, CURRENT_DATE, $2, $3, $4)
          ON CONFLICT (venue_id, date) 
          DO UPDATE SET
            unique_users = EXCLUDED.unique_users,
            avg_duration_seconds = EXCLUDED.avg_duration_seconds,
            total_visits = EXCLUDED.total_visits
        `, [stat.venue_id, stat.unique_users, stat.avg_duration_seconds, stat.total_visits]);
      }

    } catch (error) {
      console.error('Failed to generate analytics:', error);
    }
  }

  /**
   * Run health check on geofencing system
   */
  async runHealthCheck() {
    const db = require('../database/db');
    const redis = require('../database/redis');

    const health = {
      timestamp: new Date(),
      status: 'healthy',
      issues: []
    };

    try {
      // Check database connection
      await db.query('SELECT 1');
    } catch (error) {
      health.status = 'unhealthy';
      health.issues.push('Database connection failed');
    }

    try {
      // Check Redis connection
      await redis.ping();
    } catch (error) {
      health.status = 'unhealthy';
      health.issues.push('Redis connection failed');
    }

    try {
      // Check for stale subscriptions
      const staleCheck = await db.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE active = true
          AND last_seen_at < NOW() - INTERVAL '2 hours'
      `);

      if (parseInt(staleCheck.rows[0].count) > 100) {
        health.issues.push(`High number of stale subscriptions: ${staleCheck.rows[0].count}`);
      }
    } catch (error) {
      health.issues.push('Could not check stale subscriptions');
    }

    if (health.status === 'unhealthy') {
      console.error('❌ Health check FAILED:', health.issues);
      // TODO: Send alert to admin
    } else {
      console.log('✅ Health check passed');
    }

    return health;
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length,
      jobs: this.jobs.map(j => ({
        name: j.name,
        isRunning: j.job.running || false
      }))
    };
  }
}

module.exports = new GeofenceScheduler();
