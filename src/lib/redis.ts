import { Redis } from '@upstash/redis'

// Create Redis Client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export const getCacheKey = (method: string, url: string, body?: string) => {
  return `api:${method}:${url}:${body || ''}`
}

export type CacheConfig = {
  enabled: boolean
  ttl?: number // Time to live in seconds
}

export type CacheStats = {
  hit: boolean
  ttl?: number
  timestamp?: number
  timeSaved?: number // Time saved by using cache
} 