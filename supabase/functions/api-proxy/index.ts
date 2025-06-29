import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Optimized cache with automatic cleanup
const endpointCache = new Map()
const dataVersionCache = new Map()
const MAX_CACHE_SIZE = 500 // Reduced for better memory management
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes TTL as fallback
const CLEANUP_INTERVAL = 60 * 1000 // Cleanup every minute

// Global Supabase client with connection pooling
let globalSupabaseClient: any = null

// Initialize global client with optimized settings
function getSupabaseClient() {
  if (!globalSupabaseClient) {
    globalSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=30, max=100'
          }
        }
      }
    )
  }
  return globalSupabaseClient
}

// Cleanup old cache entries
function cleanupCache() {
  const now = Date.now()
  let cleanedCount = 0
  
  for (const [key, entry] of endpointCache.entries()) {
    if (now - entry.cachedAt > CACHE_TTL) {
      endpointCache.delete(key)
      cleanedCount++
    }
  }
  
  // Also cleanup version cache
  if (dataVersionCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(dataVersionCache.entries())
    entries.sort((a, b) => a[1] - b[1]) // Sort by timestamp
    const toDelete = entries.slice(0, Math.floor(entries.length / 2))
    toDelete.forEach(([key]) => dataVersionCache.delete(key))
  }
  
  if (cleanedCount > 0) {
    console.log(`Cache cleanup: removed ${cleanedCount} stale entries`)
  }
}

// Start cleanup interval
setInterval(cleanupCache, CLEANUP_INTERVAL)

// Helper functions (optimized)
function getCacheKey(route: string, apiKey?: string) {
  return `${route}:${apiKey || 'public'}`
}

function getDataVersionKey(endpointId: string, dataType: string, relatedId?: string) {
  if (dataType === 'schema' && relatedId) {
    return `schema:${relatedId}`
  } else if (dataType === 'template' && relatedId) {
    return `template:${relatedId}`
  }
  return `endpoint:${endpointId}`
}

// Optimized cache validation with timeout
async function isCacheValid(cacheEntry: any, supabaseClient: any) {
  try {
    const { endpointId, dataType, relatedId } = cacheEntry.metadata
    const versionKey = getDataVersionKey(endpointId, dataType, relatedId)
    
    // Check if we already have a recent version check
    const cachedVersion = dataVersionCache.get(versionKey)
    if (cachedVersion && (Date.now() - cachedVersion) < 30000) { // 30 seconds
      return true // Recently validated, assume still valid
    }
    
    let lastModified: string | null = null
    
    // Use Promise.race with timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Validation timeout')), 5000)
    )
    
    const validationPromise = (async () => {
      if (dataType === 'schema' && relatedId) {
        // Optimized query: get max updated_at from both tables
        const { data: schemaTime } = await supabaseClient
          .from('api_schemas')
          .select('updated_at')
          .eq('id', relatedId)
          .single()
        
        const { data: dataTime } = await supabaseClient
          .from('api_data')
          .select('updated_at')
          .eq('schema_id', relatedId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        const schemaTimestamp = schemaTime?.updated_at
        const dataTimestamp = dataTime?.updated_at
        
        if (schemaTimestamp && dataTimestamp) {
          lastModified = schemaTimestamp > dataTimestamp ? schemaTimestamp : dataTimestamp
        } else {
          lastModified = schemaTimestamp || dataTimestamp
        }
      } else if (dataType === 'template' && relatedId) {
        const { data } = await supabaseClient
          .from('json_templates')
          .select('updated_at')
          .eq('id', relatedId)
          .single()
        
        lastModified = data?.updated_at
      } else {
        const { data } = await supabaseClient
          .from('api_endpoints')
          .select('updated_at')
          .eq('id', endpointId)
          .single()
        
        lastModified = data?.updated_at
      }
      
      return lastModified
    })()
    
    lastModified = await Promise.race([validationPromise, timeoutPromise])
    
    if (!lastModified) {
      return false
    }
    
    const currentVersion = new Date(lastModified).getTime()
    const cacheTime = cacheEntry.cachedAt
    
    if (currentVersion > cacheTime) {
      return false // Data has been updated since cache
    }
    
    // Update version cache with current time
    dataVersionCache.set(versionKey, Date.now())
    return true
    
  } catch (error) {
    console.error('Cache validation error:', error.message)
    return false // On error, invalidate cache
  }
}

function addToCache(key: string, data: any, metadata: any) {
  // Aggressive cache size management
  if (endpointCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest 25% of entries
    const entries = Array.from(endpointCache.entries())
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt)
    const toDelete = entries.slice(0, Math.floor(entries.length * 0.25))
    toDelete.forEach(([key]) => endpointCache.delete(key))
  }
  
  endpointCache.set(key, {
    data,
    metadata,
    cachedAt: Date.now()
  })
}

// Analytics logging function
async function logAnalytics(supabaseClient: any, endpoint: any, request: Request, responseStatus: number, responseTime: number, responseSize: number = 0, error?: string) {
  try {
    const url = new URL(request.url)
    const userAgent = request.headers.get('user-agent') || ''
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown'

    // Basic geographic data (you could enhance this with a GeoIP service)
    let geoData = {
      country_code: null,
      region: null,
      city: null
    }

    // Try to get basic geo info from Cloudflare headers if available
    const cfCountry = request.headers.get('cf-ipcountry')
    if (cfCountry && cfCountry !== 'XX') {
      geoData.country_code = cfCountry
    }

    const analyticsData = {
      api_endpoint_id: endpoint.id,
      user_id: endpoint.user_id,
      project_id: endpoint.project_id,
      request_method: 'GET',
      request_path: endpoint.route,
      request_ip: clientIP,
      request_user_agent: userAgent,
      request_headers: {
        'user-agent': userAgent,
        'referer': request.headers.get('referer') || null
      },
      response_status: responseStatus,
      response_time_ms: responseTime,
      response_size_bytes: responseSize,
      country_code: geoData.country_code,
      region: geoData.region,
      city: geoData.city,
      error_message: error || null,
      error_type: error ? (responseStatus >= 500 ? 'server_error' : 'client_error') : null
    }

    // Insert analytics data (fire and forget)
    supabaseClient
      .from('api_analytics')
      .insert([analyticsData])
      .then(() => {
        console.log('Analytics logged successfully')
      })
      .catch((err: any) => {
        console.error('Failed to log analytics:', err.message)
      })

  } catch (error) {
    console.error('Analytics logging error:', error)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests immediately
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const url = new URL(req.url)
    
    // Extract route efficiently
    let route = url.pathname
    if (route.startsWith('/functions/v1/api-proxy')) {
      route = route.substring('/functions/v1/api-proxy'.length) || '/'
    } else if (route.startsWith('/api-proxy')) {
      route = route.substring('/api-proxy'.length) || '/'
    }
    
    if (!route.startsWith('/')) {
      route = '/' + route
    }

    const apiKeyHeader = req.headers.get('x-api-key')
    const cacheKey = getCacheKey(route, apiKeyHeader)
    
    // Check cache first (fastest path)
    const cached = endpointCache.get(cacheKey)
    if (cached) {
      // Quick TTL check
      if (Date.now() - cached.cachedAt < CACHE_TTL) {
        // For frequently accessed endpoints, skip validation for a short time
        const timeSinceCache = Date.now() - cached.cachedAt
        if (timeSinceCache < 10000) { // 10 seconds of guaranteed fresh cache
          console.log(`API Proxy: Fast cache hit for route: ${route}`)
          return new Response(
            JSON.stringify(cached.data.responseData),
            {
              status: 200,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-API-Type': cached.data.apiType,
                'X-API-Name': cached.data.apiName,
                'X-Cache': 'HIT-FAST',
                'X-Cache-Age': Math.floor(timeSinceCache / 1000).toString(),
                'X-Response-Time': `${Date.now() - startTime}ms`
              },
            }
          )
        }
        
        // Validate cache in background for older entries
        const supabaseClient = getSupabaseClient()
        const isValid = await isCacheValid(cached, supabaseClient)
        if (isValid) {
          console.log(`API Proxy: Validated cache hit for route: ${route}`)
          return new Response(
            JSON.stringify(cached.data.responseData),
            {
              status: 200,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-API-Type': cached.data.apiType,
                'X-API-Name': cached.data.apiName,
                'X-Cache': 'HIT',
                'X-Cache-Age': Math.floor(timeSinceCache / 1000).toString(),
                'X-Response-Time': `${Date.now() - startTime}ms`
              },
            }
          )
        } else {
          endpointCache.delete(cacheKey)
        }
      } else {
        // TTL expired, remove from cache
        endpointCache.delete(cacheKey)
      }
    }

    // Cache miss - fetch from database
    const supabaseClient = getSupabaseClient()
    
    console.log(`API Proxy: Cache miss, fetching data for route: "${route}"`)
    
    // Optimized query with timeout
    const queryTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    )
    
    const queryPromise = supabaseClient
      .from('api_endpoints')
      .select(`
        id,
        name,
        route,
        json_data,
        is_public,
        api_key,
        data_type,
        schema_id,
        template_id,
        updated_at,
        user_id,
        project_id,
        json_templates!template_id(id, json_data, updated_at)
      `)
      .eq('route', route)
      .eq('is_public', true)
      .limit(1)

    let { data: endpoints, error: queryError } = await Promise.race([queryPromise, queryTimeout])

    if (queryError) {
      console.error('Database query error:', queryError)
      throw queryError
    }

    // If no public endpoint found, check for private endpoints
    if (!endpoints || endpoints.length === 0) {
      if (apiKeyHeader) {
        const privateQueryPromise = supabaseClient
          .from('api_endpoints')
          .select(`
            id,
            name,
            route,
            json_data,
            is_public,
            api_key,
            data_type,
            schema_id,
            template_id,
            updated_at,
            user_id,
            project_id,
            json_templates!template_id(id, json_data, updated_at)
          `)
          .eq('route', route)
          .eq('is_public', false)
          .eq('api_key', apiKeyHeader)
          .limit(1)

        const { data: privateEndpoints, error: privateError } = await Promise.race([privateQueryPromise, queryTimeout])
        if (privateError) throw privateError
        endpoints = privateEndpoints
      }
    }

    const responseTime = Date.now() - startTime

    if (!endpoints || endpoints.length === 0) {
      const errorResponse = {
        error: 'API endpoint not found',
        route: route,
        message: `No API endpoint configured for route: ${route}`
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 404,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
            'X-Response-Time': `${responseTime}ms`
          },
        }
      )
    }

    const endpoint = endpoints[0]

    // Access control checks
    if (!endpoint.is_public) {
      if (!apiKeyHeader) {
        const errorResponse = {
          error: 'Missing API key',
          message: 'This endpoint requires an API key. Include x-api-key header in your request.',
          route: route
        }

        // Log analytics for unauthorized access
        await logAnalytics(supabaseClient, endpoint, req, 401, responseTime, JSON.stringify(errorResponse).length, 'Missing API key')
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'X-Response-Time': `${responseTime}ms`
            },
          }
        )
      }

      if (endpoint.api_key !== apiKeyHeader) {
        const errorResponse = {
          error: 'Invalid API key',
          message: 'The provided API key is not valid for this endpoint.',
          route: route
        }

        // Log analytics for invalid API key
        await logAnalytics(supabaseClient, endpoint, req, 401, responseTime, JSON.stringify(errorResponse).length, 'Invalid API key')
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'X-Response-Time': `${responseTime}ms`
            },
          }
        )
      }
    }

    let responseData = endpoint.json_data
    const apiType = endpoint.is_public ? 'public' : 'private'
    const apiName = endpoint.name
    let relatedId = null

    // Handle different data types
    if (endpoint.data_type === 'template' && endpoint.json_templates) {
      responseData = endpoint.json_templates.json_data
      relatedId = endpoint.template_id
    } else if (endpoint.data_type === 'schema' && endpoint.schema_id) {
      // Schema data query with timeout
      const schemaQueryPromise = supabaseClient
        .from('api_data')
        .select('data, updated_at')
        .eq('schema_id', endpoint.schema_id)
        .order('created_at', { ascending: false })

      const { data: schemaData, error: schemaError } = await Promise.race([schemaQueryPromise, queryTimeout])

      if (schemaError) {
        console.error('Schema data fetch error:', schemaError)
        const errorResponse = {
          error: 'Schema data fetch error',
          message: schemaError.message
        }

        // Log analytics for schema error
        await logAnalytics(supabaseClient, endpoint, req, 500, responseTime, JSON.stringify(errorResponse).length, 'Schema data fetch error')
        
        return new Response(
          JSON.stringify(errorResponse),
          {
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'X-Response-Time': `${responseTime}ms`
            },
          }
        )
      }
      
      responseData = schemaData?.map(item => item.data) || []
      relatedId = endpoint.schema_id
    }

    // Cache the response
    const cacheMetadata = {
      endpointId: endpoint.id,
      dataType: endpoint.data_type || 'template',
      relatedId: relatedId,
      lastModified: endpoint.updated_at
    }

    addToCache(cacheKey, {
      responseData,
      apiType,
      apiName
    }, cacheMetadata)

    const finalResponseTime = Date.now() - startTime
    const responseString = JSON.stringify(responseData)
    
    // Log successful analytics
    await logAnalytics(supabaseClient, endpoint, req, 200, finalResponseTime, responseString.length)
    
    console.log(`API Proxy: Fresh data served for route: ${route} in ${finalResponseTime}ms`)

    return new Response(
      responseString,
      {
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-API-Type': apiType,
          'X-API-Name': apiName,
          'X-Cache': 'MISS',
          'X-Cache-Fresh': 'true',
          'X-Response-Time': `${finalResponseTime}ms`
        },
      }
    )

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('API Proxy Error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      message: error.message
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'ERROR',
          'X-Response-Time': `${responseTime}ms`
        },
      }
    )
  }
})