'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Badge } from "@/app/components/ui/badge"
import { Rocket, Zap, Code, Heart, History, Database } from 'lucide-react'
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import confetti from 'canvas-confetti'



const EXAMPLE_APIS = [
  {
    name: 'Get Post',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    description: 'Fetch a sample post'
  },
  {
    name: 'Create Post',
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'POST',
    body: JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1
    }),
    headers: 'Content-Type: application/json',
    description: 'Create a new post'
  },
  {
    name: 'Headers Test',
    url: 'https://httpbin.org/headers',
    method: 'GET',
    description: 'Echo back request headers'
  }
]

type CacheStats = {
  hit: boolean
  ttl?: number
  timestamp?: number
  timeSaved?: number
}

type ApiResponse = {
  status: number
  statusText: string
  headers: Record<string, string>
  data: unknown
  timing?: number
  cache?: CacheStats
}

export default function FunApiTester() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState('')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('request')
  const [cacheEnabled, setCacheEnabled] = useState(false)
  const [cacheTTL, setCacheTTL] = useState('60')
  const [redisAvailable, setRedisAvailable] = useState(false)

  // Check Redis availability on component mount
  useEffect(() => {
    async function checkRedis() {
      try {
        const res = await fetch('/api/redis-status')
        const { available } = await res.json()
        setRedisAvailable(available)
      } catch (error) {
        console.error('Failed to check Redis status:', error)
        setRedisAvailable(false)
      }
    }
    checkRedis()
  }, [])

  const loadExampleApi = (example: typeof EXAMPLE_APIS[0]) => {
    setUrl(example.url)
    setMethod(example.method)
    setHeaders(example.headers || '')
    setBody(example.body || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const startTime = performance.now()
    
    try {
      const headerObj = headers.split('\n').reduce((acc, header) => {
        const [key, value] = header.split(':')
        if (key && value) {
          acc[key.trim()] = value.trim()
        }
        return acc
      }, {} as Record<string, string>)

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method,
          headers: headerObj,
          body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
          cache: {
            enabled: cacheEnabled,
            ttl: parseInt(cacheTTL)
          }
        })
      })

      if (!res.ok) {
        throw new Error('Proxy request failed')
      }

      const endTime = performance.now()
      const data: ApiResponse = await res.json()
      if (!data.cache?.hit) {
        data.timing = Math.round(endTime - startTime)
      }
      
      setResponse(data)
      setActiveTab('response')
      
      if (data.status >= 200 && data.status < 300) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while making the request')
      setResponse(null)
    }
    setIsLoading(false)
  }

  const formatResponse = () => {
    if (error) {
      return `❌ Error: ${error}`
    }
    
    if (!response) {
      return "YOUR RESPONSE WILL APPEAR HERE! ✨"
    }

    const cacheInfo = response.cache
      ? `Cache: ${response.cache.hit ? '✅ HIT' : '❌ MISS'}
${response.cache.hit 
  ? `Time Saved: ${Math.round(response.cache.timeSaved || 0)}ms
TTL: ${response.cache.ttl}s`
  : ''}`
      : ''

    return `Status: ${response.status} ${response.statusText}
Time: ${response.timing}ms
${cacheInfo}

Headers:
${Object.entries(response.headers)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Response Body:
${typeof response.data === 'object' 
  ? JSON.stringify(response.data, null, 2) 
  : response.data}`
  }

  return (
    <div className="min-h-screen bg-[#FFDE00] p-8 flex flex-col">
      <motion.h1 
        className="text-6xl font-black mb-8 text-center text-black rotate-[-2deg] hover:rotate-[2deg] transition-transform"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🚀 SUPER API TESTER 🎉
      </motion.h1>

      {/* Example APIs */}
      <div className="max-w-4xl mx-auto w-full mb-8">
        <h2 className="text-2xl font-black mb-4 flex items-center">
          <History className="mr-2" />
          QUICK TEST APIS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAMPLE_APIS.map((api, index) => (
            <Card 
              key={index} 
              className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
              onClick={() => loadExampleApi(api)}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">{api.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-black text-white mb-2">{api.method}</Badge>
                <p className="text-sm text-gray-600">{api.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto w-full flex-grow">
        <TabsList className="grid w-full grid-cols-2 p-0 bg-transparent gap-2">
          <TabsTrigger 
            value="request"
            className="border-4 border-black bg-[#FF3366] text-white data-[state=active]:bg-[#FF3366] data-[state=active]:text-white data-[state=active]:translate-y-1 data-[state=active]:translate-x-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
          >
            <Rocket className="mr-2" />
            REQUEST
          </TabsTrigger>
          <TabsTrigger 
            value="response"
            className="border-4 border-black bg-[#33FF99] text-black data-[state=active]:bg-[#33FF99] data-[state=active]:text-black data-[state=active]:translate-y-1 data-[state=active]:translate-x-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
          >
            <Zap className="mr-2" />
            RESPONSE {response && <Badge className="ml-2 bg-black text-white">{response.status}</Badge>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="request">
          <Card className="border-4 border-black mt-4 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="text-3xl font-black flex items-center">
                <Rocket className="mr-2 w-8 h-8" />
                LAUNCH YOUR REQUEST!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-4">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-[180px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                        <SelectItem key={m} value={m} className="hover:bg-[#F3F3F3]">
                          <Badge className="bg-black text-white font-bold">{m}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="url"
                    placeholder="Enter your magical API URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-grow border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    required
                  />
                </div>
                <Textarea
                  placeholder="Enter headers (one per line, e.g. Content-Type: application/json)"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="h-24 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <Textarea
                  placeholder="Enter request body (if applicable)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-24 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />

                {/* Cache Controls */}
                <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-lg font-black mb-4 flex items-center">
                    <Database className="mr-2" />
                    CACHE SETTINGS
                  </h3>
                  
                  {redisAvailable ? (
                    <>
                      {/* Cache Explanation */}
                      <div className="mb-4 p-3 bg-[#F3F3F3] border-2 border-black text-sm">
                        <p className="font-bold mb-2">🚀 How Caching Works:</p>
                        <ul className="list-disc list-inside space-y-1 mb-3">
                          <li>First request fetches fresh data and stores it in cache</li>
                          <li>Subsequent identical requests return cached data instantly</li>
                          <li>Cache expires after TTL (max 30 seconds)</li>
                        </ul>
                        <p className="font-bold mb-2">⚡ Service Limits:</p>
                        <ul className="list-disc list-inside space-y-1 mb-3">
                          <li>Maximum 30 requests per minute</li>
                          <li>Maximum cache TTL: 30 seconds</li>
                          <li>Request timeout: 30 seconds</li>
                        </ul>
                        <p className="font-bold mb-2">👨‍💻 Try it yourself:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Enable caching below</li>
                          <li>Make a request to any API</li>
                          <li>Make the same request again within TTL</li>
                          <li>Notice the faster response time and &quot;Cache HIT&quot; status!</li>
                        </ol>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="cache-toggle"
                            checked={cacheEnabled}
                            onCheckedChange={setCacheEnabled}
                          />
                          <Label htmlFor="cache-toggle" className="font-bold">Enable Caching</Label>
                        </div>
                        {cacheEnabled && (
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="cache-ttl" className="font-bold">TTL (max 30s):</Label>
                            <Input
                              id="cache-ttl"
                              type="number"
                              min="1"
                              max="30"
                              value={cacheTTL}
                              onChange={(e) => setCacheTTL(Math.min(parseInt(e.target.value), 30).toString())}
                              className="w-24 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Cache Performance Tips */}
                      {cacheEnabled && (
                        <div className="text-sm text-gray-600 border-t-2 border-black pt-3">
                          <p className="font-bold text-black mb-1">💡 Pro Tips:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Perfect for repeated API calls to the same endpoint</li>
                            <li>Great for testing rate-limited APIs</li>
                            <li>Compare cached vs. uncached response times</li>
                            <li>Watch for the green &quot;Cache HIT&quot; indicator in responses</li>
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-[#F3F3F3] border-2 border-black text-sm">
                      <p className="font-bold text-center">
                        🔒 Caching is currently unavailable
                      </p>
                      <p className="text-center mt-2 text-gray-600">
                        Redis is not configured for this instance
                      </p>
                    </div>
                  )}
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-[#FF3366] text-white border-4 border-black font-black text-xl h-16 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
                  >
                    {isLoading ? '🚀 LAUNCHING...' : '🚀 SEND REQUEST!'}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="response">
          <Card className="border-4 border-black mt-4 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="text-3xl font-black flex items-center">
                <Zap className="mr-2 w-8 h-8" />
                MAGICAL RESPONSE
                {response && (
                  <Badge 
                    className={`ml-4 ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-green-500'
                        : response.status >= 400
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    } text-white font-bold`}
                  >
                    {response.status} {response.statusText}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <pre className="whitespace-pre-wrap bg-[#F3F3F3] p-6 rounded-none border-2 border-black font-mono text-sm overflow-auto max-h-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Code className="mr-2" />
                  {formatResponse()}
                </pre>
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <motion.div
          className="inline-flex items-center space-x-2 text-black font-bold text-lg"
          whileHover={{ scale: 1.05 }}
        >
          <span>Made with</span>
          <Heart className="text-[#FF3366] animate-pulse" />
          <span>by</span>
          <a 
            href="https://www.linkedin.com/in/jvaught91/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#FF3366] hover:underline"
          >
            Julio Vaught
          </a>
        </motion.div>
      </footer>
    </div>
  )
}

