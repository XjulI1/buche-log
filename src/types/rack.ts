export type LogSize = 25 | 33 | 50

export interface Rack {
  id: string
  name: string
  height: number // cm
  width: number // cm
  depth: number // cm
  logSize: LogSize
  volumeM3: number // calculated
  volumeSteres: number // calculated
  createdAt: Date
  updatedAt: Date
}

export interface RackFormData {
  name: string
  height: number
  width: number
  depth: number
  logSize: LogSize
}
