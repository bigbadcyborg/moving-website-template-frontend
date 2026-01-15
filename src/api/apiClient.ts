import { API_BASE_URL } from '../lib/env'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshPromise: Promise<string> | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

// Load tokens from localStorage on init
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken')
  refreshToken = localStorage.getItem('refreshToken')
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = await response.json()
      setTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 with refresh
  if (response.status === 401 && refreshToken && !options.headers?.['Authorization']) {
    try {
      const newAccessToken = await refreshAccessToken()
      headers['Authorization'] = `Bearer ${newAccessToken}`
      response = await fetch(url, {
        ...options,
        headers,
      })
    } catch (e) {
      clearTokens()
      window.location.href = '/#/login'
      throw e
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    console.error('API Error:', error)
    console.error('Error detail:', error.detail)
    
    // Handle FastAPI validation errors (422)
    if (response.status === 422 && Array.isArray(error.detail)) {
      const validationErrors = error.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
      throw new Error(`Validation error: ${validationErrors}`)
    }
    
    // Handle FastAPI validation errors (422) - single error object
    if (response.status === 422 && error.detail && !Array.isArray(error.detail) && typeof error.detail === 'object') {
      // Try to extract validation error message from single error object
      const errorMessage = error.detail.msg || error.detail.message || JSON.stringify(error.detail)
      throw new Error(`Validation error: ${errorMessage}`)
    }
    
    // Handle our custom error format (object with message)
    if (error.detail && typeof error.detail === 'object' && error.detail !== null) {
      const errorMessage = error.detail.message || error.message || `HTTP ${response.status}`
      throw new Error(errorMessage)
    }
    
    // Handle string error details
    if (error.detail && typeof error.detail === 'string') {
      throw new Error(error.detail)
    }
    
    // Fallback: show the full error object in console and use a generic message
    console.error('Unhandled error format:', error)
    throw new Error(error.message || `HTTP ${response.status}: ${JSON.stringify(error)}`)
  }

  return response.json()
}
