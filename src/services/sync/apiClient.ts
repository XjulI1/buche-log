import type { AuthResponse, SyncRequest, SyncResponse } from '@/types'

interface ApiClientConfig {
  baseUrl: string
  token: string | null
}

class ApiClient {
  private config: ApiClientConfig = {
    baseUrl: '',
    token: null,
  }

  configure(baseUrl: string, token: string | null): void {
    this.config = { baseUrl, token }
  }

  getConfig(): ApiClientConfig {
    return { ...this.config }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser(): Promise<{ id: string; email: string }> {
    return this.request('/api/auth/me')
  }

  async sync(syncRequest: SyncRequest): Promise<SyncResponse> {
    return this.request('/api/sync', {
      method: 'POST',
      body: JSON.stringify(syncRequest),
    })
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()
