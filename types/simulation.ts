export interface PhishingSimulationData {
  email: string
  password: string
  timestamp: string
  userAgent?: string
  ipAddress?: string
}

export interface SimulationResult {
  success: boolean
  message: string
  data?: PhishingSimulationData
}

export interface ValidationError {
  field: string
  message: string
}
