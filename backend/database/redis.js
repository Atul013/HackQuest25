/**
 * Redis Connection
 */

const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Redis max retries reached');
      }
      return retries * 100;
    }
  }
});

client.on('connect', () => {
  console.log('✅ Redis connected');
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

client.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Initialize connection (optional - gracefully handle failure)
(async () => {
  try {
    // Only try to connect if REDIS_URL is set
    if (process.env.REDIS_URL) {
      await client.connect();
    } else {
      console.log('ℹ️  Redis disabled - no REDIS_URL in .env (caching disabled)');
    }
  } catch (error) {
    console.log('ℹ️  Redis unavailable - running without cache:', error.message);
  }
})();

// Helper functions
const helpers = {
  // Set with expiry
  setex: async (key, seconds, value) => {
    return await client.setEx(key, seconds, value);
  },

  // Get value
  get: async (key) => {
    return await client.get(key);
  },

  // Delete key
  del: async (key) => {
    return await client.del(key);
  },

  // Set operations
  sadd: async (key, member) => {
    return await client.sAdd(key, member);
  },

  srem: async (key, member) => {
    return await client.sRem(key, member);
  },

  smembers: async (key) => {
    return await client.sMembers(key);
  },

  // Ping
  ping: async () => {
    return await client.ping();
  }
};

module.exports = { client, ...helpers };
