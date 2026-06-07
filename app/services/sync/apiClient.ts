import type { AuthResponse, SyncRequest, SyncResponse } from '#shared/types'

class ApiClient {
  private token: string | null = null

  configure(token: string | null): void {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(endpoint, { ...options, headers })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ statusMessage: response.statusText }))
      throw new Error(error.statusMessage || error.error || 'API request failed')
    }

    if (response.status === 204) {
      return null as T
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
    return this.request('/api/health')
  }
}

export const apiClient = new ApiClient()
