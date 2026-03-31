export interface Terminal {
  id: number
  city_id: number
  name: string
  address: string
  created_at: string
  updated_at: string
  city?: {
    id: number
    name: string
    province: string
  }
}

export interface CreateTerminalRequest {
  city_id: number
  name: string
  address: string
}

export interface UpdateTerminalRequest {
  city_id: number
  name: string
  address: string
}