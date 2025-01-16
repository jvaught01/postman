import { createClient, type RedisClientType } from 'redis'
import { z } from 'zod'

// Validate environment variables when Redis is used
const envSchema = z.object({
  REDIS_URL: z.string().url(),
})

let redisClient: RedisClientType | null = null

export async function getRedisClient() {
  // Return existing client if already initialized
  if (redisClient) {
    return redisClient
  }

  try {
    // Validate Redis URL
    const env = envSchema.parse({
      REDIS_URL: process.env.REDIS_URL,
    })

    // Create new client
    redisClient = createClient({
      url: env.REDIS_URL,
    })

    // Connect and handle errors
    await redisClient.connect()
    redisClient.on('error', (err) => console.error('Redis Client Error', err))

    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis:', error)
    throw new Error('Redis initialization failed')
  }
}

// Types for cache configuration
export interface CacheConfig {
  enabled: boolean
  ttl?: number
}

export interface CacheStats {
  hit: boolean
  ttl?: number
  timestamp?: number
  timeSaved?: number
}

// Generate cache key
export function getCacheKey(method: string, url: string, body?: string): string {
  return `cache:${method}:${url}:${body ? JSON.stringify(body) : ''}`
} 