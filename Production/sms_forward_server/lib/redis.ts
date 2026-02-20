import Redis from 'ioredis';
import type { OTPData } from './types';

// Redis client interface
interface StorageClient {
  setex(key: string, seconds: number, value: OTPData): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  quit(): Promise<void>;
}

// Redis client wrapper optimized for serverless
class RedisClient implements StorageClient {
  private client: Redis;

  constructor(connectionString: string) {
    // Parse connection string to check if TLS is needed
    const url = new URL(connectionString);
    const isTLS = url.port === '6380' || url.protocol === 'rediss:';
    
    this.client = new Redis(connectionString, {
      // For serverless: don't retry on connection errors
      maxRetriesPerRequest: null,
      // Enable lazy connect - only connects when needed
      lazyConnect: true,
      // Connection timeout
      connectTimeout: 10000,
      // Command timeout
      commandTimeout: 5000,
      // Enable TLS if needed (Redis Labs often uses TLS)
      tls: isTLS ? {} : undefined,
      // Retry strategy for connection errors
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 200, 1000);
      },
      // Auto reconnect
      enableAutoPipelining: false,
      // Disable offline queue for serverless
      enableOfflineQueue: false,
      // Keep alive for serverless
      keepAlive: 30000,
    });

    // Handle connection errors
    this.client.on('error', (err) => {
      // Log but don't throw - let individual operations handle errors
      if (process.env.NODE_ENV === 'development') {
        console.error('Redis connection error:', err.message);
      }
    });
  }

  async setex(key: string, seconds: number, value: OTPData): Promise<void> {
    try {
      // Ensure connection is established
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      await this.client.setex(key, seconds, JSON.stringify(value));
    } catch (error) {
      // Close connection on error for serverless cleanup
      await this.quit();
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Ensure connection is established
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      // Close connection on error for serverless cleanup
      await this.quit();
      throw error;
    }
  }

  async quit(): Promise<void> {
    try {
      if (this.client.status !== 'end') {
        await this.client.quit();
      }
    } catch (error) {
      // Ignore quit errors
    }
  }
}

// For serverless: create new connection per request
// Don't reuse connections between invocations
export function getKVClient(): StorageClient {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      'Missing required environment variable: REDIS_URL. ' +
      'Please set REDIS_URL in your environment variables. ' +
      'Format: redis://default:password@host:port'
    );
  }

  // Create a new client for each request in serverless environment
  // This ensures clean connections for each function invocation
  return new RedisClient(redisUrl);
}

