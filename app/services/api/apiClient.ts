import { getISOWeek } from '#shared/utils/isoWeek'
import type {
  AuthResponse,
  AuthUser,
  ConsumptionEntry,
  ConsumptionFormData,
  ExportData,
  ImportResult,
  Rack,
  RackFormData,
} from '#shared/types'

const TOKEN_KEY = 'buche-log:token'

/** Serveur injoignable (hors ligne, serveur arrete...) */
export class NetworkError extends Error {
  constructor() {
    super('Connexion au serveur impossible')
    this.name = 'NetworkError'
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Json = Record<string, unknown>

function toRack(json: Json): Rack {
  return {
    ...(json as unknown as Rack),
    createdAt: new Date(json.createdAt as string),
    updatedAt: new Date(json.updatedAt as string),
    deletedAt: json.deletedAt ? new Date(json.deletedAt as string) : null,
  }
}

function toConsumption(json: Json): ConsumptionEntry {
  return {
    ...(json as unknown as ConsumptionEntry),
    date: new Date(json.date as string),
    createdAt: new Date(json.createdAt as string),
    updatedAt: new Date(json.updatedAt as string),
    deletedAt: json.deletedAt ? new Date(json.deletedAt as string) : null,
  }
}

/** La semaine ISO est calculee dans le fuseau horaire de l'utilisateur */
function readingBody(data: ConsumptionFormData) {
  const { week, year } = getISOWeek(data.date)
  return { ...data, weekNumber: week, year }
}

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

class ApiClient {
  private token: string | null = loadToken()
  private onUnauthorized: (() => void) | null = null

  getToken(): string | null {
    return this.token
  }

  setToken(token: string | null): void {
    this.token = token
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Stockage indisponible : le token ne vit que le temps de la session
    }
  }

  /** Appele quand le serveur rejette le token (expire, revoque...) */
  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const token = this.token
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let response: Response
    try {
      response = await fetch(endpoint, { ...options, headers })
    } catch {
      throw new NetworkError()
    }

    if (!response.ok) {
      if (response.status === 401 && token) this.onUnauthorized?.()
      const error = await response
        .json()
        .catch(() => ({ statusMessage: response.statusText }))
      throw new ApiError(
        error.statusMessage || error.error || 'API request failed',
        response.status,
      )
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

  async getCurrentUser(): Promise<AuthUser> {
    return this.request('/api/auth/me')
  }

  async getRacks(): Promise<Rack[]> {
    const racks = await this.request<Json[]>('/api/racks')
    return racks.map(toRack)
  }

  async createRack(data: RackFormData): Promise<Rack> {
    return toRack(
      await this.request('/api/racks', { method: 'POST', body: JSON.stringify(data) }),
    )
  }

  async updateRack(id: string, data: RackFormData): Promise<Rack> {
    return toRack(
      await this.request(`/api/racks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    )
  }

  async deleteRack(id: string): Promise<void> {
    return this.request(`/api/racks/${id}`, { method: 'DELETE' })
  }

  async getConsumptions(rackId: string): Promise<ConsumptionEntry[]> {
    const entries = await this.request<Json[]>(
      `/api/consumptions?rackId=${encodeURIComponent(rackId)}`,
    )
    return entries.map(toConsumption)
  }

  async createConsumption(rackId: string, data: ConsumptionFormData): Promise<ConsumptionEntry> {
    return toConsumption(
      await this.request('/api/consumptions', {
        method: 'POST',
        body: JSON.stringify({ ...readingBody(data), rackId }),
      }),
    )
  }

  async updateConsumption(id: string, data: ConsumptionFormData): Promise<ConsumptionEntry> {
    return toConsumption(
      await this.request(`/api/consumptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(readingBody(data)),
      }),
    )
  }

  async deleteConsumption(id: string): Promise<void> {
    return this.request(`/api/consumptions/${id}`, { method: 'DELETE' })
  }

  async exportData(): Promise<ExportData> {
    return this.request('/api/data')
  }

  async importData(data: ExportData): Promise<ImportResult> {
    return this.request('/api/data', { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteAllData(): Promise<void> {
    return this.request('/api/data', { method: 'DELETE' })
  }

  async savePushSubscription(subscription: {
    endpoint: string
    remindDay: number
    remindHour: number
    timezone: string
  }): Promise<void> {
    return this.request('/api/push/subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
    })
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    return this.request('/api/push/subscription', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    })
  }

  async sendTestPush(endpoint: string): Promise<void> {
    return this.request('/api/push/test', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    })
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/health')
  }
}

export const apiClient = new ApiClient()
