import { NextResponse } from 'next/server'
import { getRedisClient, getCacheKey, type CacheConfig, type CacheStats } from '@/lib/redis'
import { SetOptions } from 'redis'

const MAX_TTL = 30 // Maximum cache TTL in seconds
const RATE_LIMIT = 20 // Number of requests allowed
const RATE_LIMIT_WINDOW = 60 // Time window in seconds

// Fun error messages
const ERROR_MESSAGES = {
  rateLimited: "🚫 Whoa there, speed racer! You've hit the rate limit. Take a breather for a minute! 😅",
  invalidUrl: "🤔 That URL looks a bit wonky! Make sure it starts with http:// or https:// 🌐",
  serverError: "🔥 Oops! Our hamsters need a break from running the server wheels! 🐹",
  timeout: "⏰ Request took too long... Did someone unplug the internet? 🔌",
}

async function isRateLimited(ip: string, useRedis: boolean): Promise<boolean> {
  if (!useRedis) return false
  
  try {
    const redis = await getRedisClient()
    const key = `rate_limit:${ip}`
    const requests = await redis.incr(key)
    
    if (requests === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW)
    }
    
    return requests > RATE_LIMIT
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return false
  }
}

export async function POST(req: Request) {
  const startTime = performance.now() // Start timing at the very beginning
  
  try {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    
    // Parse request body
    const { url, method, headers, body, cache } = await req.json() as {
      url: string
      method: string
      headers: Record<string, string>
      body?: string
      cache?: CacheConfig
    }

    // Validate URL
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.invalidUrl, details: `Invalid URL: ${url}` },
        { status: 400 }
      )
    }

    const useRedis = cache?.enabled === true
    let redis = null

    if (useRedis) {
      try {
        redis = await getRedisClient()
      } catch (error) {
        console.error('Redis initialization failed:', error)
        // Continue without Redis if initialization fails
      }
    }

    // Check rate limit only if Redis is enabled and available
    if (redis && await isRateLimited(ip, useRedis)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.rateLimited },
        { status: 429 }
      )
    }

    // Check cache if Redis is enabled and available
    let cacheStats: CacheStats = { hit: false }
    if (redis && useRedis) {
      try {
        const cacheKey = getCacheKey(method, url, body)
        const cachedResponse = await redis.get(cacheKey)
        
        if (cachedResponse && typeof cachedResponse === 'string') {
          const { data, originalTiming } = JSON.parse(cachedResponse) as { 
            data: Record<string, unknown>
            originalTiming: number // Store the original request time instead of timestamp
          }
          
          const ttl = await redis.ttl(cacheKey)
          const endTime = performance.now()
          const currentTiming = Math.round(endTime - startTime)
          
          cacheStats = {
            hit: true,
            ttl,
            timeSaved: originalTiming - currentTiming // Compare original time with current time
          }
          
          return NextResponse.json({
            ...data,
            cache: cacheStats,
            timing: currentTiming
          })
        }
      } catch (error) {
        console.error('Cache retrieval failed:', error)
      }
    }

    // Make the actual request
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

    const endTime = performance.now()
    const totalTiming = Math.round(endTime - startTime)
    
    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      timing: totalTiming,
      cache: cacheStats
    }

    // Store in cache only if Redis is enabled and available
    if (redis && useRedis) {
      try {
        const cacheKey = getCacheKey(method, url, body)
        const cacheValue = JSON.stringify({ 
          data: responseData,
          originalTiming: totalTiming // Store the original request timing
        })
        
        const options: SetOptions = {
          EX: Math.min(cache?.ttl || MAX_TTL, MAX_TTL)
        }
        
        await redis.set(cacheKey, cacheValue, options)
      } catch (error) {
        console.error('Cache storage failed:', error)
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Proxy error:', error)
    
    // Determine if it's a timeout error
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    
    return NextResponse.json(
      { 
        error: isTimeout ? ERROR_MESSAGES.timeout : ERROR_MESSAGES.serverError,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: isTimeout ? 408 : 500 }
    )
  }
} 