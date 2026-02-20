import Redis from 'ioredis';
import type { OTPData } from './types';

// Redis client interface
interface StorageClient {
  setex(key: string, seconds: number, value: OTPData): Promise<void>;
  get<T>(key: string): Promise<T | null>;
}

// Redis client wrapper to match our interface
class RedisClient implements StorageClient {
  private client: Redis;

  constructor(connectionString: string) {
    this.client = new Redis(connectionString, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  async setex(key: string, seconds: number, value: OTPData): Promise<void> {
    await this.client.setex(key, seconds, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }
}

let redisClient: RedisClient | null = null;

export function getKVClient(): StorageClient {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      'Missing required environment variable: REDIS_URL. ' +
      'Please set REDIS_URL in your environment variables. ' +
      'Format: redis://default:password@host:port'
    );
  }

  // Create singleton instance
  if (!redisClient) {
    redisClient = new RedisClient(redisUrl);
  }

  return redisClient;
}

