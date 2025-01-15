import { NextResponse } from 'next/server'
import { redis, getCacheKey, type CacheConfig, type CacheStats } from '@/lib/redis'

const MAX_TTL = 30 // Maximum cache TTL in seconds
const RATE_LIMIT = 20 // Number of requests allowed
const RATE_LIMIT_WINDOW = 60 // Time window in seconds

async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rate_limit:${ip}`
  const requests = await redis.incr(key)
  
  if (requests === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW)
  }
  
  return requests > RATE_LIMIT
}

export async function POST(req: Request) {
  try {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Maximum ${RATE_LIMIT} requests per ${RATE_LIMIT_WINDOW} seconds.` },
        { status: 429 }
      )
    }

    const { url, method, headers, body, cache } = await req.json() as {
      url: string
      method: string
      headers: Record<string, string>
      body?: string
      cache?: CacheConfig
    }

    // Enforce maximum TTL
    if (cache?.enabled && cache.ttl) {
      cache.ttl = Math.min(cache.ttl, MAX_TTL)
    }

    // Check cache if enabled
    let cacheStats: CacheStats = { hit: false }
    if (cache?.enabled) {
      const cacheKey = getCacheKey(method, url, body)
      const cachedResponse = await redis.get(cacheKey)
      
      if (cachedResponse) {
        const { data, timestamp } = cachedResponse as { 
          data: Record<string, unknown>
          timestamp: number 
        }
        
        cacheStats = {
          hit: true,
          ttl: await redis.ttl(cacheKey),
          timestamp,
          timeSaved: performance.now() - timestamp
        }
        
        return NextResponse.json({
          ...data,
          cache: cacheStats
        })
      }
    }

    const startTime = performance.now()
    const response = await fetch(url, {
      method,
      headers: headers,
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
      signal: AbortSignal.timeout(30000)
    })

    const contentType = response.headers.get('content-type')
    const data = contentType?.includes('application/json') 
      ? await response.json()
      : await response.text()

    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      cache: cacheStats
    }

    // Store in cache if enabled
    if (cache?.enabled) {
      const cacheKey = getCacheKey(method, url, body)
      await redis.set(
        cacheKey, 
        { 
          data: responseData,
          timestamp: startTime 
        },
        {
          ex: Math.min(cache.ttl || MAX_TTL, MAX_TTL) // Ensure TTL doesn't exceed maximum
        }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from the provided URL' },
      { status: 500 }
    )
  }
} 